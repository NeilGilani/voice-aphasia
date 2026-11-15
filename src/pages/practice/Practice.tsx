/* Practice home (#/practice) and therapist progress view (#/progress). */
import { useState } from 'react';
import { usePersonContext } from '../../app/store';
import PracticeCard from './PracticeCard';
import { pickPracticeWord, usePractice, type Attempt } from './practiceData';
import '../../app/app.css';
import '../os.css';

export default function Practice() {
  const [ctx] = usePersonContext();
  const [word, setWord] = useState<string | null>(null);
  // Words come from their own life: names and words in sentences they have chosen.
  const pool = Array.from(new Set([
    ...ctx.people.map((p) => p.name),
    ...ctx.history.slice(-20).map((h) => pickPracticeWord(h.text, ctx)).filter(Boolean) as string[],
    'water', 'coffee', 'thank you',
  ])).slice(0, 12);
  return (
    <div className="os">
      <div className="v-aurora" aria-hidden />
      <header className="glass os-top">
        <a className="os-back" href="#/app">‹ Back</a>
        <h1>🗣️ Practice</h1>
        <a className="v-chip" href="#/progress" style={{ textDecoration: 'none' }}>Progress</a>
      </header>
      {word ? (
        <div style={{ marginTop: 16 }}><PracticeCard key={word} word={word} ctx={ctx} onClose={() => setWord(null)} /></div>
      ) : (
        <>
          <p className="os-kicker">Words from your life</p>
          <div className="os-grid">
            {pool.map((w) => (
              <button key={w} className="glass mb-person" style={{ fontSize: 24, fontWeight: 700, padding: 24 }} onClick={() => setWord(w)}>{w}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const CUE_LABEL = { none: 'Independent', 'first-sound': 'First-sound cue', model: 'After model' } as const;

export function Progress() {
  const [ctx] = usePersonContext();
  const [p, setP] = usePractice();
  const a = p.attempts;
  const ok = a.filter((x) => x.ok);
  const byWord = new Map<string, Attempt[]>();
  for (const x of a) byWord.set(x.word, [...(byWord.get(x.word) ?? []), x]);
  // Last 14 days of successful attempts.
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i));
    return a.filter((x) => x.ok && new Date(x.at).toDateString() === d.toDateString()).length;
  });
  const max = Math.max(1, ...days);
  const csv = () => {
    const rows = [['time', 'word', 'cue', 'success', 'heard', 'context'], ...a.map((x) => [new Date(x.at).toISOString(), x.word, x.cue, String(x.ok), x.heard, x.from ?? ''])];
    const blob = new Blob([rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')], { type: 'text/csv' });
    const u = URL.createObjectURL(blob); const el = document.createElement('a'); el.href = u; el.download = `${ctx.name}-practice.csv`; el.click(); URL.revokeObjectURL(u);
  };
  return (
    <div className="os">
      <div className="v-aurora" aria-hidden />
      <header className="glass os-top">
        <a className="os-back" href="#/practice">‹ Practice</a>
        <h1>📈 {ctx.name} · speech practice</h1>
      </header>
      <div className="os-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginTop: 16 }}>
        <div className="glass fb-stat"><b>{a.length}</b><span className="os-muted">attempts</span></div>
        <div className="glass fb-stat"><b>{a.length ? Math.round((ok.length / a.length) * 100) : 0}%</b><span className="os-muted">said correctly</span></div>
        <div className="glass fb-stat"><b>{ok.filter((x) => x.cue === 'none').length}</b><span className="os-muted">with no cue</span></div>
      </div>
      <p className="os-kicker">Successful words · last 14 days</p>
      <section className="glass os-sec"><div className="pr-spark">{days.map((n, i) => <i key={i} style={{ height: `${(n / max) * 100}%` }} title={`${n}`} />)}</div></section>
      <p className="os-kicker">By word</p>
      <section className="glass os-sec" style={{ overflowX: 'auto' }}>
        {byWord.size ? (
          <table className="pr-table">
            <thead><tr><th>Word</th><th>Tries</th><th>Success</th><th>Best cue level</th></tr></thead>
            <tbody>
              {[...byWord].map(([w, xs]) => {
                const s = xs.filter((x) => x.ok);
                const best = s.some((x) => x.cue === 'none') ? 'none' : s.some((x) => x.cue === 'first-sound') ? 'first-sound' : s.length ? 'model' : null;
                return (
                  <tr key={w}><td><b>{w}</b></td><td>{xs.length}</td>
                    <td style={{ minWidth: 120 }}><div className="pr-bar"><i style={{ width: `${(s.length / xs.length) * 100}%` }} /></div></td>
                    <td>{best ? CUE_LABEL[best] : '—'}</td></tr>
                );
              })}
            </tbody>
          </table>
        ) : <p className="os-muted">No practice yet. Words come from sentences {ctx.name} chooses during the day.</p>}
      </section>
      <div className="os-row" style={{ justifyContent: 'space-between' }}>
        <button className="os-btn" onClick={csv} disabled={!a.length}>⬇ Export CSV for therapist</button>
        <button className="os-btn ghost" onClick={() => confirm('Clear all practice history?') && setP({ attempts: [] })}>Clear</button>
      </div>
      <p className="os-muted">Practice log for a speech-language pathologist to review. Not a clinical assessment.</p>
    </div>
  );
}
