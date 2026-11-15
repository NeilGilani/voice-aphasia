import { useRef, useState } from 'react';
import type { Candidate, Utterance, VoiceEngine } from '../contracts';
import { currentlySeen, deviceVoice, listen, runAction, understand, type Listener } from './adapters';
import { usePersonContext } from './store';
import { Settings } from './Settings';
import './app.css';

type Turn = { who: 'person' | 'other'; text: string; at: number };
type Phase = 'idle' | 'listening' | 'thinking' | 'choosing' | 'speaking';

export function PatientApp({ voice = deviceVoice }: { voice?: VoiceEngine }) {
  const [ctx, setCtx] = usePersonContext();
  const [phase, setPhase] = useState<Phase>('idle');
  const [transcript, setTranscript] = useState('');
  const [typed, setTyped] = useState('');
  const [cands, setCands] = useState<Candidate[]>([]);
  const [source, setSource] = useState<'claude' | 'mock' | null>(null);
  const [spoken, setSpoken] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const rec = useRef<Listener | null>(null);
  const textRef = useRef('');

  async function think(text: string) {
    if (!text.trim()) { setPhase('idle'); return; }
    setPhase('thinking');
    setCands([]);
    const utterance: Utterance = { id: crypto.randomUUID(), transcript: text, seen: await currentlySeen(), startedAt: Date.now() };
    const res = await understand({
      utterance, context: ctx, now: new Date().toISOString(),
      recent: turns.slice(-6).map(({ who, text }) => ({ who, text })),
    });
    setSource(res.source);
    setCands(res.candidates);
    setPhase('choosing');
  }

  function toggleTalk() {
    if (phase === 'listening') { rec.current?.stop(); return; }
    setTranscript(''); textRef.current = ''; setSpoken(null); setCands([]);
    const l = listen(
      (t) => { textRef.current = t; setTranscript(t); },
      () => { rec.current = null; think(textRef.current); },
    );
    if (!l) { setPhase('idle'); alert('Speech recognition is not available here. Type the words instead.'); return; }
    rec.current = l;
    setPhase('listening');
  }

  async function choose(c: Candidate) {
    setPhase('speaking');
    setCands([]);
    setSpoken(c.text);
    setTurns((t) => [...t, { who: 'person', text: c.text, at: Date.now() }]);
    setCtx((p) => ({ ...p, history: [...p.history, { text: c.text, at: Date.now() }].slice(-50) }));
    await voice.speak(c.text);
    setPhase('idle');
    runAction(c);
  }

  function submitTyped(e: React.FormEvent) {
    e.preventDefault();
    setTranscript(typed); setSpoken(null);
    think(typed); setTyped('');
  }

  const label = { idle: 'Tap to talk', listening: 'Listening… tap when done', thinking: 'Finding your words…', choosing: 'Which one?', speaking: 'Speaking' }[phase];

  return (
    <div className="v-shell">
      <div className="v-aurora" aria-hidden />
      <header className="v-top">
        <div className="v-brand"><span className="v-dot" />Voice</div>
        <div className="v-chip">{voice.label}{source && ` · ${source === 'claude' ? 'Claude' : 'offline'}`}</div>
        <button className="v-icon glass" onClick={() => setShowSettings(true)} aria-label="Settings">⚙︎</button>
      </header>

      <main className="v-main">
        <section className={`v-heard glass ${transcript ? '' : 'empty'}`} aria-live="polite">
          <div className="v-kicker">I heard</div>
          <div className="v-frags">
            {transcript
              ? transcript.split(/[….,]+\s*/).filter(Boolean).map((f, i) => <span key={i} className="v-frag" style={{ animationDelay: `${i * 60}ms` }}>{f.trim()}</span>)
              : <span className="v-hint">Say it any way it comes out.</span>}
          </div>
        </section>

        {phase === 'thinking' && (
          <div className="v-cards">{[0, 1, 2].map((i) => <div key={i} className="v-card glass skel" />)}</div>
        )}
        {cands.length > 0 && (
          <div className="v-cards">
            {cands.map((c, i) => (
              <button key={c.id} className={`v-card glass ${i === 0 ? 'best' : ''}`} onClick={() => choose(c)} disabled={phase === 'speaking'} style={{ animationDelay: `${i * 90}ms` }}>
                <span className="v-num">{i + 1}</span>
                <span className="v-text">{c.text}</span>
                <span className="v-because">{c.action && c.action.type !== 'none' ? (c.action.type === 'call' ? '📞 ' : '💬 ') : ''}{c.because}</span>
              </button>
            ))}
            <button className="v-retry" onClick={toggleTalk}>None of these — try again</button>
          </div>
        )}
        {spoken && phase !== 'choosing' && (
          <div className={`v-spoken glass ${phase === 'speaking' ? 'live' : ''}`}>
            <div className="v-wave" aria-hidden>{Array.from({ length: 5 }, (_, i) => <i key={i} />)}</div>
            “{spoken}”
          </div>
        )}

        {turns.length > 0 && (
          <section className="v-history">
            <div className="v-kicker">Today</div>
            {turns.slice().reverse().slice(0, 6).map((t) => (
              <div key={t.at} className={`v-bubble ${t.who}`}>{t.text}<time>{new Date(t.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time></div>
            ))}
          </section>
        )}
      </main>

      <footer className="v-dock">
        <form className="v-type glass" onSubmit={submitTyped}>
          <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="or type words…" aria-label="Type words" />
        </form>
        <button className={`v-talk ${phase}`} onClick={toggleTalk} disabled={phase === 'thinking' || phase === 'speaking'} aria-label={label}>
          <span className="v-ring" /><span className="v-ring r2" />
          <svg viewBox="0 0 24 24" width="44" height="44" fill="currentColor"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-2.08A7 7 0 0 0 19 12h-2Z"/></svg>
        </button>
        <div className="v-label">{label}</div>
      </footer>

      {showSettings && <Settings ctx={ctx} setCtx={setCtx} onClose={() => setShowSettings(false)} />}
    </div>
  );
}
