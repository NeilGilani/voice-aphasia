# Running VoiceOS (demo)

Four local processes. The AI uses your Claude subscription through the headless `claude -p` CLI, so you need no API key. Run `claude` once beforehand so it is logged in. Requires Node ≥ 23.

```bash
npm install
```

1. Understanding server (fragments → 3 sentences, /api/simplify), port 8787:
```bash
node server/understand.ts
```
2. Read-the-world server (photo → bill/letter summary), port 8788:
```bash
node server/read.ts
```
3. Cloned-voice server (F5-TTS-MLX, Apple Silicon), port 8790. One-time setup is in `src/voice/README.md`; it needs `brew install ffmpeg`:
```bash
~/voice-ext/f5env/bin/python server/voice_server.py
```
4. The app (Vite proxies /api/read → 8788, /api/voice → 8790, /api → 8787):
```bash
npm run dev
```

Open http://localhost:5173/#/app (phone-sized window, or on a phone on the same Wi-Fi via the Network URL Vite prints).
Routes: `#/` landing · `#/app` VoiceOS · `#/family` family bridge · `#/memory` `#/day` `#/practice` `#/progress`.

Every server is optional. If one is down, the app falls back: offline candidate guesses, the device voice (the status bar says so), or a local simplifier.

## Demo path (verified in the browser)
1. Home → **Read** → tap the electric-bill sample (or hold up the paper bill). Claude reads it in ~9 s: Valley Power & Light, $84.12, due Sat Nov 21.
2. **Call Ellie about it** → the simulated call connects ("Hi Grandpa! … It's my birthday!").
3. Talk or type fragments: `bill… money… help… Saturday`. Three cards appear (~3–5 s).
4. Tap card 1 → it is spoken in Frank's cloned voice, and Ellie replies.
5. Also try: Messages → Ellie (simplified with icons), Talk with `water… no… Ellie… phone… birthday`, Memories → "Tell this story", Emergency (hold).

Reset the demo persona: clear site data, or Settings → Reset demo.
