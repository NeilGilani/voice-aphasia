import type { VoiceEngine } from '../contracts';

/**
 * Voice workstream. Speaks text in the person's cloned voice via the local
 * F5-TTS-MLX server (server/voice_server.py, proxied at /api/voice), and falls
 * back to the browser's speechSynthesis — clearly labelled — whenever the clone
 * is missing, slow, or down.
 */

export const VOICE_API = (import.meta.env.VITE_VOICE_API as string | undefined) ?? '/api/voice';

export interface VoiceStatus {
  ready: boolean;
  cloned: boolean;
  name?: string;
  warm?: boolean;
}

export async function getVoiceStatus(): Promise<VoiceStatus> {
  try {
    const r = await fetch(`${VOICE_API}/status`, { signal: AbortSignal.timeout(1500) });
    if (!r.ok) return { ready: false, cloned: false };
    return (await r.json()) as VoiceStatus;
  } catch {
    return { ready: false, cloned: false };
  }
}

/** Upload a voice sample (recorded or a voicemail/video file). refText = what was said, if known. */
export async function cloneVoice(sample: Blob, name: string, refText?: string): Promise<VoiceStatus> {
  const fd = new FormData();
  fd.append('audio', sample, sample instanceof File ? sample.name : 'sample.webm');
  fd.append('name', name);
  if (refText) fd.append('ref_text', refText);
  const r = await fetch(`${VOICE_API}/clone`, { method: 'POST', body: fd });
  if (!r.ok) throw new Error((await r.text()) || `clone failed (${r.status})`);
  return (await r.json()) as VoiceStatus;
}

/** Browser speechSynthesis. Always available, never their voice. */
export class DeviceVoiceEngine implements VoiceEngine {
  label = 'Device voice';
  async ready() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }
  speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) return resolve();
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      speechSynthesis.speak(u);
    });
  }
}

export interface ClonedVoiceOptions {
  /** Give up on the clone and use the device voice after this long (ms). */
  timeoutMs?: number;
  /** Called whenever the engine actually used (and so the label) changes. */
  onFallback?: (reason: string) => void;
}

/**
 * The person's own voice. Call `prepare(candidates)` as soon as the 3 cards
 * appear: audio is synthesised in the background so the tap plays instantly.
 */
export class ClonedVoiceEngine implements VoiceEngine {
  label = 'Device voice (backup)';
  /** Which voice the last `speak` actually used. */
  lastUsed: 'clone' | 'preset' | 'device' = 'device';
  private status: VoiceStatus = { ready: false, cloned: false };
  private cache = new Map<string, Promise<Blob>>();
  private device = new DeviceVoiceEngine();
  private audio: HTMLAudioElement | null = null;
  private opts: Required<Omit<ClonedVoiceOptions, 'onFallback'>> & ClonedVoiceOptions;

  constructor(opts: ClonedVoiceOptions = {}) {
    this.opts = { timeoutMs: 8000, ...opts };
  }

  async ready(): Promise<boolean> {
    this.status = await getVoiceStatus();
    this.label = this.status.cloned
      ? `${this.status.name ?? 'Your'} voice`
      : this.status.ready ? 'Natural voice (not cloned yet)' : 'Device voice (no voice sample yet)';
    if (!this.status.cloned) return this.device.ready();
    return true;
  }

  get usingClone() {
    return this.status.ready && this.status.cloned;
  }

  /** Pre-synthesise texts (e.g. the 3 candidate sentences). Safe to call repeatedly. */
  prepare(texts: string[]): void {
    if (!this.usingClone) return;
    for (const t of texts) this.fetchAudio(t).catch(() => this.cache.delete(key(t)));
  }

  private fetchAudio(text: string): Promise<Blob> {
    const k = key(text);
    let p = this.cache.get(k);
    if (!p) {
      p = fetch(`${VOICE_API}/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      }).then((r) => {
        if (!r.ok) throw new Error(`speak ${r.status}`);
        return r.blob();
      });
      this.cache.set(k, p);
      if (this.cache.size > 50) this.cache.delete(this.cache.keys().next().value!);
    }
    return p;
  }

  stop() {
    this.audio?.pause();
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  }

  async speak(text: string): Promise<void> {
    this.stop();
    if (this.usingClone) {
      try {
        const blob = await withTimeout(this.fetchAudio(text), this.opts.timeoutMs);
        await this.play(blob);
        this.lastUsed = 'clone';
        return;
      } catch (e) {
        this.cache.delete(key(text));
        this.opts.onFallback?.(`Their voice wasn't ready (${(e as Error).message}); used device voice.`);
      }
    }
    // Natural preset voice (Kokoro sidecar): instant, human-sounding, but not theirs.
    if (this.status.ready) {
      try {
        const r = await withTimeout(fetch(`${VOICE_API}/preset/speak`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }),
        }), 4000);
        if (r.ok) {
          await this.play(await r.blob());
          this.lastUsed = 'preset';
          return;
        }
      } catch { /* fall through to the browser voice */ }
    }
    this.lastUsed = 'device';
    await this.device.speak(text);
  }

  private play(blob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const a = new Audio(url);
      this.audio = a;
      const done = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      a.onended = done;
      a.onpause = done;
      a.onerror = () => reject(new Error('playback failed'));
      a.play().catch(reject);
    });
  }
}

const key = (t: string) => t.trim().toLowerCase();

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timed out')), ms)),
  ]);
}

/** Default engine for the app: cloned voice with device fallback. */
export function createVoiceEngine(opts?: ClonedVoiceOptions) {
  return new ClonedVoiceEngine(opts);
}
