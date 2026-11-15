import type { PersonContext } from '../../contracts';
import type { ReadResult } from './types';

const URLS = [import.meta.env.VITE_READ_URL as string | undefined, '/api/read', 'http://localhost:8788/api/read'].filter(Boolean) as string[];

/** Downscale to ≤1280px JPEG data URL (smaller upload, faster Claude). */
export async function toDataUrl(src: HTMLVideoElement | HTMLImageElement | Blob): Promise<string> {
  let el: HTMLVideoElement | HTMLImageElement | ImageBitmap = src as HTMLVideoElement;
  if (src instanceof Blob) el = await createImageBitmap(src);
  const w = el instanceof HTMLVideoElement ? el.videoWidth : el instanceof HTMLImageElement ? el.naturalWidth : el.width;
  const h = el instanceof HTMLVideoElement ? el.videoHeight : el instanceof HTMLImageElement ? el.naturalHeight : el.height;
  const s = Math.min(1, 1280 / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.round(w * s); c.height = Math.round(h * s);
  c.getContext('2d')!.drawImage(el, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.85);
}

export async function readImage(image: string, context?: PersonContext): Promise<ReadResult> {
  let last: unknown;
  for (const url of URLS) {
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ image, context, now: new Date().toISOString() }),
      });
      if (r.ok) return (await r.json()) as ReadResult;
      last = new Error(`${url} ${r.status}`);
    } catch (e) { last = e; }
  }
  throw last;
}
