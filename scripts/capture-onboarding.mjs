import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const DEBUG_PORT = 9335;
const APP_URL = 'http://localhost:8081';
const OUT = './docs/screenshots';
const VW = 414;
const VH = 896;

mkdirSync(OUT, { recursive: true });

const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  `--window-size=${VW},${VH}`,
  `--remote-debugging-port=${DEBUG_PORT}`,
  '--user-data-dir=/tmp/chrome-cap-profile-onb',
  '--no-first-run',
  '--no-default-browser-check',
  'about:blank',
], { stdio: ['ignore', 'pipe', 'pipe'] });
chrome.stderr.on('data', () => {});
chrome.stdout.on('data', () => {});

let wsURL;
for (let i = 0; i < 50; i++) {
  await sleep(200);
  try {
    const j = await (await fetch(`http://localhost:${DEBUG_PORT}/json/version`)).json();
    wsURL = j.webSocketDebuggerUrl; break;
  } catch {}
}
if (!wsURL) { chrome.kill(); throw new Error('chrome did not start'); }

let msgId = 0;
const pending = new Map();
const ws = new WebSocket(wsURL);
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id);
    pending.delete(m.id);
    if (m.error) reject(new Error(m.error.message)); else resolve(m.result);
  }
});
await new Promise((r) => ws.addEventListener('open', r, { once: true }));

const cdp = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
  const id = ++msgId;
  pending.set(id, { resolve, reject });
  ws.send(JSON.stringify({ id, method, params, sessionId }));
});

const { targetInfos } = await cdp('Target.getTargets');
const page = targetInfos.find((t) => t.type === 'page');
const { sessionId } = await cdp('Target.attachToTarget', { targetId: page.targetId, flatten: true });
const send = (m, p) => cdp(m, p, sessionId);

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', {
  width: VW, height: VH, deviceScaleFactor: 2, mobile: true,
});

async function navigate(url) {
  await send('Page.navigate', { url });
  await sleep(500);
  for (let i = 0; i < 30; i++) {
    const { result } = await send('Runtime.evaluate', { expression: 'document.readyState', returnByValue: true });
    if (result.value === 'complete') break;
    await sleep(200);
  }
  await sleep(2500);
}

// 先到根，清掉 onboardingDone 标记，再直接进 onboarding 页
await navigate(APP_URL);
await send('Runtime.evaluate', {
  expression: `(() => { for (const k of ['prefs.onboardingDone','@prefs.onboardingDone']) try { localStorage.removeItem(k); } catch{} })()`,
  returnByValue: true,
});
await navigate(APP_URL + '/onboarding');

const { data } = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync(`${OUT}/onboarding.png`, Buffer.from(data, 'base64'));
console.log(`OK onboarding (${Math.round(data.length * 0.75 / 1024)}KB)`);

ws.close();
chrome.kill();
console.log('done');
