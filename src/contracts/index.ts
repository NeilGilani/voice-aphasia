/*
 * Shared contracts between the five workstreams. Change only by agreement
 * (integration lead merges). Each workstream owns its own folder.
 */

/** Everything the person tried to say in one turn. */
export interface Utterance {
  id: string;
  /** Raw words heard, fragments included, e.g. "water… no… Ellie… phone… birthday". */
  transcript: string;
  /** Per-word timing/confidence when available. */
  words?: { text: string; start: number; end: number; confidence?: number }[];
  /** What the camera saw them point at or hold up (vision workstream). */
  seen?: SeenObject[];
  startedAt: number;
}

export interface SeenObject {
  label: string;
  confidence: number;
  /** True if the person was pointing at / holding it. */
  pointedAt: boolean;
}

/** Durable knowledge about the person (understand workstream owns storage). */
export interface PersonContext {
  name: string;
  people: { name: string; relation: string; phone?: string; notes?: string }[];
  routines: { time: string; what: string }[];
  /** Sentences they have chosen before — the learning signal. */
  history: { text: string; at: number }[];
  /** Free-form facts: "loves the Giants", "takes pills at 8am". */
  facts: string[];
}

/** One guess at what they mean. */
export interface Candidate {
  id: string;
  text: string;
  /** Action to run if chosen, beyond speaking it. */
  action?: { type: 'call' | 'text'; to: string; body?: string } | { type: 'none' };
  confidence: number;
  /** Short why, shown small: "You mentioned Ellie + birthday; it's Nov 15". */
  because: string;
}

export interface UnderstandRequest {
  utterance: Utterance;
  context: PersonContext;
  now: string; // ISO
  /** Recent conversation turns (both sides) for continuity. */
  recent: { who: 'person' | 'other'; text: string }[];
}

export interface UnderstandResponse {
  candidates: Candidate[]; // exactly 3, best first
}

/** Voice workstream: speak text in the person's own (cloned) voice. */
export interface VoiceEngine {
  ready(): Promise<boolean>;
  speak(text: string): Promise<void>;
  /** Name shown in UI, e.g. "Grandpa's voice" or "Device voice". */
  label: string;
}
