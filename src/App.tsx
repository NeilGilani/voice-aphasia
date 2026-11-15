import { useEffect, useState } from 'react';
import VoiceOS from './app/VoiceOS';
import { Caller } from './phone';
import { PatientApp } from './app/PatientApp';
import { Family, Landing, MemoryBook, MyDay, Practice, Progress } from './pages';

const route = () => window.location.hash.replace(/^#\/?/, '');

export default function App() {
  const [r, setR] = useState(route());
  useEffect(() => {
    const on = () => setR(route());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  if (r === 'family') return <Family />;
  if (r === '' || r === 'landing') return <Landing />;
  if (r === 'memory') return <MemoryBook />;
  if (r === 'day') return <MyDay />;
  if (r === 'practice') return <Practice />;
  if (r === 'progress') return <Progress />;
  if (r.startsWith('caller')) return <Caller />;
  if (r === 'classic') return <PatientApp />;
  return <VoiceOS />;
}
