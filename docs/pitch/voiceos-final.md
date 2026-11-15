# voiceos-final.mp4: timing and notes

1920×1080 H.264/AAC, **1:26.5**. The narrator is Kokoro `am_michael` (a preset voice, not cloned). Frank's line is his cloned voice from `/api/voice/speak`.

| Video | Start–End | Audio |
|---|---|---|
| Title: “They understand everything. The words come out wrong.” | 0:00–0:14.7 | Narration 0:00.8–0:13.1 |
| “My grandfather was affected by aphasia.” | 0:14.7–0:22.1 | Narration 0:15.4–0:20.5 |
| Dictation / Siri today (labelled recreation), “car… no… sick… sorry… love” typing out | 0:22.1–0:35.0 | Narration 0:23.7–0:33.5 |
| Real app: Phone → Ellie → live call, Ellie's line simplified | 0:35.0–0:45.9 | silence (captions) |
| Fragments “car no sick sorry love” → thinking (3×) | 0:45.9–0:48.5 | silence |
| 3 cards, top card + “because” highlighted | 0:48.5–1:02.5 | Narration 0:51.0–0:59.6 |
| Tap → spoken | 1:02.5–1:11.9 | **Frank's voice 1:02.9–1:09.7**: “I'm sorry, sweetheart. I'm sick, so I can't come Saturday. I love you.” Then a 2 s hold. |
| End card: VoiceOS | 1:11.9–1:26.5 | Narration 1:12.8–1:24.1 |

## Honest notes
- **Ellie** joined from a second, live `#/caller` page (typed, not shown), not "Simulate Ellie". The built-in simulated Ellie asks about her birthday, not a Saturday party.
- **Seeded context:** before recording, Frank's context got one fact, “Ellie's birthday party is this Saturday at David's house”. It also got two past chosen sentences (“I'm sorry, sweetheart. I'm not feeling well today.” and “I love you, sweetheart.”), the way the Memory Book and learning would supply them.
- **Second attempt:** the first attempt's top card was “I'm sorry, sweetheart. I can't come. I'm not feeling well.”, without “I love you”. The video uses the second attempt with the same fragments, and the first attempt is cut.
- **Typed fragments:** Frank's fragments are typed, because the headless browser has no microphone.
- **Simplifier dropped a word:** Ellie's simplified line reads “…birthday party on?”, losing “Saturday”. That's the real simplifier output.
