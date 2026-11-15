/*
 * Phone (ws/voice). Integration: in src/app/VoiceOS.tsx, after the built-ins are registered:
 *   import { registerPhone } from '../phone'; registerPhone();   // replaces the simulated 'call' screen
 * and route  #/caller → <Caller/>  (Ellie's device).
 */
import { registerApp } from '../app/os/registry';
import { PhoneCall } from './PhoneCall';
export { PhoneCall } from './PhoneCall';
export { Caller } from './Caller';
export { joinCall, DEMO_ROOM, type CallEvent, type CallLink } from './relay';

export function registerPhone() {
  registerApp({ id: 'call', name: 'Call', emoji: '📞', hue: 140, component: PhoneCall, hidden: true });
}
