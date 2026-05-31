#!/usr/bin/env node
import { promises as fs, createWriteStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { startServer } from './server.mjs';
import { findSongFolders, resolveSongAssets } from './discover.mjs';
import { LANDSCAPE_PROFILE, SHORTS_PROFILE, HUE_ENABLED, applyProfileInPage } from './profile.mjs';

const CHROME = '/usr/bin/google-chrome';
const LOGO = '/home/maurice/Documents/Music/Youtube/profile_picture_transparant_background.png';
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const LAUNCH_ARGS = ['--no-sandbox', '--mute-audio', '--autoplay-policy=no-user-gesture-required'];
const RENDER_TIMEOUT_MS = 30 * 60 * 1000; // per render: full-song landscape encodes take minutes

// ---- CLI parsing ----
function parseArgs(argv) {
  // Headful is the DEFAULT: a visible Chrome gets GPU acceleration, which is
  // dramatically faster for this canvas+VP8 workload. --headless runs windowless
  // (CPU/SwiftShader, much slower) for unattended use without a display.
  const out = { overwrite: false, headless: false, concurrency: 1, folder: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--overwrite') out.overwrite = true;
    else if (a === '--headless') out.headless = true;
    else if (a === '--concurrency') out.concurrency = Math.max(1, parseInt(argv[++i], 10) || 1);
    else if (!a.startsWith('--')) out.folder = a;
  }
  return out;
}

// ---- Browser helpers ----
async function launch(headless) {
  // protocolTimeout (default 180s) caps any single CDP call, including the
  // awaitStatusDone waitForFunction that stays pending for the whole encode.
  // Raise it above RENDER_TIMEOUT_MS so the per-render timeout governs instead.
  return puppeteer.launch({
    executablePath: CHROME,
    headless: headless ? 'new' : false,
    args: LAUNCH_ARGS,
    protocolTimeout: RENDER_TIMEOUT_MS + 60000,
  });
}

// Generic page (used by the WebCodecs probe). Render pages use openRenderPage.
async function openPage(browser, url) {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForSelector('#dlBtn');
  return page;
}

// Runs IN THE PAGE: replaces showSaveFilePicker with a shim whose writable
// streams each chunk (base64) to Node via window.__mvWrite. This keeps the
// page on its low-memory streaming path instead of buffering the whole video
// in a Blob, and pipes the bytes straight to disk on our side.
const STREAMING_SHIM = () => {
  const toB64 = (u8) => {
    let s = ''; const CH = 0x8000;
    for (let i = 0; i < u8.length; i += CH) s += String.fromCharCode.apply(null, u8.subarray(i, i + CH));
    return btoa(s);
  };
  window.showSaveFilePicker = async () => ({
    createWritable: async () => ({
      write: async (data) => {
        const u8 = data instanceof Uint8Array ? data
          : data instanceof ArrayBuffer ? new Uint8Array(data)
          : new Uint8Array(await data.arrayBuffer());
        await window.__mvWrite(toB64(u8));
      },
      close: async () => { await window.__mvClose(); },
      abort: async () => { await window.__mvAbort(); },
    }),
  });
};

// A render page wired to stream the page's WebM output into `ws` (a Node
// write stream). Each render uses its own page + stream, so concurrent renders
// stay isolated. Backpressure: __mvWrite resolves on drain, pausing the encode.
async function openRenderPage(browser, url, ws) {
  const page = await browser.newPage();
  await page.exposeFunction('__mvWrite', (b64) => new Promise((resolve) => {
    const buf = Buffer.from(b64, 'base64');
    if (ws.write(buf)) resolve(); else ws.once('drain', resolve);
  }));
  await page.exposeFunction('__mvClose', () => new Promise((resolve) => ws.end(resolve)));
  await page.exposeFunction('__mvAbort', () => { if (!ws.destroyed) ws.destroy(); });
  await page.evaluateOnNewDocument(STREAMING_SHIM);
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForSelector('#dlBtn');
  return page;
}

// Click via the element's own DOM .click() rather than a coordinate-based mouse
// event, so the fixed-position Donate button (z-index:100, top-right) can't
// intercept clicks on the Download buttons. Also viewport/layout-independent.
async function domClick(page, selector) {
  await page.$eval(selector, (el) => el.click());
}

async function uploadAndWait(page, selector, filePath, labelId) {
  const input = await page.$(selector);
  await input.uploadFile(filePath);
  await page.waitForFunction(
    (id) => { const el = document.getElementById(id); return !!el && el.textContent.trim().startsWith('✓'); },
    { timeout: 60000 }, labelId,
  );
}

// Resolves when status starts with "Done!"; throws if it starts with "Error".
async function awaitStatusDone(page, statusId, timeoutMs) {
  const handle = await page.waitForFunction((id) => {
    const t = (document.getElementById(id)?.textContent || '').trim();
    if (t.startsWith('Done!')) return 'done';
    if (t.startsWith('Error')) return 'error: ' + t;
    return false;
  }, { timeout: timeoutMs, polling: 500 }, statusId);
  const result = await handle.jsonValue();
  if (result.startsWith('error')) throw new Error('Render reported ' + result);
}

// ---- Render one video (kind: 'tiktok' | 'youtube' | 'landscape') ----
async function renderOne(browser, origin, kind, assets, outPath) {
  const dlDir = await fs.mkdtemp(path.join(assets.folder, '.render-tmp-'));
  const outTmp = path.join(dlDir, 'out.webm');
  const ws = createWriteStream(outTmp);
  const page = await openRenderPage(browser, origin + '/music_visualizer.html', ws);
  try {
    if (kind === 'landscape') {
      await domClick(page, '.tab-btn[data-tab="landscape"]');
      await uploadAndWait(page, '#imgInput', assets.landscape, 'imgLabel');
      await uploadAndWait(page, '#audioInput', assets.mp3, 'audioLabel');
      await uploadAndWait(page, '#logoInput', LOGO, 'logoLabel');
      await page.evaluate(applyProfileInPage, LANDSCAPE_PROFILE, HUE_ENABLED);
      await page.waitForFunction(() => !document.getElementById('dlBtn').disabled, { timeout: 60000 });
      await domClick(page, '#dlBtn');
      await awaitStatusDone(page, 'status', RENDER_TIMEOUT_MS);
    } else {
      const portrait = kind === 'tiktok' ? assets.tiktok : assets.youtube;
      await domClick(page, '.tab-btn[data-tab="shorts"]');
      await uploadAndWait(page, '#portraitInput', portrait, 'portraitLabel');
      await uploadAndWait(page, '#shortsAudioInput', assets.mp3, 'shortsAudioLabel');
      await uploadAndWait(page, '#shortsLogoInput', LOGO, 'shortsLogoLabel');
      await page.evaluate(applyProfileInPage, SHORTS_PROFILE, HUE_ENABLED);
      await page.waitForFunction(() => !document.getElementById('shortsDlBtn').disabled, { timeout: 60000 });
      await domClick(page, '#shortsDlBtn');
      await awaitStatusDone(page, 'shortsStatus', RENDER_TIMEOUT_MS);
    }
    // The page awaits writable.close() (-> __mvClose -> ws end/finish) before
    // setting status "Done!", so the file is fully flushed to disk by now.
    await fs.rename(outTmp, outPath);
  } finally {
    if (!ws.writableFinished && !ws.destroyed) ws.destroy();
    await fs.rm(dlDir, { recursive: true, force: true }).catch(() => {});
    await page.close().catch(() => {});
  }
}

// ---- Build the ordered job list (shorts first, then landscape) ----
function jobsForSong(assets, overwrite) {
  const plan = [
    { kind: 'tiktok',    src: assets.tiktok,    out: path.join(assets.folder, `${assets.title} Tik Tok.webm`) },
    { kind: 'youtube',   src: assets.youtube,   out: path.join(assets.folder, `${assets.title} Youtube shorts.webm`) },
    { kind: 'landscape', src: assets.landscape, out: path.join(assets.folder, `${assets.title}.webm`) },
  ];
  return plan.map((j) => ({ ...j, assets, overwrite }));
}

async function shouldSkip(job) {
  if (!job.src) return `missing source image for ${job.kind}`;
  if (!job.overwrite) {
    try { await fs.access(job.out); return 'output already exists'; } catch {}
  }
  return null;
}

// ---- Simple async pool ----
async function runPool(items, concurrency, worker) {
  let i = 0;
  const runNext = async () => {
    while (i < items.length) {
      const idx = i++;
      await worker(items[idx], idx);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, runNext));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.folder) {
    console.error('Usage: node render.mjs "<folder>" [--overwrite] [--headless] [--concurrency N]');
    process.exit(2);
  }
  try { await fs.access(LOGO); } catch { console.error('Logo not found: ' + LOGO); process.exit(2); }

  const songFolders = await findSongFolders(args.folder);
  if (songFolders.length === 0) { console.error('No .mp3 found in ' + args.folder); process.exit(2); }

  const jobs = [];
  for (const folder of songFolders) {
    const assets = await resolveSongAssets(folder);
    if (assets) jobs.push(...jobsForSong(assets, args.overwrite));
  }

  const { server, origin } = await startServer(REPO_ROOT);
  let browser = await launch(args.headless);

  // Only headless risks missing WebCodecs; if so, fall back to headful (GPU).
  if (args.headless) {
    const probe = await openPage(browser, origin + '/music_visualizer.html');
    const ok = await probe.evaluate(() => typeof VideoEncoder !== 'undefined');
    await probe.close();
    if (!ok) {
      console.warn('WebCodecs unavailable headless — relaunching headful.');
      await browser.close();
      browser = await launch(false);
    }
  }

  const results = { done: [], skipped: [], failed: [] };
  try {
    await runPool(jobs, args.concurrency, async (job) => {
      const label = `${job.assets.title} [${job.kind}]`;
      const skip = await shouldSkip(job);
      if (skip) { console.log(`SKIP   ${label} — ${skip}`); results.skipped.push({ label, skip }); return; }
      console.log(`RENDER ${label} ...`);
      try {
        await renderOne(browser, origin, job.kind, job.assets, job.out);
        console.log(`DONE   ${label} -> ${path.basename(job.out)}`);
        results.done.push(label);
      } catch (err) {
        console.error(`FAIL   ${label} — ${err.message}`);
        results.failed.push({ label, error: err.message });
      }
    });
  } finally {
    await browser.close().catch(() => {});
    server.close();
  }

  console.log(`\nSummary: ${results.done.length} rendered, ${results.skipped.length} skipped, ${results.failed.length} failed.`);
  const erroredSkips = results.skipped.filter((s) => s.skip.startsWith('missing'));
  process.exit(results.failed.length > 0 || erroredSkips.length > 0 ? 1 : 0);
}

main().catch((err) => { console.error(err); process.exit(1); });
