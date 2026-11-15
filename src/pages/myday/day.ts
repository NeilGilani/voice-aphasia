import { KEYS, useStored } from '../shared';

export interface DayItem {
  id: string; time: string; what: string; icon: string;
  kind: 'routine' | 'med' | 'appt';
  /** Gentle spoken prompt, e.g. "Time for your morning pills." */
  prompt: string;
  doneAt?: number;
}
export interface DayData { date: string; items: DayItem[] }

const seed: DayItem[] = [
  { id: 'pills-am', time: '08:00', what: 'Morning pills', icon: '💊', kind: 'med', prompt: 'Time for your morning pills, with a glass of water.' },
  { id: 'breakfast', time: '08:30', what: 'Breakfast', icon: '🍳', kind: 'routine', prompt: "Let's have breakfast." },
  { id: 'walk', time: '10:30', what: 'Walk outside', icon: '🚶', kind: 'routine', prompt: 'A short walk outside would feel good.' },
  { id: 'call-ellie', time: '12:00', what: "Call Ellie — it's her birthday", icon: '🎂', kind: 'routine', prompt: "It's Ellie's birthday. Want to call her?" },
  { id: 'therapy', time: '15:00', what: 'Speech therapy', icon: '🗣️', kind: 'appt', prompt: 'Speech therapy with Dr. Patel at three.' },
  { id: 'pills-pm', time: '20:00', what: 'Evening pills', icon: '💊', kind: 'med', prompt: 'Time for your evening pills.' },
];

const todayKey = () => new Date().toDateString();

export function useDay() {
  const [d, setD] = useStored<DayData>(KEYS.day, { date: todayKey(), items: seed });
  // New day → clear ticks, keep the schedule.
  if (d.date !== todayKey()) {
    const fresh = { date: todayKey(), items: d.items.map((i) => ({ ...i, doneAt: undefined })) };
    queueMicrotask(() => setD(fresh));
    return [fresh, setD] as const;
  }
  return [d, setD] as const;
}

export const minutes = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + (m || 0); };
export const pretty = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return `${((h + 11) % 12) + 1}${m ? ':' + String(m).padStart(2, '0') : ''} ${h < 12 ? 'am' : 'pm'}`;
};

/** The next not-done item (or the overdue one), for the big "now" card. */
export function nextItem(items: DayItem[], now = new Date()): DayItem | undefined {
  const t = now.getHours() * 60 + now.getMinutes();
  const open = items.filter((i) => !i.doneAt).sort((a, b) => minutes(a.time) - minutes(b.time));
  return open.find((i) => minutes(i.time) <= t + 60) ?? open[0];
}
