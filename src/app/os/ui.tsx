/* Shared VoiceOS components. Import from 'src/app/os' so every screen looks native. */
import type { CSSProperties, ReactNode } from 'react';
import type { Contact } from './persona';
import './tokens.css';

export const hueGrad = (hue: number) =>
  `radial-gradient(circle at 30% 20%, hsl(${hue} 95% 78%), hsl(${hue} 80% 55%) 55%, hsl(${(hue + 30) % 360} 75% 38%))`;

/** Illustrated portrait (DiceBear, CC0); the gradient shows through if offline. */
export const portrait = (name: string, hue: number) =>
  `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(name)}&backgroundType=solid&backgroundColor=${hslHex(hue)}`;
function hslHex(h: number) {
  const f = (n: number) => { const k = (n + h / 30) % 12; const a = 0.6 * Math.min(0.75, 1 - 0.75); return Math.round(255 * (0.75 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, '0'); };
  return `${f(0)}${f(8)}${f(4)}`;
}

export function Avatar({ c, size = 64, ring }: { c: Pick<Contact, 'name' | 'hue' | 'emoji' | 'photo'>; size?: number; ring?: boolean }) {
  const style: CSSProperties = {
    width: size, height: size, fontSize: size * 0.42,
    backgroundImage: `url(${c.photo ?? portrait(c.name, c.hue)}), ${hueGrad(c.hue)}`,
    outline: ring ? '3px solid rgba(62,230,160,.9)' : undefined, outlineOffset: 3,
  };
  return (
    <span className="os-avatar" style={style} aria-label={c.name}>
      <span className="em">{c.emoji}</span>
    </span>
  );
}

export function AppIcon({ emoji, hue, size = 68 }: { emoji: string; hue: number; size?: number }) {
  return <span className="ico" style={{ width: size, height: size, background: hueGrad(hue), fontSize: size * 0.5 }}>{emoji}</span>;
}

export function ScreenHead({ emoji, hue, title, sub, right }: { emoji: string; hue: number; title: string; sub?: ReactNode; right?: ReactNode }) {
  return (
    <header className="os-head">
      <AppIcon emoji={emoji} hue={hue} size={56} />
      <div style={{ flex: 1 }}><h1>{title}</h1>{sub && <p>{sub}</p>}</div>
      {right}
    </header>
  );
}

export function Lines({ lines }: { lines: { text: string; icon: string }[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {lines.map((l, i) => (
        <div key={i} className="os-line os-glass" style={{ animationDelay: `${i * 70}ms`, borderRadius: 22 }}>
          <span className="em">{l.icon}</span>{l.text}
        </div>
      ))}
    </div>
  );
}

export const Kicker = ({ children }: { children: ReactNode }) => <div className="os-kicker">{children}</div>;

export const fmtTime = (t: number) => new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
export const ago = (t: number) => {
  const m = Math.round((Date.now() - t) / 60000);
  return m < 1 ? 'now' : m < 60 ? `${m} min` : m < 1440 ? `${Math.round(m / 60)} hr` : `${Math.round(m / 1440)} d`;
};
