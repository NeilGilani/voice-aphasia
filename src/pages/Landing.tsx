import '../app/os/tokens.css';
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
      <div className="os-wall" aria-hidden />
      <nav className="os-glass lp-nav">
        <span className="lp-brand"><i className="lp-dot" />VoiceOS</span>
        <span className="lp-links"><a href="#/family">For family</a><a href="#/app" className="sp-btn">Open VoiceOS</a></span>
      </nav>

      <header className="lp-hero">
        <p className="sp-kicker">Elevating the voice assistant</p>
        <h1>Voice assistants fail the people<br /><em>who need them most.</em></h1>
        <p className="lp-sub">
          Siri, Alexa and Google Assistant are built into almost every phone and speaker. But say a sentence the way a stroke
          survivor with aphasia says it, and the answer is “Sorry, I didn’t get that.” VoiceOS is the assistant rebuilt for them:
          it understands <i>meaning</i> from broken speech, answers in <i>your own voice</i>, and acts.
        </p>
        <div className="lp-vs">
          <div className="os-glass lp-side bad">
            <small>Today’s voice assistant</small>
            <p className="lp-frag">“Hey Siri… call… uh… Ellie… no… phone…”</p>
            <p className="lp-reply">Sorry, I didn’t get that.</p>
          </div>
          <div className="os-glass lp-side good">
            <small>VoiceOS</small>
            <p className="lp-frag">“call… uh… Ellie… no… phone… birthday”</p>
            <p className="lp-chosen">“Call Ellie and wish her a happy birthday.”</p>
            <p className="lp-tag">🔊 in his own voice · 📞 calling Ellie…</p>
          </div>
        </div>
      </header>

      <section className="lp-story">
        <h2>The flaw: assistants match words. People mean things.</h2>
        <p>
          Voice assistants expect clean, complete commands. Many people can’t give them: stroke survivors with aphasia,
          people with dysarthria from Parkinson’s or ALS, people who stutter, many older adults. They are fully present,
          they know exactly what they mean, and the assistant on their phone still doesn’t understand them.
        </p>
        <p>
          VoiceOS keeps the voice assistant and changes what it listens for. It takes the fragments, what you point at,
          who is in your life and what day it is, and offers three full sentences. You tap one, and it is said in your own
          cloned voice. Then it makes the call, sends the text, reads the letter.
        </p>
      </section>

      <section className="lp-stats">
        {STATS.map((s) => (
          <a key={s.n} className="os-glass lp-stat" href={s.href} target="_blank" rel="noreferrer">
            <b>{s.n}</b><span>{s.l}</span><small>Source: {s.src} ↗</small>
          </a>
        ))}
      </section>

      <section className="lp-apps">
        <h2>One home screen. Everything rebuilt.</h2>
        <div className="lp-grid">
          {APPS.map((a) => (
            <a key={a.t} href={a.href} className="os-glass lp-app">
              <span className="lp-ic">{a.i}</span><h3>{a.t}</h3><p>{a.d}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="os-glass lp-how">
        <h2>What we elevated</h2>
        <ol>
          <li><b>Hears the fragments.</b> Speech recognition that keeps the broken words and pauses.</li>
          <li><b>Sees what you point at.</b> Hand and object detection runs in the browser, and only labels leave the device.</li>
          <li><b>Knows your life.</b> Memory Book, today's routine, the date, and every sentence you chose before.</li>
          <li><b>Offers three, never one.</b> You stay the author. Nothing is said until you choose.</li>
        </ol>
      </section>

      <footer className="lp-foot">
        <p>Elevate the ordinary: a birthday call, a bill, “I love you.”</p>
        <p className="sp-muted">Built at BayValleyHacks 2026. VoiceOS is an assistive prototype, not a medical device.</p>
      </footer>
    </div>
  );
}
