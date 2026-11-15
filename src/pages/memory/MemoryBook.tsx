/*
 * Memory Book: their life, people (photo, relation, stories), favourite topics — built with family.
 * Everything here is folded into PersonContext (people[].notes + facts) so the understanding engine uses it.
 */
import { useEffect, useState } from 'react';
import { usePersonContext } from '../../app/store';
import { KEYS, readFileAsDataUrl, speak, useStored } from '../shared';
import '../../app/app.css';
import '../os.css';

export interface MemoryData {
  lifeStory: string;
  topics: string[];
  people: Record<string, { photo?: string; stories: string[] }>;
  /** Facts we last wrote into PersonContext, so we can replace them cleanly. */
  derived: string[];
}

export const emptyMemory: MemoryData = {
  lifeStory: 'Grew up in San Jose. Worked 30 years as a machinist. Married Rosa in 1978. Coaches Little League in spring.',
  topics: ['The Giants', 'Fishing at Lake Tahoe', 'Old cars'],
  people: {
    Ellie: { stories: ['Taught her to ride a bike on Elm Street.', 'Calls every Sunday night.'] },
    Rosa: { stories: ['Met at a dance in 1976.'] },
  },
  derived: [],
};

export function useMemory() {
  return useStored<MemoryData>(KEYS.memory, emptyMemory);
}

/** Facts the Memory Book contributes to PersonContext. */
export function memoryFacts(m: MemoryData): string[] {
  const out: string[] = [];
  if (m.lifeStory.trim()) out.push(`Life story: ${m.lifeStory.trim()}`);
  for (const t of m.topics) out.push(`Loves talking about ${t}`);
  return out;
}

const initial = (n: string) => n.trim().charAt(0).toUpperCase() || '?';

export default function MemoryBook() {
  const [ctx, setCtx] = usePersonContext();
  const [mem, setMem] = useMemory();
  const [open, setOpen] = useState<string | null>(null);
  const [newP, setNewP] = useState({ name: '', relation: '', phone: '' });
  const [topic, setTopic] = useState('');
  const [story, setStory] = useState('');

  // Fold Memory Book into PersonContext whenever it changes.
  useEffect(() => {
    const facts = memoryFacts(mem);
    setCtx((c) => {
      const base = c.facts.filter((f) => !mem.derived.includes(f));
      const people = c.people.map((p) => {
        const s = mem.people[p.name]?.stories ?? [];
        return s.length ? { ...p, notes: s.join(' ') } : p;
      });
      return { ...c, facts: [...base, ...facts], people };
    });
    if (facts.join('|') !== mem.derived.join('|')) setMem((m) => ({ ...m, derived: facts }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mem.lifeStory, mem.topics, mem.people]);

  const addPerson = () => {
    if (!newP.name.trim()) return;
    setCtx((c) => ({ ...c, people: [...c.people, { name: newP.name.trim(), relation: newP.relation.trim() || 'friend', phone: newP.phone.trim() || undefined }] }));
    setNewP({ name: '', relation: '', phone: '' });
  };
  const setPhoto = async (name: string, f?: File) => {
    if (!f) return;
    const photo = await readFileAsDataUrl(f);
    setMem((m) => ({ ...m, people: { ...m.people, [name]: { stories: m.people[name]?.stories ?? [], photo } } }));
  };
  const addStory = (name: string) => {
    if (!story.trim()) return;
    setMem((m) => ({ ...m, people: { ...m.people, [name]: { ...m.people[name], stories: [...(m.people[name]?.stories ?? []), story.trim()] } } }));
    setStory('');
  };
  const removePerson = (name: string) => {
    setCtx((c) => ({ ...c, people: c.people.filter((p) => p.name !== name) }));
    setOpen(null);
  };

  const person = ctx.people.find((p) => p.name === open);

  return (
    <div className="os">
      <div className="v-aurora" aria-hidden />
      <header className="glass os-top">
        <a className="os-back" href="#/app">‹ Back</a>
        <h1>📖 {ctx.name}'s Memory Book</h1>
      </header>

      <p className="os-kicker">People</p>
      <div className="os-grid">
        {ctx.people.map((p) => (
          <button key={p.name} className="glass mb-person os-anim" onClick={() => { setOpen(p.name); speak(`${p.name}, your ${p.relation}`); }}>
            {mem.people[p.name]?.photo
              ? <img className="mb-face" src={mem.people[p.name].photo} alt="" />
              : <div className="mb-face">{initial(p.name)}</div>}
            <div className="mb-name">{p.name}</div>
            <div className="mb-rel">{p.relation}</div>
          </button>
        ))}
      </div>

      {person && (
        <section className="glass os-sec os-anim" style={{ marginTop: 14 }}>
          <div className="os-row">
            {mem.people[person.name]?.photo
              ? <img className="mb-face" style={{ margin: 0 }} src={mem.people[person.name].photo} alt="" />
              : <div className="mb-face" style={{ margin: 0 }}>{initial(person.name)}</div>}
            <div style={{ flex: 1 }}>
              <div className="mb-name" style={{ fontSize: 26 }}>{person.name}</div>
              <div className="mb-rel">{person.relation}{person.phone ? ` · ${person.phone}` : ''}</div>
            </div>
            <label className="os-btn ghost">📷 Photo<input type="file" accept="image/*" hidden onChange={(e) => setPhoto(person.name, e.target.files?.[0])} /></label>
          </div>
          <p className="os-kicker">Stories</p>
          {(mem.people[person.name]?.stories ?? []).map((s, i) => <div key={i} className="mb-story">{s}</div>)}
          <div className="os-row" style={{ marginTop: 8 }}>
            <input className="os-in" style={{ flex: 1 }} placeholder={`A memory with ${person.name}…`} value={story}
              onChange={(e) => setStory(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addStory(person.name)} />
            <button className="os-btn" onClick={() => addStory(person.name)}>Add</button>
          </div>
          <div className="os-row" style={{ marginTop: 14, justifyContent: 'space-between' }}>
            <button className="os-btn ghost" onClick={() => setOpen(null)}>Close</button>
            <button className="os-btn ghost" onClick={() => removePerson(person.name)}>Remove</button>
          </div>
        </section>
      )}

      <section className="glass os-sec" style={{ marginTop: 14 }}>
        <p className="os-muted" style={{ marginTop: 0 }}>Add someone</p>
        <div className="os-row">
          <input className="os-in" style={{ flex: 2, minWidth: 120 }} placeholder="Name" value={newP.name} onChange={(e) => setNewP({ ...newP, name: e.target.value })} />
          <input className="os-in" style={{ flex: 2, minWidth: 120 }} placeholder="Relation (granddaughter…)" value={newP.relation} onChange={(e) => setNewP({ ...newP, relation: e.target.value })} />
          <input className="os-in" style={{ flex: 2, minWidth: 120 }} placeholder="Phone (optional)" value={newP.phone} onChange={(e) => setNewP({ ...newP, phone: e.target.value })} />
          <button className="os-btn" onClick={addPerson}>+ Add</button>
        </div>
      </section>

      <p className="os-kicker">Life story</p>
      <section className="glass os-sec">
        <textarea className="os-in" rows={4} value={mem.lifeStory} onChange={(e) => setMem({ ...mem, lifeStory: e.target.value })} />
        <p className="os-muted">Family can write this together. Voice uses it to understand what {ctx.name} means.</p>
      </section>

      <p className="os-kicker">Favourite topics</p>
      <section className="glass os-sec">
        <div className="os-row">
          {mem.topics.map((t) => (
            <span key={t} className="os-chip">{t}<button aria-label={`Remove ${t}`} onClick={() => setMem({ ...mem, topics: mem.topics.filter((x) => x !== t) })}>✕</button></span>
          ))}
        </div>
        <div className="os-row" style={{ marginTop: 12 }}>
          <input className="os-in" style={{ flex: 1 }} placeholder="Add a topic" value={topic} onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && topic.trim()) { setMem({ ...mem, topics: [...mem.topics, topic.trim()] }); setTopic(''); } }} />
        </div>
      </section>
    </div>
  );
}
