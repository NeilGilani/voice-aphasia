import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { VisionCamera, getSeenObjects } from './index';
import type { SeenObject } from '../contracts';

function Test() {
  const [seen, setSeen] = useState<SeenObject[]>([]);
  const [debug, setDebug] = useState(true);
  const [facing, setFacing] = useState<'user' | 'environment'>('user');
  useEffect(() => { const t = setInterval(() => setSeen(getSeenObjects(5)), 500); return () => clearInterval(t); }, []);
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <h2 style={{ margin: '4px 0 12px' }}>Vision test</h2>
      <VisionCamera debug={debug} facingMode={facing} />
      <div style={{ display: 'flex', gap: 12, margin: '12px 0' }}>
        <label><input type="checkbox" checked={debug} onChange={(e) => setDebug(e.target.checked)} /> debug boxes</label>
        <button onClick={() => setFacing(facing === 'user' ? 'environment' : 'user')}>flip camera</button>
      </div>
      <h3>getSeenObjects(5)</h3>
      <pre id="seen" style={{ background: '#1a1a22', padding: 12, borderRadius: 12 }}>{JSON.stringify(seen, null, 2)}</pre>
    </div>
  );
}
createRoot(document.getElementById('root')!).render(<StrictMode><Test /></StrictMode>);
