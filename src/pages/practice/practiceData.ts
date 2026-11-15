/*
 * Therapy in daily life: after the person picks a sentence, offer one word from it to practise.
 * Uses a simple cueing ladder SLPs use (try → first-sound cue → hear it → repeat). Attempts are logged
 * for the progress view. This is practice support, not a clinical assessment.
 */
import type { PersonContext } from '../../contracts';
import { KEYS, useStored } from '../shared';

export type Cue = 'none' | 'first-sound' | 'model';
export interface Attempt { word: string; heard: string; ok: boolean; cue: Cue; at: number; from?: string }
export interface PracticeData { attempts: Attempt[] }

export const usePractice = () => useStored<PracticeData>(KEYS.practice, { attempts: [] });

const STOP = new Set('a an the and or but to of in on at for with is are was be i me my you your her his him she he it its we our they them this that and please can could would will want tell call text happy have get go do some'.split(' '));

/** Choose the most meaningful word to practise: a person's name first, else the longest content word. */
export function pickPracticeWord(sentence: string, ctx?: PersonContext): string | null {
  const words = sentence.replace(/[^\p{L}\s'-]/gu, ' ').split(/\s+/).filter(Boolean);
  const names = new Set((ctx?.people ?? []).map((p) => p.name.toLowerCase()));
  const name = words.find((w) => names.has(w.toLowerCase()));
  if (name) return name;
  const content = words.filter((w) => !STOP.has(w.toLowerCase()) && w.length > 2);
  if (!content.length) return null;
  return content.sort((a, b) => b.length - a.length)[0].toLowerCase();
}

/** Very rough syllable split for display ("El · lie"). */
export function syllables(word: string): string[] {
  const parts = word.match(/[^aeiouy]*[aeiouy]+(?:[^aeiouy]*$|[^aeiouy](?=[^aeiouy]))?/gi);
  return parts && parts.join('') === word ? parts : [word];
}

export function firstSound(word: string): string {
  const m = word.match(/^[^aeiouy]*[aeiouy]/i);
  return (m ? m[0] : word.slice(0, 2));
}

/** Lenient match: the word appears, or the heard text is within edit distance 1–2 of it. */
export function heardMatches(target: string, heard: string): boolean {
  const t = target.toLowerCase();
  const toks = heard.toLowerCase().replace(/[^\p{L}\s]/gu, ' ').split(/\s+/);
  return toks.some((w) => w === t || lev(w, t) <= (t.length > 5 ? 2 : 1));
}

function lev(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
