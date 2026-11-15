import { useState } from 'react';
import type { PersonContext } from '../contracts';
import { demoContext } from './store';

export function Settings({ ctx, setCtx, onClose }: { ctx: PersonContext; setCtx: (c: PersonContext) => void; onClose: () => void }) {
  const [d, setD] = useState<PersonContext>(ctx);
  const [fact, setFact] = useState('');
  const set = <K extends keyof PersonContext>(k: K, v: PersonContext[K]) => setD({ ...d, [k]: v });

  return (
    <div className="v-sheet-bg" onClick={onClose}>
      <div className="v-sheet glass" onClick={(e) => e.stopPropagation()}>
        <div className="v-sheet-head"><h2>About you</h2><button className="v-icon glass" onClick={onClose} aria-label="Close">✕</button></div>
        <p className="v-sub">Filled in with family or a therapist. Voice uses this to guess what you mean.</p>

        <label className="v-field">Name<input value={d.name} onChange={(e) => set('name', e.target.value)} /></label>

        <h3>People</h3>
        {d.people.map((p, i) => (
          <div className="v-row" key={i}>
            {(['name', 'relation', 'phone'] as const).map((k) => (
              <input key={k} placeholder={k} value={p[k] ?? ''} onChange={(e) => set('people', d.people.map((q, j) => j === i ? { ...q, [k]: e.target.value } : q))} />
            ))}
            <button className="v-x" onClick={() => set('people', d.people.filter((_, j) => j !== i))}>✕</button>
          </div>
        ))}
        <button className="v-add" onClick={() => set('people', [...d.people, { name: '', relation: '' }])}>+ Add person</button>

        <h3>Routines</h3>
        {d.routines.map((r, i) => (
          <div className="v-row" key={i}>
            <input type="time" value={r.time} onChange={(e) => set('routines', d.routines.map((q, j) => j === i ? { ...q, time: e.target.value } : q))} />
            <input placeholder="what" value={r.what} onChange={(e) => set('routines', d.routines.map((q, j) => j === i ? { ...q, what: e.target.value } : q))} />
            <button className="v-x" onClick={() => set('routines', d.routines.filter((_, j) => j !== i))}>✕</button>
          </div>
        ))}
        <button className="v-add" onClick={() => set('routines', [...d.routines, { time: '12:00', what: '' }])}>+ Add routine</button>

        <h3>Facts</h3>
        <div className="v-facts">{d.facts.map((f, i) => <span key={i} className="v-pill">{f}<button onClick={() => set('facts', d.facts.filter((_, j) => j !== i))}>✕</button></span>)}</div>
        <form className="v-row" onSubmit={(e) => { e.preventDefault(); if (fact.trim()) { set('facts', [...d.facts, fact.trim()]); setFact(''); } }}>
          <input placeholder="e.g. Loves the Giants" value={fact} onChange={(e) => setFact(e.target.value)} />
          <button className="v-add">Add</button>
        </form>

        <div className="v-sheet-foot">
          <button className="v-ghost" onClick={() => setD({ ...demoContext, history: [] })}>Reset demo</button>
          <button className="v-primary" onClick={() => { setCtx(d); onClose(); }}>Save</button>
        </div>
      </div>
    </div>
  );
}
