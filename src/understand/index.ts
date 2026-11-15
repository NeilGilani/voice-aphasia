import type { Candidate, UnderstandRequest, UnderstandResponse } from '../contracts/index.ts';

export { startCapture, speechSupported, type Capture } from './speech.ts';
export { loadContext, saveContext, learnFromChoice, updateContext, DEMO_CONTEXT } from './context.ts';

/** Server base; '' = same origin (Vite proxies /api -> :8787). Override with VITE_UNDERSTAND_URL. */
const BASE: string = (import.meta as any).env?.VITE_UNDERSTAND_URL ?? '';

/** Turn fragments + context into exactly 3 ranked candidates. */
export async function understand(req: UnderstandRequest, signal?: AbortSignal): Promise<UnderstandResponse> {
  const r = await fetch(`${BASE}/api/understand`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(req), signal,
  });
  if (!r.ok) throw new Error(`understand failed: ${r.status} ${await r.text()}`);
  return (await r.json()) as UnderstandResponse;
}

/**
 * Streaming variant: `onPartial(index, text)` fires as each sentence finishes (first at ~2 s),
 * so the UI can show cards early. Resolves with the final validated 3 candidates.
 */
export async function understandStream(req: UnderstandRequest, onPartial: (index: number, text: string) => void, signal?: AbortSignal): Promise<UnderstandResponse> {
  const r = await fetch(`${BASE}/api/understand?stream=1`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(req), signal,
  });
  if (!r.ok || !r.body) throw new Error(`understand failed: ${r.status}`);
  const reader = r.body.getReader(); const dec = new TextDecoder();
  let buf = ''; let final: Candidate[] | null = null;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i); buf = buf.slice(i + 1);
      if (!line.trim()) continue;
      const ev = JSON.parse(line);
      if (ev.type === 'partial') onPartial(ev.index, ev.text);
      else if (ev.type === 'final') final = ev.candidates;
    }
  }
  if (!final) throw new Error('understand stream ended without result');
  return { candidates: final };
}

export interface SimpleLine { text: string; icon: string; keywords?: string[] }

/** Aphasia-friendly rewrite: short lines, one emoji each, key words to bold. */
export async function simplify(text: string, people?: { name: string; relation: string }[], signal?: AbortSignal): Promise<{ lines: SimpleLine[] }> {
  const r = await fetch(`${BASE}/api/simplify`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text, people }), signal,
  });
  if (!r.ok) throw new Error(`simplify failed: ${r.status}`);
  return r.json();
}
