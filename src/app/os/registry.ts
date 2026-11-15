/* App registry. Other workstreams: registerApp({...}) from your module, or ask the integration lead. */
import type { ComponentType } from 'react';

export interface AppDef {
  id: string; name: string; emoji: string; hue: number;
  component: ComponentType<{ params?: Record<string, string> }>;
  /** Hidden from the launcher grid (e.g. sub-screens). */
  hidden?: boolean;
  badge?: () => number;
}

export const APPS = new Map<string, AppDef>();
export function registerApp(a: AppDef) { APPS.set(a.id, a); }
export const launcher = () => [...APPS.values()].filter((a) => !a.hidden);
