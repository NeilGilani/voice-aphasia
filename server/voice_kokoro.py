"""Preset-voice sidecar: Kokoro-82M (MLX, ~0.4 GB) — instant, natural, not cloned.

Used when there is no clone, or the clone isn't ready in time; far more human than
browser speechSynthesis. Runs in its own venv (mlx-audio) on :8792; voice_server.py
proxies /api/voice/preset/* to it.

  POST /speak {"text": "...", "voice"?: "am_michael"} -> audio/wav
Run: ~/voice-ext/mlxaudio/bin/python server/voice_kokoro.py
"""
import io, os, queue, threading, concurrent.futures as cf
import numpy as np, soundfile as sf, uvicorn
from fastapi import FastAPI
from fastapi.responses import Response
from pydantic import BaseModel
from mlx_audio.tts.utils import load_model

VOICE = os.environ.get("KOKORO_VOICE", "am_michael")
app = FastAPI()
jobs: "queue.Queue" = queue.Queue()  # MLX work stays on the main thread
cache: dict[str, bytes] = {}


class Req(BaseModel):
    text: str
    voice: str | None = None


def synth(text: str, voice: str) -> bytes:
    k = f"{voice}|{text.strip().lower()}"
    if k not in cache:
        a = np.concatenate([np.array(r.audio) for r in model.generate(
            text=text, voice=voice, speed=0.95, lang_code="a" if voice.startswith("a") else "b", verbose=False)])
        b = io.BytesIO(); sf.write(b, a, model.sample_rate, format="WAV"); cache[k] = b.getvalue()
    return cache[k]


@app.post("/speak")
def speak(req: Req):
    f = cf.Future(); jobs.put((f, req.text[:400], req.voice or VOICE))
    return Response(f.result(timeout=30), media_type="audio/wav")


@app.get("/status")
def status():
    return {"ready": True, "voice": VOICE}


if __name__ == "__main__":
    model = load_model("mlx-community/Kokoro-82M-bf16")
    synth("Hello.", VOICE)
    cfg = uvicorn.Config(app, host="127.0.0.1", port=int(os.environ.get("KOKORO_PORT", "8792")))
    threading.Thread(target=uvicorn.Server(cfg).run, daemon=True).start()
    print("[kokoro] ready", flush=True)
    while True:
        f, t, v = jobs.get()
        try: f.set_result(synth(t, v))
        except Exception as e: f.set_exception(e)
