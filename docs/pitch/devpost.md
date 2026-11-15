# VoiceOS: the voice assistant, elevated for the people it leaves behind

## Inspiration: the existing product we elevated
Voice assistants (Siri, Alexa, Google Assistant) are built into almost every phone and smart speaker. They promise hands-free help
for everyone. But they're tuned to clean, complete commands. Say "Hey Siri… call… uh… Ellie… no… phone" the way a stroke survivor
with aphasia says it, and you get "Sorry, I didn't get that."

The people this fails are often the people who need a voice assistant most:
- stroke survivors with aphasia (they know what they mean, but the words come out broken);
- people with dysarthria from Parkinson's or ALS;
- people who stutter;
- many older adults.

About 2 million people in the U.S. live with aphasia alone ([NIDCD](https://www.nidcd.nih.gov/health/aphasia)). Roughly
100,000–180,000 acquire it each year ([ASHA](https://www.asha.org/practice-portal/clinical-topics/aphasia/)).

**Elevate the Ordinary:** we took the most ordinary piece of tech, the voice assistant, and rebuilt it so it understands
*meaning* instead of exact words, answers in *your own voice*, and *acts* across your whole life.

## What it does
VoiceOS is a voice assistant plus a phone-first OS, rebuilt around what people with broken speech can still do: say fragments, recognise faces and pictures, point, tap.
- **Talk.** Say the fragments. VoiceOS combines what it heard, what you're pointing at, your Memory Book, today's routine and the date, then offers **3 full sentences** with a short "because". Tap one and it speaks **in your own cloned voice**, and can act on it (call Ellie).
- **Read the world.** Hold up a bill or a letter. The camera turns it into one short line: "Electric bill. $84.20. Due Nov 20."
- **Calls & messages by face.** No contact lists. Family picture messages arrive already simplified.
- **Money, safely.** You decide to pay; a family helper confirms on their phone. VoiceOS never moves money by itself.
- **My Day.** Pills, meals and appointments as big pictures with gentle spoken prompts.
- **Memory Book.** People (photo, relation, stories), life story and favourite topics, written with family. It feeds the understanding engine directly.
- **Practice: therapy inside daily life.** After you choose a sentence: "Want to try saying *Ellie*?" It uses a cueing ladder speech therapists use (try → first-sound cue → hear it → say it together). A **progress view** with CSV export lets a speech-language pathologist see what's improving.
- **Family bridge.** A companion view: today's activity, send a picture message, "say it simply" (long sentences → short ones with pictures), and payment confirmations.

## How we built it
- Vite + React + TypeScript, dark-glass UI, five parallel workstreams against shared typed contracts (`src/contracts`).
- Understanding: a Node server calls Claude (Sonnet/Haiku via the Claude CLI, API fallback), given fragments + vision labels + PersonContext + recent turns + time. It returns exactly 3 ranked candidates with actions. Every choice is fed back as a prior.
- Voice: VoiceStudio running locally clones a voice from a short sample (an old voicemail works); browser speech is the fallback.
- Vision: MediaPipe hands + object detection in the browser. Only labels like "phone, pointed at" leave the device.
- Family/Memory/Day/Practice: local-first state shared across views; family simplification via `/api/simplify` with an offline rule-based fallback.

## Results (honest)
Our own eval set has 30 aphasia-style utterances. A hit means a candidate matches all of a case's keyword groups.
- Sonnet: top-1 27/30, top-3 30/30.
- Haiku: top-1 28/30, top-3 30/30.

We wrote these cases ourselves and the matching is lenient, so these are smoke-test numbers, not clinical accuracy. End-to-end understanding takes about 7–9 s today.

## Challenges
- Fragments are ambiguous by design, so we rank three options instead of guessing one, and show *why*.
- Keeping the person the author: nothing is spoken, sent or paid without their tap.
- Latency across speech → LLM → voice cloning.

## What's next
Co-design with speech-language pathologists and people with aphasia; on-device models; nod/gaze selection; real telephony and banking integrations behind family confirmation; more languages.

In the demo, the "Frank" voice is cloned from a public sample speaker, not a real patient.

*VoiceOS is a hackathon prototype, not a medical device.*
