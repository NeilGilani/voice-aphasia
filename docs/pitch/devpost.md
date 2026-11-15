# Voice — the words are still there. We help them out.

## Inspiration
Aphasia is a language disorder, usually caused by a stroke. The person still understands, still thinks, still knows exactly
what they want to say. But the words come out broken: "water… no… Ellie… phone… birthday." Conversations move on
without them. Families start answering for them. Voice is our attempt to give them their sentences back, in their own voice.

About 2 million people in the U.S. live with aphasia ([NIDCD](https://www.nidcd.nih.gov/health/aphasia)), and roughly
100,000–180,000 acquire it each year ([ASHA](https://www.asha.org/practice-portal/clinical-topics/aphasia/)).
An estimated 21–38% of acute stroke patients develop it ([StatPearls](https://www.ncbi.nlm.nih.gov/books/NBK559315/)).

**Elevate the Ordinary:** the most ordinary thing in the world, calling your granddaughter on her birthday, is what Voice gives back.

## What it does
1. **Listens to fragments.** Speech recognition tuned to keep broken, halting words instead of throwing them away.
2. **Sees what you point at.** In-browser hand + object detection notices you holding a phone or pointing at a photo.
3. **Knows your life.** People, routines, facts, and every sentence you chose before.
4. **Offers 3 full sentences.** Claude turns fragments + what it sees + context + the time and date into three ranked candidates, each with a short "because".
5. **Speaks in your own voice.** One tap (or a nod) and it's said in a voice cloned from an old voicemail. It can act too, e.g. call Ellie.
6. **Learns.** Every choice becomes context for next time.
7. **Family mode.** Works the other direction: family talk normally, and Voice shows each idea as one short sentence with a picture.

## How we built it
- Vite + React + TypeScript, phone-first, glassy UI; shared typed contracts between five parallel workstreams.
- Node/Express server holding the Claude API key: `/api/understand` (Claude Opus 5.5, Sonnet 5.5 as the faster fallback), `/api/simplify`, `/api/voice/*`.
- Voice cloning via VoiceStudio running locally; browser `speechSynthesis` fallback.
- Vision: MediaPipe hands + object detection running entirely in the browser; only labels leave the camera.
- An eval set of 30 aphasia-style utterances that we check candidate quality against.

## Challenges
- Fragments are ambiguous by design, so the model has to rank, not guess. Three options and a visible "because" keep the person in charge.
- Latency: understanding plus voice synthesis has to feel conversational.
- Honesty: the person has to stay the author. Voice never speaks without a choice.

## What we're proud of
The moment a broken string of words turns into a whole sentence, said in his own voice, and his granddaughter answers.

## What's next
Testing with speech-language pathologists and people with aphasia; on-device models for privacy; nod and gaze selection; multilingual support.

## Disclaimer
Voice is a hackathon prototype, not a medical device. The statistics above link to their sources. We report no accuracy figures beyond our own small eval set.
