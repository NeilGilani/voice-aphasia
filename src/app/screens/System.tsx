import { Settings } from '../Settings';
import { useOS } from '../os/os';
import { ScreenHead, Kicker } from '../os/ui';
import { VoiceSampleRecorder } from '../../voice';
import { Family as FamilyPage } from '../../pages';
import '../app.css';

export function AboutMe() {
  const os = useOS();
  return (
    <>
      <ScreenHead emoji="⚙️" hue={230} title="Settings" sub="For family or a therapist to fill in." />
      <Kicker>My voice</Kicker>
      <div className="os-glass" style={{ padding: 16 }}><VoiceSampleRecorder defaultName={os.ctx.name} /></div>
      <div className="settings-inline"><Settings ctx={os.ctx} setCtx={os.setCtx} onClose={os.back} /></div>
    </>
  );
}

export function Family() {
  return (
    <>
      <ScreenHead emoji="👨‍👩‍👧" hue={15} title="Family" sub="Say it to me. I’ll make it simple for Frank." />
      <div className="family-embed"><FamilyPage /></div>
    </>
  );
}
