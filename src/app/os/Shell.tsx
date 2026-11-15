import { useEffect, useState } from 'react';
import { APPS } from './registry';
import { useOS } from './os';
import { Avatar } from './ui';

function StatusBar() {
  const os = useOS();
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 15000); return () => clearInterval(t); }, []);
  const online = os.contacts.filter((c) => c.online);
  return (
    <div className="os-status">
      <span>{now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
      <span className="os-spacer" />
      <span className="os-online" title={`${online.map((c) => c.name).join(', ')} online`}>
        {online.map((c) => <Avatar key={c.id} c={c} size={26} />)}<span className="dot" />
      </span>
      <span className="os-pill">🗣 {os.voice.label.replace(/\s*\(.*\)/, '')}</span>
    </div>
  );
}

function Toasts() {
  const os = useOS();
  return (
    <div className="os-toasts">
      {os.toasts.map((t) => (
        <div key={t.id} className="os-toast os-glass" onClick={() => { t.onTap?.(); os.dismiss(t.id); }}>
          {t.contact ? <Avatar c={t.contact} size={44} /> : <span style={{ fontSize: 32 }}>{t.emoji}</span>}
          <div style={{ minWidth: 0 }}><b>{t.title}</b><span>{t.body}</span></div>
        </div>
      ))}
    </div>
  );
}

function Dock() {
  const os = useOS();
  const inTalk = os.route.app === 'talk';
  return (
    <nav className="os-dock os-glass">
      <button className="os-dock-btn" onClick={os.back} disabled={os.depth <= 1} aria-label="Back">←<small>Back</small></button>
      <button className={`os-talk-fab ${inTalk ? 'hot' : ''}`} onClick={() => !inTalk && os.open('talk')} aria-label="Talk">
        <svg viewBox="0 0 24 24" width="42" height="42" fill="currentColor"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-2.08A7 7 0 0 0 19 12h-2Z" /></svg>
      </button>
      <button className="os-dock-btn" onClick={os.home} aria-label="Home">⌂<small>Home</small></button>
    </nav>
  );
}

export function Shell() {
  const os = useOS();
  const app = APPS.get(os.route.app) ?? APPS.get('home')!;
  const Screen = app.component;
  const key = `${os.depth}-${os.route.app}-${JSON.stringify(os.route.params ?? {})}`;
  return (
    <div className="os-root">
      <div className="os-device">
        <div className="os-wall" aria-hidden />
        <StatusBar />
        <Toasts />
        <main className="os-stage">
          <div key={key} className={`os-screen ${os.dir === 'back' ? 'back' : os.dir === 'home' ? 'home' : ''}`}>
            <Screen params={os.route.params} />
          </div>
        </main>
        <Dock />
      </div>
    </div>
  );
}
