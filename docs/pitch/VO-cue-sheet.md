# VoiceOS demo: voice-over cue sheet

Video: `docs/pitch/voiceos-demo.mp4`. 1920×1080, 30 fps, **2:32.7**.
Everything on screen is the real app on master, driven by Playwright:
- Frank's phone is at `#/app` (390×844).
- Ellie's laptop is at `#/caller`, connected live through the call relay.
- The 3 cards are real Claude output, and his lines are the real cloned voice from `/api/voice/speak`.

The only sound is his two voice lines (marked 🔊). **Don't talk over 🔊 slots.** Everything else is silence left for your narration.
Speed-ups: "Thinking" waits run at 2–3× and Ellie's second typing at 1.5×. Everything else is real time.

| # | Start–End | You say (VO) | On screen |
|---|---|---|---|
| 1 | 0:00–0:07 | "Frank is 71. He knows exactly what he wants to say." | Title: *Frank knows exactly what he wants to say.* |
| 2 | 0:07–0:14 | "After his stroke, the words don't come out. It's called aphasia, and about two million Americans live with it." | Title: aphasia, ~2 million in the U.S. (NIDCD) |
| 3 | 0:14–0:19 | "So we rebuilt his phone around what he can still do." | Title: **VoiceOS**, his phone rebuilt around what he can still do. |
| 4 | 0:19–0:29 | "This is Frank's home screen. Faces instead of contact lists, a big Talk button, his day in pictures. And a message: it's Ellie's birthday." | Home: Ellie's birthday toast, Talk orb, My people, today's plan. |
| 5 | 0:29–0:37.5 | "A letter came. Frank can't read it, so he holds it up to the camera." | Read app: the camera sees the electric bill, then tap 👁️. The short reading wait is sped up 3×. |
| 6 | 0:37.5–0:47.7 | "VoiceOS turns a page of fine print into one line: electric bill, eighty-four dollars, due Saturday. With a button to call Ellie about it." | Result card: ⚡ $84.12 due Saturday, late-fee warning, "📞 Call Ellie about it". |
| 7 | 0:47.7–0:53.5 | "So he calls her. Not by dialling: he just taps her face." | Phone → Ellie. Ringing, then "Live: Ellie is on another device". Ellie's laptop (right) shows "Connected to Frank's phone". |
| 8 | 0:53.5–1:08.3 | "Ellie talks normally on her laptop. On Frank's phone, her long sentence arrives as short lines with pictures, so he can follow it." | Ellie types her greeting (right). On Frank's phone it becomes simplified lines with emoji, e.g. "You were worried about it." / "Is everything okay?" |
| 9 | 1:08.3–1:12.6 | "And here's the hard part. All Frank can get out is: bill… money… help… Saturday." | Fragment chips: **bill · money · help · Saturday**, then "Finding your words…" (sped up 2×). |
| 10 | 1:12.6–1:19.8 | "Claude uses those fragments, the bill he just read, today's date and his life, and offers three full sentences. He taps the first one." | Three glass cards. The best one is highlighted, with a small "because". Tap at ≈1:19.4. |
| 🔊 11 | **1:19.8–1:26.6** | *(silent: his cloned voice plays)* "Ellie, happy birthday. The power bill, $84 … I need help. Saturday." | "Speaking…" waveform on Frank's phone. The line appears on Ellie's laptop, played there in his voice. |
| 12 | 1:26.6–1:35.8 | "That's his own voice, cloned from a short recording, and it plays on Ellie's laptop." | Ellie starts typing her reply (sped up 1.5× from 1:31.5). |
| 13 | 1:35.8–1:45.7 | "Ellie answers like she always would. Frank sees it simply: Ellie comes over Saturday. We pay the bill together. Don't worry." | Ellie: "Of course, Grandpa! I'll come over on Saturday…". Frank: 👍 / 📅 / 💡 / 🙂 simplified lines. |
| 14 | 1:45.7–1:56.0 | "Then the thing he really wanted to say. Ellie… love… you." | Fragments **Ellie · love · you**, then a quick think (2×), then three cards. Tap at ≈1:55.6. |
| 🔊 15 | **1:56.0–1:59.8** | *(silent: his cloned voice plays)* "Ellie, I love you. Thank you. Saturday." | Speaking waveform. The line lands on Ellie's laptop. |
| 16 | 1:59.8–2:08.7 | "And she gets to hear 'I love you' from her grandpa, in his voice, on her birthday." | Ellie: "I love you too, Grandpa ❤️ See you Saturday!" Hold on both screens. |
| 17 | 2:08.7–2:24.7 | "Messages from family arrive simplified. A Memory Book of his life feeds every guess. His day in pictures. Practice that turns real sentences into therapy. And a family view to stay close." | Fast montage, 3.2 s each: Messages (2:08.7) → Memories (2:11.9) → My Day (2:15.1) → Practice (2:18.3) → Family (2:21.5). |
| 18 | 2:24.7–2:32.7 | "VoiceOS. The words are still there. Elevate the ordinary." | Closing title: **VoiceOS. Elevate the ordinary.** |

## Honest notes
- Ellie's side is **typed** in the recording; on stage she can speak, since #/caller transcribes speech. The call runs over the local relay, not a phone line.
- Frank's fragments are typed into the composer, because the headless browser has no microphone. In real use he speaks them.
- The camera input is the sample bill (`src/vision/read/samples/bill.png`) fed in as a fake webcam.
- The second chosen sentence was Claude's top card, "Ellie, I love you. Thank you. Saturday." We didn't script it to say "I love you, Ellie."
- His voice lines were re-synthesised from the same clone and placed at the tap time. The browser recording itself has no audio track.

## Re-render
Scripts are in `docs/pitch/video-build/`:
1. `node rec.mjs`. App on :5177, writes `raw/` with corner timing markers.
2. `python3 align.py` inside `raw/`.
3. `node assets.mjs`.
4. Fetch voice WAVs.
5. `python3 compose.py`.

If the voice server improves, re-run steps 4 and 5 only. The cue times stay the same unless the voice lines get longer.
