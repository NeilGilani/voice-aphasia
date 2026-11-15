/*
 * Integration seam. Each function prefers the real workstream implementation
 * and falls back to a local stub so the app always runs end to end.
 */
import type {
  Candidate, SeenObject, UnderstandRequest, UnderstandResponse, VoiceEngine,
} from '../contracts';

const uid = () => Math.random().toString(36).slice(2, 10);

/** Understand: POST /api/understand (ws/understand server), else heuristic mock. */
export async function understand(req: UnderstandRequest): Promise<UnderstandResponse & { source: 'claude' | 'mock' }> {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 45000);
    const r = await fetch('/api/understand', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal: ctl.signal,
    });
    clearTimeout(t);
    if (r.ok) {
      const data = (await r.json()) as UnderstandResponse;
      if (data.candidates?.length) return { candidates: data.candidates.slice(0, 3), source: 'claude' };
    }
  } catch { /* fall through to mock */ }
  return { candidates: mockUnderstand(req), source: 'mock' };
}

export function mockUnderstand({ utterance, context }: UnderstandRequest): Candidate[] {
  const t = utterance.transcript.toLowerCase();
  const person = context.people.find((p) => t.includes(p.name.toLowerCase()));
  const seen = utterance.seen?.find((s) => s.pointedAt)?.label;
  const out: Candidate[] = [];
  if (person && /birthday/.test(t)) {
    out.push({
      id: uid(),
      text: `Call ${person.name} and wish her a happy birthday. Tell her I love her.`,
      action: person.phone ? { type: 'call', to: person.phone } : { type: 'none' },
      confidence: 0.86,
      because: `You said ${person.name} + phone + birthday`,
    });
  }
  if (person) {
    out.push({
      id: uid(),
      text: `Can you help me call ${person.name}?`,
      action: person.phone ? { type: 'call', to: person.phone } : { type: 'none' },
      confidence: 0.6,
      because: `${person.name} is your ${person.relation}`,
    });
  }
  if (/water|drink/.test(t)) {
    out.push({ id: uid(), text: 'Could I have a glass of water, please?', action: { type: 'none' }, confidence: 0.4, because: 'You said "water" first' });
  }
  if (seen) {
    out.push({ id: uid(), text: `I want the ${seen}.`, action: { type: 'none' }, confidence: 0.5, because: `You pointed at the ${seen}` });
  }
  const fill = ['I need a moment, please wait.', 'Can you help me?', 'Yes, that is right.'];
  for (const f of fill) if (out.length < 3) out.push({ id: uid(), text: f, action: { type: 'none' }, confidence: 0.2, because: 'A common thing to say' });
  return out.slice(0, 3);
}

/** Voice: device speechSynthesis. ws/voice replaces this with the cloned voice. */
export const deviceVoice: VoiceEngine = {
  label: 'Device voice',
  async ready() { return 'speechSynthesis' in window; },
  speak(text) {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) return resolve();
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      speechSynthesis.speak(u);
    });
  },
};

/** Vision: what the camera saw pointed at / held in the last few seconds (ws/vision). */
export async function currentlySeen(): Promise<SeenObject[]> {
  try { return (await import("../vision")).getSeenObjects(5); } catch { return []; }
}

/** Mic: browser Web Speech API with interim results, fragment-friendly. */
export interface Listener { stop(): void }
export function listen(onText: (text: string, final: boolean) => void, onEnd: () => void): Listener | null {
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) return null;
  const rec = new SR();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = 'en-US';
  let finalText = '';
  rec.onresult = (e: any) => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) finalText += (finalText ? '… ' : '') + r[0].transcript.trim();
      else interim += r[0].transcript;
    }
    onText(interim ? `${finalText}${finalText ? '… ' : ''}${interim.trim()}` : finalText, !interim);
  };
  rec.onend = onEnd;
  rec.onerror = onEnd;
  rec.start();
  return { stop: () => rec.stop() };
}

export function runAction(c: Candidate) {
  const a = c.action;
  if (!a || a.type === 'none') return;
  const href = a.type === 'call' ? `tel:${a.to}` : `sms:${a.to}${a.body ? `?body=${encodeURIComponent(a.body)}` : ''}`;
  window.location.href = href;
}
