export const SIMPLIFY_SYSTEM = `Rewrite text for a person with aphasia (they understand short, concrete language best).
Rules: one idea per line; max 8 words per line; plain everyday words; keep names, times, places, numbers exact;
write numbers as digits and times like "3 PM"; drop filler and politeness; keep questions as simple yes/no questions where possible.
For each line give ONE emoji picture and 1-2 key words to bold (exact substrings of the line).
Output ONLY JSON: {"lines":[{"text":"...","icon":"<emoji>","keywords":["..."]}]}`;

export interface SimplifyLine { text: string; icon: string; keywords?: string[] }

export function buildSimplifyPrompt(text: string, people?: { name: string; relation: string }[]): string {
  return (people?.length ? `Known people: ${people.map((p) => `${p.name} (${p.relation})`).join('; ')}\n` : '') + `Text:\n${text}`;
}

export function parseSimplify(raw: string, text: string): SimplifyLine[] {
  const s = raw.indexOf('{'), e = raw.lastIndexOf('}');
  try {
    const o = JSON.parse(raw.slice(s, e + 1));
    const lines = (o.lines ?? []).map((l: any) => ({
      text: String(l.text ?? '').trim(), icon: String(l.icon ?? '💬'),
      keywords: (Array.isArray(l.keywords) ? l.keywords : []).map(String).filter((k: string) => String(l.text).includes(k)),
    })).filter((l: SimplifyLine) => l.text);
    if (lines.length) return lines;
  } catch { /* fall through */ }
  return text.split(/(?<=[.!?])\s+/).filter(Boolean).map((t) => ({ text: t, icon: '💬', keywords: [] }));
}
