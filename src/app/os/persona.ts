/* Seeded demo persona for VoiceOS: Frank, 71, stroke in 2025. Everything is fictional. */
import type { PersonContext } from '../../contracts';

export interface Contact {
  id: string; name: string; relation: string; phone?: string;
  hue: number; emoji: string; photo?: string; online?: boolean; favorite?: boolean;
}
export interface Msg { id: string; from: string; to: string; text: string; at: number; read?: boolean }
export interface PlanItem { time: string; what: string; emoji: string; done?: boolean }
export interface Memory { id: string; title: string; when: string; emoji: string; hue: number; story: string; people: string[] }
export interface Bill { id: string; from: string; what: string; amount: number; due: string; emoji: string; paid?: boolean }

const h = (hrs: number) => Date.now() - hrs * 3600_000;

export const ME = { name: 'Frank', age: 71, note: 'Stroke in March 2025 · aphasia (expressive)', hue: 210, emoji: '🧢' };

export const CONTACTS: Contact[] = [
  { id: 'ellie', name: 'Ellie', relation: 'granddaughter', phone: '+15555550101', hue: 330, emoji: '🎓', online: true, favorite: true },
  { id: 'maria', name: 'Maria', relation: 'wife', hue: 20, emoji: '🌻', online: true, favorite: true },
  { id: 'david', name: 'David', relation: 'son', phone: '+15555550102', hue: 200, emoji: '🔧', favorite: true },
  { id: 'sam', name: 'Sam', relation: 'grandson', phone: '+15555550104', hue: 140, emoji: '⚾', online: true, favorite: true },
  { id: 'patel', name: 'Dr. Patel', relation: 'speech therapist', phone: '+15555550103', hue: 265, emoji: '🩺' },
  { id: 'biscuit', name: 'Biscuit', relation: 'dog', hue: 40, emoji: '🐶' },
];

export const PLAN: PlanItem[] = [
  { time: '08:00', what: 'Pills', emoji: '💊', done: true },
  { time: '10:00', what: 'Coffee with Maria', emoji: '☕', done: true },
  { time: '12:30', what: 'Lunch', emoji: '🥪' },
  { time: '15:00', what: 'Speech practice', emoji: '🗣️' },
  { time: '16:00', what: 'Walk Biscuit', emoji: '🐕' },
  { time: '19:00', what: 'Giants game', emoji: '⚾' },
];

export const MESSAGES: Msg[] = [
  { id: 'm1', from: 'ellie', to: 'me', text: "Hi Grandpa!! It's my birthday today 🎂 I'm at school but I'll call you tonight after my exam if that's ok. Love you so much", at: h(3), read: false },
  { id: 'm2', from: 'me', to: 'ellie', text: 'Happy birthday sweetheart. I am proud of you.', at: h(26), read: true },
  { id: 'm3', from: 'david', to: 'me', text: "Dad, I'm picking you up Thursday at 2 for the neurologist appointment. Don't forget your insurance card and the list of medicines.", at: h(5), read: false },
  { id: 'm4', from: 'sam', to: 'me', text: 'Giants won!!! did u see that homerun', at: h(20), read: true },
];

export const MEMORIES: Memory[] = [
  { id: 'wed', title: 'Our wedding', when: 'June 1979', emoji: '💍', hue: 20, people: ['maria'], story: 'Married Maria at St. Anne’s. It rained, and we danced anyway.' },
  { id: 'shop', title: 'My workshop', when: '1985 – 2019', emoji: '🪚', hue: 30, people: ['david'], story: 'Built furniture for 34 years. David learned to use a plane here.' },
  { id: 'ellie', title: 'Ellie is born', when: 'Nov 15, 2005', emoji: '👶', hue: 330, people: ['ellie'], story: 'First grandchild. I held her first, before anyone.' },
  { id: 'giants', title: 'World Series', when: '2010', emoji: '🏆', hue: 25, people: ['sam', 'david'], story: 'Watched the Giants win with Sam on my lap.' },
  { id: 'biscuit', title: 'Biscuit comes home', when: '2021', emoji: '🐶', hue: 45, people: ['biscuit', 'maria'], story: 'A shelter puppy. He picked me.' },
  { id: 'walk', title: 'First walk after stroke', when: 'May 2025', emoji: '🌳', hue: 140, people: ['maria'], story: 'Ten steps in the garden. Maria cried.' },
];

export const BILLS: Bill[] = [
  { id: 'pge', from: 'Valley Power', what: 'Electric', amount: 84.12, due: 'Sat, Nov 21', emoji: '⚡' },
  { id: 'phone', from: 'Verizon', what: 'Phone', amount: 45, due: 'Nov 28', emoji: '📱' },
  { id: 'rx', from: 'CVS Pharmacy', what: 'Medicine', amount: 12.5, due: 'Paid', emoji: '💊', paid: true },
];

/** The PersonContext the understand engine sees, derived from the persona. */
export const FRANK_CONTEXT: PersonContext = {
  name: 'Frank',
  people: CONTACTS.filter((c) => c.relation !== 'dog').map((c) => ({ name: c.name, relation: c.relation, phone: c.phone })),
  routines: PLAN.map((p) => ({ time: p.time, what: p.what })),
  history: [],
  facts: [
    "Today is Ellie's birthday (Nov 15); she is at college",
    'Loves the Giants', 'Retired carpenter', 'Drinks coffee black',
    'Dog named Biscuit', 'Right side weak after stroke in 2025',
    'Electric bill from Valley Power: $84.12 due Saturday',
  ],
};

export const contact = (id: string) => CONTACTS.find((c) => c.id === id || c.name.toLowerCase() === id.toLowerCase());
