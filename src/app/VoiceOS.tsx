/* VoiceOS: registers the built-in apps and boots the shell. */
import { useEffect } from 'react';
import { OSProvider, Shell, registerApp, useOS, contact } from './os';
import Home from './screens/Home';
import Talk from './screens/Talk';
import Read from './screens/Read';
import { Call, Person, Phone } from './screens/People';
import { Messages, Thread } from './screens/Messages';
import { Emergency, MemoryDetail, Money } from './screens/Life';
import { FamilyBridge, MemoryBook, MyDay, Practice, Progress } from '../pages';
import { AboutMe } from './screens/System';
import { MESSAGES } from './os/persona';

const unread = () => MESSAGES.filter((m) => !m.read).length;

registerApp({ id: 'home', name: 'Home', emoji: '⌂', hue: 250, component: Home, hidden: true });
registerApp({ id: 'talk', name: 'Talk', emoji: '🗣️', hue: 255, component: Talk });
registerApp({ id: 'phone', name: 'Phone', emoji: '📞', hue: 140, component: Phone });
registerApp({ id: 'messages', name: 'Messages', emoji: '💬', hue: 200, component: Messages, badge: unread });
registerApp({ id: 'read', name: 'Read', emoji: '📷', hue: 175, component: Read });
registerApp({ id: 'money', name: 'Money', emoji: '💵', hue: 120, component: Money });
registerApp({ id: 'day', name: 'My Day', emoji: '☀️', hue: 45, component: MyDay });
registerApp({ id: 'memories', name: 'Memories', emoji: '📖', hue: 25, component: MemoryBook });
registerApp({ id: 'practice', name: 'Practice', emoji: '🎯', hue: 300, component: Practice });
registerApp({ id: 'family', name: 'Family', emoji: '👨‍👩‍👧', hue: 15, component: FamilyBridge });
registerApp({ id: 'progress', name: 'Progress', emoji: '📈', hue: 160, component: Progress });
registerApp({ id: 'sos', name: 'Emergency', emoji: '🚨', hue: 355, component: Emergency });
registerApp({ id: 'settings', name: 'Settings', emoji: '⚙️', hue: 230, component: AboutMe });
registerApp({ id: 'person', name: 'Person', emoji: '👤', hue: 0, component: Person, hidden: true });
registerApp({ id: 'call', name: 'Call', emoji: '📞', hue: 140, component: Call, hidden: true });
registerApp({ id: 'thread', name: 'Thread', emoji: '💬', hue: 200, component: Thread, hidden: true });
registerApp({ id: 'memory', name: 'Memory', emoji: '📖', hue: 25, component: MemoryDetail, hidden: true });

/** A gentle incoming notification so the OS feels alive on first open. */
function Boot() {
  const os = useOS();
  useEffect(() => {
    const t = setTimeout(() => {
      const ellie = contact('ellie')!;
      os.toast({ contact: ellie, title: 'Ellie', body: 'It’s my birthday 🎂 call me tonight?', onTap: () => os.open('thread', { id: 'ellie' }) });
    }, 2500);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line
  return <Shell />;
}

export default function VoiceOS() {
  return <OSProvider><Boot /></OSProvider>;
}
