/*
 * In-browser camera understanding: MediaPipe hand landmarks + COCO object
 * detection → SeenObject[] for the current utterance window. No server.
 */
import {
  FilesetResolver,
  HandLandmarker,
  ObjectDetector,
  type NormalizedLandmark,
} from '@mediapipe/tasks-vision';
import type { SeenObject } from '../contracts';

const WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm';
const HAND_MODEL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const OBJECT_MODEL =
  'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/int8/1/efficientdet_lite0.tflite';

/** Labels that are never "the thing they mean". */
const IGNORE = new Set(['person', 'dining table', 'chair', 'couch', 'bed', 'toilet']);
const HISTORY_MS = 20_000;

/** Box in normalized [0..1] video coordinates (unmirrored). */
export interface Box { x: number; y: number; w: number; h: number }

export interface Detection {
  label: string;
  confidence: number;
  box: Box;
  pointedAt: boolean;
  /** How the person indicated it. */
  gesture?: 'point' | 'hold';
}

export interface Hand {
  landmarks: NormalizedLandmark[];
  pointing: boolean;
}

export interface VisionFrame {
  t: number;
  detections: Detection[];
  hands: Hand[];
  /** End of the pointing ray, when a hand is pointing (normalized). */
  ray?: { from: { x: number; y: number }; to: { x: number; y: number } };
}

const dist = (a: NormalizedLandmark, b: NormalizedLandmark) => Math.hypot(a.x - b.x, a.y - b.y);

/** Finger i is extended if its tip is clearly farther from the wrist than its PIP joint. */
function extended(lm: NormalizedLandmark[], tip: number, pip: number) {
  return dist(lm[tip], lm[0]) > dist(lm[pip], lm[0]) * 1.15;
}

function isPointing(lm: NormalizedLandmark[]) {
  const index = extended(lm, 8, 6);
  const others = [extended(lm, 12, 10), extended(lm, 16, 14), extended(lm, 20, 18)].filter(Boolean).length;
  return index && others <= 1;
}

function boxDistance(b: Box, p: { x: number; y: number }) {
  const dx = Math.max(b.x - p.x, 0, p.x - (b.x + b.w));
  const dy = Math.max(b.y - p.y, 0, p.y - (b.y + b.h));
  return Math.hypot(dx, dy);
}

function palm(lm: NormalizedLandmark[]) {
  const ids = [0, 5, 9, 13, 17];
  return { x: ids.reduce((s, i) => s + lm[i].x, 0) / 5, y: ids.reduce((s, i) => s + lm[i].y, 0) / 5 };
}

export class VisionEngine {
  private hands?: HandLandmarker;
  private objects?: ObjectDetector;
  private history: VisionFrame[] = [];
  private lastObjects: { label: string; confidence: number; box: Box }[] = [];
  private frame = 0;
  private raf = 0;
  private lastVideoTime = -1;
  private listeners = new Set<(f: VisionFrame) => void>();
  running = false;

  private loading?: Promise<void>;

  load(): Promise<void> {
    return (this.loading ??= this.doLoad().catch((e) => { this.loading = undefined; throw e; }));
  }

  private async doLoad(): Promise<void> {
    const fileset = await FilesetResolver.forVisionTasks(WASM);
    const make = async (delegate: 'GPU' | 'CPU') =>
      Promise.all([
        HandLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: HAND_MODEL, delegate },
          runningMode: 'VIDEO',
          numHands: 2,
        }),
        ObjectDetector.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: OBJECT_MODEL, delegate },
          runningMode: 'VIDEO',
          scoreThreshold: 0.3,
          maxResults: 8,
        }),
      ]);
    try {
      [this.hands, this.objects] = await make('GPU');
    } catch {
      [this.hands, this.objects] = await make('CPU');
    }
  }

  onFrame(fn: (f: VisionFrame) => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  start(video: HTMLVideoElement) {
    if (this.running) return;
    this.running = true;
    const tick = () => {
      if (!this.running) return;
      if (video.readyState >= 2 && video.currentTime !== this.lastVideoTime) {
        this.lastVideoTime = video.currentTime;
        this.process(video);
      }
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  private process(video: HTMLVideoElement) {
    if (!this.hands || !this.objects) return;
    const now = performance.now();
    const W = video.videoWidth, H = video.videoHeight;
    // Object detection is the heavy part: run it every 3rd frame, hands every frame.
    if (this.frame++ % 3 === 0) {
      const res = this.objects.detectForVideo(video, now);
      this.lastObjects = res.detections.flatMap((d) => {
        const c = d.categories[0];
        const bb = d.boundingBox;
        if (!c || !bb || IGNORE.has(c.categoryName)) return [];
        return [{
          label: c.categoryName,
          confidence: c.score,
          box: { x: bb.originX / W, y: bb.originY / H, w: bb.width / W, h: bb.height / H },
        }];
      });
    }
    const hr = this.hands.detectForVideo(video, now);
    const hands: Hand[] = hr.landmarks.map((lm) => ({ landmarks: lm, pointing: isPointing(lm) }));

    const detections: Detection[] = this.lastObjects.map((o) => ({ ...o, pointedAt: false }));
    let ray: VisionFrame['ray'];
    for (const h of hands) {
      const lm = h.landmarks;
      if (h.pointing) {
        // Ray from index knuckle through fingertip; pick first box it hits.
        const from = { x: lm[5].x, y: lm[5].y };
        const dx = lm[8].x - lm[5].x, dy = lm[8].y - lm[5].y;
        const len = Math.hypot(dx, dy) || 1;
        let best: Detection | undefined, bestT = Infinity;
        for (let t = 0; t <= 2.5; t += 0.02) {
          const p = { x: lm[8].x + (dx / len) * t * 0.5, y: lm[8].y + (dy / len) * t * 0.5 };
          for (const d of detections) {
            if (boxDistance(d.box, p) < 0.02 && t < bestT) { best = d; bestT = t; }
          }
          if (best) break;
        }
        const end = best
          ? { x: best.box.x + best.box.w / 2, y: best.box.y + best.box.h / 2 }
          : { x: lm[8].x + (dx / len) * 0.4, y: lm[8].y + (dy / len) * 0.4 };
        ray = { from, to: end };
        if (best) { best.pointedAt = true; best.gesture = 'point'; }
      } else {
        // Holding: palm/fingertips inside or touching a box. Prefer smallest such box.
        const pts = [palm(lm), lm[4], lm[8], lm[12]];
        const hits = detections.filter((d) => pts.filter((p) => boxDistance(d.box, p) < 0.03).length >= 2);
        hits.sort((a, b) => a.box.w * a.box.h - b.box.w * b.box.h);
        if (hits[0] && !hits[0].pointedAt) { hits[0].pointedAt = true; hits[0].gesture = 'hold'; }
      }
    }

    const frame: VisionFrame = { t: Date.now(), detections, hands, ray };
    this.history.push(frame);
    const cutoff = frame.t - HISTORY_MS;
    while (this.history.length && this.history[0].t < cutoff) this.history.shift();
    this.listeners.forEach((fn) => fn(frame));
  }

  /**
   * Objects seen in the last `windowMs` (or since `since`, epoch ms).
   * One entry per label; pointed/held objects first. An object counts as
   * pointedAt if it was indicated in at least 3 frames (debounces flicker).
   */
  getSeen(windowMs = 5000, since?: number): SeenObject[] {
    const from = since ?? Date.now() - windowMs;
    const agg = new Map<string, { conf: number; frames: number; pointed: number; pointConf: number }>();
    for (const f of this.history) {
      if (f.t < from) continue;
      for (const d of f.detections) {
        const a = agg.get(d.label) ?? { conf: 0, frames: 0, pointed: 0, pointConf: 0 };
        a.conf = Math.max(a.conf, d.confidence);
        a.frames++;
        if (d.pointedAt) { a.pointed++; a.pointConf = Math.max(a.pointConf, d.confidence); }
        agg.set(d.label, a);
      }
    }
    return [...agg.entries()]
      .filter(([, a]) => a.frames >= 2 || a.conf > 0.6)
      .map(([label, a]) => ({
        label,
        confidence: Math.round((a.pointed >= 3 ? a.pointConf : a.conf) * 100) / 100,
        pointedAt: a.pointed >= 3,
      }))
      .sort((x, y) => Number(y.pointedAt) - Number(x.pointedAt) || y.confidence - x.confidence)
      .slice(0, 6);
  }
}

/** Shared singleton so the app and the utterance pipeline see the same camera state. */
export const vision = new VisionEngine();

/** Convenience for the understand workstream: objects seen in the last N seconds. */
export function getSeenObjects(seconds = 5, since?: number): SeenObject[] {
  return vision.getSeen(seconds * 1000, since);
}
