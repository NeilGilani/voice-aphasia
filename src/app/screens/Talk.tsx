import { useState } from 'react';
import { Composer } from '../os/Composer';
import { useOS } from '../os/os';
import { runAction } from '../adapters';
import { ScreenHead, Kicker, fmtTime } from '../os/ui';
import { PracticeCard } from '../../pages';

export default function Talk() {
  const os = useOS();
  const [said, setSaid] = useState<{ text: string; at: number }[]>([]);
  const [practice, setPractice] = useState<string>();
  return (
    <>
      <ScreenHead emoji="🗣️" hue={255} title="Talk" sub="Broken words are fine. Point at things too." />
      <Composer
        autoListen={false}
        recent={said.map((s) => ({ who: 'person' as const, text: s.text }))}
        quick={['Yes', 'No', 'Wait, please', 'Thank you', 'I need help']}
        onSpoken={(c) => {
          setSaid((s) => [...s, { text: c.text, at: Date.now() }]);
          setPractice(c.text);
          if (c.action?.type === 'call') {
            const who = os.contacts.find((p) => p.phone === (c.action as { to: string }).to);
            if (who) os.open('call', { id: who.id }); else runAction(c);
          }
        }}
      />
      {practice && <div style={{ marginTop: 16 }}><PracticeCard sentence={practice} ctx={os.ctx} onClose={() => setPractice(undefined)} /></div>}
      {said.length > 0 && (
        <>
          <Kicker>Said today</Kicker>
          <div className="thread">{said.slice().reverse().map((s) => <div key={s.at} className="bub out">{s.text}<time>{fmtTime(s.at)}</time></div>)}</div>
        </>
      )}
    </>
  );
}
