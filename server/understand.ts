/**
 * Understand server (no deps). Run: node server/understand.ts
 *   POST /api/understand            UnderstandRequest -> UnderstandResponse (exactly 3)
 *   POST /api/understand?stream=1   NDJSON: {"type":"partial","index":n,"text":"..."}... then {"type":"final","candidates":[...]}
 *   POST /api/read                  {image: dataURL} -> {title, lines:[{text,icon}], amount?, due?, from?, suggestion?}
 *   POST /api/simplify              {text, people?} -> {lines:[{text,icon,keywords}]}
 * Uses a warm pool of headless `claude -p` (Claude subscription). Falls back to the Anthropic API
 * only if ANTHROPIC_API_KEY is set and the CLI fails. Env: PORT=8787, UNDERSTAND_MODEL=haiku|sonnet|opus.
 */
import { createServer, type ServerResponse } from 'node:http';
import type { UnderstandRequest, UnderstandResponse } from '../src/contracts/index.ts';
import { ask, prewarm, shutdown } from './claudePool.ts';
import { SYSTEM, buildUserPrompt, parseCandidates } from './understandPrompt.ts';
import { READ_SYSTEM, parseRead } from './readPrompt.ts';
import { SIMPLIFY_SYSTEM, buildSimplifyPrompt, parseSimplify, type SimplifyLine } from './simplifyPrompt.ts';

const MODEL = process.env.UNDERSTAND_MODEL ?? 'haiku';
const API_MODEL = process.env.UNDERSTAND_API_MODEL ?? 'claude-haiku-5-5';

async function viaApi(system: string, prompt: string | unknown[]): Promise<string> {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: API_MODEL, max_tokens: 600, system, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!r.ok) throw new Error(`api ${r.status}: ${await r.text()}`);
  const j: any = await r.json();
  return j.content?.map((b: any) => b.text ?? '').join('') ?? '';
}

async function run(system: string, prompt: string | unknown[], model: string, onText?: (acc: string) => void): Promise<{ raw: string; via: string }> {
  try { return { raw: await ask(model, system, prompt, onText), via: 'cli' }; } catch (e) {
    if (!process.env.ANTHROPIC_API_KEY) throw e;
    console.warn('[understand] CLI failed, using API:', (e as Error).message);
    return { raw: await viaApi(system, prompt as any), via: 'api' };
  }
}

/** Completed "text" fields seen so far in partial JSON. */
function partialTexts(acc: string): string[] {
  return [...acc.matchAll(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => { try { return JSON.parse(`"${m[1]}"`); } catch { return m[1]; } });
}

export async function understandServer(req: UnderstandRequest, model = MODEL, onPartial?: (index: number, text: string) => void):
  Promise<UnderstandResponse & { ms: number; firstMs: number; via: string }> {
  const t0 = Date.now(); let firstMs = 0, emitted = 0;
  const { raw, via } = await run(SYSTEM, buildUserPrompt(req), model, (acc) => {
    const ts = partialTexts(acc);
    while (emitted < ts.length && emitted < 3) { if (!firstMs) firstMs = Date.now() - t0; onPartial?.(emitted, ts[emitted]); emitted++; }
  });
  const ms = Date.now() - t0;
  return { candidates: parseCandidates(raw, req), ms, firstMs: firstMs || ms, via };
}

export async function simplifyServer(text: string, people?: { name: string; relation: string }[], model = MODEL): Promise<{ lines: SimplifyLine[] }> {
  const { raw } = await run(SIMPLIFY_SYSTEM, buildSimplifyPrompt(text, people), model);
  return { lines: parseSimplify(raw, text) };
}

export async function readServer(image: string, model = MODEL) {
  const m = /^data:(image\/[a-z+]+);base64,(.+)$/s.exec(image);
  if (!m) throw new Error('image must be a base64 data URL');
  const content = [
    { type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } },
    { type: 'text', text: 'Read this for me.' },
  ];
  const { raw } = await run(READ_SYSTEM, content, model);
  return parseRead(raw);
}

export function warmUp(model = MODEL) { prewarm(model, SYSTEM); prewarm(model, SIMPLIFY_SYSTEM); prewarm(model, READ_SYSTEM); }
export { shutdown };

function json(rs: ServerResponse, code: number, body: unknown) {
  rs.statusCode = code; rs.setHeader('content-type', 'application/json'); rs.end(JSON.stringify(body));
}

if (import.meta.main) {
  const port = Number(process.env.PORT ?? 8787);
  warmUp();
  createServer(async (rq, rs) => {
    rs.setHeader('access-control-allow-origin', '*');
    rs.setHeader('access-control-allow-headers', 'content-type');
    if (rq.method === 'OPTIONS') return rs.end();
    const url = new URL(rq.url ?? '/', 'http://x');
    if (rq.method !== 'POST') return json(rs, 404, { error: 'not found' });
    let body = '';
    for await (const c of rq) body += c;
    try {
      if (url.pathname === '/api/understand') {
        const req = JSON.parse(body) as UnderstandRequest;
        if (url.searchParams.get('stream')) {
          rs.setHeader('content-type', 'application/x-ndjson'); rs.setHeader('cache-control', 'no-cache');
          const res = await understandServer(req, MODEL, (index, text) => rs.write(JSON.stringify({ type: 'partial', index, text }) + '\n'));
          rs.end(JSON.stringify({ type: 'final', candidates: res.candidates }) + '\n');
          console.log(`[understand] ${res.via} first=${res.firstMs}ms total=${res.ms}ms "${req.utterance.transcript}"`);
        } else {
          const res = await understandServer(req);
          console.log(`[understand] ${res.via} first=${res.firstMs}ms total=${res.ms}ms "${req.utterance.transcript}" -> "${res.candidates[0].text}"`);
          json(rs, 200, { candidates: res.candidates });
        }
      } else if (url.pathname === '/api/simplify') {
        const { text, people } = JSON.parse(body);
        const t0 = Date.now();
        const res = await simplifyServer(String(text ?? ''), people);
        console.log(`[simplify] ${Date.now() - t0}ms ${res.lines.length} lines`);
        json(rs, 200, res);
      } else if (url.pathname === '/api/read') {
        const { image } = JSON.parse(body);
        const t0 = Date.now();
        const res = await readServer(String(image ?? ''));
        console.log(`[read] ${Date.now() - t0}ms "${res.title}"`);
        json(rs, 200, res);
      } else json(rs, 404, { error: 'not found' });
    } catch (e) {
      console.error('[understand]', e);
      if (!rs.headersSent) json(rs, 500, { error: String((e as Error).message) }); else rs.end();
    }
  }).listen(port, () => console.log(`understand server on :${port} (model ${MODEL}, warm pool)`));
  process.on('SIGINT', () => { shutdown(); process.exit(0); });
  process.on('SIGTERM', () => { shutdown(); process.exit(0); });
}
