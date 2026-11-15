/* My Day: picture routine, meds and appointments, with gentle spoken prompts. */
import { useEffect, useState } from 'react';
import { usePersonContext } from '../../app/store';
import { speak, uid } from '../shared';
import { nextItem, pretty, useDay, type DayItem } from './day';
import '../../app/os/tokens.css';
import '../os.css';

const KIND_ICON: Record<DayItem['kind'], string> = { routine: '🌞', med: '💊', appt: '📅' };

export default function MyDay() {
  const [ctx] = usePersonContext();
  const [day, setDay] = useDay();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<{ time: string; what: string; kind: DayItem['kind'] }>({ time: '09:00', what: '', kind: 'routine' });
  const now = nextItem(day.items);
  const items = [...day.items].sort((a, b) => a.time.localeCompare(b.time));

  const toggle = (id: string) =>
    setDay({ ...day, items: day.items.map((i) => (i.id === id ? { ...i, doneAt: i.doneAt ? undefined : Date.now() } : i)) });

  // Gentle prompt: speak the current item once when it becomes due.
  useEffect(() => {
    const t = setInterval(() => {
      const n = nextItem(day.items);
      if (!n) return;
      const [h, m] = n.time.split(':').map(Number);
      const d = new Date();
      if (d.getHours() === h && d.getMinutes() === m) speak(n.prompt);
    }, 60_000);
    return () => clearInterval(t);
  }, [day.items]);

  const add = () => {
    if (!draft.what.trim()) return;
    const icon = KIND_ICON[draft.kind];
    setDay({ ...day, items: [...day.items, { id: uid(), ...draft, what: draft.what.trim(), icon, prompt: `Time for ${draft.what.trim()}.` }] });
    setDraft({ ...draft, what: '' }); setAdding(false);
  };

  const doneCount = day.items.filter((i) => i.doneAt).length;

  return (
    <div className="sp">
      <div className="os-wall" aria-hidden />
      <header className="os-glass sp-top">
        <a className="sp-back" href="#/app">‹ Back</a>
        <h1>🌞 {ctx.name}'s day</h1>
        <span className="sp-pill">{doneCount}/{day.items.length}</span>
      </header>

      {now ? (
        <section className="os-glass md-now sp-anim" style={{ marginTop: 16 }}>
          <div className="big" aria-hidden>{now.icon}</div>
          <h2>{now.what}</h2>
          <p className="sp-muted" style={{ fontSize: 18 }}>{pretty(now.time)}</p>
          <div className="sp-row" style={{ justifyContent: 'center', marginTop: 12 }}>
            <button className="sp-btn ghost" onClick={() => speak(now.prompt)}>🔊 Tell me</button>
            <button className="sp-btn ok" onClick={() => toggle(now.id)}>✓ Done</button>
          </div>
        </section>
      ) : (
        <section className="os-glass md-now" style={{ marginTop: 16 }}><div className="big">🎉</div><h2>All done today</h2></section>
      )}

      <p className="sp-kicker">Today</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((i) => (
          <div key={i.id} className={`glass md-item ${i.doneAt ? 'done' : ''}`}>
            <span className="ic" aria-hidden>{i.icon}</span>
            <div style={{ flex: 1 }}>
              <div className="t">{i.what}</div>
              <div className="tm">{pretty(i.time)}</div>
            </div>
            <button className="md-check" aria-label={i.doneAt ? `Undo ${i.what}` : `Mark ${i.what} done`} onClick={() => toggle(i.id)}>✓</button>
          </div>
        ))}
      </div>

      {adding ? (
        <section className="os-glass sp-sec" style={{ marginTop: 14 }}>
          <div className="sp-row">
            <input className="sp-in" type="time" style={{ maxWidth: 140 }} value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })} />
            <select className="sp-in" style={{ maxWidth: 160 }} value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as DayItem['kind'] })}>
              <option value="routine">Routine</option><option value="med">Medicine</option><option value="appt">Appointment</option>
            </select>
            <input className="sp-in" style={{ flex: 1, minWidth: 160 }} placeholder="What" value={draft.what} onChange={(e) => setDraft({ ...draft, what: e.target.value })} />
            <button className="sp-btn" onClick={add}>Add</button>
          </div>
        </section>
      ) : (
        <div style={{ textAlign: 'center', marginTop: 16 }}><button className="sp-btn ghost" onClick={() => setAdding(true)}>+ Add to day (family)</button></div>
      )}
    </div>
  );
}
