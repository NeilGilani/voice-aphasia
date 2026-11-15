/* Family bridge: companion view for family — today, picture messages, simplified talk, payment help. */
import { useState } from 'react';
import { usePersonContext } from '../../app/store';
import { simplify, type SimpleLine } from '../simplify';
import { SpeechRec, listenOnce, readFileAsDataUrl, uid } from '../shared';
import { useDay } from '../myday/day';
import { usePractice } from '../practice/practiceData';
import { useInbox, usePayments } from './bridge';
import '../../app/app.css';
import '../os.css';

const PICS = ['❤️', '👋', '🎂', '🍽️', '💊', '🚗', '📞', '🏠', '⚾', '😴', '🎉', '🌞'];
const today = (t: number) => new Date(t).toDateString() === new Date().toDateString();
const hhmm = (t: number) => new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

type Tab = 'today' | 'message' | 'simplify' | 'money';

export default function FamilyBridge() {
  const [ctx] = usePersonContext();
  const [tab, setTab] = useState<Tab>('today');
  return (
    <div className="os">
      <div className="v-aurora" aria-hidden />
      <header className="glass os-top">
        <a className="os-back" href="#/">‹ Voice</a>
        <h1>👨‍👩‍👧 Family · {ctx.name}</h1>
      </header>
      <nav className="glass os-tabs">
        {([['today', 'Today'], ['message', 'Send picture'], ['simplify', 'Say it simply'], ['money', 'Payments']] as [Tab, string][]).map(([k, l]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>
        ))}
      </nav>
      {tab === 'today' && <Today />}
      {tab === 'message' && <Message />}
      {tab === 'simplify' && <Simplify />}
      {tab === 'money' && <Money />}
    </div>
  );
}

function Today() {
  const [ctx] = usePersonContext();
  const [day] = useDay();
  const [practice] = usePractice();
  const said = ctx.history.filter((h) => today(h.at));
  const done = day.items.filter((i) => i.doneAt && today(i.doneAt));
  const tries = practice.attempts.filter((a) => today(a.at));
  const feed = [
    ...said.map((h) => ({ at: h.at, icon: '🗣️', text: `Said: “${h.text}”` })),
    ...done.map((i) => ({ at: i.doneAt!, icon: i.icon, text: `Done: ${i.what}` })),
    ...tries.map((a) => ({ at: a.at, icon: a.ok ? '⭐' : '🔁', text: `Practised “${a.word}”${a.ok ? ' — got it!' : ''}` })),
  ].sort((a, b) => b.at - a.at);
  return (
    <>
      <div className="os-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="glass fb-stat"><b>{said.length}</b><span className="os-muted">sentences said</span></div>
        <div className="glass fb-stat"><b>{done.length}/{day.items.length}</b><span className="os-muted">routine done</span></div>
        <div className="glass fb-stat"><b>{tries.filter((t) => t.ok).length}</b><span className="os-muted">words practised</span></div>
      </div>
      <p className="os-kicker">Activity</p>
      <section className="glass os-sec fb-feed">
        {feed.length ? feed.map((f, i) => (
          <div key={i} className="fb-item os-anim"><span style={{ fontSize: 24 }}>{f.icon}</span><span>{f.text}</span><time>{hhmm(f.at)}</time></div>
        )) : <p className="os-muted">Nothing yet today. Activity appears here as {ctx.name} uses Voice.</p>}
      </section>
    </>
  );
}

function Message() {
  const [inbox, setInbox] = useInbox();
  const [icon, setIcon] = useState('❤️');
  const [text, setText] = useState('');
  const [from, setFrom] = useState('Ellie');
  const [photo, setPhoto] = useState<string>();
  const [lines, setLines] = useState<SimpleLine[]>([]);

  const send = async () => {
    if (!text.trim() && !photo) return;
    const simple = text.trim() ? (await simplify({ text })).lines : [];
    setLines(simple);
    const short = simple.map((l) => l.text).join(' ') || text;
    setInbox([{ id: uid(), from, icon, text: short, photo, at: Date.now() }, ...inbox]);
    setText(''); setPhoto(undefined);
  };
  return (
    <>
      <section className="glass os-sec">
        <div className="os-row" style={{ marginBottom: 12 }}>
          <span className="os-muted">From</span>
          <input className="os-in" style={{ maxWidth: 180 }} value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="os-row">{PICS.map((p) => <button key={p} className={`fb-pic ${icon === p ? 'on' : ''}`} onClick={() => setIcon(p)}>{p}</button>)}</div>
        <textarea className="os-in" style={{ marginTop: 12 }} placeholder="Write normally — we'll shorten it for him" value={text} onChange={(e) => setText(e.target.value)} />
        <div className="os-row" style={{ marginTop: 12, justifyContent: 'space-between' }}>
          <label className="os-btn ghost">📷 {photo ? 'Photo added' : 'Add photo'}<input type="file" accept="image/*" hidden onChange={async (e) => e.target.files?.[0] && setPhoto(await readFileAsDataUrl(e.target.files[0]))} /></label>
          <button className="os-btn" onClick={send}>Send {icon}</button>
        </div>
      </section>
      {lines.length > 0 && <p className="os-muted" style={{ textAlign: 'center' }}>Sent as: {lines.map((l) => `${l.icon} ${l.text}`).join('  ')}</p>}
      <p className="os-kicker">Sent</p>
      <section className="fb-feed">
        {inbox.map((m) => (
          <div key={m.id} className="glass fb-item">
            <span style={{ fontSize: 34 }}>{m.icon}</span>
            <div><b>{m.from}</b><div>{m.text}</div>{m.photo && <img src={m.photo} alt="" style={{ maxWidth: 160, borderRadius: 12, marginTop: 8 }} />}</div>
            <time>{hhmm(m.at)}{m.read ? ' · seen' : ''}</time>
          </div>
        ))}
      </section>
    </>
  );
}

function Simplify() {
  const [said, setSaid] = useState('');
  const [lines, setLines] = useState<SimpleLine[]>([]);
  const [busy, setBusy] = useState(false);
  const [src, setSrc] = useState<'server' | 'local'>();
  const run = async (t: string) => {
    if (!t.trim()) return;
    setBusy(true);
    const r = await simplify({ text: t });
    setLines(r.lines); setSrc(r.source); setBusy(false);
  };
  return (
    <>
      <section className="glass os-sec">
        <p className="os-muted" style={{ marginTop: 0 }}>Talk normally. Show him the screen.</p>
        <div className="os-row">
          <button className="os-btn" disabled={!SpeechRec || busy} onClick={async () => { setBusy(true); const t = await listenOnce(8000); setSaid(t); setBusy(false); run(t); }}>🎙 {busy ? 'Listening…' : 'Speak'}</button>
          <button className="os-btn ghost" onClick={() => { const t = "Hi Dad, so um, Ellie's coming over tomorrow after school, and we're going to have cake for her birthday, and then I'll drive you to the doctor on Monday at ten."; setSaid(t); run(t); }}>Try example</button>
        </div>
        <textarea className="os-in" style={{ marginTop: 12 }} placeholder="…or type" value={said} onChange={(e) => setSaid(e.target.value)} />
        <button className="os-btn" style={{ marginTop: 12 }} disabled={busy || !said.trim()} onClick={() => run(said)}>Make it simple</button>
      </section>
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }} aria-live="polite">
        {lines.map((l, i) => (
          <div key={i} className="glass fam-card" style={{ animationDelay: `${i * 90}ms` }}>
            <span className="fam-icon" aria-hidden>{l.icon}</span><span className="fam-line">{l.text}</span>
          </div>
        ))}
        {src === 'local' && <p className="os-muted" style={{ textAlign: 'center' }}>Offline simplifier (server not reachable)</p>}
      </section>
    </>
  );
}

function Money() {
  const [pays, setPays] = usePayments();
  const set = (id: string, status: 'approved' | 'declined') => setPays(pays.map((p) => (p.id === id ? { ...p, status } : p)));
  return (
    <>
      <p className="os-muted">When he wants to pay something, you double-check it here. Voice never moves money on its own. This prototype only records the decision.</p>
      <section className="fb-feed">
        {pays.map((p) => (
          <div key={p.id} className="glass fb-pay os-anim">
            <span style={{ fontSize: 34 }}>🧾</span>
            <div style={{ flex: 1 }}>
              <b>{p.payee}</b><div className="fb-amt">${p.amount.toFixed(2)}</div><div className="os-muted">{p.note}</div>
            </div>
            {p.status === 'pending' ? (
              <div className="os-row">
                <button className="os-btn ok" onClick={() => set(p.id, 'approved')}>✓ Looks right</button>
                <button className="os-btn no" onClick={() => set(p.id, 'declined')}>✕ Stop</button>
              </div>
            ) : <span className="os-chip">{p.status === 'approved' ? '✓ Confirmed' : '✕ Stopped'}</span>}
          </div>
        ))}
        {!pays.length && <p className="os-muted">No payments waiting.</p>}
      </section>
    </>
  );
}
