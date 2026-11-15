import type { UnderstandRequest, UnderstandResponse } from '../contracts/index.ts';

export { startCapture, speechSupported, type Capture } from './speech.ts';
export { loadContext, saveContext, learnFromChoice, updateContext, DEMO_CONTEXT } from './context.ts';

/** Server base; override with VITE_UNDERSTAND_URL. Dev: run `node server/understand.ts`. */
const BASE: string = (import.meta as any).env?.VITE_UNDERSTAND_URL ?? 'http://localhost:8787';

/** Turn fragments + context into exactly 3 ranked candidates. */
export async function understand(req: UnderstandRequest, signal?: AbortSignal): Promise<UnderstandResponse> {
  const r = await fetch(`${BASE}/api/understand`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(req),
    signal,
  });
  if (!r.ok) throw new Error(`understand failed: ${r.status} ${await r.text()}`);
  return (await r.json()) as UnderstandResponse;
}
