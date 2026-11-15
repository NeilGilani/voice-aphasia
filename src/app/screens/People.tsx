import { useEffect, useRef, useState } from 'react';
import { Composer } from '../os/Composer';
import { useOS } from '../os/os';
import { contact, MEMORIES } from '../os/persona';
import { Avatar, Kicker, ScreenHead } from '../os/ui';

export function Person({ params }: { params?: Record<string, string> }) {
  const os = useOS();
  const c = contact(params?.id ?? '')!;
  const mems = MEMORIES.filter((m) => m.people.includes(c.id));
  return (
    <div className="call">
      <Avatar c={c} size={150} ring={c.online} />
      <h2>{c.name}</h2>
      <div className="st" style={{ textTransform: 'capitalize' }}>{c.relation}{c.online ? ' · online now' : ''}</div>
      <div className="os-grid" style={{ width: '100%', marginTop: 16 }}>
        <button className="os-btn green" onClick={() => os.open('call', { id: c.id })}><span className="big">📞</span>Call</button>
        <button className="os-btn primary" onClick={() => os.open('thread', { id: c.id })}><span className="big">💬</span>Message</button>
      </div>
      {mems.length > 0 && <div style={{ width: '100%', textAlign: 'left' }}>
        <Kicker>Memories together</Kicker>
        <div className="os-grid">{mems.map((m) => <button key={m.id} className="mem" style={{ background: `linear-gradient(160deg,hsl(${m.hue} 80% 60%),hsl(${m.hue + 30} 70% 30%))` }} onClick={() => os.open('memory', { id: m.id })}><span className="em">{m.emoji}</span><b>{m.title}</b><small>{m.when}</small></button>)}</div>
      </div>}
    </div>
  );
}

export function Phone() {
  const os = useOS();
  return (
    <>
      <ScreenHead emoji="📞" hue={140} title="Phone" sub="Tap a face to call." />
      <div className="home-people">
        {os.contacts.filter((c) => c.phone).map((c, i) => (
          <button key={c.id} className="person os-glass os-tile" style={{ animationDelay: `${i * 50}ms` }} onClick={() => os.open('call', { id: c.id })}>
            <Avatar c={c} size={84} ring={c.online} /><b>{c.name}</b><small>{c.relation}</small>
          </button>
        ))}
      </div>
    </>
  );
}

/** In-app call. Demo: simulated connection; "real phone" hands off to tel:. While connected, the person speaks via Composer in their own voice. */
export function Call({ params }: { params?: Record<string, string> }) {
  const os = useOS();
  const c = contact(params?.id ?? 'ellie')!;
  const [state, setState] = useState<'ringing' | 'live' | 'ended'>('ringing');
  const [secs, setSecs] = useState(0);
  const [log, setLog] = useState<{ who: 'person' | 'other'; text: string }[]>([]);
  const t = useRef<number>(0);
  useEffect(() => {
    const a = setTimeout(() => {
      setState('live');
      const hello = c.id === 'ellie' ? 'Hi Grandpa! Did you get my message? It’s my birthday!' : `Hi ${os.ctx.name}! How are you?`;
      setLog([{ who: 'other', text: hello }]);
    }, 2600);
    return () => clearTimeout(a);
  }, []); // eslint-disable-line
  useEffect(() => {
    if (state !== 'live') return;
    t.current = window.setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t.current);
  }, [state]);
  const hang = () => { setState('ended'); os.toast({ contact: c, title: `Call with ${c.name}`, body: `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')} · ended` }); setTimeout(os.back, 500); };
  return (
    <div className="call">
      <div className={`call-av ${state}`} style={{ ['--h' as string]: c.hue }}><Avatar c={c} size={state === 'live' ? 110 : 160} /></div>
      <h2>{c.name}</h2>
      <div className="st">{state === 'ringing' ? 'Calling…' : state === 'live' ? <><span style={{ color: 'var(--os-green)' }}>●</span> {`${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`}</> : 'Call ended'}</div>
      {state === 'live' && (
        <div style={{ width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
          <div className="thread">{log.map((l, i) => <div key={i} className={`bub ${l.who === 'other' ? 'in' : 'out'}`}>{l.text}</div>)}</div>
          <Composer compact recent={log} quick={['Yes', 'No', 'I love you', 'Say again?']} onSpoken={(x) => {
            setLog((l) => [...l, { who: 'person', text: x.text }]);
            if (c.id === 'ellie' && log.length < 3) setTimeout(() => setLog((l) => [...l, { who: 'other', text: /bill|pay|\$/i.test(x.text) ? 'Of course Grandpa, I’ll pay it online tonight. Don’t worry 💛' : 'Aww Grandpa 🥹 I love you too! Thank you!' }]), 1800);
          }} />
        </div>
      )}
      <div className="row" style={{ marginTop: 18, gap: 14 }}>
        {c.phone && <a className="os-btn" href={`tel:${c.phone}`} style={{ textDecoration: 'none', fontSize: 16 }}>📱 Real phone</a>}
        <button className="os-btn red" onClick={hang}><span className="big">⏹</span>Hang up</button>
      </div>
    </div>
  );
}
