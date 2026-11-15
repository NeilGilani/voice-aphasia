/* Fragments → 3 sentences → spoken in their voice. Reused by Talk, Phone and Messages. */
import { useEffect, useRef, useState } from 'react';
import type { Candidate, Utterance } from '../../contracts';
import { currentlySeen, listen, understand, type Listener } from '../adapters';
import { useOS } from './os';
import './composer.css';

type Phase = 'idle' | 'listening' | 'thinking' | 'choosing' | 'speaking';

export interface ComposerProps {
  /** Conversation so far, oldest first (for continuity). */
  recent?: { who: 'person' | 'other'; text: string }[];
  /** Called after the chosen sentence has been spoken. */
  onSpoken?: (c: Candidate) => void;
  /** Speak aloud (false = e.g. a text reply that only needs sending). */
  speak?: boolean;
  /** Quick one-tap phrases. */
  quick?: string[];
  autoListen?: boolean;
  compact?: boolean;
}

export function Composer({ recent = [], onSpoken, speak = true, quick = [], autoListen, compact }: ComposerProps) {
  const os = useOS();
  const [phase, setPhase] = useState<Phase>('idle');
  const [heard, setHeard] = useState('');
  const [typed, setTyped] = useState('');
  const [cands, setCands] = useState<Candidate[]>([]);
  const [source, setSource] = useState<'claude' | 'mock'>();
  const [spoken, setSpoken] = useState<string>();
  const rec = useRef<Listener | null>(null);
  const text = useRef('');

  async function think(t: string) {
    if (!t.trim()) return setPhase('idle');
    setPhase('thinking'); setCands([]);
    const startedAt = Date.now() - 8000;
    const utterance: Utterance = { id: crypto.randomUUID(), transcript: t, seen: await currentlySeen(), startedAt };
    const res = await understand({ utterance, context: os.ctx, now: new Date().toISOString(), recent: recent.slice(-8) });
    setSource(res.source); setCands(res.candidates);
    (os.voice as { prepare?: (t: string[]) => void }).prepare?.(res.candidates.map((c) => c.text)); setPhase('choosing');
  }

  function mic() {
    if (phase === 'listening') return rec.current?.stop();
    setHeard(''); text.current = ''; setSpoken(undefined); setCands([]);
    const l = listen((t) => { text.current = t; setHeard(t); }, () => { rec.current = null; think(text.current); });
    if (!l) { os.toast({ emoji: '⌨️', title: 'No microphone here', body: 'Type the words instead.' }); return; }
    rec.current = l; setPhase('listening');
  }

  useEffect(() => { if (autoListen) mic(); return () => rec.current?.stop(); }, []); // eslint-disable-line

  async function choose(c: Candidate) {
    setPhase('speaking'); setCands([]); setSpoken(c.text);
    os.setCtx((p) => ({ ...p, history: [...p.history.filter((h) => h.text !== c.text), { text: c.text, at: Date.now() }].slice(-50) }));
    if (speak) await os.voice.speak(c.text);
    setPhase('idle');
    onSpoken?.(c);
  }

  const label = { idle: 'Tap and talk', listening: 'Listening… tap when done', thinking: 'Finding your words…', choosing: 'Which one?', speaking: 'Speaking…' }[phase];

  return (
    <div className={`cp ${compact ? 'compact' : ''}`}>
      <div className={`cp-heard os-glass ${heard ? '' : 'empty'}`} aria-live="polite">
        {heard
          ? heard.split(/[….,]+\s*/).filter(Boolean).map((f, i) => <span key={i} className="cp-frag" style={{ animationDelay: `${i * 60}ms` }}>{f.trim()}</span>)
          : <span className="cp-hint">{phase === 'listening' ? 'I’m listening…' : 'Say it any way it comes out'}</span>}
        {phase === 'listening' && <span className="cp-eq">{Array.from({ length: 4 }, (_, i) => <i key={i} />)}</span>}
      </div>

      {phase === 'thinking' && <div className="cp-cards">{[0, 1, 2].map((i) => <div key={i} className="cp-card os-glass skel" />)}</div>}
      {cands.length > 0 && (
        <div className="cp-cards">
          {cands.map((c, i) => (
            <button key={c.id} className={`cp-card os-glass ${i === 0 ? 'best' : ''}`} onClick={() => choose(c)} style={{ animationDelay: `${i * 90}ms` }}>
              <span className="cp-num">{i + 1}</span>
              <span className="cp-text">{c.text}</span>
              <span className="cp-because">{c.action?.type === 'call' ? '📞 ' : c.action?.type === 'text' ? '💬 ' : '💡 '}{c.because}</span>
            </button>
          ))}
          <div className="cp-meta">
            <button className="os-chip" onClick={mic}>↻ None of these</button>
            <span className="os-pill">{source === 'claude' ? '✨ Claude' : '⚡ Offline guess'}</span>
          </div>
        </div>
      )}
      {spoken && (
        <div className={`cp-spoken os-glass ${phase === 'speaking' ? 'live' : ''}`}>
          <span className="cp-wave">{Array.from({ length: 5 }, (_, i) => <i key={i} />)}</span>
          <span>“{spoken}”</span>
        </div>
      )}

      {quick.length > 0 && phase === 'idle' && !spoken && (
        <div className="cp-quick">{quick.map((q) => <button key={q} className="os-chip" onClick={() => choose({ id: q, text: q, confidence: 1, because: '' })}>{q}</button>)}</div>
      )}

      <div className="cp-controls">
        <form className="cp-type os-glass" onSubmit={(e) => { e.preventDefault(); setHeard(typed); setSpoken(undefined); think(typed); setTyped(''); }}>
          <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="or type words…" aria-label="Type words" />
          {typed && <button className="cp-go" aria-label="Go">➜</button>}
        </form>
        <button className={`cp-mic ${phase}`} onClick={mic} disabled={phase === 'thinking' || phase === 'speaking'} aria-label={label}>
          <svg viewBox="0 0 24 24" width="40" height="40" fill="currentColor"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-2.08A7 7 0 0 0 19 12h-2Z" /></svg>
        </button>
      </div>
      <div className="cp-label">{label}</div>
    </div>
  );
}
