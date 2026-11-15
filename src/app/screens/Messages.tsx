import { useEffect, useState } from 'react';
import { Composer } from '../os/Composer';
import { useOS } from '../os/os';
import { contact } from '../os/persona';
import { Avatar, ScreenHead, ago, fmtTime } from '../os/ui';
import { simplify, type SimpleLine } from '../../pages/simplify';

export function Messages() {
  const os = useOS();
  const threads = os.contacts.map((c) => ({ c, last: os.messages.filter((m) => m.from === c.id || m.to === c.id).at(-1), unread: os.messages.filter((m) => m.from === c.id && !m.read).length }))
    .filter((t) => t.last).sort((a, b) => b.last!.at - a.last!.at);
  return (
    <>
      <ScreenHead emoji="💬" hue={200} title="Messages" sub="I’ll make them short and clear." />
      <div className="stack">
        {threads.map(({ c, last, unread }, i) => (
          <button key={c.id} className="list-item os-glass os-tile" style={{ animationDelay: `${i * 50}ms` }} onClick={() => os.open('thread', { id: c.id })}>
            <Avatar c={c} size={64} ring={c.online} />
            <span className="grow"><b>{c.name}</b><small>{last!.from === 'me' ? 'You: ' : ''}{last!.text}</small></span>
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <small style={{ color: 'var(--os-ink-3)' }}>{ago(last!.at)}</small>
              {unread > 0 && <span className="os-badge" style={{ position: 'static' }}>{unread}</span>}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

function Simple({ text }: { text: string }) {
  const [lines, setLines] = useState<SimpleLine[]>();
  useEffect(() => { simplify({ text }).then((r) => setLines(r.lines)); }, [text]);
  if (!lines) return null;
  return <div className="simple">{lines.map((l, i) => <div key={i}><span>{l.icon}</span>{l.text}</div>)}</div>;
}

export function Thread({ params }: { params?: Record<string, string> }) {
  const os = useOS();
  const c = contact(params?.id ?? 'ellie')!;
  const msgs = os.messages.filter((m) => m.from === c.id || m.to === c.id);
  const [showOrig, setShowOrig] = useState(false);
  useEffect(() => { os.markRead(c.id); }, []); // eslint-disable-line
  return (
    <>
      <header className="os-head">
        <Avatar c={c} size={56} ring={c.online} />
        <div style={{ flex: 1 }}><h1>{c.name}</h1><p style={{ textTransform: 'capitalize' }}>{c.relation}</p></div>
        <button className="os-chip" onClick={() => setShowOrig((v) => !v)}>{showOrig ? '✨ Simple' : '📝 Full'}</button>
        {c.phone && <button className="os-chip" onClick={() => os.open('call', { id: c.id })}>📞</button>}
      </header>
      <div className="thread" style={{ marginBottom: 18 }}>
        {msgs.map((m) => (
          <div key={m.id} className={`bub ${m.from === 'me' ? 'out' : 'in'}`}>
            {m.from !== 'me' && !showOrig ? <Simple text={m.text} /> : m.text}
            <time>{fmtTime(m.at)}</time>
          </div>
        ))}
      </div>
      <Composer
        speak={false}
        recent={msgs.slice(-6).map((m) => ({ who: m.from === 'me' ? 'person' as const : 'other' as const, text: m.text }))}
        quick={['❤️ Love you', '👍 OK', 'Call me', 'Thank you']}
        onSpoken={(x) => { os.addMessage({ from: 'me', to: c.id, text: x.text }); os.toast({ emoji: '✅', title: `Sent to ${c.name}`, body: x.text }); }}
      />
    </>
  );
}
