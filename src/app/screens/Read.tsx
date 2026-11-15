import { lazy, Suspense, useState } from 'react';
import { useOS } from '../os/os';
import { Lines, ScreenHead, Kicker } from '../os/ui';

const VisionCamera = lazy(() => import('../../vision').then((m) => ({ default: m.VisionCamera })));

interface ReadResult { title: string; lines: { text: string; icon: string }[]; suggestion?: string }

const DEMO_BILL: ReadResult = {
  title: 'Electric bill',
  lines: [
    { text: 'Electric bill from PG&E', icon: '⚡' },
    { text: 'You owe $84.20', icon: '💵' },
    { text: 'Pay by Friday, Nov 20', icon: '📅' },
    { text: 'Same as last month', icon: '✅' },
  ],
  suggestion: 'Ask Ellie to help you pay it',
};

async function readImage(image: string): Promise<ReadResult> {
  try {
    const r = await fetch('/api/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image }), signal: AbortSignal.timeout(40000) });
    if (r.ok) { const j = await r.json(); if (j.lines?.length) return j; }
  } catch { /* fall back */ }
  return DEMO_BILL;
}

function grabFrame(): string | null {
  const v = document.querySelector<HTMLVideoElement>('.read-cam video');
  if (!v || !v.videoWidth) return null;
  const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight;
  c.getContext('2d')!.drawImage(v, 0, 0);
  return c.toDataURL('image/jpeg', 0.8);
}

export default function Read() {
  const os = useOS();
  const [cam, setCam] = useState(false);
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<ReadResult>();
  const [source, setSource] = useState<'camera' | 'sample'>();

  async function scan(sample: boolean) {
    setBusy(true); setRes(undefined); setSource(sample ? 'sample' : 'camera');
    const img = sample ? null : grabFrame();
    const r = img ? await readImage(img) : await new Promise<ReadResult>((ok) => setTimeout(() => ok(DEMO_BILL), 1400));
    setRes(r); setBusy(false);
  }

  return (
    <>
      <ScreenHead emoji="📷" hue={175} title="Read" sub="Hold up a letter, bill or sign." />
      {!res && (
        <div className="read-cam os-glass">
          {cam ? <Suspense fallback={null}><VisionCamera facingMode="environment" /></Suspense>
            : <div className="read-empty"><div><div style={{ fontSize: 64 }}>📄</div>Turn on the camera, or try the sample bill.</div></div>}
          <div className="read-frame" />
          {busy && <div className="read-scan" />}
        </div>
      )}
      {res && (
        <>
          {source === 'sample' && (
            <div className="paper" style={{ marginBottom: 18 }}>
              <h4>PG&amp;E · Energy Statement</h4>
              Account 4402-xxxx-19 · Service: 1418 Alder St<br />Statement date 11/02/2026 · Billing period 10/01–10/31<br />
              Total electric charges this period … <span className="amt">$84.20</span><br />Amount due by <b>11/20/2026</b>. Late payment charge may apply…
            </div>
          )}
          <Kicker>What it says</Kicker>
          <Lines lines={res.lines} />
          <div className="stack" style={{ marginTop: 16 }}>
            <button className="os-btn primary block" onClick={() => os.voice.speak(res.lines.map((l) => l.text).join('. '))}><span className="big">🔊</span>Read it to me</button>
            {res.suggestion && <button className="os-btn green block" onClick={() => os.open('call', { id: 'ellie' })}><span className="big">📞</span>{res.suggestion}</button>}
            <button className="os-btn block" onClick={() => setRes(undefined)}>↻ Read something else</button>
          </div>
        </>
      )}
      {!res && (
        <div className="stack" style={{ marginTop: 16 }}>
          {cam ? <button className="os-btn primary block" disabled={busy} onClick={() => scan(false)}><span className="big">◉</span>{busy ? 'Reading…' : 'Read this'}</button>
            : <button className="os-btn primary block" onClick={() => setCam(true)}><span className="big">📷</span>Camera on</button>}
          <button className="os-btn block" disabled={busy} onClick={() => scan(true)}>{busy ? 'Reading…' : '📄 Try sample bill'}</button>
        </div>
      )}
    </>
  );
}
