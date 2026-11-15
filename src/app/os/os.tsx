/* VoiceOS kernel: navigation stack, toasts, shared state, voice engine. */
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import type { PersonContext, VoiceEngine } from '../../contracts';
import { CONTACTS, MESSAGES, type Contact, type Msg } from './persona';
import { usePersonContext } from '../store';
import { getVoice } from '../adapters';

export type Route = { app: string; params?: Record<string, string> };
export interface Toast { id: number; title: string; body: string; emoji?: string; contact?: Contact; onTap?: () => void }

interface OS {
  route: Route; dir: 'fwd' | 'back' | 'home'; depth: number;
  open(app: string, params?: Record<string, string>): void;
  back(): void; home(): void;
  toast(t: Omit<Toast, 'id'>): void; toasts: Toast[]; dismiss(id: number): void;
  ctx: PersonContext; setCtx(c: PersonContext | ((p: PersonContext) => PersonContext)): void;
  contacts: Contact[]; messages: Msg[]; addMessage(m: Omit<Msg, 'id' | 'at'>): void; markRead(from: string): void;
  voice: VoiceEngine;
}

const Ctx = createContext<OS>(null!);
export const useOS = () => useContext(Ctx);

export function OSProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<Route[]>([{ app: 'home' }]);
  const [dir, setDir] = useState<'fwd' | 'back' | 'home'>('home');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [messages, setMessages] = useState<Msg[]>(MESSAGES);
  const [ctx, setCtx] = usePersonContext();
  const voice = useMemo(() => getVoice(), []);
  const tid = useRef(0);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = ++tid.current;
    setToasts((x) => [...x.slice(-2), { ...t, id }]);
    setTimeout(() => dismiss(id), 6000);
  }, [dismiss]);

  const os: OS = {
    route: stack[stack.length - 1], dir, depth: stack.length,
    open: (app, params) => { setDir(app === 'home' ? 'home' : 'fwd'); setStack((s) => app === 'home' ? [{ app }] : [...s, { app, params }]); },
    back: () => { setDir('back'); setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)); },
    home: () => { setDir('home'); setStack([{ app: 'home' }]); },
    toast, toasts, dismiss, ctx, setCtx,
    contacts: CONTACTS, messages,
    addMessage: (m) => setMessages((x) => [...x, { ...m, id: crypto.randomUUID(), at: Date.now(), read: true }]),
    markRead: (from) => setMessages((x) => x.map((m) => (m.from === from ? { ...m, read: true } : m))),
    voice,
  };
  return <Ctx.Provider value={os}>{children}</Ctx.Provider>;
}
