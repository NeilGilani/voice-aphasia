/*
 * Family mode: turn what family says into short, simple sentences with a picture each.
 * Tries POST /api/simplify (understand server); falls back to a local rule-based simplifier
 * so the page always works offline / before the server lands.
 */

export interface SimpleLine {
  text: string;
  /** Emoji picture shown large next to the sentence. */
  icon: string;
}

export interface SimplifyRequest {
  text: string;
  /** Optional person context so names/places can get pictures. */
  people?: { name: string; relation: string }[];
}

export interface SimplifyResponse {
  lines: SimpleLine[];
}

const ICONS: [RegExp, string][] = [
  [/\b(doctor|dr\.?|nurse|hospital|clinic|appointment)\b/i, '🩺'],
  [/\b(pill|pills|medicine|medication|meds|tablet)\b/i, '💊'],
  [/\b(eat|food|lunch|dinner|breakfast|hungry|meal|soup|sandwich)\b/i, '🍽️'],
  [/\b(drink|water|thirsty|tea|coffee|juice)\b/i, '🥤'],
  [/\b(car|drive|ride|pick (you )?up)\b/i, '🚗'],
  [/\b(call|phone|ring|facetime|video)\b/i, '📞'],
  [/\b(birthday|party|cake)\b/i, '🎂'],
  [/\b(sleep|bed|nap|tired|rest)\b/i, '🛏️'],
  [/\b(walk|outside|park|garden)\b/i, '🚶'],
  [/\b(bath|shower|wash|toilet|bathroom)\b/i, '🚿'],
  [/\b(today|now|tonight|this (morning|afternoon|evening))\b/i, '📅'],
  [/\b(tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|week)\b/i, '🗓️'],
  [/\b(love|miss|hug|proud)\b/i, '❤️'],
  [/\b(game|giants|baseball|tv|watch|movie)\b/i, '📺'],
  [/\b(home|house)\b/i, '🏠'],
  [/\b(store|shop|groceries|buy)\b/i, '🛒'],
  [/\b(pain|hurt|sore)\b/i, '🤕'],
  [/\b(visit|coming|come over|see you)\b/i, '👋'],
  [/\b(daughter|son|granddaughter|grandson|wife|husband|mom|dad|family)\b/i, '👨‍👩‍👧'],
  [/\?\s*$/, '❓'],
];

const FILLER = /\b(um+|uh+|like|you know|i mean|basically|actually|just|so|well|okay so|anyway)\b,?\s*/gi;

export function pickIcon(s: string): string {
  for (const [re, icon] of ICONS) if (re.test(s)) return icon;
  return '💬';
}

/** Rule-based fallback: split into clauses, strip filler, cap ~8 words each. */
export function simplifyLocal(text: string): SimpleLine[] {
  const clauses = text
    .replace(FILLER, ' ')
    .split(/(?<=[.!?])\s+|,\s*(?:and|but|so|because|then)\s+|\s+(?:and then|but|because)\s+|;\s*/i)
    .map((c) => c.replace(/\s+/g, ' ').trim())
    .filter((c) => c.split(' ').length >= 2);
  return clauses.slice(0, 5).map((c) => {
    const isQ = c.endsWith('?');
    let words = c.replace(/[.!?]+$/, '').split(' ');
    if (words.length > 9) words = words.slice(0, 9);
    let s = words.join(' ');
    s = s.charAt(0).toUpperCase() + s.slice(1) + (isQ ? '?' : '.');
    return { text: s, icon: pickIcon(c) };
  });
}

export async function simplify(req: SimplifyRequest): Promise<{ lines: SimpleLine[]; source: 'server' | 'local' }> {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 6000);
    const r = await fetch('/api/simplify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal: ctl.signal,
    });
    clearTimeout(t);
    if (!r.ok) throw new Error(String(r.status));
    const data = (await r.json()) as SimplifyResponse;
    if (!Array.isArray(data.lines) || !data.lines.length) throw new Error('empty');
    return { lines: data.lines.map((l) => ({ text: l.text, icon: l.icon || pickIcon(l.text) })), source: 'server' };
  } catch {
    return { lines: simplifyLocal(req.text), source: 'local' };
  }
}
