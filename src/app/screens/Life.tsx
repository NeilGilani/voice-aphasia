import { useEffect, useRef, useState } from 'react';
import { useOS } from '../os/os';
import { BILLS, MEMORIES, PLAN, contact } from '../os/persona';
import { Avatar, Kicker, ScreenHead } from '../os/ui';

export function Money() {
  const os = useOS();
  const due = BILLS.filter((b) => !b.paid);
  const total = due.reduce((s, b) => s + b.amount, 0);
  return (
    <>
      <ScreenHead emoji="💵" hue={120} title="Money" sub="Bills, in pictures." />
      <div className="os-glass" style={{ padding: 20, textAlign: 'center' }}>
        <div style={{ color: 'var(--os-ink-2)', fontWeight: 700 }}>To pay this month</div>
        <div className="big-num">${total.toFixed(0)}</div>
        <div style={{ fontSize: 30, letterSpacing: 4 }}>{'💵'.repeat(Math.min(6, Math.round(total / 20)))}</div>
      </div>
      <Kicker>Bills</Kicker>
      <div className="stack">
        {BILLS.map((b, i) => (
          <div key={b.id} className="list-item os-glass os-tile" style={{ animationDelay: `${i * 60}ms`, opacity: b.paid ? 0.55 : 1 }}>
            <span style={{ fontSize: 44 }}>{b.emoji}</span>
            <span className="grow"><b>{b.what} · ${b.amount.toFixed(2)}</b><small>{b.from} · {b.paid ? '✅ Paid' : `📅 ${b.due}`}</small></span>
          </div>
        ))}
      </div>
      <div className="stack" style={{ marginTop: 16 }}>
        <button className="os-btn primary block" onClick={() => os.open('read')}><span className="big">📷</span>Read a new bill</button>
        <button className="os-btn block" onClick={() => os.open('thread', { id: 'david' })}><span className="big">🙋</span>Ask David for help</button>
      </div>
    </>
  );
}

export function MyDay() {
  const os = useOS();
  const [done, setDone] = useState(() => new Set(PLAN.filter((p) => p.done).map((p) => p.time)));
  return (
    <>
      <ScreenHead emoji="☀️" hue={45} title="My Day" sub={new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })} />
      <div className="os-glass" style={{ padding: 16, display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16, background: 'linear-gradient(135deg,rgba(255,92,154,.35),rgba(255,201,92,.2))' }}>
        <span style={{ fontSize: 46 }}>🎂</span>
        <div style={{ flex: 1 }}><b style={{ fontSize: 20 }}>Ellie’s birthday</b><div style={{ color: 'var(--os-ink-2)' }}>She turns 21 today</div></div>
        <button className="os-chip" onClick={() => os.open('call', { id: 'ellie' })}>📞 Call</button>
      </div>
      <div className="tl">
        {PLAN.map((p) => (
          <button key={p.time} className={`tl-item os-glass ${done.has(p.time) ? 'done' : ''}`}
            onClick={() => setDone((d) => { const n = new Set(d); n.has(p.time) ? n.delete(p.time) : n.add(p.time); return n; })}>
            <span className="em">{p.emoji}</span>
            <span style={{ flex: 1 }}><b>{p.what}</b><small>{p.time}</small></span>
            <span style={{ fontSize: 28 }}>{done.has(p.time) ? '✅' : '⬜️'}</span>
          </button>
        ))}
      </div>
    </>
  );
}

export function MemoryBook() {
  const os = useOS();
  return (
    <>
      <ScreenHead emoji="📖" hue={25} title="Memory Book" sub="Your stories, ready to share." />
      <div className="os-grid">
        {MEMORIES.map((m, i) => (
          <button key={m.id} className="mem" style={{ animationDelay: `${i * 60}ms`, background: `linear-gradient(160deg,hsl(${m.hue} 80% 60%),hsl(${m.hue + 30} 70% 28%))` }} onClick={() => os.open('memory', { id: m.id })}>
            <span className="em">{m.emoji}</span><b>{m.title}</b><small>{m.when}</small>
          </button>
        ))}
      </div>
    </>
  );
}

export function MemoryDetail({ params }: { params?: Record<string, string> }) {
  const os = useOS();
  const m = MEMORIES.find((x) => x.id === params?.id) ?? MEMORIES[0];
  return (
    <>
      <div className="mem-hero os-glass" style={{ background: `linear-gradient(160deg,hsl(${m.hue} 80% 60%),hsl(${m.hue + 30} 70% 28%))` }}>{m.emoji}</div>
      <h1 style={{ fontSize: 34, margin: '18px 0 4px' }}>{m.title}</h1>
      <div style={{ color: 'var(--os-ink-2)', fontWeight: 700 }}>{m.when}</div>
      <p style={{ fontSize: 22, lineHeight: 1.4 }}>{m.story}</p>
      <div className="row" style={{ marginBottom: 16 }}>{m.people.map((id) => { const c = contact(id); return c && <Avatar key={id} c={c} size={56} />; })}</div>
      <button className="os-btn primary block" onClick={() => os.voice.speak(`${m.title}. ${m.when}. ${m.story}`)}><span className="big">🔊</span>Tell this story</button>
    </>
  );
}

const WORDS = [['☕', 'coffee'], ['🐶', 'dog'], ['🔑', 'keys'], ['📞', 'phone'], ['🍎', 'apple'], ['⚾', 'baseball'], ['💊', 'pills'], ['🪑', 'chair']];

export function Practice() {
  const os = useOS();
  const [i, setI] = useState(0);
  const [hint, setHint] = useState(0);
  const [score, setScore] = useState<boolean[]>([]);
  const [emoji, word] = WORDS[i % WORDS.length];
  const next = (ok: boolean) => { setScore((s) => [...s, ok].slice(-WORDS.length)); setI((x) => x + 1); setHint(0); };
  return (
    <>
      <ScreenHead emoji="🎯" hue={300} title="Practice" sub="Name the picture. Take your time." />
      <div className="prac-card os-glass" key={i}>{emoji}</div>
      <div className="prac-word" style={{ margin: '18px 0' }}>{hint === 0 ? '' : hint === 1 ? word[0].toUpperCase() + ' _ '.repeat(word.length - 1) : word}</div>
      <div className="os-grid">
        <button className="os-btn" onClick={() => { setHint((h) => Math.min(2, h + 1)); if (hint >= 1) os.voice.speak(word); }}>💡 Hint</button>
        <button className="os-btn green" onClick={() => next(true)}>✅ I said it</button>
      </div>
      <button className="os-btn block" style={{ marginTop: 12 }} onClick={() => next(false)}>Skip →</button>
      <div className="dots" style={{ marginTop: 18 }}>{score.map((s, k) => <i key={k} className={s ? 'on' : ''} />)}</div>
    </>
  );
}

export function Emergency() {
  const os = useOS();
  const [p, setP] = useState(0);
  const [sent, setSent] = useState(false);
  const raf = useRef(0);
  const start = () => {
    const t0 = performance.now();
    const tick = (t: number) => { const v = Math.min(1, (t - t0) / 1500); setP(v); if (v < 1) raf.current = requestAnimationFrame(tick); else fire(); };
    raf.current = requestAnimationFrame(tick);
  };
  const cancel = () => { cancelAnimationFrame(raf.current); if (!sent) setP(0); };
  const fire = () => {
    setSent(true);
    os.voice.speak(`I need help. My name is ${os.ctx.name}. I had a stroke and I have trouble speaking.`);
    os.toast({ emoji: '🚨', title: 'Help is on the way (demo)', body: 'Maria and David were alerted with your location.' });
  };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  return (
    <>
      <ScreenHead emoji="🚨" hue={355} title="Emergency" sub="Hold the button for help." />
      <button className="sos" onPointerDown={start} onPointerUp={cancel} onPointerLeave={cancel} aria-label="Hold for help">
        <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255,255,255,.9)" strokeWidth="4" strokeDasharray={`${p * 301.6} 301.6`} strokeLinecap="round" /></svg>
        {sent ? '✓' : 'HELP'}
      </button>
      <div style={{ textAlign: 'center', color: 'var(--os-ink-2)', fontWeight: 700, marginBottom: 16 }}>{sent ? 'Speaking for you…' : 'Hold for 2 seconds'}</div>
      <Kicker>Medical ID — show this</Kicker>
      <div className="medid os-glass">
        <span>Name</span><b>Frank Moretti, 71</b>
        <span>Condition</span><b>Stroke (2025), aphasia — understands, hard to speak</b>
        <span>Meds</span><b>Apixaban, Atorvastatin</b>
        <span>Call</span><b>Maria (wife) · David (son)</b>
      </div>
    </>
  );
}
