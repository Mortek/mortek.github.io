#!/usr/bin/env node
import { promises as fs } from 'node:fs';
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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

// `ctx` may be a Browser (default context, e.g. the WebCodecs probe) or a
// BrowserContext (per-render isolated context) — both expose newPage().
async function openPage(ctx, url) {
  const page = await ctx.newPage();
  await page.evaluateOnNewDocument(() => { try { delete window.showSaveFilePicker; } catch {} });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForSelector('#dlBtn');
  return page;
}

// Per-context download dir: Browser.setDownloadBehavior scoped to browserContextId
// isolates downloads so concurrent renders (separate contexts) never cross-capture.
async function setDownloadDir(page, dir, browserContextId) {
  const client = await page.createCDPSession();
  await client.send('Browser.setDownloadBehavior', {
    behavior: 'allow', downloadPath: dir, browserContextId, eventsEnabled: true,
  });
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

// Waits for a single settled .webm (no .crdownload, size stable ~1.5s).
async function waitForWebm(dir, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let lastSize = -1, stableSince = 0;
  while (Date.now() < deadline) {
    const files = await fs.readdir(dir);
    const downloading = files.some((f) => f.endsWith('.crdownload'));
    const webm = files.find((f) => f.toLowerCase().endsWith('.webm'));
    if (webm && !downloading) {
      const { size } = await fs.stat(path.join(dir, webm));
      if (size === lastSize && size > 0) {
        if (Date.now() - stableSince > 1500) return path.join(dir, webm);
      } else { lastSize = size; stableSince = Date.now(); }
    }
    await sleep(500);
  }
  throw new Error('Timed out waiting for .webm download in ' + dir);
}

// ---- Render one video (kind: 'tiktok' | 'youtube' | 'landscape') ----
async function renderOne(browser, origin, kind, assets, outPath) {
  const context = await browser.createBrowserContext();
  const page = await openPage(context, origin + '/music_visualizer.html');
  const dlDir = await fs.mkdtemp(path.join(assets.folder, '.render-tmp-'));
  try {
    await setDownloadDir(page, dlDir, context.id);
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
    // Encoding is already finished when status says "Done!"; this only waits
    // for Chrome to flush the Blob to disk, but allow ample margin for large files.
    const webm = await waitForWebm(dlDir, 120000);
    await fs.rename(webm, outPath);
  } finally {
    await fs.rm(dlDir, { recursive: true, force: true }).catch(() => {});
    await context.close().catch(() => {});
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
