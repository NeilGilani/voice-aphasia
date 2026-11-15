/**
 * POST /api/understand — UnderstandRequest -> UnderstandResponse (exactly 3 candidates).
 * Uses the local Claude Code subscription via headless `claude -p`; falls back to the
 * Anthropic API only if ANTHROPIC_API_KEY is set and the CLI fails.
 * Run: node server/understand.ts   (PORT=8787, UNDERSTAND_MODEL=sonnet|haiku|opus)
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import type { UnderstandRequest, UnderstandResponse } from '../src/contracts/index.ts';
import { SYSTEM, buildUserPrompt, parseCandidates } from './understandPrompt.ts';

const MODEL = process.env.UNDERSTAND_MODEL ?? 'sonnet';
const API_MODEL = process.env.UNDERSTAND_API_MODEL ?? 'claude-sonnet-5-5';
const TIMEOUT_MS = 25_000;

function viaCli(prompt: string, model = MODEL): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = ['-p', '--output-format', 'json', '--model', model, '--system-prompt', SYSTEM,
      '--tools', '', '--strict-mcp-config', '--no-session-persistence', '--setting-sources', '',
      '--exclude-dynamic-system-prompt-sections'];
    // cwd=tmpdir so no project CLAUDE.md is loaded (shorter context = faster).
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

async function viaApi(prompt: string): Promise<string> {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: API_MODEL, max_tokens: 600, system: SYSTEM, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!r.ok) throw new Error(`api ${r.status}: ${await r.text()}`);
  const j: any = await r.json();
  return j.content?.map((b: any) => b.text ?? '').join('') ?? '';
}

export async function understandServer(req: UnderstandRequest, model?: string): Promise<UnderstandResponse & { ms: number; via: string }> {
  const prompt = buildUserPrompt(req);
  const t0 = Date.now();
  let raw = '', via = 'cli';
  try { raw = await viaCli(prompt, model); } catch (e) {
    if (!process.env.ANTHROPIC_API_KEY) throw e;
    console.warn('[understand] CLI failed, using API:', (e as Error).message);
    raw = await viaApi(prompt); via = 'api';
  }
  return { candidates: parseCandidates(raw, req), ms: Date.now() - t0, via };
}

if (import.meta.main) {
  const port = Number(process.env.PORT ?? 8787);
  createServer(async (rq, rs) => {
    rs.setHeader('access-control-allow-origin', '*');
    rs.setHeader('access-control-allow-headers', 'content-type');
    if (rq.method === 'OPTIONS') return rs.end();
    if (rq.method !== 'POST' || rq.url !== '/api/understand') { rs.statusCode = 404; return rs.end(); }
    let body = '';
    for await (const c of rq) body += c;
    try {
      const req = JSON.parse(body) as UnderstandRequest;
      const res = await understandServer(req);
      console.log(`[understand] ${res.via} ${res.ms}ms "${req.utterance.transcript}" -> "${res.candidates[0].text}"`);
      rs.setHeader('content-type', 'application/json');
      rs.end(JSON.stringify({ candidates: res.candidates }));
    } catch (e) {
      console.error('[understand]', e);
      rs.statusCode = 500; rs.end(JSON.stringify({ error: String((e as Error).message) }));
    }
  }).listen(port, () => console.log(`understand server on :${port} (model ${MODEL})`));
}
