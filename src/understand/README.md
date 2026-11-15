# understand (workstream 2)

**Client** (`import { understand, startCapture, loadContext, learnFromChoice } from './understand'`)
- `startCapture(onPartial)` → `{ stop(): Promise<Utterance>, cancel() }`. Web Speech API, interim results, keeps false starts, marks pauses >1.2 s as "…", restarts itself on Chrome's silence timeout. It never stops on its own.
- `understand(req)` → `POST ${VITE_UNDERSTAND_URL ?? http://localhost:8787}/api/understand` → exactly 3 candidates. For `call`/`text` actions, `to` is the phone number.
- `loadContext()/saveContext()/updateContext()` store PersonContext in localStorage (`DEMO_CONTEXT` = Frank). After a pick, call `learnFromChoice(ctx, candidate)`; the last 8 choices go into the prompt as a prior.

**Server**: `node server/understand.ts` (Node ≥ 23, no dependencies). Env: `PORT` (default 8787), `UNDERSTAND_MODEL` (sonnet|haiku|opus).
It runs headless `claude -p --output-format json` with the user's Claude subscription. The prompt goes in on stdin, with a custom system prompt, no tools, no MCP and no settings. Output is JSON, then validated, repaired and padded to 3.
If the CLI fails, it falls back to the Anthropic API, but only when `ANTHROPIC_API_KEY` is set.

**Eval**: `node server/understandEval.ts [sonnet|haiku]`. 30 cases; a hit means a candidate matches all keyword regex groups (lenient).
Measured 2026-11-15 with DEMO_CONTEXT:
- sonnet: top-1 27/30, top-3 30/30
- haiku: top-1 28/30, top-3 30/30
Misses: "tephone" → Ellie birthday call (top-1 has no "phone"); "water" + pointing at cup → coffee (overcorrects the literal word); sonnet "cold… blanket… no… window" → blanket.
Caveat: the keyword match is loose and the cases were written by us, so treat these as smoke numbers, not clinical accuracy.

**Latency**: one request takes about 7–9 s end to end (sonnet ≈ haiku). About 3 s of that is `claude` CLI startup, so use the API fallback if speed matters. The UI should show a "thinking" state.
