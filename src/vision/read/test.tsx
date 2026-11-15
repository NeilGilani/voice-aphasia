import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../app/app.css';
import { demoContext } from '../../app/store';
import { ReadWorld } from './index';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="v-shell">
      <div className="v-aurora" />
      <div className="v-top" style={{ marginBottom: 16 }}><div className="v-brand"><span className="v-dot" />Read the world</div></div>
      <ReadWorld context={demoContext} />
    </div>
  </StrictMode>,
);
