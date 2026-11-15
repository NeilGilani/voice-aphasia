# Voice (workstream 3)

Speaks the chosen sentence in the person's **own cloned voice**, falling back to a clearly labelled device voice when the clone isn't available.

## Engine choice
We first looked at VoiceStudio (debpalash/VoiceStudio). It does run on Apple Silicon (a backend-only `bun run setup:api` that serves an OpenAI-compatible `/v1/audio/speech` on :3900). The full install is roughly 6–10 GB (PyTorch, ~200 Python packages and the OmniVoice weights), and it's AGPL. For the hackathon we went lighter:
**[F5-TTS-MLX](https://github.com/lucasnewman/f5-tts-mlx)**, which does zero-shot cloning natively on MLX: ~1.3 GB of weights, no PyTorch, and it clones from a sample of about 5–10 s plus its transcript.
- Trade-off: one engine, English-first, and quality is a bit below OmniVoice. In exchange the install is far smaller and simpler and runs on Metal.

## Run
```bash
uv venv --python 3.12 ~/voice-ext/f5env
VIRTUAL_ENV=~/voice-ext/f5env uv pip install f5-tts-mlx mlx-whisper fastapi uvicorn python-multipart soundfile
~/voice-ext/f5env/bin/python server/voice_server.py   # :8790; needs ffmpeg (brew)
```
Natural fallback voice (optional): `uv venv --python 3.12 ~/voice-ext/mlxaudio && VIRTUAL_ENV=~/voice-ext/mlxaudio uv pip install mlx-audio "misaki[en]" fastapi uvicorn soundfile` + the spaCy `en_core_web_sm` wheel, then `~/voice-ext/mlxaudio/bin/python server/voice_kokoro.py` (:8792).

In `vite.config.ts` (integration lead), add `server: { proxy: { '/api/voice': 'http://127.0.0.1:8790' } }`, or set `VITE_VOICE_API=http://127.0.0.1:8790/api/voice`.

## Use
```tsx
import { createVoiceEngine, VoiceSampleRecorder, VoiceBadge } from './voice';
const voice = createVoiceEngine({ onFallback: (m) => toast(m) });
await voice.ready();                       // sets voice.label: "Grandpa voice" or "Device voice (…)"
voice.prepare(candidates.map(c => c.text)); // when the 3 cards appear: pre-synthesise
await voice.speak(chosen.text);             // instant if prepared; device voice if not ready within 8 s
<VoiceSampleRecorder defaultName="Grandpa" onCloned={() => voice.ready()} />
<VoiceBadge engine={voice} usingClone={voice.usingClone} />
```

## Latency
Measured on this Mac (M-series, 8 steps): a cold synth of one short sentence takes **~3 s**, a cached one **~10 ms**. Three candidates queue serially (~9 s total), so to stay under 2 s we **pre-synthesise all 3 candidates the moment they're shown**. By the time the person taps, the audio is cached, and server and client both dedupe in-flight requests. The model stays loaded and warm.

## Privacy
The sample and the clone stay on this machine (`~/voice-ext/data`), and nothing goes to the cloud. Uploaded voicemails and videos are cut to the first 10 s of speech and transcribed locally with mlx-whisper.

Measured clone times: recorded sample ≈1 s; an uploaded video with no transcript ≈5 s once whisper-base is cached (the first call downloads it, ~50 s).
