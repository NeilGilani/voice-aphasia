import '../app/app.css';
import './os.css';
import './landing.css';

const STATS = [
  { n: '~2 million', l: 'people in the U.S. live with aphasia', src: 'NIDCD', href: 'https://www.nidcd.nih.gov/health/aphasia' },
  { n: '100k–180k', l: 'Americans acquire it every year', src: 'ASHA', href: 'https://www.asha.org/practice-portal/clinical-topics/aphasia/' },
  { n: '21–38%', l: 'of acute stroke patients develop aphasia', src: 'StatPearls / NCBI', href: 'https://www.ncbi.nlm.nih.gov/books/NBK559315/' },
];

const APPS = [
  { i: '🗣️', t: 'Talk', d: 'Say the pieces. Get 3 full sentences. Tap one, and it speaks in your own voice.', href: '#/app' },
  { i: '📞', t: 'Calls & messages', d: 'Faces, not phone numbers. Picture messages from family come in already simplified.', href: '#/app' },
  { i: '🧾', t: 'Read the world', d: 'Hold up a bill, a letter or a menu. The camera reads it back as one short line.', href: '#/app' },
  { i: '💳', t: 'Money, safely', d: 'You decide to pay; a family helper confirms it. Nothing moves money on its own.', href: '#/family' },
  { i: '🌞', t: 'My Day', d: 'Pills, meals and appointments as pictures, with a gentle spoken nudge.', href: '#/day' },
  { i: '📖', t: 'Memory Book', d: 'People, photos, stories and favourite topics. Built with family, so Voice knows your life.', href: '#/memory' },
  { i: '⭐', t: 'Practice', d: 'Therapy inside real life: after you choose a sentence, try saying one word from it.', href: '#/practice' },
  { i: '👨‍👩‍👧', t: 'Family bridge', d: 'Family can see today, send pictures, say things simply, and help with payments.', href: '#/family' },
];

export default function Landing() {
  return (
    <div className="lp">
      <div className="v-aurora" aria-hidden />
      <nav className="glass lp-nav">
        <span className="v-brand"><i className="v-dot" />VoiceOS</span>
        <span className="lp-links"><a href="#/family">For family</a><a href="#/app" className="os-btn">Open VoiceOS</a></span>
      </nav>

      <header className="lp-hero">
        <p className="os-kicker">An operating system for people living with aphasia</p>
        <h1>The words are still there.<br /><em>We built everything else around that.</em></h1>
        <p className="lp-sub">
          After a stroke, someone can understand everything and know exactly what they mean, and still not be able to say it.
          Phones, bills, menus and messages all assume words. VoiceOS rebuilds them around what they can still do:
          faces, pictures, pointing and tapping.
        </p>
        <div className="glass lp-demo">
          <p className="lp-frag">water… no… Ellie… phone… birthday</p>
          <div className="lp-arrow">↓</div>
          <p className="lp-chosen">“Call Ellie and wish her a happy birthday. Tell her I love her.”</p>
          <p className="lp-tag">🔊 in his own voice · 📞 calling Ellie…</p>
        </div>
      </header>

      <section className="lp-story">
        <h2>Fully present. Trapped without words.</h2>
        <p>
          Aphasia affects language, not intelligence. The person at the dinner table still has opinions, jokes and love to give,
          but the conversation moves on without them. Family starts answering for them. A phone call, a bill or a text from a
          grandchild turns into a wall.
        </p>
        <p>Picture boards and AAC apps help, but they make you build every sentence from scratch, one icon at a time. VoiceOS starts from what you already said.</p>
      </section>

      <section className="lp-stats">
        {STATS.map((s) => (
          <a key={s.n} className="glass lp-stat" href={s.href} target="_blank" rel="noreferrer">
            <b>{s.n}</b><span>{s.l}</span><small>Source: {s.src} ↗</small>
          </a>
        ))}
      </section>

      <section className="lp-apps">
        <h2>One home screen. Everything rebuilt.</h2>
        <div className="lp-grid">
          {APPS.map((a) => (
            <a key={a.t} href={a.href} className="glass lp-app">
              <span className="lp-ic">{a.i}</span><h3>{a.t}</h3><p>{a.d}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="glass lp-how">
        <h2>How it understands</h2>
        <ol>
          <li><b>Hears the fragments.</b> Speech recognition that keeps the broken words and pauses.</li>
          <li><b>Sees what you point at.</b> Hand and object detection runs in the browser, and only labels leave the device.</li>
          <li><b>Knows your life.</b> Memory Book, today's routine, the date, and every sentence you chose before.</li>
          <li><b>Offers three, never one.</b> You stay the author. Nothing is said until you choose.</li>
        </ol>
      </section>

      <footer className="lp-foot">
        <p>Elevate the ordinary: a birthday call, a bill, “I love you.”</p>
        <p className="os-muted">Built at BayValleyHacks 2026. VoiceOS is an assistive prototype, not a medical device.</p>
      </footer>
    </div>
  );
}
