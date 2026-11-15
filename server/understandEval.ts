/** Eval: node server/understandEval.ts [model]  — reports top-1/top-3 hit rate + latency. */
import { DEMO_CONTEXT } from '../src/understand/context.ts';
import { understandServer } from './understand.ts';
import { CASES } from './understandEvalCases.ts';

const model = process.argv[2] ?? process.env.UNDERSTAND_MODEL ?? 'sonnet';
const CONC = 5;
const results: { i: number; top1: boolean; top3: boolean; ms: number; got: string[] }[] = [];
let next = 0;
async function worker() {
  while (next < CASES.length) {
    const i = next++; const c = CASES[i];
    const req = {
      utterance: { id: `e${i}`, transcript: c.transcript, startedAt: 0, seen: c.seen?.map((s) => ({ ...s, confidence: 0.8 })) },
      context: DEMO_CONTEXT, now: c.now ?? '2026-11-15T10:00:00-08:00', recent: c.recent ?? [],
    };
    try {
      const r = await understandServer(req, model);
      const hit = (t: string) => c.must.every((g) => new RegExp(g, 'i').test(t));
      const got = r.candidates.map((x) => x.text);
      results.push({ i, top1: hit(got[0]), top3: got.some(hit), ms: r.ms, got });
    } catch (e) { results.push({ i, top1: false, top3: false, ms: 0, got: [`ERROR ${(e as Error).message}`] }); }
  }
}
await Promise.all(Array.from({ length: CONC }, worker));
results.sort((a, b) => a.i - b.i);
for (const r of results) console.log(`${r.top1 ? '✓' : r.top3 ? '~' : '✗'} ${r.ms}ms  "${CASES[r.i].transcript}"  [${CASES[r.i].meaning}] -> ${r.got[0]}`);
const n = results.length, ms = results.map((r) => r.ms).filter(Boolean).sort((a, b) => a - b);
console.log(`\nmodel=${model} n=${n} top1=${results.filter((r) => r.top1).length}/${n} top3=${results.filter((r) => r.top3).length}/${n} latency median=${ms[ms.length >> 1]}ms p90=${ms[Math.floor(ms.length * 0.9)]}ms`);
