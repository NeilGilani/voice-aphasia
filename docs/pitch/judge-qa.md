# Judge Q&A prep (VoiceOS: the voice assistant, elevated)

**What existing product did you elevate?**
The voice assistant: Siri, Alexa, Google Assistant. It's ordinary, everywhere, and built on the assumption that you can say a clean command. We kept the idea (talk to your phone and it does things) and rebuilt the understanding for people whose speech doesn't come out clean.

**Why not just improve Siri?**
We can't change Siri, and the change is bigger than better speech recognition. Siri's model is: transcribe the words, match an intent. For someone with aphasia, the right words were never said. "Ellie… no… phone… birthday" has to be *interpreted* using who Ellie is, today's date, and what he's holding. VoiceOS adds that interpretation layer, plus three choices (so the person stays the author), output in their own voice, and actions across calls, messages, mail, money and routines. We'd love for assistant makers to adopt this pattern, and the design isn't tied to our app.

**Don't Apple and Google already work on this?**
Yes, and it's important work:
- **Google's Project Euphonia** collects speech from people with speech impairments to make recognition work better for them.
- **Project Relate** is Google's app built on that for people with non-standard speech.
- **The Speech Accessibility Project** at the University of Illinois is backed by several big tech companies and also collects atypical speech data.
- **Apple** has accessibility features like Personal Voice (voice banking) and a setting to listen for atypical speech.

Those mostly make *transcription* more accurate for the words someone says. VoiceOS targets a different gap: when the words themselves are missing or wrong (aphasia), it infers *meaning* from fragments + life context + what you point at. It speaks the result in your own voice and acts on it. The two approaches complement each other: better recognition would make VoiceOS better too.

**Doesn't this already exist?**
Parts of it do, and we respect that work. **Proloquo2Go** (AssistiveWare) and **Lingraphica**'s apps and devices are proven AAC tools.
They're symbol- and phrase-board based: you navigate categories and build a message icon by icon, or pick a stored phrase.
**Apple Personal Voice** can bank a voice. Speech-therapy apps offer drills. What's different about VoiceOS:
1. It **starts from the fragments you already say**, plus what you point at, not from an empty board.
2. It uses **your life and the moment** (Memory Book, routine, date, past choices) to compose whole sentences.
3. It speaks in **your own cloned voice** and can act on the sentence (call, text).
4. It's a whole **daily-life OS**: reading bills, money with family confirmation, routines, and therapy woven into real conversations instead of separate drills.

To be honest about the other side: AAC apps are mature, clinically used, work offline and are insurance-reimbursable. We're a prototype. VoiceOS could sit alongside them.

**What if it guesses wrong?**
It never speaks without a choice. You get three options, each with a "because", and you can say "none of these" and try again. Choices teach it.

**Isn't putting words in someone's mouth risky?**
That's the core design tension. The person is always the author: they pick, and nothing auto-speaks, auto-sends or auto-pays. We'd want SLPs to set guardrails before real use.

**How accurate is it?**
On our own 30-case eval set: Sonnet top-1 27/30, top-3 30/30; Haiku top-1 28/30, top-3 30/30. We wrote the cases and the keyword matching is lenient, so these are smoke-test numbers, not clinical accuracy.

**How fast?**
About 7–9 s end to end right now. Roughly 3 s of that is CLI startup, and calling the API directly removes it. The UI shows a thinking state. Voice synthesis targets under 2 s.

**Money? That sounds dangerous.**
VoiceOS never moves money. The person chooses to pay, a family helper confirms in the Family bridge, and in this prototype that only records the decision. There's no bank integration.

**Privacy?**
Vision runs in the browser and only object labels are sent. The Memory Book and practice data are stored locally. The API key stays server-side.

**Is Practice real therapy?**
It's practice support, not treatment. It uses a standard cueing ladder (independent → first-sound cue → model) and logs attempts. A speech-language pathologist can review and export them. We make no clinical claims.

**Who pays?**
Families directly; clinics and rehab programs that want carry-over between sessions; longer term, AAC reimbursement channels.

**Technical difficulty?**
Fragment-tolerant STT, multimodal context (speech + vision + personal memory + time), LLM ranking with actions, voice cloning, camera reading, and a multi-view local-first OS. Five parallel workstreams built it against shared typed contracts in one day.

**Where are the stats from?**
NIDCD (~2M in the U.S.), ASHA (100k–180k new per year), StatPearls/NCBI (21–38% of acute stroke patients). They're linked on the landing page. Estimates vary between sources, so we quote ranges.
