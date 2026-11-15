import { ReadWorld } from '../../vision';
import { useOS } from '../os/os';
import { ScreenHead } from '../os/ui';

export default function Read() {
  const os = useOS();
  return (
    <>
      <ScreenHead emoji="📷" hue={175} title="Read" sub="Hold up a letter, bill or pill bottle." />
      <ReadWorld context={os.ctx} speak={(t) => os.voice.speak(t)} />
      <button className="os-btn green block" style={{ marginTop: 16 }} onClick={() => os.open('call', { id: 'ellie' })}><span className="big">📞</span>Call Ellie about it</button>
    </>
  );
}
