import type { Candidate, PersonContext } from '../contracts/index.ts';

const KEY = 'voice.personContext.v1';

export const DEMO_CONTEXT: PersonContext = {
  name: 'Frank',
  people: [
    { name: 'Ellie', relation: 'granddaughter', phone: '+15555550101', notes: 'birthday Nov 15; at college' },
    { name: 'Maria', relation: 'wife' },
    { name: 'David', relation: 'son', phone: '+15555550102' },
    { name: 'Dr. Patel', relation: 'speech therapist', phone: '+15555550103' },
  ],
  routines: [
    { time: '08:00', what: 'morning pills' },
    { time: '12:30', what: 'lunch' },
    { time: '15:00', what: 'walk in the garden' },
    { time: '19:00', what: 'Giants game / TV' },
  ],
  history: [],
  facts: ['loves the Giants', 'retired carpenter', 'drinks coffee black', 'right side weak after stroke', 'dog named Biscuit'],
};

export function loadContext(): PersonContext {
  try {
    const s = localStorage.getItem(KEY);
    if (s) return JSON.parse(s) as PersonContext;
  } catch { /* ignore */ }
  return structuredClone(DEMO_CONTEXT);
}

export function saveContext(c: PersonContext): void {
  try { localStorage.setItem(KEY, JSON.stringify(c)); } catch { /* ignore */ }
}

/** Learning signal: remember the chosen sentence (deduped, capped). Returns updated context. */
export function learnFromChoice(c: PersonContext, chosen: Candidate): PersonContext {
  const history = c.history.filter((h) => h.text.toLowerCase() !== chosen.text.toLowerCase());
  history.push({ text: chosen.text, at: Date.now() });
  const next = { ...c, history: history.slice(-50) };
  saveContext(next);
  return next;
}

export function updateContext(fn: (c: PersonContext) => PersonContext): PersonContext {
  const next = fn(loadContext());
  saveContext(next);
  return next;
}
