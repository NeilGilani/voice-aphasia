/**
 * POST /api/read — { image: dataURL, context?: PersonContext, now?: ISO } -> ReadResult.
 * "Read the world": Claude looks at mail, a bill, a menu or a medicine label and returns
 * an aphasia-friendly summary. Uses headless `claude -p` (image passed as a temp file the
 * Read tool opens); falls back to the Anthropic API if ANTHROPIC_API_KEY is set.
 * Run: node server/read.ts   (PORT=8788, READ_MODEL=sonnet|haiku|opus)
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { PersonContext } from '../src/contracts/index.ts';
import type { ReadResult } from '../src/vision/read/types.ts';

const MODEL = process.env.READ_MODEL ?? 'sonnet';
const API_MODEL = process.env.READ_API_MODEL ?? 'claude-sonnet-5-5';
const TIMEOUT_MS = 45_000;

export const SYSTEM = `You help a person with aphasia (a language disorder after stroke) understand a document or object they photographed.
They can understand very short, concrete phrases, numbers, and pictures — not paragraphs.
Reply with ONLY a JSON object, no prose, matching:
{
  "kind": "bill" | "medicine" | "appointment" | "menu" | "letter" | "package" | "sign" | "other",
  "icon": one emoji for the thing,
  "title": 1-3 words, e.g. "Electric bill",
  "headline": the ONE thing that matters, max 6 words, using " · " separators, e.g. "$84 · due Friday",
  "summary": one plain sentence, max 12 words, everyday words,
  "facts": up to 4 items {"icon": emoji, "label": 1-2 words, "value": short, e.g. "$84.12", "Fri Nov 21", "2 pills", "8 AM"},
  "actions": 1-3 items {"type": "call"|"remind"|"help"|"pay"|"none", "label": max 4 words, "to"?: phone number or person name, "when"?: ISO datetime},
  "warning"?: max 8 words, only if urgent/safety (overdue, allergy, do not drink alcohol),
  "confidence": 0..1
}
Rules: resolve relative dates against "now". Prefer people from the person's context for "help" actions (e.g. "Pay with Ellie's help", to: "Ellie").
For a phone number printed on the document, offer a "call" action with it. For a due date or appointment, offer "remind" with "when".
For a menu, headline = 2-3 simple dishes they could order. If you cannot read it, kind "other", say so simply, confidence < 0.3.`;

function userPrompt(path: string | null, context?: PersonContext, now = new Date().toISOString()) {
  const people = context?.people?.map((p) => `${p.name} (${p.relation})`).join(', ') || 'unknown';
  return `${path ? `Read the image file at ${path} and look at it.\n` : ''}Now: ${now}
Person: ${context?.name ?? 'unknown'}. People who help: ${people}. Facts: ${context?.facts?.join('; ') || 'none'}.
Return the JSON.`;
}

function viaCli(imagePath: string, prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = ['-p', '--output-format', 'json', '--model', MODEL, '--system-prompt', SYSTEM,
      '--tools', 'Read', '--allowedTools', 'Read', '--strict-mcp-config', '--no-session-persistence',
      '--setting-sources', '', '--add-dir', imagePath.replace(/\/[^/]+$/, '')];
    const child = spawn('claude', args, { cwd: tmpdir(), env: { ...process.env, ANTHROPIC_API_KEY: '' } });
    let out = '', err = '';
    const t = setTimeout(() => { child.kill(); reject(new Error('claude timeout')); }, TIMEOUT_MS);
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('error', reject);
    child.on('close', (code) => {
      clearTimeout(t);
      try {
        const j = JSON.parse(out);
        if (j.is_error) return reject(new Error(String(j.result)));
        resolve(String(j.result ?? ''));
      } catch { reject(new Error(`claude exit ${code}: ${err || out}`.slice(0, 400))); }
    });
    child.stdin.end(prompt);
  });
}

async function viaApi(mediaType: string, b64: string, prompt: string): Promise<string> {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: API_MODEL, max_tokens: 800, system: SYSTEM,
      messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: b64 } },
        { type: 'text', text: prompt },
      ] }],
    }),
  });
  if (!r.ok) throw new Error(`api ${r.status}: ${await r.text()}`);
  const j: any = await r.json();
  return j.content?.map((b: any) => b.text ?? '').join('') ?? '';
}

export function parseResult(raw: string): ReadResult {
  const m = raw.match(/\{[\s\S]*\}/);
  const j: any = m ? JSON.parse(m[0]) : {};
  const str = (v: unknown, d = '') => (typeof v === 'string' ? v : d);
  return {
    kind: str(j.kind, 'other') as ReadResult['kind'],
    icon: str(j.icon, '📄'),
    title: str(j.title, 'Something'),
    headline: str(j.headline, ''),
    summary: str(j.summary, "I couldn't read this. Try again closer."),
    facts: (Array.isArray(j.facts) ? j.facts : []).slice(0, 4).map((f: any) => ({ icon: str(f.icon, '•'), label: str(f.label), value: str(f.value) })),
    actions: (Array.isArray(j.actions) ? j.actions : []).slice(0, 3).map((a: any) => ({
      type: ['call', 'remind', 'help', 'pay'].includes(a.type) ? a.type : 'none',
      label: str(a.label, 'OK'), to: a.to ? String(a.to) : undefined, when: a.when ? String(a.when) : undefined,
    })),
    warning: j.warning ? String(j.warning) : undefined,
    confidence: typeof j.confidence === 'number' ? j.confidence : 0.5,
  };
}

export async function readImage(dataUrl: string, context?: PersonContext, now?: string): Promise<ReadResult & { ms: number; via: string }> {
  const m = dataUrl.match(/^data:(image\/(png|jpeg|webp|gif));base64,(.+)$/);
  if (!m) throw new Error('image must be a base64 data URL');
  const [, mediaType, ext, b64] = m;
  const dir = mkdtempSync(join(tmpdir(), 'voice-read-'));
  const path = join(dir, `photo.${ext === 'jpeg' ? 'jpg' : ext}`);
  writeFileSync(path, Buffer.from(b64, 'base64'));
  const t0 = Date.now();
  let raw = '', via = 'cli';
  try {
    raw = await viaCli(path, userPrompt(path, context, now));
  } catch (e) {
    if (!process.env.ANTHROPIC_API_KEY) throw e;
    console.warn('[read] CLI failed, using API:', (e as Error).message);
    raw = await viaApi(mediaType, b64, userPrompt(null, context, now)); via = 'api';
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  return { ...parseResult(raw), ms: Date.now() - t0, via };
}

if (import.meta.main) {
  const port = Number(process.env.PORT ?? 8788);
  createServer(async (rq, rs) => {
    rs.setHeader('access-control-allow-origin', '*');
    rs.setHeader('access-control-allow-headers', 'content-type');
    if (rq.method === 'OPTIONS') return rs.end();
    if (rq.method !== 'POST' || rq.url !== '/api/read') { rs.statusCode = 404; return rs.end(); }
    let body = '';
    for await (const c of rq) body += c;
    try {
      const { image, context, now } = JSON.parse(body);
      const res = await readImage(image, context, now);
      console.log(`[read] ${res.via} ${res.ms}ms -> ${res.title}: ${res.headline}`);
      rs.setHeader('content-type', 'application/json');
      rs.end(JSON.stringify(res));
    } catch (e) {
      console.error('[read]', e);
      rs.statusCode = 500; rs.end(JSON.stringify({ error: String((e as Error).message) }));
    }
  }).listen(port, () => console.log(`read server on :${port} (model ${MODEL})`));
}
