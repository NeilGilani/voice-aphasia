import type { Utterance } from '../contracts/index.ts';

/**
 * Fragment-friendly speech capture (Web Speech API). Keeps hesitations, false starts and
 * long pauses (rendered as "…"), never auto-stops on silence — the person decides when done.
 */
export interface Capture {
  /** Stop listening and return the final Utterance. */
  stop(): Promise<Utterance>;
  cancel(): void;
}

export function speechSupported(): boolean {
  const w = window as any;
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export function startCapture(onPartial: (text: string) => void, opts: { lang?: string; pauseMs?: number } = {}): Capture {
  const w = window as any;
  const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!SR) throw new Error('Speech recognition not supported in this browser');
  const pauseMs = opts.pauseMs ?? 1200;
  const startedAt = Date.now();
  const finals: { text: string; at: number; confidence?: number }[] = [];
  let interim = '';
  let stopped = false;
  let lastAt = startedAt;
  let finish: ((u: Utterance) => void) | null = null;

  const render = () => {
    let s = '';
    finals.forEach((f, i) => {
      if (i > 0) s += f.at - finals[i - 1].at > pauseMs ? '… ' : ' ';
      s += f.text;
    });
    if (interim) s += (s ? (Date.now() - lastAt > pauseMs ? '… ' : ' ') : '') + interim;
    return s.trim();
  };

  const build = (): Utterance => ({
    id: `u${startedAt}`,
    transcript: render(),
    words: finals.map((f) => ({ text: f.text, start: f.at - startedAt, end: f.at - startedAt, confidence: f.confidence })),
    startedAt,
  });

  const make = () => {
    const r = new SR();
    r.lang = opts.lang ?? 'en-US';
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 1;
    r.onresult = (ev: any) => {
      interim = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const res = ev.results[i];
        const t = String(res[0].transcript).trim();
        if (!t) continue;
        if (res.isFinal) { finals.push({ text: t, at: Date.now(), confidence: res[0].confidence }); lastAt = Date.now(); }
        else interim += (interim ? ' ' : '') + t;
      }
      onPartial(render());
    };
    // Chrome ends sessions on long silence; aphasic speech has long pauses, so restart.
    r.onend = () => {
      if (stopped) { if (interim) { finals.push({ text: interim, at: Date.now() }); interim = ''; } finish?.(build()); }
      else { try { rec = make(); rec.start(); } catch { /* ignore */ } }
    };
    r.onerror = (e: any) => { if (e.error === 'not-allowed') { stopped = true; } };
    return r;
  };
  let rec = make();
  rec.start();

  return {
    stop: () => new Promise((resolve) => { finish = resolve; stopped = true; try { rec.stop(); } catch { resolve(build()); } }),
    cancel: () => { stopped = true; try { rec.abort(); } catch { /* ignore */ } },
  };
}
