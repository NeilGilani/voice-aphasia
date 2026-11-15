export interface ReadResult {
  kind: 'bill' | 'medicine' | 'appointment' | 'menu' | 'letter' | 'package' | 'sign' | 'other';
  icon: string;
  title: string;
  /** The one thing that matters: "$84 · due Friday". */
  headline: string;
  summary: string;
  /** Numbers as pictures: big value, icon, tiny label. */
  facts: { icon: string; label: string; value: string }[];
  actions: { type: 'call' | 'remind' | 'help' | 'pay' | 'none'; label: string; to?: string; when?: string }[];
  warning?: string;
  confidence: number;
  ms?: number;
  via?: string;
}
