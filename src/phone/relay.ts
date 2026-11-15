/*
 * Tiny call relay over the voice server (server/voice_server.py): POST a line, receive
 * the other side's lines over Server-Sent Events. Text only — each device does its own
 * speech-to-text, and Frank's lines are spoken on the far side in his cloned voice.
 */
import { VOICE_API } from '../voice';

export type Who = 'frank' | 'ellie';
export interface CallEvent { who: Who; kind: 'line' | 'hello' | 'bye'; text: string; at: number }

export interface CallLink {
  send(kind: CallEvent['kind'], text?: string): Promise<number>;
  close(): void;
}

export function joinCall(room: string, me: Who, onEvent: (e: CallEvent) => void, onStatus?: (up: boolean) => void): CallLink {
  const es = new EventSource(`${VOICE_API}/call/${encodeURIComponent(room)}/events`);
  // Announce only once subscribed, so the other side's reply can't be missed.
  es.onopen = () => { onStatus?.(true); void link.send('hello').catch(() => {}); };
  es.onerror = () => onStatus?.(false);
  es.onmessage = (m) => {
    const e = JSON.parse(m.data) as CallEvent;
    if (e.who !== me) onEvent(e);
  };
  const link: CallLink = {
    async send(kind, text = '') {
      const r = await fetch(`${VOICE_API}/call/${encodeURIComponent(room)}`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ who: me, kind, text }),
      });
      if (!r.ok) throw new Error(`relay ${r.status}`);
      return ((await r.json()) as { listeners: number }).listeners;
    },
    close() { es.close(); },
  };
  return link;
}

/** The demo room. Both devices open the same code. */
export const DEMO_ROOM = 'frank-ellie';
