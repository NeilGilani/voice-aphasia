# 2-minute demo video: script + shot list (checked against master)

Spine: **read a bill with the camera → call Ellie → reply in his own voice.**
Cheat-code moment: fragments → 3 cards → his own voice → Ellie answers.
Persona (from `src/app/os/persona.ts`): **Frank**, 71, expressive aphasia after a stroke in March 2025. **Ellie** is his granddaughter (birthday today, at college), **Maria** his wife, and **Biscuit** the dog.

## Pre-flight (do before recording)
- Start the servers: `npm run dev` and the understand server on :8787. Pre-warm `/api/understand` once, since the first call is slow.
- Clone Frank's voice in Settings (30–60 s sample). Otherwise the device voice is used. Say which one you used if asked.
- Have `src/vision/read/samples/bill.png` printed or on a second screen. It's the electric bill, $84.12 due 11/21.
- Clear localStorage keys `voice.practice.v1` and `voice.day.v1` for a clean Family view.

## Shot list
| Time | Shot (what's really on screen) | Audio / VO |
|---|---|---|
| 0:00–0:10 | Kitchen table. Frank turns the bill over in his hands. Close on the dense small print. | VO: "Frank understands everything. Since his stroke, words don't work: not spoken, not written." |
| 0:10–0:17 | Caption: *About 2 million Americans live with aphasia (NIDCD)*. | VO: "It's called aphasia." |
| 0:17–0:24 | VoiceOS home screen: wallpaper, people tiles, Ellie's 🎂 message. | VO: "So we rebuilt his phone around what he can still do." |
| 0:24–0:42 | **Read.** Home → 📷 Read. He holds up the bill. `ReadWorld` shows a few big emoji lines: the electric bill, $84.12, due Nov 21, plus action buttons (💳 pay / 🤝 help, ⏰ remind). It reads them aloud. | Device or cloned voice reads the lines. |
| 0:42–0:52 | **Call by face.** Back → 📞 Phone → tap Ellie's face. The call screen shows "Calling…", then a live timer. | Ring sound (add in the edit). |
| 0:52–1:05 | **Cheat-code moment.** On the live call he presses talk and says: "bill… help… Ellie… birthday." Fragments pop in. Three glass cards rise, with the best one highlighted and a small "because". | His real, halting voice. |
| 1:05–1:15 | He taps the best card, e.g. "Happy birthday, Ellie. Can you help me pay the electric bill?" | **His cloned voice** says the sentence. |
| 1:15–1:27 | Ellie's reply bubble appears: "Of course Grandpa, I'll pay it online tonight. Don't worry 💛". Cut to a real actor reading the same line on camera. | Ellie (actor) says the line warmly. |
| 1:27–1:38 | **Reply in his own voice.** He taps the quick reply "I love you", or speaks "love… you… proud." Ellie's bubble: "Aww Grandpa 🥹 I love you too!" Hold 3 s on his face. | Cloned voice: "I love you." |
| 1:38–1:48 | **Practice.** On the Talk screen after a choice, the PracticeCard slides up: "Want to practise one word? **Ellie** · El · lie". He says it, and ⭐ "Beautiful. You said it!" | VO: "Every sentence becomes a little therapy." |
| 1:48–1:55 | Quick tiles at phone size: `#/family` Today (activity feed), `#/memory` (people faces), `#/day` (picture routine). | VO: "Family stays close. His life feeds the understanding." |
| 1:55–2:00 | End card on the aurora: **VoiceOS: the words are still there.** BayValleyHacks 2026. | VO: "Elevate the ordinary." |

## Honesty notes for the cut (be ready to say these to judges)
- **Calls are simulated in-app.** Ellie's replies on the call are scripted in `People.tsx`. The "📱 Real phone" button hands off to `tel:`. Say "simulated call" if asked.
- Understanding takes about 7–9 s live. We cut the wait in the edit; the app shows a thinking state.
- On master, the **Read** "pay/help" button opens an SMS to a helper. The Family-bridge payment confirmation (`#/family` → Payments) is a separate view with a seeded bill. Show it only as "family can confirm", not as wired to the bill scan.
- Practice needs Chrome or Safari speech recognition. Exactly which three cards appear depends on the model, so record a few takes.
