/*
 * Messages screen: incoming texts are simplified (short lines + pictures) and read aloud;
 * replying = speak fragments -> 3 full sentences -> tap to send. Seeded family threads.
 */
import { useEffect, useRef, useState } from 'react';
import type { Candidate, PersonContext, VoiceEngine } from '../contracts';
import { deviceVoice, listen, type Listener } from '../app/adapters';
import { usePersonContext } from '../app/store';
import { simplify, understandStream, type SimpleLine } from '../understand';
import '../app/app.css';
import './messages.css';

interface Msg { id: string; from: 'them' | 'me'; text: string; at: number; simple?: SimpleLine[] }
interface Thread { id: string; name: string; icon: string; msgs: Msg[]; unread: boolean }

const KEY = 'voice.messages.v1';
const ago = (min: number) => Date.now() - min * 60_000;
const SEED: Thread[] = [
  { id: 'ellie', name: 'Ellie', icon: '👧', unread: true, msgs: [
    { id: 'e1', from: 'them', at: ago(90), text: "Hi Dad!! Can't believe I'm another year older today 🎂 Are you free for a call tonight after dinner? Love you so much." },
  ] },
  { id: 'patel', name: 'Dr. Patel', icon: '🩺', unread: true, msgs: [
    { id: 'p1', from: 'them', at: ago(240), text: 'Reminder: your speech therapy session has moved from Tuesday to Thursday, November 19 at 3:00 PM. Please bring your practice workbook. Reply YES to confirm.' },
  ] },
  { id: 'rosa', name: 'Rosa', icon: '👵', unread: false, msgs: [
    { id: 'r1', from: 'them', at: ago(600), text: "I'm at the pharmacy picking up your prescription, then grabbing groceries. Do you want anything special for dinner? Back around 5." },
    { id: 'r2', from: 'me', at: ago(590), text: 'Soup, please. Thank you, love.' },
  ] },
];

function load(): Thread[] { try { const s = localStorage.getItem(KEY); if (s) return JSON.parse(s); } catch { /* ignore */ } return SEED; }

function Bold({ line }: { line: SimpleLine }) {
  const ks = (line.keywords ?? []).filter(Boolean);
  if (!ks.length) return <>{line.text}</>;
  const re = new RegExp(`(${ks.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
  return <>{line.text.split(re).map((p, i) => (ks.includes(p) ? <b key={i}>{p}</b> : <span key={i}>{p}</span>))}</>;
}

export function Messages({ voice = deviceVoice, onBack }: { voice?: VoiceEngine; onBack?: () => void }) {
  const [ctx, setCtx] = usePersonContext();
  const [threads, setThreads] = useState<Thread[]>(load);
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(threads)); } catch { /* ignore */ } }, [threads]);

  const thread = threads.find((t) => t.id === open);
  const patch = (id: string, fn: (t: Thread) => Thread) => setThreads((ts) => ts.map((t) => (t.id === id ? fn(t) : t)));

  return (
    <div className="v-shell">
      <div className="v-aurora" />
      <header className="v-top">
        {(thread || onBack) && <button className="v-icon glass" aria-label="Back" onClick={() => (thread ? setOpen(null) : onBack?.())}>←</button>}
        <div className="v-brand">{thread ? <>{thread.icon} {thread.name}</> : <>💬 Messages</>}</div>
      </header>
      {thread
        ? <ThreadView key={thread.id} thread={thread} ctx={ctx} voice={voice}
            onChange={(fn) => patch(thread.id, fn)} onLearn={(text) => setCtx((p) => ({ ...p, history: [...p.history, { text, at: Date.now() }].slice(-50) }))} />
        : (
          <main className="v-main m-list">
            {threads.map((t) => (
              <button key={t.id} className="m-thread glass" onClick={() => { setOpen(t.id); patch(t.id, (x) => ({ ...x, unread: false })); }}>
                <div className="m-avatar">{t.icon}</div>
                <div style={{ minWidth: 0 }}>
                  <div className="m-name">{t.name}</div>
                  <div className="m-prev">{t.msgs[t.msgs.length - 1]?.text}</div>
                </div>
                {t.unread && <div className="m-unread" aria-label="unread" />}
              </button>
            ))}
          </main>
        )}
    </div>
  );
}

function ThreadView({ thread, ctx, voice, onChange, onLearn }: {
  thread: Thread; ctx: PersonContext; voice: VoiceEngine;
  onChange: (fn: (t: Thread) => Thread) => void; onLearn: (text: string) => void;
}) {
  const [phase, setPhase] = useState<'idle' | 'listening' | 'thinking' | 'choosing'>('idle');
  const [heard, setHeard] = useState('');
  const [cands, setCands] = useState<(Partial<Candidate> & { text: string })[]>([]);
  const [showOrig, setShowOrig] = useState<string | null>(null);
  const rec = useRef<Listener | null>(null);
  const heardRef = useRef('');
  const bottom = useRef<HTMLDivElement>(null);

  // Simplify incoming messages that haven't been yet; read the newest one aloud.
  useEffect(() => {
    const todo = thread.msgs.filter((m) => m.from === 'them' && !m.simple);
    todo.forEach(async (m, i) => {
      let lines: SimpleLine[];
      try { lines = (await simplify(m.text, ctx.people)).lines; }
      catch { lines = m.text.split(/(?<=[.!?])\s+/).map((t) => ({ text: t, icon: '💬' })); }
      onChange((t) => ({ ...t, msgs: t.msgs.map((x) => (x.id === m.id ? { ...x, simple: lines } : x)) }));
      if (i === todo.length - 1) voice.speak(`${thread.name} says: ${lines.map((l) => l.text).join(' ')}`).catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread.id]);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }); }, [thread.msgs.length, cands.length]);

  async function think(text: string) {
    if (!text.trim()) { setPhase('idle'); return; }
    setPhase('thinking'); setCands([]);
    const recent = thread.msgs.slice(-6).map((m) => ({ who: m.from === 'me' ? 'person' as const : 'other' as const, text: m.text }));
    const req = {
      utterance: { id: crypto.randomUUID(), transcript: `(replying by text to ${thread.name}) ${text}`, startedAt: Date.now() },
      context: ctx, now: new Date().toISOString(), recent,
    };
    try {
      const res = await understandStream(req, (i, t) => setCands((c) => { const n = [...c]; n[i] = { text: t }; return n; }));
      setCands(res.candidates);
    } catch {
      setCands([{ text: text.replace(/…/g, ' ').trim() }]);
    }
    setPhase('choosing');
  }

  function talk() {
    if (phase === 'listening') { rec.current?.stop(); return; }
    heardRef.current = ''; setHeard(''); setCands([]);
    const l = listen((t) => { heardRef.current = t; setHeard(t); }, () => { rec.current = null; think(heardRef.current); });
    if (!l) { const t = prompt('Type the words'); if (t) think(t); return; }
    rec.current = l; setPhase('listening');
  }

  function send(text: string) {
    onChange((t) => ({ ...t, msgs: [...t.msgs, { id: crypto.randomUUID(), from: 'me', text, at: Date.now() }] }));
    onLearn(text); setCands([]); setHeard(''); setPhase('idle');
    voice.speak(text).catch(() => {});
  }

  const lastIn = [...thread.msgs].reverse().find((m) => m.from === 'them');
  return (
    <>
      <main className="v-main">
        <div className="m-msgs">
          {thread.msgs.map((m) => m.from === 'me'
            ? <div key={m.id} className="m-out">{m.text}<div className="m-time">{new Date(m.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div></div>
            : (
              <div key={m.id} className="m-in glass">
                {m.simple
                  ? m.simple.map((l, i) => <div key={i} className="m-line"><span className="m-ico">{l.icon}</span><span><Bold line={l} /></span></div>)
                  : <div className="v-card skel" style={{ minHeight: 60 }} />}
                {showOrig === m.id && <div className="m-orig">{m.text}</div>}
                <div className="m-acts">
                  <button className="v-ghost" onClick={() => voice.speak((m.simple ?? [{ text: m.text }]).map((l) => l.text).join(' '))}>🔊 Read</button>
                  <button className="v-ghost" onClick={() => setShowOrig(showOrig === m.id ? null : m.id)}>{showOrig === m.id ? 'Hide' : 'Original'}</button>
                </div>
              </div>
            ))}
        </div>
        {lastIn && phase === 'idle' && /reply yes|\?/i.test(lastIn.text) && (
          <div className="m-acts">
            <button className="v-ghost" onClick={() => send('Yes.')}>👍 Yes</button>
            <button className="v-ghost" onClick={() => send('No.')}>👎 No</button>
            <button className="v-ghost" onClick={() => send('Love you!')}>❤️ Love you</button>
          </div>
        )}
        {(heard || phase === 'listening') && (
          <div className="v-heard glass">
            <div className="v-kicker">Heard</div>
            <div className="v-frags">{heard ? heard.split(/\s*…\s*|\s+/).filter(Boolean).map((f, i) => <span key={i} className="v-frag">{f}</span>) : <span className="v-hint">Say a few words…</span>}</div>
          </div>
        )}
        {(phase === 'thinking' || phase === 'choosing') && (
          <div className="v-cards">
            {[0, 1, 2].map((i) => cands[i]
              ? (
                <button key={i} className={`v-card glass${i === 0 ? ' best' : ''}`} onClick={() => send(cands[i].text)}>
                  <span className="v-num">{i + 1}</span>
                  <span className="v-text">{cands[i].text}</span>
                  {cands[i].because && <span className="v-because">{cands[i].because}</span>}
                </button>
              )
              : phase === 'thinking' && <div key={i} className="v-card glass skel" />)}
          </div>
        )}
        <div ref={bottom} />
      </main>
      <div className="v-dock">
        <button className={`v-talk ${phase === 'listening' ? 'listening' : 'idle'}`} onClick={talk} disabled={phase === 'thinking'} aria-label="Reply">
          <span className="v-ring" /><span className="v-ring r2" />
          <span style={{ fontSize: 40 }}>{phase === 'listening' ? '■' : '🎙️'}</span>
        </button>
        <div className="v-label">{phase === 'listening' ? 'Tap when done' : phase === 'thinking' ? 'Finding words…' : `Reply to ${thread.name}`}</div>
      </div>
    </>
  );
}
