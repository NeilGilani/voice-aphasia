import { useEffect, useRef, useState } from 'react';
import { simplify, type SimpleLine } from './simplify';
import './pages.css';

/* Minimal typing for the Web Speech API (not in lib.dom for all TS targets). */
type SR = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: (e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void;
  onend: () => void; start: () => void; stop: () => void;
};
const SpeechRec: (new () => SR) | undefined =
  (globalThis as any).SpeechRecognition ?? (globalThis as any).webkitSpeechRecognition;

const EXAMPLE =
  "Hi Dad, so um, Ellie's coming over tomorrow after school, and we're going to have cake for her birthday, and then I'll drive you to the doctor on Monday at ten.";

export default function Family() {
  const [said, setSaid] = useState('');
  const [interim, setInterim] = useState('');
  const [lines, setLines] = useState<SimpleLine[]>([]);
  const [source, setSource] = useState<'server' | 'local' | null>(null);
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const rec = useRef<SR | null>(null);

  async function run(text: string) {
    if (!text.trim()) return;
    setBusy(true);
    const r = await simplify({ text });
    setLines(r.lines);
    setSource(r.source);
    setBusy(false);
  }

  function toggleMic() {
    if (!SpeechRec) return;
    if (listening) { rec.current?.stop(); return; }
    const r = new SpeechRec();
    r.lang = 'en-US'; r.continuous = true; r.interimResults = true;
    let finalText = '';
    r.onresult = (e) => {
      let tmp = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalText += res[0].transcript + ' ';
        else tmp += res[0].transcript;
      }
      setSaid(finalText.trim());
      setInterim(tmp);
    };
    r.onend = () => { setListening(false); setInterim(''); run(finalText); };
    rec.current = r;
    setSaid(''); setLines([]);
    r.start();
    setListening(true);
  }

  useEffect(() => () => rec.current?.stop(), []);

  return (
    <div className="pg pg-family">
      <div className="pg-aurora" aria-hidden />
      <header className="fam-head glass">
        <a href="#/" className="pg-brand">Voice</a>
        <span className="fam-tag">Family mode</span>
      </header>

      <main className="fam-main">
        <section className="glass fam-input">
          <p className="fam-hint">Talk normally. We'll make it simple for him.</p>
          <div className="fam-row">
            <button
              className={`fam-mic ${listening ? 'on' : ''}`}
              onClick={toggleMic}
              disabled={!SpeechRec}
              aria-pressed={listening}
              title={SpeechRec ? '' : 'Speech recognition not supported in this browser — type instead'}
            >
              {listening ? '■ Stop' : '🎙 Speak'}
            </button>
            <button className="pg-btn ghost" onClick={() => { setSaid(EXAMPLE); run(EXAMPLE); }}>Try example</button>
          </div>
          <textarea
            className="fam-text"
            rows={3}
            placeholder="…or type what you want to say"
            value={said + (interim ? ' ' + interim : '')}
            onChange={(e) => setSaid(e.target.value)}
          />
          <button className="pg-btn" disabled={busy || !said.trim()} onClick={() => run(said)}>
            {busy ? 'Simplifying…' : 'Make it simple'}
          </button>
        </section>

        <section className="fam-out" aria-live="polite">
          {lines.map((l, i) => (
            <div key={i} className="glass fam-card" style={{ animationDelay: `${i * 90}ms` }}>
              <span className="fam-icon" aria-hidden>{l.icon}</span>
              <span className="fam-line">{l.text}</span>
            </div>
          ))}
          {source === 'local' && <p className="fam-src">Offline simplifier (server not reachable)</p>}
        </section>
      </main>
    </div>
  );
}
