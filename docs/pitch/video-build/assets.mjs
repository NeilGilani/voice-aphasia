import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: process.env.HOME + '/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
const base = `<style>*{margin:0;box-sizing:border-box}body{width:1920px;height:1080px;overflow:hidden;font-family:-apple-system,"SF Pro Display",system-ui,sans-serif;color:#fff;background:#070814;position:relative}
.w{position:absolute;inset:-20%;filter:blur(60px);background:radial-gradient(38% 30% at 18% 12%,rgba(124,92,255,.62),transparent 70%),radial-gradient(34% 28% at 88% 28%,rgba(0,190,255,.42),transparent 70%),radial-gradient(40% 36% at 30% 78%,rgba(255,92,154,.32),transparent 70%),radial-gradient(30% 30% at 85% 90%,rgba(62,230,160,.22),transparent 70%)}
.c{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:28px;padding:0 200px}
h1{font-size:88px;letter-spacing:-.04em;line-height:1.05;font-weight:800}h2{font-size:54px;font-weight:700;letter-spacing:-.03em;line-height:1.2}
.g{background:linear-gradient(90deg,#b3a8ff,#38d0ff,#ff8fbf);-webkit-background-clip:text;color:transparent}.s{font-size:28px;color:rgba(255,255,255,.6)}
.lbl{position:absolute;font-size:26px;font-weight:700;color:rgba(255,255,255,.75);letter-spacing:.02em}
.bz{position:absolute;border-radius:64px;background:#111;box-shadow:0 30px 90px rgba(0,0,0,.6),0 0 0 2px rgba(255,255,255,.12)}
.lap{position:absolute;border-radius:22px;background:#111;box-shadow:0 30px 90px rgba(0,0,0,.6),0 0 0 2px rgba(255,255,255,.12)}
.brand{position:absolute;left:60px;top:44px;font-size:30px;font-weight:800;display:flex;gap:12px;align-items:center}.dot{width:16px;height:16px;border-radius:50%;background:radial-gradient(circle,#fff,#8b7bff);box-shadow:0 0 18px #8b7bff}</style><div class=w></div>`;
const shot = async (name, html, transparent = false) => { await p.setContent(base + html); await p.screenshot({ path: `assets/${name}.png`, omitBackground: transparent }); };
await shot('t1', `<div class=c><h1>Frank knows exactly<br>what he wants to say.</h1></div>`);
await shot('t2', `<div class=c><h2>After a stroke, the words don’t come out.<br>It’s called <span class=g>aphasia</span>.</h2><p class=s>About 2 million people in the U.S. live with it · NIDCD</p></div>`);
await shot('t3', `<div class=c><h1><span class=g>VoiceOS</span></h1><h2 style="font-size:44px;color:rgba(255,255,255,.8)">His phone, rebuilt around what he can still do.</h2></div>`);
await shot('t4', `<div class=c><h1><span class=g>VoiceOS.</span><br>Elevate the ordinary.</h1><p class=s>The words are still there. · BayValleyHacks 2026</p></div>`);
// single phone bg: phone 444x956 centred at x=738,y=62
await shot('bg1', `<div class=brand><i class=dot></i>VoiceOS</div><div class=bz style="left:722px;top:46px;width:476px;height:988px"></div><div class=lbl style="left:0;right:0;text-align:center;top:1040px;font-size:22px">Frank’s phone · real app, real Claude, his cloned voice</div>`);
// call bg: phone at x=150,y=62 ; laptop 1150x715 at x=680,y=182
await shot('bg2', `<div class=brand><i class=dot></i>VoiceOS</div><div class=bz style="left:134px;top:46px;width:476px;height:988px"></div><div class=lbl style="left:134px;width:476px;text-align:center;top:1040px;font-size:22px">Frank’s phone</div><div class=lap style="left:664px;top:166px;width:1182px;height:747px"></div><div class=lbl style="left:664px;width:1182px;text-align:center;top:930px;font-size:22px">Ellie’s laptop · she talks normally, hears his replies in his own voice</div>`);
await p.setViewportSize({ width: 444, height: 956 });
await p.setContent(`<style>*{margin:0}body{background:#000}div{width:444px;height:956px;border-radius:52px;background:#fff}</style><div></div>`);
await p.screenshot({ path: 'assets/mask.png' });
await b.close();
