# Judge Q&A prep

**Doesn't this already exist?**
Partly, and we respect that work. AAC apps like **Proloquo2Go** (AssistiveWare) and **Lingraphica**'s devices and apps are proven
tools. They're symbol- and phrase-board based: the user navigates categories and builds a message icon by icon, or picks
pre-stored phrases. That works, but it's slow, and it asks someone with a language disorder to do a lot of language work.
Voice is different in three ways: (1) it **starts from the fragments the person already says** plus what they point at, instead of an empty board;
(2) it uses **personal context and time** (who Ellie is, that today is her birthday) to compose full sentences; (3) it speaks in
**their own cloned voice**. Honestly, AAC apps are mature, clinically used and work offline. We're a prototype, and we could see Voice
living alongside them rather than replacing them. Voice banking exists too (e.g. Apple Personal Voice), but it isn't connected to fragment understanding.

**What if it guesses wrong?**
It never speaks without a choice. There are three options, each with a "because", and "none of these" lets the person try again. Choices teach it.

**Isn't putting words in someone's mouth risky?**
That's the core design tension. The person is always the author: they pick, and nothing auto-sends. We'd want SLPs to define guardrails before real use.

**How accurate is it?**
We have a small eval set of 30 aphasia-style utterances we wrote ourselves; we'll show the pass rate we measured. That isn't clinical validation and we won't claim it is.

**Privacy?**
Vision runs in the browser and only object labels are sent. The Claude API key stays server-side. Next step: on-device models and local-only context storage.

**Latency?**
Target: under 2 s for voice. Sonnet is the faster fallback for understanding.

**Who pays / who's the user?**
People with aphasia and their families, plus speech-language pathologists who could configure context. Possible paths: clinics and rehab programs, insurance-covered AAC channels.

**Technical difficulty?**
Fragment-tolerant STT, multimodal context (speech + vision + personal memory + time), LLM ranking with actions, voice cloning, all in a real-time, phone-first UI, built by five parallel workstreams against shared typed contracts.

**Where did the stats come from?**
NIDCD (~2M in the U.S.), ASHA (100k–180k new per year), StatPearls/NCBI (21–38% of acute stroke). They're linked on the landing page. Estimates vary between sources, and we quote the conservative ones.
