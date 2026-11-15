# understand (workstream 2)

**Client** (`import { understand, startCapture, loadContext, learnFromChoice } from './understand'`)
- `startCapture(onPartial)` → `{ stop(): Promise<Utterance>, cancel() }`. Web Speech API, interim results, keeps false starts, marks pauses >1.2 s as "…", restarts itself on Chrome's silence timeout. It never stops on its own.
- `understand(req)` → `POST ${VITE_UNDERSTAND_URL ?? http://localhost:8787}/api/understand` → exactly 3 candidates. For `call`/`text` actions, `to` is the phone number.
- `loadContext()/saveContext()/updateContext()` store PersonContext in localStorage (`DEMO_CONTEXT` = Frank). After a pick, call `learnFromChoice(ctx, candidate)`; the last 8 choices go into the prompt as a prior.

**Also:** `understandStream(req, onPartial)` shows each sentence as soon as it is done. `simplify(text, people)` → `{lines:[{text, icon, keywords}]}` powers Phone, Messages and Read. The Messages screen is `src/messages` (`<Messages voice onBack />`).

**Server**: `node server/understand.ts` (Node ≥ 23, no deps; port 8787, which Vite proxies as `/api`).
- `POST /api/understand`, plus `?stream=1` (NDJSON partials, then the final result)
- `POST /api/simplify`
Each request uses a warm pool of headless `claude -p` processes on the user's Claude subscription. The prompt goes in as stream-json, with no tools, no MCP and no settings, `--effort low` and thinking off.
- **Hedged:** each request goes to 2 pre-spawned processes and the first finisher wins.
- **Resolves early:** it returns on the stream's `message_stop`, because the CLI emits its own `result` about 2 s later.
- **Fallback:** the Anthropic API, only if `ANTHROPIC_API_KEY` is set.
- **Env:** `UNDERSTAND_MODEL` (default haiku), `CLAUDE_POOL` (4), `CLAUDE_HEDGE` (2).

**Latency** (same request, measured):
- Before (cold `claude -p` per call): 7–9 s.
- After, with the warm pool idle: total 2.4–3.3 s, first sentence about 2 s.
- Eval run back-to-back (1.5 s gaps, so the pool doesn't fully re-warm): median 4.0 s, p90 4.9 s, first sentence median 3.1 s.

**Eval**: `node server/understandEval.ts [haiku|sonnet]`. 30 cases; a hit means a candidate matches all keyword regex groups (lenient, and we wrote the cases). Smoke numbers, not clinical accuracy.
- After the changes: haiku top-1 28/30, top-3 30/30.
- Before: sonnet 27/30 top-1, 30/30 top-3; haiku 28/30 top-1, 30/30 top-3.
- Persistent misses: "tephone" → Ellie call; "water" + cup → not water.
Full output: `server/understandEval.results.txt`.
