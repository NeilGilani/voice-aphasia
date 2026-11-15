import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: process.env.HOME + '/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
const base = `<style>*{margin:0;box-sizing:border-box}body{width:1920px;height:1080px;overflow:hidden;font-family:-apple-system,"SF Pro Display",system-ui,sans-serif;color:#fff;background:#070814;position:relative}
.w{position:absolute;inset:-20%;filter:blur(60px);background:radial-gradient(38% 30% at 18% 12%,rgba(124,92,255,.55),transparent 70%),radial-gradient(34% 28% at 88% 28%,rgba(0,190,255,.38),transparent 70%),radial-gradient(40% 36% at 30% 78%,rgba(255,92,154,.28),transparent 70%),radial-gradient(30% 30% at 85% 90%,rgba(62,230,160,.2),transparent 70%)}
.c{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:30px;padding:0 220px}
h1{font-size:84px;letter-spacing:-.04em;line-height:1.06;font-weight:800}h2{font-size:56px;font-weight:700;letter-spacing:-.03em;line-height:1.2}
.g{background:linear-gradient(90deg,#b3a8ff,#38d0ff,#ff8fbf);-webkit-background-clip:text;color:transparent}.s{font-size:28px;color:rgba(255,255,255,.6)}
.glass{background:linear-gradient(145deg,rgba(255,255,255,.17),rgba(255,255,255,.05));border:1px solid rgba(255,255,255,.22);border-radius:36px;box-shadow:0 18px 50px rgba(0,0,0,.45)}
.lbl{position:absolute;font-size:24px;font-weight:600;color:rgba(255,255,255,.6)}
.bz{position:absolute;border-radius:70px;background:#111;box-shadow:0 30px 90px rgba(0,0,0,.6),0 0 0 2px rgba(255,255,255,.12)}
.cap{position:absolute;left:1000px;right:140px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;gap:22px}
.cap small{text-transform:uppercase;letter-spacing:.16em;font-size:22px;color:rgba(255,255,255,.55);font-weight:700}
.cap b{font-size:58px;line-height:1.12;letter-spacing:-.03em}.cap p{font-size:30px;color:rgba(255,255,255,.7);line-height:1.4}
.brand{position:absolute;left:60px;top:44px;font-size:30px;font-weight:800;display:flex;gap:12px;align-items:center}.dot{width:16px;height:16px;border-radius:50%;background:radial-gradient(circle,#fff,#8b7bff);box-shadow:0 0 18px #8b7bff}</style><div class=w></div>`;
const shot = async (name, html) => { await p.setContent(base + html); await p.screenshot({ path: `s/${name}.png` }); };
await shot('s1', `<div class=c><h1>They understand everything.<br><span class=g>The words come out wrong.</span></h1><p class=s>About 2 million Americans live with aphasia · most often after a stroke · NIDCD</p></div>`);
await shot('s2', `<div class=c><h2 style="font-size:64px">My grandfather was affected by aphasia.</h2><h2 class=g style="font-size:64px">That’s why I built this.</h2></div>`);
const T = 'car… no… sick… sorry… love';
for (let k = 0; k <= T.length; k++) {
  await shot('d' + String(k).padStart(2, '0'), `<div class=c><p class=s style="font-size:24px;letter-spacing:.14em;text-transform:uppercase">Dictation / Siri today · recreation</p>
  <div class=glass style="width:1100px;padding:56px 64px;text-align:left"><div style="font-size:26px;color:rgba(255,255,255,.55);margin-bottom:22px">🎙️ Transcribing…</div>
  <div style="font-size:70px;font-weight:600;letter-spacing:-.02em;min-height:90px">${T.slice(0, k)}<span style="display:inline-block;width:4px;height:66px;background:#38d0ff;margin-left:6px;vertical-align:-8px"></span></div>
  <div style="font-size:26px;color:rgba(255,255,255,.5);margin-top:26px">Every word written down correctly. None of it is what he means.</div></div></div>`);
}
const ph = (cap, title, sub) => `<div class=brand><i class=dot></i>VoiceOS</div><div class=bz style="left:362px;top:24px;width:497px;height:1032px"></div><div class=lbl style="left:362px;width:497px;text-align:center;top:1040px;font-size:0"></div><div class=cap><small>${cap}</small><b>${title}</b><p>${sub}</p></div>`;
await shot('p1', ph('Real app · Frank’s phone', 'Frank calls his granddaughter, Ellie.', 'She talks normally from her laptop. Her words arrive short and simple, with pictures.'));
await shot('p2', ph('What Frank types', '“car no sick sorry love”', 'Five words. The wrong first one. That’s what comes out.'));
await shot('p3', ph('VoiceOS · real Claude output', 'Three full sentences.', 'With a short “because” for each. He stays the author.'));
await shot('p4', ph('In Frank’s own cloned voice', '“I’m sorry, sweetheart. I’m sick, so I can’t come Saturday. I love you.”', ''));
await shot('end', `<div class=c><h1><span class=g>VoiceOS</span></h1><h2 style="font-size:46px;color:rgba(255,255,255,.85)">From hearing your words to understanding you.</h2><p class=s>Elevate the ordinary · BayValleyHacks 2026</p></div>`);
await p.setViewportSize({ width: 461, height: 1000 });
await p.setContent(`<style>*{margin:0}body{background:#000}div{width:461px;height:1000px;border-radius:56px;background:#fff}</style><div></div>`);
await p.screenshot({ path: 's/mask.png' });
await b.close();
