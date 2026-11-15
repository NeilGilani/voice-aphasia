import { useEffect, useState } from 'react';
import VoiceOS from './app/VoiceOS';
import { PatientApp } from './app/PatientApp';
import { Family, Landing } from './pages';

const route = () => window.location.hash.replace(/^#\/?/, '');

export default function App() {
  const [r, setR] = useState(route());
  useEffect(() => {
    const on = () => setR(route());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  if (r === 'family') return <Family />;
  if (r === 'landing') return <Landing />;
  if (r === 'classic') return <PatientApp />;
  return <VoiceOS />;
}
