/*
 * Ellie's side (open on a laptop or second phone at #/caller). She talks normally; her
 * speech is transcribed here and sent to Frank's phone, which shows it simplified. Frank's
 * replies arrive as text and play here in his cloned voice.
 */
import { useEffect, useRef, useState } from 'react';
import { startCapture, speechSupported, type Capture } from '../understand/speech';
import { createVoiceEngine } from '../voice';
import { DEMO_ROOM, joinCall, type CallLink } from './relay';
import '../app/os/tokens.css';
import './phone.css';

interface Line { who: 'me' | 'frank'; text: string; at: number }

export function Caller() {
  const room = new URLSearchParams(location.hash.split('?')[1] ?? '').get('room') ?? DEMO_ROOM;
  const [log, setLog] = useState<Line[]>([]);
  const [frankHere, setFrankHere] = useState(false);
  const [up, setUp] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [typed, setTyped] = useState('');
  const [voiceLabel, setVoiceLabel] = useState('…');
  const voice = useRef(createVoiceEngine());
  const link = useRef<CallLink | null>(null);
  const cap = useRef<Capture | null>(null);

  useEffect(() => {
    voice.current.ready().then(() => setVoiceLabel(voice.current.usingClone ? `Frank’s own voice (cloned)` : 'Device voice: Frank’s voice not set up'));
    const l = joinCall(room, 'ellie', async (e) => {
      if (e.kind === 'hello') { setFrankHere(true); l.send('hello').catch(() => {}); }
      if (e.kind === 'bye') setFrankHere(false);
      if (e.kind === 'line' && e.text) {
        setFrankHere(true);
        setLog((x) => [...x, { who: 'frank', text: e.text, at: Date.now() }]);
        await voice.current.speak(e.text);
      }
    }, setUp);
    link.current = l;
    return () => { l.send('bye').catch(() => {}); l.close(); };
  }, [room]);

  function say(text: string) {
    if (!text.trim()) return;
    setLog((x) => [...x, { who: 'me', text, at: Date.now() }]);
    link.current?.send('line', text).catch(() => {});
  }

  async function mic() {
    if (listening) {
      const u = await cap.current?.stop();
      setListening(false); setInterim('');
      if (u) say(u.transcript.replace(/…/g, ','));
      return;
    }
    cap.current = startCapture(setInterim, { pauseMs: 2000 });
    setListening(true);
  }

  return (
    <div className="caller">
      <div className="caller-card os-glass">
        <h2>📞 Call with Grandpa Frank</h2>
        <div className="ph-mode live">
          {!up ? 'Connecting to relay…' : frankHere ? '🔗 Connected to Frank’s phone' : `Waiting for Frank (room “${room}”). Open Phone → Ellie on his device.`}
        </div>
        <div className="caller-voice">🔈 His replies play in: <b>{voiceLabel}</b></div>
        <div className="ph-log">
          {log.map((l) => <div key={l.at} className={`bub ${l.who === 'me' ? 'out' : 'in'}`}>{l.text}</div>)}
          {interim && <div className="bub out ph-interim">{interim}…</div>}
        </div>
        {speechSupported() ? (
          <button className={`os-btn block ${listening ? 'red' : 'primary'}`} onClick={mic}>{listening ? '■ Done, send it' : '🎙 Tap and talk to Frank'}</button>
        ) : <p className="ph-mode">This browser has no speech recognition; type instead.</p>}
        <form className="caller-type" onSubmit={(e) => { e.preventDefault(); say(typed); setTyped(''); }}>
          <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="…or type what you say" />
          <button className="os-btn">Send</button>
        </form>
        <p className="caller-note">Honest note: this is a text relay over the local network, not a phone line. Your words are transcribed here; Frank sees them simplified with pictures. His answers come back as text and are spoken here in his cloned voice.</p>
      </div>
    </div>
  );
}
