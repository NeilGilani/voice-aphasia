"""Voice workstream server: local voice cloning with F5-TTS-MLX (Apple Silicon).

Endpoints (all under /api/voice):
  GET  /status            -> {ready, cloned, name, warm}
  POST /clone             multipart: audio (any format ffmpeg reads, incl. video), name, ref_text?
  POST /speak             {"text": "..."} -> audio/wav  (cached)
  POST /prepare           {"texts": [...]} -> pre-synthesise in the background
  Call relay (two devices/tabs, text only; each side does its own STT/TTS):
  POST /call/{room}       {"who": "frank"|"ellie", "kind": "line"|"hello"|"bye", "text": "..."}
  GET  /call/{room}/events  Server-Sent Events, one JSON event per line said

Run:  ~/voice-ext/f5env/bin/python server/voice_server.py   (port 8790, VOICE_PORT to change)
The sample stays on this machine (VOICE_DATA, default ~/voice-ext/data).
"""
import concurrent.futures as cf, hashlib, json, os, queue, subprocess, tempfile, threading, time
from collections import OrderedDict
from pathlib import Path

import mlx.core as mx
import numpy as np
import soundfile as sf
import uvicorn
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
import asyncio
from pydantic import BaseModel

# f5-tts-mlx 0.2.6 passes a tuple shape; newer MLX only accepts a list of ints.
_normal = mx.random.normal
mx.random.normal = lambda shape=(), *a, **k: _normal([int(d) for d in shape], *a, **k)

from f5_tts_mlx.cfm import F5TTS
from f5_tts_mlx.generate import FRAMES_PER_SEC, SAMPLE_RATE, TARGET_RMS, estimated_duration
from f5_tts_mlx.utils import convert_char_to_pinyin

DATA = Path(os.environ.get("VOICE_DATA", Path.home() / "voice-ext" / "data"))
DATA.mkdir(parents=True, exist_ok=True)
REF_WAV, META = DATA / "ref.wav", DATA / "voice.json"
STEPS = int(os.environ.get("VOICE_STEPS", "8"))
MAX_REF_S = 10.0

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# MLX streams are per-thread and hang off the main thread here, so every MLX
# call is queued to the main thread; uvicorn runs in a background thread.
jobs: "queue.Queue[tuple[cf.Future, object, tuple]]" = queue.Queue()


def submit(fn, *args) -> cf.Future:
    f = cf.Future()
    jobs.put((f, fn, args))
    return f
state = {"model": None, "ref": None, "meta": None, "warm": False}
cache: "OrderedDict[str, bytes]" = OrderedDict()
inflight: dict[str, cf.Future] = {}
inflight_lock = threading.Lock()


def model() -> F5TTS:
    if state["model"] is None:
        state["model"] = F5TTS.from_pretrained("lucasnewman/f5-tts-mlx")
    return state["model"]


def load_voice():
    if REF_WAV.exists() and META.exists():
        audio, _ = sf.read(REF_WAV)
        a = mx.array(audio.astype(np.float32))
        rms = mx.sqrt(mx.mean(mx.square(a)))
        if rms < TARGET_RMS:
            a = a * TARGET_RMS / rms
        state["ref"], state["meta"] = a, json.loads(META.read_text())
        cache.clear()


def synth(text: str) -> bytes:
    ref, meta = state["ref"], state["meta"]
    ref_text = meta["ref_text"]
    dur = int(estimated_duration(ref, ref_text, text) * FRAMES_PER_SEC)
    if True:
        wave, _ = model().sample(
            mx.expand_dims(ref, 0), text=convert_char_to_pinyin([ref_text + " " + text]),
            duration=dur, steps=STEPS, method="rk4", cfg_strength=2.0, sway_sampling_coef=-1.0, seed=7,
        )
        wave = wave[ref.shape[0]:]
        mx.eval(wave)
    buf = tempfile.SpooledTemporaryFile()
    sf.write(buf, np.array(wave), SAMPLE_RATE, format="WAV")
    buf.seek(0)
    return buf.read()


def key(text: str) -> str:
    return hashlib.sha1((state["meta"]["id"] + "|" + text.strip().lower()).encode()).hexdigest()


def _synth_cached(k: str, text: str) -> bytes:
    t0 = time.time()
    data = synth(text)
    print(f"[voice] synth {time.time()-t0:.2f}s: {text[:60]!r}", flush=True)
    cache[k] = data
    if len(cache) > 200:
        cache.popitem(last=False)
    return data


def audio_future(text: str) -> cf.Future:
    k = key(text)
    with inflight_lock:
        if k in cache:
            cache.move_to_end(k)
            f = cf.Future(); f.set_result(cache[k]); return f
        f = inflight.get(k)
        if f is None:
            f = inflight[k] = submit(_synth_cached, k, text)
            f.add_done_callback(lambda _f, k=k: inflight.pop(k, None))
        return f


def get_audio(text: str) -> bytes:
    return audio_future(text).result(timeout=60)


def transcribe(wav: Path) -> str:
    import mlx_whisper
    return mlx_whisper.transcribe(str(wav), path_or_hf_repo="mlx-community/whisper-base-mlx")["text"].strip()


@app.get("/api/voice/status")
def status():
    m = state["meta"]
    return {"ready": True, "cloned": m is not None, "name": m and m["name"], "warm": state["warm"]}


@app.post("/api/voice/clone")
async def clone(audio: UploadFile = File(...), name: str = Form("My"), ref_text: str = Form("")):
    with tempfile.TemporaryDirectory() as d:
        src = Path(d) / ("in" + Path(audio.filename or "x.webm").suffix)
        src.write_bytes(await audio.read())
        out = Path(d) / "ref.wav"
        # mono 24 kHz, trim silence at start, cap to MAX_REF_S (F5 wants a short reference)
        r = subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), "-vn", "-ac", "1", "-ar", str(SAMPLE_RATE),
                            "-af", "silenceremove=start_periods=1:start_threshold=-45dB,loudnorm",
                            "-t", str(MAX_REF_S), str(out)], capture_output=True, text=True)
        if r.returncode != 0 or not out.exists():
            raise HTTPException(400, f"Couldn't read that audio: {r.stderr[-300:]}")
        secs = sf.info(out).duration
        if secs < 2.5:
            raise HTTPException(400, "Sample is too short; please record at least 3 seconds of speech.")
        text = ref_text.strip()
        if not text or secs >= MAX_REF_S - 0.05:  # trimmed uploads: the given transcript no longer matches
            text = submit(transcribe, out).result(timeout=120)
        if not text:
            raise HTTPException(400, "Couldn't hear any words in that sample.")
        REF_WAV.write_bytes(out.read_bytes())
    META.write_text(json.dumps({"id": str(time.time()), "name": name.strip() or "My", "ref_text": text}))
    submit(load_voice).result(timeout=30)
    audio_future("Hello, it's me.")
    return {**status(), "ref_text": text, "seconds": round(secs, 1)}


class SpeakReq(BaseModel):
    text: str


class PrepareReq(BaseModel):
    texts: list[str]


@app.post("/api/voice/speak")
def speak(req: SpeakReq):
    if state["meta"] is None:
        raise HTTPException(409, "No voice sample yet")
    if not req.text.strip():
        raise HTTPException(400, "empty text")
    return Response(get_audio(req.text[:400]), media_type="audio/wav")


@app.post("/api/voice/prepare")
def prepare(req: PrepareReq):
    if state["meta"] is not None:
        for t in req.texts[:5]:
            audio_future(t[:400])
    return {"ok": True}


# ---- call relay ---------------------------------------------------------------
rooms: dict[str, list[asyncio.Queue]] = {}
history: dict[str, list[dict]] = {}


class CallEvent(BaseModel):
    who: str
    kind: str = "line"
    text: str = ""


@app.post("/api/voice/call/{room}")
async def call_send(room: str, ev: CallEvent):
    e = {**ev.model_dump(), "at": time.time()}
    history.setdefault(room, []).append(e)
    del history[room][:-50]
    for q in rooms.get(room, []):
        q.put_nowait(e)
    return {"ok": True, "listeners": len(rooms.get(room, []))}


@app.get("/api/voice/call/{room}/events")
async def call_events(room: str):
    q: asyncio.Queue = asyncio.Queue()
    rooms.setdefault(room, []).append(q)

    async def gen():
        try:
            yield "retry: 1000\n\n"
            while True:
                try:
                    e = await asyncio.wait_for(q.get(), 15)
                    yield f"data: {json.dumps(e)}\n\n"
                except asyncio.TimeoutError:
                    yield ": ping\n\n"
        finally:
            rooms[room].remove(q)

    return StreamingResponse(gen(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


def warm():
    model()
    if state["meta"]:
        _synth_cached(key("Hello, it's me."), "Hello, it's me.")
    state["warm"] = True
    print("[voice] warm", flush=True)


if __name__ == "__main__":
    submit(load_voice)
    submit(warm)
    cfg = uvicorn.Config(app, host=os.environ.get("VOICE_HOST", "127.0.0.1"), port=int(os.environ.get("VOICE_PORT", "8790")))
    threading.Thread(target=uvicorn.Server(cfg).run, daemon=True).start()
    while True:
        fut, fn, args = jobs.get()
        try:
            fut.set_result(fn(*args))
        except Exception as e:  # noqa: BLE001
            print(f"[voice] job failed: {e!r}", flush=True)
            fut.set_exception(e)
