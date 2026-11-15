# Voice — giving words back to people with aphasia

BayValleyHacks 2026 · theme "Elevate the Ordinary" · hacking ends 8:00 PM PT today.

## The product
Someone with aphasia (stroke / brain injury) knows exactly what they mean but the words come out broken:
"water… no… Ellie… phone… birthday". Voice listens to the fragments, looks at what they point at,
uses what it knows about their life, and offers **3 full sentences**. They tap one (or nod) and the phone
says it **in their own voice** — and can act on it (call Ellie). It learns from every choice.

Demo moment: struggling fragments → 3 cards → tap → his own warm voice: "Call Ellie and wish her a happy
birthday. Tell her I love her." → phone rings Ellie.

## Architecture
- Vite + React + TS app (phone-first, works on laptop). `src/contracts/index.ts` = shared types. Don't break them.
- `server/` — small Node server (Express) holding the Claude API key; `/api/understand`, `/api/voice/*`.
- Claude model: `claude-opus-5-5` (fallback `claude-sonnet-5-5` for speed). Key from env `ANTHROPIC_API_KEY`.
- Voice cloning: VoiceStudio (https://github.com/debpalash/VoiceStudio), run locally; fallback browser speechSynthesis.

## Workstreams (one Claude session each, own folder, own branch)
| # | Branch | Owns | Done looks like |
|---|---|---|---|
| 1 | `ws/app` | `src/app/`, `src/main.tsx`, `src/App.tsx`, styles — **integration lead** | Glassy, gorgeous patient UI: big talk button, live fragments, 3 candidate cards, tap → speak; conversation view; settings/onboarding for people & facts. Merges the other branches. |
| 2 | `ws/understand` | `src/understand/`, `server/understand*` | Speech capture (fragment-friendly STT), context store, Claude prompt that turns fragments+context+vision into 3 ranked candidates with actions; learns from choices; eval set of 30 aphasia-style utterances with pass rate. |
| 3 | `ws/voice` | `src/voice/`, `server/voice*` | VoiceStudio running locally, clone from a short sample/voicemail, `VoiceEngine` impl + fallback; latency < 2 s; recording UI for the sample. |
| 4 | `ws/vision` | `src/vision/` | Camera: detect what the person points at / holds up (MediaPipe hands + object detection) → `SeenObject[]` attached to the utterance. Works in browser, no server. |
| 5 | `ws/story` | `src/pages/` (landing, family mode), `docs/pitch/` | Landing page, Family mode (simplify what family says into short sentences + pictures), Devpost write-up, 2-min demo video script, judge Q&A. |

Rules: stay in your folder; need something from another workstream → code against the contract and stub it.
Commit often to your branch, push. No secrets in git. Honest claims only (no fake accuracy numbers).
