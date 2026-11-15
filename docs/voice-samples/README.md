# Cloned voice: before / after

**Why it sounded bad:** the voice was being cloned from a *synthetic* reference. The test sample was macOS `say -v Daniel`, and F5-TTS copies whatever it's given, robotic prosody included. Nobody had recorded a real sample yet.

All files say "Can you help me pay the bill on Saturday?" unless the name says otherwise. Metrics are measured, not listened to: Whisper transcription and an autocorrelation F0 estimate.

| File | Reference | Length | Pitch variation | Whisper |
|---|---|---|---|---|
| `before_robot-reference.wav` | macOS `say` voice | 2.4 s (rushed) | 3.3 semitones (flat) | exact |
| `after_human-reference_8steps.wav` | real human sample | 4.4 s | 6.6 st | exact |
| `after_human-reference_16steps.wav` | real human sample | 4.4 s | 6.4 st | exact |
| `after_i-love-you-ellie.wav`, `after_call-ellie.wav` | real human sample, server pipeline | | | |

**Findings**
- The reference is the cause. A human reference doubles the intonation range and gives natural pacing.
- Steps (8 → 16 → 32) barely change these metrics; 16 is a little smoother at ~2× the time. The server now uses 16 for pre-generated lines and 8 for live cache misses.
- Uploaded references now get a highpass at 70 Hz, FFT denoise, leading-silence trim and loudness normalisation.

**The demo voice right now** is the sample F5 ships (a real male reader, not Frank and not the user). For a voice that's actually *yours*, record 6–10 s in Settings → Their own voice:
- a quiet room, phone ~20 cm away, a natural warm tone (talk to someone; don't "read");
- say exactly the script shown, so the transcript matches.

A mismatched transcript is the next most common cause of garbled clones.

## Model comparison (`compare/`)
Two lines per model: "I love you, Ellie." and the bill line. All run locally with MLX on this Mac. "Pitch SD" is intonation range in semitones (higher = less flat); "Whisper" checks the words came out right.

| Model | Size | Clones? | Time per line (warm) | Pitch SD | Words right |
|---|---|---|---|---|---|
| **F5-TTS-MLX** (`f5_clone_16steps_*`) | 1.3 GB | yes | 3–10 s (pre-rendered, cached → ~5 ms) | **6.4–8.1** | 2/2 |
| Chatterbox 4-bit (`chatterbox_clone_ex*`), exaggeration 0.3/0.5/0.7 | 0.6 GB | yes | 2–8 s | 3.6–6.6 | **3/6**: "I love you, Erwin", "and you'll help me…", a doubled "Ellie" |
| **Kokoro-82M** (`kokoro_*`; am_michael, am_adam, bm_george, bm_lewis) | 0.4 GB | no (presets) | **~0.1 s** | 3.0–4.3 | 8/8 |

**Decision**
- **Their voice = F5 clone.** It had the most intonation and every word right; all demo lines are pre-rendered and cached on disk.
- **The fallback is now Kokoro (am_michael)** instead of the robotic browser voice. It's instant and natural but not cloned, labelled "Natural voice (not cloned yet)".
- Chatterbox's emotion control is appealing, but the 4-bit quant mis-spoke half the lines, and that's a dealbreaker for an AAC device. The fp16 build (2.6 GB) might fix it; it's untested and would need the user's OK to download.

These numbers are measured, not listened to; please listen to `compare/` and overrule by ear. Swapping the preset voice is one env var: `KOKORO_VOICE=bm_lewis`.
