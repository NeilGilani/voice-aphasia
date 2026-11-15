import { chromium } from 'playwright';
import fs from 'fs';
const BASE = 'http://localhost:5177';
const OUT = process.cwd() + '/raw';
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT);
const browser = await chromium.launch({ executablePath: process.env.HOME + '/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing', headless: true, args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-video-capture=${process.cwd()}/bill.y4m`, '--autoplay-policy=no-user-gesture-required'] });
const log = [];
const T0 = Date.now();
let frank, ellie;
const MK = `(() => { const d = document.createElement('div'); d.id='__mk'; d.style.cssText='position:fixed;left:0;top:0;width:8px;height:8px;z-index:2147483647;background:rgb(0,0,0);pointer-events:none'; const add=()=>document.body?document.body.appendChild(d):setTimeout(add,10); add(); })()`;
const mark = async (ev, extra = {}) => { const i = log.length; const g = 16 + i * 6; const e = { ev, i, g, t: (Date.now() - T0) / 1000, ...extra }; log.push(e); console.log(JSON.stringify(e));
  for (const p of [frank, ellie]) if (p) await p.evaluate((g) => { const d = document.getElementById('__mk'); if (d) d.style.background = `rgb(${g},${g},${g})`; }, g).catch(() => {});
  await new Promise((r) => setTimeout(r, 250)); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const fctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, permissions: ['camera', 'microphone'], recordVideo: { dir: OUT + '/frank', size: { width: 780, height: 1688 } } });
frank = await fctx.newPage(); await frank.addInitScript(MK);
await frank.addInitScript(() => { try { localStorage.removeItem('voice.practice.v1'); } catch {} });
await frank.goto(BASE + '/#/app'); await await mark('frank_page');
await sleep(1500);
await mark('home');
await sleep(6000);
await frank.mouse.wheel(0, 500); await sleep(2500); await frank.mouse.wheel(0, -500); await sleep(1500);

// Read the bill with the (fake) camera
const openApp = async (name) => { await frank.locator('.os-dock-btn[aria-label="Home"]').click().catch(() => {}); await sleep(700); const b = frank.locator(`.os-app:has(span:text-is("${name}"))`).first(); await b.scrollIntoViewIfNeeded(); await sleep(400); await b.click(); await sleep(900); };
await mark('read_open'); await openApp('Read');
await sleep(3000);
await frank.locator('.rw-shoot').click(); await mark('read_shoot');
await frank.locator('.rw-act').first().waitFor({ timeout: 90000 }); await mark('read_result');
await sleep(7000);
await frank.mouse.wheel(0, 400); await sleep(3000);

// Ellie's laptop
const ectx = await browser.newContext({ viewport: { width: 1280, height: 800 }, recordVideo: { dir: OUT + '/ellie', size: { width: 1280, height: 800 } } });
ellie = await ectx.newPage(); await ellie.addInitScript(MK);
await ellie.goto(BASE + '/#/caller'); await await mark('ellie_page'); await sleep(2500);

await mark('call_open'); await openApp('Phone');
await sleep(1200);
await frank.locator('button', { hasText: 'Ellie' }).first().click(); await mark('call_dial');
await frank.locator('.ph-mode.live').waitFor({ timeout: 20000 }); await mark('call_live');
await sleep(2000);
const ellieSay = async (text) => { const i = ellie.locator('.caller-type input'); await i.click(); await i.pressSequentially(text, { delay: 28 }); await sleep(400); await ellie.locator('.caller-type button').click(); await mark('ellie_said', { text }); };
await ellieSay("Hi Grandpa!! Thank you for calling on my birthday! Mom said you got a letter in the mail and you were worried about it. Is everything okay?");
await frank.locator('.ph-in').last().locator('text=/./').first().waitFor(); await sleep(7000); await mark('frank_read_simplified');

const compose = async (frags) => {
  const inp = frank.locator('.cp-type input'); await inp.click(); await inp.pressSequentially(frags, { delay: 90 }); await mark('frags_typed', { frags });
  await sleep(600); await inp.press('Enter'); await mark('thinking');
  await frank.locator('.cp-card:not(.skel)').first().waitFor({ timeout: 120000 }); await mark('cards');
  await sleep(6500);
  const text = (await frank.locator('.cp-card:not(.skel) .cp-text').first().innerText()).trim();
  await frank.locator('.cp-card:not(.skel)').first().click(); await mark('tap', { text });
  await frank.locator('.cp-label', { hasText: 'Tap and talk' }).waitFor({ timeout: 60000 }); await mark('spoken_done', { text });
  return text;
};
await frank.mouse.wheel(0, 600);
const t1 = await compose('bill… money… help… Saturday');
await sleep(3500);
await ellieSay("Of course, Grandpa! I'll come over on Saturday and we'll pay the electric bill together. Don't worry about it at all.");
await sleep(8000); await mark('ellie_reply_read');
const t2 = await compose('Ellie… love… you');
await sleep(4000);
await ellieSay('I love you too, Grandpa ❤️ See you Saturday!');
await sleep(6000); await mark('call_end');

// Montage
for (const app of ['Messages', 'Memories', 'My Day', 'Practice', 'Family']) {
  await mark('montage', { app }); await openApp(app); await sleep(3200);
  await frank.mouse.wheel(0, 300); await sleep(1300);
}
await mark('end');
await sleep(800);
const fv = frank.video(), ev = ellie.video();
await fctx.close(); await ectx.close(); await browser.close();
fs.copyFileSync(await fv.path(), OUT + '/frank.webm'); fs.copyFileSync(await ev.path(), OUT + '/ellie.webm');
fs.writeFileSync(OUT + '/log.json', JSON.stringify(log, null, 1));
