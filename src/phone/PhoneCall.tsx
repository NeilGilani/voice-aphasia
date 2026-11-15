/* Frank's side of a call: Ellie's words arrive simplified with pictures; he answers with Talk candidates in his own voice. */
import { useEffect, useRef, useState } from 'react';
import { Avatar, Composer, Lines, contact, useOS } from '../app/os';
import { simplify, type SimpleLine } from '../pages/simplify';
import { DeviceVoiceEngine } from '../voice';
import { DEMO_ROOM, joinCall, type CallLink } from './relay';
import './phone.css';

interface Line { who: 'person' | 'other'; text: string; simple?: SimpleLine[]; at: number }

/** Scripted Ellie, only used when no second device joins (clearly labelled on screen). */
const SIM_ELLIE = [
  'Hi Grandpa! Did you get my message? It’s my birthday today!',
  'Aww, thank you Grandpa. Are you coming to dinner on Sunday? Mom is making lasagna.',
  'I love you too. I’ll call you tomorrow after school, okay?',
];

const deviceVoice = new DeviceVoiceEngine();

export function PhoneCall({ params }: { params?: Record<string, string> }) {
  const os = useOS();
  const c = contact(params?.id ?? 'ellie')!;
  const room = params?.room ?? DEMO_ROOM;
  const [mode, setMode] = useState<'connecting' | 'live' | 'sim'>('connecting');
  const [relayUp, setRelayUp] = useState(false);
  const [log, setLog] = useState<Line[]>([]);
  const [secs, setSecs] = useState(0);
  const link = useRef<CallLink | null>(null);
  const simStep = useRef(0);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  async function hear(text: string) {
    const at = Date.now();
    setLog((l) => [...l, { who: 'other', text, at }]);
    try {
      const { lines } = await simplify({ text, people: os.ctx.people });
      setLog((l) => l.map((x) => (x.at === at ? { ...x, simple: lines } : x)));
    } catch { /* raw text stays visible */ }
  }

  useEffect(() => {
    const l = joinCall(room, 'frank', (e) => {
      if (e.kind === 'hello' || e.kind === 'line') setMode('live');
      if (e.kind === 'line' && e.text) hear(e.text);
      if (e.kind === 'bye') os.toast({ contact: c, title: c.name, body: 'Hung up' });
    }, setRelayUp);
    link.current = l;
    // No second device after a few seconds → offer simulation.
    const t = setTimeout(() => { if (modeRef.current === 'connecting') setMode('sim'); }, 5000);
    return () => { clearTimeout(t); l.send('bye').catch(() => {}); l.close(); };
  }, [room]); // eslint-disable-line

  useEffect(() => {
    if (mode === 'sim' && simStep.current === 0) { simStep.current = 1; setTimeout(() => hear(SIM_ELLIE[0]), 900); }
  }, [mode]); // eslint-disable-line

  useEffect(() => {
    const t = window.setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const clock = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  const recent = log.map((l) => ({ who: l.who, text: l.text }));

  return (
    <div className="call ph">
      <div className={`call-av ${mode === 'connecting' ? 'ringing' : 'live'}`} style={{ ['--h' as string]: c.hue }}><Avatar c={c} size={mode === 'connecting' ? 140 : 96} /></div>
      <h2>{c.name}</h2>
      <div className="st">
        {mode === 'connecting' ? 'Calling…' : <><span style={{ color: 'var(--os-green)' }}>●</span> {clock}</>}
      </div>
      <div className={`ph-mode ${mode}`}>
        {mode === 'live' && '🔗 Live: Ellie is on another device'}
        {mode === 'sim' && '🎭 Simulated Ellie: no second device joined. Open #/caller on a laptop for a live call.'}
        {mode === 'connecting' && (relayUp ? `Waiting for Ellie (room “${room}”)…` : 'Connecting…')}
      </div>

      <div className="ph-log">
        {log.map((l) => l.who === 'other' ? (
          <div key={l.at} className="ph-in os-glass">
            {l.simple?.length ? <Lines lines={l.simple} /> : <div className="ph-raw">{l.text}</div>}
            <div className="ph-in-foot">
              {l.simple?.length ? <details><summary>Her exact words</summary>{l.text}</details> : <span />}
              <button className="os-chip" onClick={() => deviceVoice.speak(l.text)}>🔊 Again</button>
            </div>
          </div>
        ) : <div key={l.at} className="bub out">{l.text}</div>)}
      </div>

      {mode !== 'connecting' && (
        <Composer compact recent={recent} quick={['Yes', 'No', 'I love you', 'Say again?', 'Happy birthday!']} onSpoken={(x) => {
          setLog((l) => [...l, { who: 'person', text: x.text, at: Date.now() }]);
          link.current?.send('line', x.text).catch(() => {});
          if (modeRef.current === 'sim' && simStep.current < SIM_ELLIE.length) {
            const next = SIM_ELLIE[simStep.current++];
            setTimeout(() => hear(next), 2200);
          }
        }} />
      )}

      <div className="row" style={{ marginTop: 18, gap: 14 }}>
        {mode === 'connecting' && <button className="os-btn" onClick={() => setMode('sim')}>🎭 Simulate Ellie</button>}
        <button className="os-btn red" onClick={() => { os.toast({ contact: c, title: `Call with ${c.name}`, body: `${clock} · ended` }); os.back(); }}><span className="big">⏹</span>Hang up</button>
      </div>
    </div>
  );
}
