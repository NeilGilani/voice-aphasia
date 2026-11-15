import { useCallback, useEffect, useRef, useState } from 'react';
import { vision, type VisionFrame } from './engine';
import type { SeenObject } from '../contracts';

export interface UseVisionOptions {
  enabled?: boolean;
  /** 'user' = selfie camera (default; person holds things up), 'environment' = rear. */
  facingMode?: 'user' | 'environment';
}

export function useVision({ enabled = true, facingMode = 'user' }: UseVisionOptions = {}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'running' | 'error'>('idle');
  const [error, setError] = useState<string>();
  const [frame, setFrame] = useState<VisionFrame>();

  useEffect(() => {
    if (!enabled) return;
    let stream: MediaStream | undefined;
    let cancelled = false;
    setStatus('loading');
    (async () => {
      try {
        const [s] = await Promise.all([
          navigator.mediaDevices.getUserMedia({
            video: { facingMode, width: { ideal: 640 }, height: { ideal: 480 } },
            audio: false,
          }),
          vision.load(),
        ]);
        stream = s;
        if (cancelled || !videoRef.current) return s.getTracks().forEach((t) => t.stop());
        const v = videoRef.current;
        v.srcObject = s;
        v.muted = true;
        v.playsInline = true;
        await v.play();
        vision.start(v);
        setStatus('running');
      } catch (e) {
        if (!cancelled) { setError(e instanceof Error ? e.message : String(e)); setStatus('error'); }
      }
    })();
    const off = vision.onFrame(setFrame);
    return () => {
      cancelled = true;
      off();
      vision.stop();
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [enabled, facingMode]);

  const getSeen = useCallback((seconds = 5, since?: number): SeenObject[] => vision.getSeen(seconds * 1000, since), []);

  return { videoRef, status, error, frame, getSeen, mirrored: facingMode === 'user' };
}
