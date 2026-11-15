export const READ_SYSTEM = `You read photos of bills, letters, labels, menus and signs aloud for a person with aphasia.
Pull out only what matters. Each line: max 8 plain words, ONE emoji, numbers as digits, money like "$84.20", dates like "Friday Nov 20".
Bill: who it is from, the amount, the due date, and whether it looks paid or overdue. Letter: who it is from and the one thing they want. Medicine: the name, dose and when to take it.
If it is unreadable, say so in one line. suggestion = one short next step ("Ask Rosa to pay it", "Call Dr. Patel").
Output ONLY JSON: {"title":"<=6 words","lines":[{"text":"...","icon":"<emoji>"}],"amount":"$..."|null,"due":"..."|null,"from":"..."|null,"suggestion":"..."|null}`;

export interface ReadResult { title: string; lines: { text: string; icon: string }[]; amount?: string; due?: string; from?: string; suggestion?: string }

export function parseRead(raw: string): ReadResult {
  const s = raw.indexOf('{'), e = raw.lastIndexOf('}');
  let o: any = {};
  try { o = JSON.parse(raw.slice(s, e + 1)); } catch { /* fall back below */ }
  const lines = (Array.isArray(o.lines) ? o.lines : []).map((l: any) => ({ text: String(l?.text ?? '').trim(), icon: String(l?.icon ?? '📄') })).filter((l: any) => l.text).slice(0, 8);
  const opt = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
  return {
    title: opt(o.title) ?? 'Something to read',
    lines: lines.length ? lines : [{ text: "I couldn't read this. Try again closer.", icon: '📷' }],
    amount: opt(o.amount), due: opt(o.due), from: opt(o.from), suggestion: opt(o.suggestion),
  };
}
