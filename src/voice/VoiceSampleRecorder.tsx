import { useEffect, useRef, useState } from 'react';
import { cloneVoice, type VoiceStatus } from './engine';

/** A sentence that's easy to read aloud and covers lots of sounds. Sent as the reference transcript. */
export const SAMPLE_SCRIPT =
  'Good morning. I would like a cup of coffee, and then maybe a walk outside with the family.';

const MAX_SECONDS = 12;

interface Props {
  defaultName?: string;
  onCloned?: (status: VoiceStatus) => void;
}

/**
 * Capture a voice sample: a family member helps the person read the script
 * (about 8 s), or uploads an old voicemail / video with their voice.
 */
export function VoiceSampleRecorder({ defaultName = '', onCloned }: Props) {
  const [name, setName] = useState(defaultName);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [sample, setSample] = useState<{ blob: Blob; url: string; scripted: boolean } | null>(null);
  const [transcript, setTranscript] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => {
    window.clearInterval(timer.current);
    rec.current?.stream.getTracks().forEach((t) => t.stop());
  }, []);

  function setNewSample(blob: Blob, scripted: boolean) {
    if (sample) URL.revokeObjectURL(sample.url);
    setSample({ blob, url: URL.createObjectURL(blob), scripted });
    setTranscript(scripted ? SAMPLE_SCRIPT : '');
  }

  async function start() {
    setMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      const mr = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setNewSample(new Blob(chunks, { type: mr.mimeType }), true);
      };
      rec.current = mr;
      mr.start();
      setRecording(true);
      setSeconds(0);
      timer.current = window.setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_SECONDS) stop();
          return s + 1;
        });
      }, 1000);
    } catch {
      setMsg('Microphone not available. You can upload a voicemail or video instead.');
    }
  }

  function stop() {
    window.clearInterval(timer.current);
    if (rec.current?.state === 'recording') rec.current.stop();
    setRecording(false);
  }

  async function submit() {
    if (!sample) return;
    setBusy(true);
    setMsg('Learning the voice…');
    try {
      const status = await cloneVoice(sample.blob, name.trim() || 'My', transcript.trim() || undefined);
      setMsg(`Done. Voice will now speak as “${status.name}”.`);
      onCloned?.(status);
    } catch (e) {
      setMsg(`Couldn't learn the voice: ${(e as Error).message}. The device voice will be used for now.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="voice-recorder" style={styles.card}>
      <h3 style={{ margin: 0 }}>Their own voice</h3>
      <p style={styles.hint}>
        Record about 8 seconds, or upload an old voicemail or video. One clear speaker works best.
      </p>

      <label style={styles.label}>
        Whose voice is this?
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Grandpa" style={styles.input} />
      </label>

      <blockquote style={styles.script}>“{SAMPLE_SCRIPT}”</blockquote>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {!recording ? (
          <button onClick={start} style={styles.primary} disabled={busy}>● Record</button>
        ) : (
          <button onClick={stop} style={{ ...styles.primary, background: '#c0392b' }}>
            ■ Stop ({MAX_SECONDS - seconds}s)
          </button>
        )}
        <label style={styles.secondary}>
          Upload voicemail / video
          <input
            type="file"
            accept="audio/*,video/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setNewSample(f, false);
            }}
          />
        </label>
      </div>

      {sample && (
        <>
          <audio controls src={sample.url} style={{ width: '100%' }} />
          <label style={styles.label}>
            What is said in it? {sample.scripted ? '' : '(optional, we can work it out)'}
            <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} rows={2} style={styles.input} />
          </label>
          <button onClick={submit} disabled={busy} style={styles.primary}>
            {busy ? 'Learning…' : 'Use this voice'}
          </button>
        </>
      )}
      {msg && <p role="status" style={styles.hint}>{msg}</p>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: { display: 'flex', flexDirection: 'column', gap: 12, padding: 20, borderRadius: 20, background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', maxWidth: 520 },
  hint: { margin: 0, opacity: 0.75, fontSize: 14 },
  label: { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14 },
  input: { font: 'inherit', padding: 10, borderRadius: 10, border: '1px solid rgba(127,127,127,0.4)', background: 'transparent', color: 'inherit' },
  script: { margin: 0, fontSize: 20, lineHeight: 1.4 },
  primary: { font: 'inherit', fontSize: 18, padding: '12px 20px', borderRadius: 14, border: 0, background: '#2d6cdf', color: '#fff', cursor: 'pointer' },
  secondary: { padding: '12px 16px', borderRadius: 14, border: '1px solid rgba(127,127,127,0.5)', cursor: 'pointer' },
};
