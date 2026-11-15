/* Small shared helpers for VoiceOS story pages: localStorage-backed state + speech capture. */
import { useEffect, useState } from 'react';

export function useStored<T>(key: string, init: T) {
  const [v, setV] = useState<T>(() => {
    try { const raw = localStorage.getItem(key); if (raw) return JSON.parse(raw) as T; } catch { /* ignore */ }
    return init;
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* ignore */ }
    window.dispatchEvent(new CustomEvent('voiceos:store', { detail: key }));
  }, [key, v]);
  // Keep in sync when another page on this tab or another tab writes the same key.
  useEffect(() => {
    const reload = () => { try { const raw = localStorage.getItem(key); if (raw) setV(JSON.parse(raw)); } catch { /* ignore */ } };
    const onStorage = (e: StorageEvent) => { if (e.key === key) reload(); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key]);
  return [v, setV] as const;
}

export const KEYS = {
  memory: 'voice.memory.v1',
  inbox: 'voice.inbox.v1',
  payments: 'voice.payments.v1',
  day: 'voice.day.v1',
  practice: 'voice.practice.v1',
};

export const uid = () => Math.random().toString(36).slice(2, 10);

type SR = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: (e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void;
  onend: () => void; onerror: () => void; start: () => void; stop: () => void;
};
export const SpeechRec: (new () => SR) | undefined =
  (globalThis as any).SpeechRecognition ?? (globalThis as any).webkitSpeechRecognition;

/** Listen once; resolves with the final transcript ('' if unsupported or nothing heard). */
export function listenOnce(ms = 5000): Promise<string> {
  return new Promise((res) => {
    if (!SpeechRec) return res('');
    const r = new SpeechRec();
    r.lang = 'en-US'; r.continuous = false; r.interimResults = false;
    let text = '';
    r.onresult = (e) => { for (let i = e.resultIndex; i < e.results.length; i++) text += e.results[i][0].transcript; };
    r.onend = () => res(text.trim());
    r.onerror = () => res(text.trim());
    r.start();
    setTimeout(() => r.stop(), ms);
  });
}

export function speak(text: string) {
  try { speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance(text)); } catch { /* ignore */ }
}

export function readFileAsDataUrl(f: File, max = 480): Promise<string> {
  // Downscale photos so localStorage doesn't overflow.
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = img.width * s; c.height = img.height * s;
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      res(c.toDataURL('image/jpeg', 0.8));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = rej;
    img.src = URL.createObjectURL(f);
  });
}
