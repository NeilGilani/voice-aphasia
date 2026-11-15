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
