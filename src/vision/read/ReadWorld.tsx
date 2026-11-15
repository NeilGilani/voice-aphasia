import { useEffect, useRef, useState } from 'react';
import type { PersonContext } from '../../contracts';
import { readImage, toDataUrl } from './api';
import type { ReadResult } from './types';
import { SAMPLES } from './samples';
import './read.css';

export interface ReadWorldProps {
  context?: PersonContext;
  /** Speak text aloud (pass the app's VoiceEngine.speak); defaults to speechSynthesis. */
  speak?: (text: string) => void | Promise<void>;
}

const ACT_ICON = { call: '📞', remind: '⏰', help: '🤝', pay: '💳', none: '👍' } as const;

function defaultSpeak(text: string) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}

function icsUrl(title: string, when: string) {
  const d = new Date(when);
  const fmt = (x: Date) => x.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nUID:${Date.now()}@voice\nDTSTAMP:${fmt(new Date())}\nDTSTART:${fmt(d)}\nDTEND:${fmt(new Date(d.getTime() + 30 * 60e3))}\nSUMMARY:${title}\nBEGIN:VALARM\nTRIGGER:-PT30M\nACTION:DISPLAY\nDESCRIPTION:${title}\nEND:VALARM\nEND:VEVENT\nEND:VCALENDAR`;
  return URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
}

/** "Read the world": point the camera at mail, a bill, a menu or a pill bottle → what matters, as pictures. */
export function ReadWorld({ context, speak = defaultSpeak }: ReadWorldProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [cam, setCam] = useState<'starting' | 'on' | 'off'>('starting');
  const [still, setStill] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ReadResult>();
  const [error, setError] = useState<string>();
  const [toast, setToast] = useState<string>();

  useEffect(() => {
    let stream: MediaStream | undefined, cancelled = false;
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1440 } }, audio: false })
      .then(async (s) => {
        stream = s;
        if (cancelled || !videoRef.current) return s.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = s;
        await videoRef.current.play();
        setCam('on');
      })
      .catch(() => !cancelled && setCam('off'));
    return () => { cancelled = true; stream?.getTracks().forEach((t) => t.stop()); };
  }, []);

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(undefined), 3500); return () => clearTimeout(t); }, [toast]);

  async function run(image: string) {
    setStill(image); setBusy(true); setResult(undefined); setError(undefined);
    try {
      const r = await readImage(image, context);
      setResult(r);
      speak([r.title, r.headline].filter(Boolean).join('. '));
    } catch {
      setError("I couldn't read that. Try again, a little closer.");
    } finally { setBusy(false); }
  }

  const capture = async () => videoRef.current && cam === 'on' && run(await toDataUrl(videoRef.current));
  const upload = async (f?: File) => f && run(await toDataUrl(f));
  const sample = async (url: string) => run(await toDataUrl(await (await fetch(url)).blob()));
  const reset = () => { setStill(undefined); setResult(undefined); setError(undefined); };

  function phoneFor(to?: string) {
    if (!to) return undefined;
    const p = context?.people.find((x) => x.name.toLowerCase() === to.toLowerCase());
    return p?.phone ?? (/\d{3}/.test(to) ? to.replace(/[^\d+]/g, '') : undefined);
  }

  function act(a: ReadResult['actions'][number]) {
    if (!result) return;
    if (a.type === 'call') {
      const n = phoneFor(a.to);
      if (n) location.href = `tel:${n}`; else setToast(`No number for ${a.to ?? 'them'}`);
    } else if (a.type === 'help' || a.type === 'pay') {
      const helper = context?.people.find((p) => p.phone && (!a.to || p.name.toLowerCase() === a.to.toLowerCase())) ?? context?.people.find((p) => p.phone);
      const body = `Can you help me with this? ${result.title}: ${result.headline}`;
      if (helper?.phone) location.href = `sms:${helper.phone}?body=${encodeURIComponent(body)}`;
      else setToast('Add a helper in Settings');
    } else if (a.type === 'remind') {
      const when = a.when ?? new Date(Date.now() + 864e5).toISOString();
      const link = document.createElement('a');
      link.href = icsUrl(`${result.title}: ${result.headline}`, when);
      link.download = 'reminder.ics';
      link.click();
      setToast(`⏰ Reminder: ${new Date(when).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`);
    } else setToast('👍');
  }

  return (
    <div className="rw">
      <div className="glass rw-cam">
        <video ref={videoRef} playsInline muted style={{ display: still || cam !== 'on' ? 'none' : 'block' }} />
        {still && <img src={still} alt="What you showed me" />}
        {!still && <div className="rw-frame" />}
        {busy && <div className="rw-scan" />}
        {!still && cam !== 'on' && <div className="rw-msg">{cam === 'starting' ? 'Starting camera…' : '📷 No camera. Add a photo below.'}</div>}
      </div>

      <div className="rw-row">
        <button className="glass rw-btn" onClick={() => fileRef.current?.click()} aria-label="Add a photo">🖼️ Photo</button>
        {still && !busy
          ? <button className="rw-shoot" onClick={reset} aria-label="Read something else">↺</button>
          : <button className="rw-shoot" onClick={capture} disabled={busy || cam !== 'on'} aria-label="Read this">{busy ? '…' : '👁️'}</button>}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
      </div>

      {!still && (
        <div className="rw-samples" aria-label="Try a sample">
          {SAMPLES.map((s) => <button key={s.name} onClick={() => sample(s.url)} title={s.name}><img src={s.url} alt={s.name} /></button>)}
        </div>
      )}

      {busy && <div className="glass v-card skel" />}
      {error && <div className="glass rw-result"><div className="rw-summary">{error}</div></div>}

      {result && (
        <div className="glass rw-result">
          <div className="rw-head">
            <div className="rw-icon">{result.icon}</div>
            <div><div className="rw-title">{result.title}</div><div className="rw-headline">{result.headline}</div></div>
            <button className="v-icon glass" style={{ marginLeft: 'auto', flex: 'none' }} onClick={() => speak(`${result.headline}. ${result.summary}`)} aria-label="Say it">🔊</button>
          </div>
          {result.warning && <div className="rw-warn">⚠️ {result.warning}</div>}
          <div className="rw-summary">{result.summary}</div>
          {result.facts.length > 0 && (
            <div className="rw-facts">
              {result.facts.map((f, i) => <div key={i} className="rw-fact"><i>{f.icon}</i><b>{f.value}</b><span>{f.label}</span></div>)}
            </div>
          )}
          <div className="rw-actions">
            {result.actions.map((a, i) => <button key={i} className="glass rw-act" onClick={() => act(a)}><span>{ACT_ICON[a.type]}</span>{a.label}</button>)}
          </div>
          {result.ms != null && <div className="rw-meta">read in {(result.ms / 1000).toFixed(1)} s</div>}
        </div>
      )}
      {toast && <div className="glass rw-toast">{toast}</div>}
    </div>
  );
}
