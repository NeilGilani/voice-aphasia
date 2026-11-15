import type { Candidate, UnderstandRequest } from '../src/contracts/index.ts';

export const SYSTEM = `You voice a person with aphasia: they know what they mean, words come out broken. Decode:
- semantic paraphasia: related wrong word ("water" for "phone"); trust names, time, context, pointed-at objects over the literal word, but keep the literal word if it fits.
- phonemic errors ("tephone"=telephone); "no"/"not that"/"wait" cancels the previous word; telegraphic content words; fillers/"…" mean nothing; repeats from earlier turns may be perseveration.
Prior: sentences they chose before, routines near now, known people.
Give 3 DIFFERENT natural first-person sentences they'd say aloud, best first. Add call/text action only for a known person when it fits.
Output ONLY compact JSON: {"candidates":[{"text":"...","action":{"type":"call"|"text"|"none","to":"<name>","body":"..."},"confidence":0.0,"because":"<=8 words"}]}`;

export function buildUserPrompt(req: UnderstandRequest): string {
  const c = req.context;
  const d = new Date(req.now);
  const lines: string[] = [];
  lines.push(`Now: ${d.toLocaleString('en-US', { weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`);
  lines.push(`Person: ${c.name}`);
  if (c.people.length) lines.push(`People: ${c.people.map((p) => `${p.name} (${p.relation}${p.phone ? ', has phone' : ''}${p.notes ? `; ${p.notes}` : ''})`).join('; ')}`);
  if (c.routines.length) lines.push(`Routines: ${c.routines.map((r) => `${r.time} ${r.what}`).join('; ')}`);
  if (c.facts.length) lines.push(`Facts: ${c.facts.join('; ')}`);
  const hist = c.history.slice(-8);
  if (hist.length) lines.push(`Previously chose: ${hist.map((h) => `"${h.text}"`).join(' | ')}`);
  const recent = req.recent.slice(-6);
  if (recent.length) lines.push(`Recent turns:\n${recent.map((t) => `${t.who === 'person' ? c.name : 'Other'}: ${t.text}`).join('\n')}`);
  const seen = (req.utterance.seen ?? []).filter((s) => s.confidence >= 0.3);
  if (seen.length) lines.push(`Camera sees: ${seen.map((s) => `${s.label}${s.pointedAt ? ' (POINTING AT / HOLDING)' : ''}`).join(', ')}`);
  lines.push(`They said: "${req.utterance.transcript}"`);
  return lines.join('\n');
}

/** Extract + validate + repair model output into exactly 3 candidates. */
export function parseCandidates(raw: string, req: UnderstandRequest): Candidate[] {
  let obj: any = null;
  const s = raw.indexOf('{'), e = raw.lastIndexOf('}');
  if (s >= 0 && e > s) {
    const body = raw.slice(s, e + 1);
    try { obj = JSON.parse(body); } catch {
      try { obj = JSON.parse(body.replace(/,\s*([}\]])/g, '$1').replace(/[“”]/g, '"')); } catch { obj = null; }
    }
  }
  const arr: any[] = Array.isArray(obj) ? obj : Array.isArray(obj?.candidates) ? obj.candidates : [];
  const people = req.context.people;
  const out: Candidate[] = [];
  for (const x of arr) {
    const text = typeof x === 'string' ? x : String(x?.text ?? '').trim();
    if (!text || out.some((o) => o.text.toLowerCase() === text.toLowerCase())) continue;
    let action: Candidate['action'] = { type: 'none' };
    const a = x?.action;
    if (a && (a.type === 'call' || a.type === 'text') && a.to) {
      const p = people.find((pp) => pp.name.toLowerCase() === String(a.to).toLowerCase());
      if (p?.phone) action = { type: a.type, to: p.phone, ...(a.body ? { body: String(a.body) } : {}) };
    }
    const conf = Number(x?.confidence);
    out.push({
      id: `${req.utterance.id}-${out.length}`,
      text,
      action,
      confidence: Number.isFinite(conf) ? Math.max(0, Math.min(1, conf)) : 0.5 - out.length * 0.1,
      because: String(x?.because ?? '').slice(0, 120),
    });
    if (out.length === 3) break;
  }
  const fillers = [
    `I'm trying to say: ${req.utterance.transcript.replace(/[.…]+/g, ' ').replace(/\s+/g, ' ').trim()}.`,
    'Can you give me a moment? I want to say something.',
    'Can you ask me yes or no questions?',
  ];
  for (const f of fillers) if (out.length < 3) out.push({ id: `${req.utterance.id}-${out.length}`, text: f, action: { type: 'none' }, confidence: 0.05, because: 'Fallback' });
  return out;
}
