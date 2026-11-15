# Simple 2-minute live demo (screen recording you perform)

**Setup (2 min before):**
- Run `npm run dev`, plus the understand server (:8787) and the voice server.
- Open **Window A** at `http://localhost:5177/#/app` and set it to phone size (DevTools → device toolbar → iPhone 14, or the browser pane's Mobile view).
- Open **Window B** at `http://localhost:5177/#/caller`. That's Ellie's laptop, and someone else can play her.
- Warm up once: on Talk, type `hi` and press Enter so the first real call isn't slow.
- Have a real iPhone with Siri on, plus the printed bill (`src/vision/read/samples/bill.png`) or that file open on a second screen.
- Start the screen recording with the mic on.

| Time | Do this (exact clicks) | Say this (exact lines) |
|---|---|---|
| 0:00–0:15 | Hold up the iPhone. Say to Siri, haltingly: **"Hey Siri… call… uh… Ellie… no… phone."** Let Siri answer. | *(after Siri answers)* "That's how voice assistants treat people whose speech doesn't come out clean." |
| 0:15–0:30 | Cut to Window A, the VoiceOS home screen. | "Stroke survivors with aphasia, people with Parkinson's, ALS, or a stutter: they know exactly what they mean. So we elevated the voice assistant. This is VoiceOS." |
| 0:30–0:55 | Tap **Talk**. Tap the mic and say **"call… uh… Ellie… no… phone… birthday"**. Or type it in "or type words…" and press Enter. Wait for the 3 cards. | "Same broken words. VoiceOS knows Ellie is his granddaughter, that today is her birthday, and what he's holding. Instead of 'didn't get that', three full sentences." |
| 0:55–1:05 | Tap the **highlighted first card**. | *(stay quiet while it speaks in his cloned voice)*, then: "That's his own voice." |
| 1:05–1:20 | Tap **Home** (⌂). Tap **Read**. Hold the bill to the camera and tap 👁️. Or tap **🖼️ Photo** and pick bill.png. | "It reads his mail too. A page of fine print becomes one line: electric bill, eighty-four dollars, due Saturday." |
| 1:20–1:45 | Tap **Home** → **Phone** → **Ellie's face**. In Window B, "Ellie" types or says: *"Hi Grandpa! Is everything okay?"* In Window A, type **"bill… money… help… Saturday"**, press Enter, then tap card 1. | "He calls by face. Ellie talks normally, and he sees her words simplified with pictures. He answers in fragments, and she hears a full sentence in his voice." |
| 1:45–2:00 | Window B: Ellie types *"I love you Grandpa!"*. Then cut to the landing page `#/`. | "Siri matches words. VoiceOS understands meaning. Elevate the ordinary: the voice assistant, finally for the people who need it most." |

**If something goes wrong**
- **The cards are slow (7–9 s is normal):** keep talking through the "Finding your words…" shimmer.
- **No second device:** on the call screen tap **🎭 Simulate Ellie**. It's labelled as a simulation on screen.
- **Siri actually understands you:** say "Sometimes it works. Often it doesn't, and you can't build your day on 'sometimes'." Then carry on.
- **Honesty:** Frank's voice is cloned from a public sample speaker, not a real patient.
