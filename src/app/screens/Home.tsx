import { useOS } from '../os/os';
import { launcher } from '../os/registry';
import { PLAN, ME } from '../os/persona';
import { AppIcon, Avatar, Kicker } from '../os/ui';
import './screens.css';

const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };

export default function Home() {
  const os = useOS();
  const nowHM = new Date().toTimeString().slice(0, 5);
  const next = PLAN.find((p) => p.time >= nowHM) ?? PLAN[PLAN.length - 1];
  const unread = (id: string) => os.messages.filter((m) => m.from === id && !m.read).length;
  return (
    <div className="home">
      <section className="home-hero">
        <div className="home-date">{new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        <h1>{greet()}, {ME.name}</h1>
        <div className="home-next os-glass" onClick={() => os.open('day')}>
          <span className="em">{next.emoji}</span>
          <div><small>Next · {next.time}</small><b>{next.what}</b></div>
          <span className="home-cake">🎂 Ellie’s birthday</span>
        </div>
      </section>

      <button className="home-talk os-glass" onClick={() => os.open('talk')}>
        <span className="home-talk-orb"><svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-2.08A7 7 0 0 0 19 12h-2Z" /></svg></span>
        <span><b>Talk</b><small>Say a few words. I’ll find the rest.</small></span>
      </button>

      <Kicker>My people</Kicker>
      <div className="home-people">
        {os.contacts.filter((c) => c.favorite).map((c, i) => (
          <button key={c.id} className="person os-glass os-tile" style={{ animationDelay: `${i * 50}ms`, background: `linear-gradient(160deg,hsla(${c.hue},90%,60%,.35),rgba(255,255,255,.04))` }} onClick={() => os.open('person', { id: c.id })}>
            <Avatar c={c} size={84} ring={c.online} />
            <b>{c.name}</b><small>{c.relation}</small>
            {unread(c.id) > 0 && <span className="os-badge">{unread(c.id)}</span>}
          </button>
        ))}
      </div>

      <Kicker>Today</Kicker>
      <div className="home-plan">
        {PLAN.map((p) => (
          <div key={p.time} className={`plan-chip os-glass ${p.done ? 'done' : ''} ${p === next ? 'now' : ''}`}>
            <span className="em">{p.emoji}</span><b>{p.time.replace(/^0/, '')}</b><small>{p.what}</small>
          </div>
        ))}
      </div>

      <Kicker>Apps</Kicker>
      <div className="os-grid g4 home-apps">
        {launcher().filter((a) => a.id !== 'home').map((a, i) => {
          const n = a.badge?.() ?? 0;
          return (
            <button key={a.id} className="os-app" style={{ animationDelay: `${i * 30}ms` }} onClick={() => os.open(a.id)}>
              <span style={{ position: 'relative' }}><AppIcon emoji={a.emoji} hue={a.hue} />{n > 0 && <span className="os-badge">{n}</span>}</span>
              <span>{a.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
