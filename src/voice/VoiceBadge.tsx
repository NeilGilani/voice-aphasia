import type { VoiceEngine } from '../contracts';

/** Small, honest label: whose voice is about to speak. */
export function VoiceBadge({ engine, usingClone }: { engine: VoiceEngine; usingClone: boolean }) {
  return (
    <span
      title={usingClone ? 'Speaking in their cloned voice' : 'Their voice is not set up or not reachable; using the device voice'}
      style={{ fontSize: 13, padding: '4px 10px', borderRadius: 999, background: usingClone ? 'rgba(46,204,113,0.2)' : 'rgba(241,196,15,0.25)' }}
    >
      {usingClone ? '🗣 ' : '🔈 '}
      {engine.label}
    </span>
  );
}
