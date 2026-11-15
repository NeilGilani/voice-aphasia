/*
 * Drop-in card for the patient app: show after a sentence is chosen.
 * <PracticeCard sentence="Call Ellie…" ctx={ctx} onClose={…} />
 */
import { useMemo, useState } from 'react';
import type { PersonContext } from '../../contracts';
import { SpeechRec, listenOnce, speak } from '../shared';
import { firstSound, heardMatches, pickPracticeWord, syllables, usePractice, type Cue } from './practiceData';
import '../os.css';

const NEXT: Record<Cue, Cue | null> = { none: 'first-sound', 'first-sound': 'model', model: null };

export default function PracticeCard({ sentence, word: forced, ctx, onClose }: { sentence?: string; word?: string; ctx?: PersonContext; onClose?: () => void }) {
  const word = useMemo(() => forced ?? (sentence ? pickPracticeWord(sentence, ctx) : null), [forced, sentence, ctx]);
  const [, setP] = usePractice();
  const [cue, setCue] = useState<Cue>('none');
  const [state, setState] = useState<'ask' | 'listen' | 'ok' | 'again' | 'done'>('ask');
  const [heard, setHeard] = useState('');
  if (!word) return null;

  const tryIt = async () => {
    if (cue === 'model') speak(word);
    setState('listen');
    const h = SpeechRec ? await listenOnce(4000) : '';
    setHeard(h);
    const ok = heardMatches(word, h);
    setP((p) => ({ attempts: [...p.attempts, { word, heard: h, ok, cue, at: Date.now(), from: sentence }] }));
    if (ok) { setState('ok'); return; }
    const n = NEXT[cue];
    if (n) { setCue(n); setState('again'); if (n === 'first-sound') speak(firstSound(word)); }
    else setState('done');
  };

  return (
    <section className="glass os-sec os-anim" aria-live="polite">
      <p className="os-kicker" style={{ marginTop: 0 }}>Want to practise one word?</p>
      <div className="pr-word">{word.charAt(0).toUpperCase() + word.slice(1)}</div>
      <div className="pr-syl">{syllables(word).join(' · ')}</div>
      {cue === 'first-sound' && <p className="pr-fb" style={{ color: '#9fe7ff' }}>It starts with “{firstSound(word)}…”</p>}
      {cue === 'model' && <p className="pr-fb" style={{ color: '#9fe7ff' }}>Listen, then say it with me.</p>}
      <p className="pr-fb">
        {state === 'listen' && '👂 Listening…'}
        {state === 'ok' && '⭐ Beautiful. You said it!'}
        {state === 'again' && 'Close! Try again.'}
        {state === 'done' && 'Good effort. We will try again later. 💜'}
      </p>
      {heard && state !== 'listen' && <p className="os-muted" style={{ textAlign: 'center' }}>Heard: “{heard}”</p>}
      {!SpeechRec && <p className="os-muted" style={{ textAlign: 'center' }}>Microphone practice needs Chrome or Safari.</p>}
      <div className="os-row" style={{ justifyContent: 'center', marginTop: 10 }}>
        {(state === 'ask' || state === 'again') && <button className="os-btn" onClick={tryIt} disabled={!SpeechRec}>🎙 Say it</button>}
        <button className="os-btn ghost" onClick={() => speak(word)}>🔊 Hear it</button>
        <button className="os-btn ghost" onClick={onClose}>{state === 'ok' || state === 'done' ? 'Done' : 'Not now'}</button>
      </div>
    </section>
  );
}
