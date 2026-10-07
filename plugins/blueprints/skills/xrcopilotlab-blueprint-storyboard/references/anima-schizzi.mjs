// Anima gli schizzi delle scene Dn: ogni tratto si disegna, i testi compaiono, la luce azzurra pulsa
// dove decide una persona. Registra la pagina (Chrome di sistema), taglia l'avvio e monta la voce.
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
// playwright-core: quello del pacchetto xrcopilotlab-demo (cartella estratta, o clone del banco).
// Si indica con PLAYWRIGHT_CORE_FROM=<cartella con node_modules>; senza, quello del progetto corrente.
const require = createRequire((process.env.PLAYWRIGHT_CORE_FROM || process.cwd()) + '/package.json');
const { chromium } = require('playwright-core');

const scenes = JSON.parse(readFileSync('dscenes.json', 'utf8'));   // [{n, code, dur, humans}]
mkdirSync('clips', { recursive: true });
mkdirSync('rec', { recursive: true });

const script = (dur, human) => `
(() => {
  const D = ${dur} * 1000, svg = document.querySelector('.sk svg');
  const shapes = [...svg.querySelectorAll('path,line,rect,circle,ellipse,polyline,polygon')];
  const texts = [...svg.querySelectorAll('text')];
  const drawEnd = D * 0.62;
  shapes.forEach((el, i) => {
    let len = 0; try { len = el.getTotalLength(); } catch {}
    const delay = (i / Math.max(1, shapes.length)) * (drawEnd * 0.7);
    const fillOp = el.getAttribute('fill-opacity');
    if (len > 0) {
      el.style.strokeDasharray = len; el.style.strokeDashoffset = len;
      el.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: drawEnd * 0.3 + 200, delay, fill: 'forwards', easing: 'ease-out' });
    }
    if (el.getAttribute('fill') && el.getAttribute('fill') !== 'none') {
      el.style.opacity = 0;
      el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: delay + 250, fill: 'forwards' });
    }
  });
  texts.forEach((el, i) => {
    el.style.opacity = 0;
    el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 450, delay: drawEnd * 0.35 + i * 140, fill: 'forwards' });
  });
  const tit = document.querySelector('.tit');
  tit.style.opacity = 0;
  tit.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: 250, fill: 'forwards' });
  ${human ? `
  // decisione umana: alone azzurro che pulsa sugli elementi azzurri
  const blue = shapes.filter(e => (e.getAttribute('stroke') || '').includes('umano'));
  blue.forEach(el => el.animate(
    [{ filter: 'drop-shadow(0 0 0 rgba(14,165,233,0))' }, { filter: 'drop-shadow(0 0 8px rgba(14,165,233,.95))' }, { filter: 'drop-shadow(0 0 0 rgba(14,165,233,0))' }],
    { duration: 1100, delay: D * 0.55, iterations: 2, fill: 'none' }));` : ''}
  window.__t0 = performance.now();
})();`;

const browser = await chromium.launch({ channel: 'chrome', headless: true });
for (const s of scenes) {
  const t = Date.now();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: 'rec', size: { width: 1280, height: 720 } } });
  const page = await ctx.newPage();
  await page.goto('file://' + process.cwd() + `/frames/f${s.n}.html`);
  const startedMs = Date.now() - t;                       // il video parte con il contesto
  await page.evaluate(script(s.dur, s.humans));
  await page.waitForTimeout(s.dur * 1000 + 400);
  await ctx.close();
  const webm = readdirSync('rec').filter(f => f.endsWith('.webm')).map(f => join('rec', f))[0];
  const out = `clips/${s.code}-scena-${s.n}`;
  // solo immagine (per l'animatic)
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', webm, '-ss', String((startedMs / 1000).toFixed(2)), '-t', String(s.dur),
    '-vf', 'fps=25,format=yuv420p', '-c:v', 'libx264', '-crf', '22', '-an', '-movflags', '+faststart', `${out}-solo-video.mp4`]);
  // con la voce neurale di quella scena
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', `${out}-solo-video.mp4`, '-i', `audio/scena-${s.n}.mp3`,
    '-filter_complex', `[1:a]adelay=450|450,apad=whole_dur=${s.dur}[a]`, '-map', '0:v', '-map', '[a]', '-t', String(s.dur),
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', `${out}.mp4`]);
  rmSync(webm);
  console.log(`✓ ${out}.mp4 (${s.dur} s)`);
}
await browser.close();
