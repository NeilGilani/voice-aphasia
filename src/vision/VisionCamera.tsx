import { useEffect, useRef } from 'react';
import { useVision, type UseVisionOptions } from './useVision';
import type { VisionFrame } from './engine';

export interface VisionCameraProps extends UseVisionOptions {
  /** Draw every detected box (debug) instead of only the pointed/held one. */
  debug?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const HAND_LINKS = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];

function draw(ctx: CanvasRenderingContext2D, f: VisionFrame | undefined, debug: boolean) {
  const { width: W, height: H } = ctx.canvas;
  ctx.clearRect(0, 0, W, H);
  if (!f) return;
  const r = Math.max(6, W * 0.02);
  for (const d of f.detections) {
    if (!d.pointedAt && !debug) continue;
    const x = d.box.x * W, y = d.box.y * H, w = d.box.w * W, h = d.box.h * H;
    ctx.lineWidth = d.pointedAt ? Math.max(3, W * 0.006) : 1.5;
    ctx.strokeStyle = d.pointedAt ? 'rgba(255,214,102,0.95)' : 'rgba(255,255,255,0.45)';
    ctx.fillStyle = d.pointedAt ? 'rgba(255,214,102,0.12)' : 'transparent';
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); ctx.stroke();
  }
  if (debug) {
    ctx.strokeStyle = 'rgba(120,200,255,0.7)'; ctx.lineWidth = 2;
    for (const hand of f.hands) {
      ctx.beginPath();
      for (const [a, b] of HAND_LINKS) {
        ctx.moveTo(hand.landmarks[a].x * W, hand.landmarks[a].y * H);
        ctx.lineTo(hand.landmarks[b].x * W, hand.landmarks[b].y * H);
      }
      ctx.stroke();
    }
  }
  if (f.ray) {
    ctx.setLineDash([6, 8]); ctx.strokeStyle = 'rgba(255,214,102,0.7)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(f.ray.from.x * W, f.ray.from.y * H); ctx.lineTo(f.ray.to.x * W, f.ray.to.y * H); ctx.stroke();
    ctx.setLineDash([]);
  }
}

/** Camera preview with a subtle highlight on whatever the person points at or holds up. */
export function VisionCamera({ debug = false, className, style, ...opts }: VisionCameraProps) {
  const { videoRef, status, error, frame, mirrored } = useVision(opts);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvasRef.current, v = videoRef.current;
    if (!c || !v) return;
    if (v.videoWidth && (c.width !== v.videoWidth || c.height !== v.videoHeight)) {
      c.width = v.videoWidth; c.height = v.videoHeight;
    }
    const ctx = c.getContext('2d');
    if (ctx) draw(ctx, frame, debug);
  }, [frame, debug, videoRef]);

  const pointed = frame?.detections.find((d) => d.pointedAt);
  const flip = mirrored ? 'scaleX(-1)' : undefined;
  return (
    <div className={className} style={{ position: 'relative', overflow: 'hidden', borderRadius: 20, background: '#111', aspectRatio: '4 / 3', ...style }}>
      <video ref={videoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: flip }} />
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: flip, pointerEvents: 'none' }} />
      {status !== 'running' && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#fff', font: '500 15px system-ui', padding: 16, textAlign: 'center' }}>
          {status === 'error' ? `Camera unavailable: ${error}` : 'Starting camera…'}
        </div>
      )}
      {pointed && (
        <div style={{ position: 'absolute', left: 12, bottom: 12, padding: '6px 12px', borderRadius: 999, background: 'rgba(20,20,20,0.6)', backdropFilter: 'blur(8px)', color: '#ffd666', font: '600 15px system-ui' }}>
          {pointed.gesture === 'hold' ? 'Holding' : 'Pointing at'}: {pointed.label}
        </div>
      )}
    </div>
  );
}
