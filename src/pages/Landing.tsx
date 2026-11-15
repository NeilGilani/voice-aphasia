import './pages.css';

const STATS = [
  { n: '~2 million', l: 'people in the U.S. live with aphasia', src: 'NIDCD', href: 'https://www.nidcd.nih.gov/health/aphasia' },
  { n: '100k–180k', l: 'Americans acquire it every year', src: 'ASHA', href: 'https://www.asha.org/practice-portal/clinical-topics/aphasia/' },
  { n: '21–38%', l: 'of acute stroke patients develop aphasia', src: 'StatPearls / NCBI', href: 'https://www.ncbi.nlm.nih.gov/books/NBK559315/' },
];

const STEPS = [
  { icon: '👂', t: 'It listens to the pieces', d: '“water… no… Ellie… phone… birthday.” Broken words are still signal.' },
  { icon: '👉', t: 'It sees what you point at', d: 'The camera notices the phone in your hand or the photo on the fridge.' },
  { icon: '🧠', t: 'It knows your life', d: 'Who Ellie is. That today is her birthday. What you chose last time.' },
  { icon: '🃏', t: 'Three full sentences', d: 'Big cards. Tap one, or just nod. You stay the author.' },
  { icon: '🗣️', t: 'In your own voice', d: 'Cloned from an old voicemail, so it still sounds like you.' },
];

export default function Landing() {
  return (
    <div className="pg pg-landing">
      <div className="pg-aurora" aria-hidden />
      <nav className="land-nav glass">
        <span className="pg-brand">Voice</span>
        <span className="land-links">
          <a href="#/family">Family mode</a>
          <a href="#/app" className="pg-btn sm">Open the app</a>
        </span>
      </nav>

      <header className="land-hero">
        <p className="land-eyebrow">For people living with aphasia</p>
        <h1>The words are still there.<br /><em>We help them out.</em></h1>
        <p className="land-sub">
          After a stroke, someone can understand everything, know exactly what they mean — and still not be able to say it.
          Voice turns the fragments they <i>can</i> say into the sentence they <i>meant</i>, and speaks it in their own voice.
        </p>
        <div className="land-demo glass">
          <p className="frag">water… no… Ellie… phone… birthday</p>
          <div className="arrow">↓</div>
          <p className="chosen">“Call Ellie and wish her a happy birthday. Tell her I love her.”</p>
          <p className="voice-tag">🔊 in his own voice</p>
        </div>
      </header>

      <section className="land-story">
        <h2>Fully present. Trapped without words.</h2>
        <p>
          Aphasia affects language, not intelligence. The person at the dinner table still has opinions, jokes and love to give —
          but conversations move on without them. Families start answering for them. They go quiet.
        </p>
        <p>
          Picture boards and AAC apps help, but they ask the person to build every sentence from scratch, one icon at a time.
          Voice starts from what they already said.
        </p>
      </section>

      <section className="land-stats">
        {STATS.map((s) => (
          <a key={s.n} className="glass stat" href={s.href} target="_blank" rel="noreferrer">
            <span className="stat-n">{s.n}</span>
            <span className="stat-l">{s.l}</span>
            <span className="stat-src">Source: {s.src} ↗</span>
          </a>
        ))}
      </section>

      <section className="land-steps">
        <h2>How it works</h2>
        <div className="steps">
          {STEPS.map((s) => (
            <div key={s.t} className="glass step">
              <span className="step-i">{s.icon}</span>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="land-family glass">
        <div>
          <h2>And it works both ways.</h2>
          <p>
            Long sentences are hard to follow with aphasia. <b>Family mode</b> listens to the people who love them and shows
            each idea as one short sentence with a picture.
          </p>
        </div>
        <a href="#/family" className="pg-btn">Try Family mode →</a>
      </section>

      <footer className="land-foot">
        <p>Elevate the ordinary: a birthday call, asking for water, saying “I love you.”</p>
        <p className="small">Built at BayValleyHacks 2026. Voice is an assistive prototype, not a medical device.</p>
      </footer>
    </div>
  );
}
