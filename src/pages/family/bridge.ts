/* Family-bridge data shared with the patient app: picture messages in, payments to confirm. */
import { KEYS, uid, useStored } from '../shared';

export interface PictureMessage { id: string; from: string; icon: string; text: string; photo?: string; at: number; read?: boolean }
export interface PaymentRequest {
  id: string; payee: string; amount: number; note: string; at: number;
  /** Person taps "pay" on their side; a family helper confirms here. */
  status: 'pending' | 'approved' | 'declined';
}

export const useInbox = () => useStored<PictureMessage[]>(KEYS.inbox, []);
export const usePayments = () =>
  useStored<PaymentRequest[]>(KEYS.payments, [
    { id: 'seed-bill', payee: 'Electric bill', amount: 84.2, note: 'Read from a bill with the camera · due Nov 20', at: Date.now(), status: 'pending' },
  ]);

/** For the patient app / vision: queue a payment for family confirmation. */
export function requestPayment(payee: string, amount: number, note = ''): PaymentRequest {
  const p: PaymentRequest = { id: uid(), payee, amount, note, at: Date.now(), status: 'pending' };
  try {
    const list = JSON.parse(localStorage.getItem(KEYS.payments) || '[]') as PaymentRequest[];
    localStorage.setItem(KEYS.payments, JSON.stringify([p, ...list]));
  } catch { /* ignore */ }
  return p;
}
