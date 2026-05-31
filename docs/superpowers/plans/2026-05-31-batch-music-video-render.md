# Batch Music-Video Render Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Node script (+ thin Claude skill) that, for a folder of song assets, drives `music_visualizer.html` headlessly to render the TikTok short, YouTube short, and landscape video and drop the `.webm` files back into the folder.

**Architecture:** A tiny static HTTP server serves the repo over `127.0.0.1` (secure context for WebCodecs). puppeteer-core drives system google-chrome: it deletes `window.showSaveFilePicker` to force the in-page encoder's Blob `<a download>` path, points Chrome's download dir at a temp folder inside the song folder, uploads the file inputs, applies a locked settings profile, clicks the download button, waits for completion, then moves the file to its canonical name. Pure asset-discovery logic is isolated and unit-tested; browser automation is integration-tested against a real song folder.

**Tech Stack:** Node 20 (ESM), `puppeteer-core` (drives `/usr/bin/google-chrome`), `node:test`, `node:http`.

**Spec:** `docs/superpowers/specs/2026-05-31-batch-music-video-render-design.md`

**Note on testing:** Browser+WebCodecs rendering cannot be meaningfully unit-tested without the real page, so the encoder-driving code is verified by integration runs against the real test folder. Only the pure discovery logic gets unit tests (Task 3).

**Note on cache-busting:** This work adds files under `tools/`, `docs/`, and `.claude/`. It does NOT modify any site CSS/JS/HTML, so the `sw.js` / `?v=N` / visualizer-version bumps in `CLAUDE.md` do **not** apply here.

---

## File Structure

- Create `tools/batch-render/package.json` — pins `puppeteer-core`, ESM, `node --test`.
- Create `tools/batch-render/discover.mjs` — pure asset discovery (song folders + per-song asset paths).
- Create `tools/batch-render/test/discover.test.mjs` — unit tests for discovery.
- Create `tools/batch-render/profile.mjs` — locked settings profile (data) + in-page applier function.
- Create `tools/batch-render/server.mjs` — ephemeral static file server.
- Create `tools/batch-render/render.mjs` — CLI + browser orchestration (imports the three modules above).
- Create `.claude/skills/render-music-videos/SKILL.md` — thin skill wrapper.

---

## Task 1: Scaffold package + install puppeteer-core

**Files:**
- Create: `tools/batch-render/package.json`

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "batch-render",
  "version": "1.0.0",
  "type": "module",
  "private": true,
  "description": "Headless batch renderer for music_visualizer.html",
  "bin": { "batch-render": "./render.mjs" },
  "scripts": { "test": "node --test" },
  "dependencies": { "puppeteer-core": "^23.0.0" }
}
```

- [ ] **Step 2: Install dependency**

Run: `cd tools/batch-render && npm install`
Expected: creates `node_modules/` + `package-lock.json`, installs `puppeteer-core` with no Chromium download.

- [ ] **Step 3: Verify puppeteer-core can drive system Chrome**

Run:
```bash
cd tools/batch-render && node -e "import('puppeteer-core').then(async p=>{const b=await p.default.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox']});const pg=await b.newPage();await pg.goto('about:blank');console.log('OK', await pg.evaluate(()=>navigator.userAgent));await b.close();})"
```
Expected: prints `OK Mozilla/5.0 ... Chrome/...` and exits cleanly.

- [ ] **Step 4: Ignore node_modules + temp render dirs**

Append to repo root `.gitignore` (create the lines if absent):
```
tools/batch-render/node_modules/
.render-tmp-*/
```

- [ ] **Step 5: Commit**

```bash
git add tools/batch-render/package.json tools/batch-render/package-lock.json .gitignore
git commit -m "chore(batch-render): scaffold package with puppeteer-core"
```

---

## Task 2: Static file server

**Files:**
- Create: `tools/batch-render/server.mjs`

- [ ] **Step 1: Write `server.mjs`**

```js
import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg',
  '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json',
};

// Serves `rootDir` over 127.0.0.1 on an OS-assigned port.
// Returns { server, port, origin }.
export async function startServer(rootDir) {
  const root = path.resolve(rootDir);
  const server = http.createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      const filePath = path.normalize(path.join(root, urlPath === '/' ? '/index.html' : urlPath));
      if (!filePath.startsWith(root)) { res.writeHead(403).end('forbidden'); return; }
      const data = await fs.readFile(filePath);
      res.writeHead(200, { 'content-type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
      res.end(data);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  return { server, port, origin: `http://127.0.0.1:${port}` };
}
```

- [ ] **Step 2: Verify it serves the visualizer**

Run:
```bash
cd tools/batch-render && node -e "import('./server.mjs').then(async m=>{const s=await m.startServer('../..');const r=await fetch(s.origin+'/music_visualizer.html');const t=await r.text();console.log(r.status, t.includes('id=\"dlBtn\"')?'HAS dlBtn':'MISSING dlBtn');s.server.close();})"
```
Expected: `200 HAS dlBtn`

- [ ] **Step 3: Commit**

```bash
git add tools/batch-render/server.mjs
git commit -m "feat(batch-render): static file server for secure-context serving"
```

---

## Task 3: Asset discovery (TDD)

**Files:**
- Create: `tools/batch-render/discover.mjs`
- Test: `tools/batch-render/test/discover.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { findSongFolders, resolveSongAssets } from '../discover.mjs';

const FOLDER = '/home/maurice/Downloads/Epic Viking Warrior Music/Age Of Heroes';

test('findSongFolders returns the folder itself when it contains an mp3', async () => {
  const folders = await findSongFolders(FOLDER);
  assert.deepEqual(folders, [FOLDER]);
});

test('findSongFolders recurses one level into a parent of song folders', async () => {
  const parent = path.dirname(FOLDER);
  const folders = await findSongFolders(parent);
  assert.ok(folders.includes(FOLDER), 'should include the Age Of Heroes subfolder');
});

test('resolveSongAssets finds all three variants and ignores decoys', async () => {
  const a = await resolveSongAssets(FOLDER);
  assert.equal(a.title, 'Age Of Heroes');
  assert.equal(path.basename(a.mp3), 'Age Of Heroes.mp3');
  assert.equal(path.basename(a.landscape), 'Age Of Heroes.png');
  assert.equal(path.basename(a.tiktok), 'Age Of Heroes Tik Tok.png');
  assert.equal(path.basename(a.youtube), 'Age Of Heroes Youtube shorts.png');
  // "Age Of Heroes 2MB.png" must NOT be chosen as the landscape image
  assert.ok(!a.landscape.includes('2MB'));
});

test('resolveSongAssets matches image suffixes case-insensitively', async () => {
  // "Youtube shorts" in the test folder is lowercase "shorts"; matching must still succeed
  const a = await resolveSongAssets(FOLDER);
  assert.ok(a.youtube && a.youtube.toLowerCase().endsWith('youtube shorts.png'));
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd tools/batch-render && node --test test/discover.test.mjs`
Expected: FAIL — `Cannot find module '../discover.mjs'`.

- [ ] **Step 3: Write `discover.mjs`**

```js
import { promises as fs } from 'node:fs';
import path from 'node:path';

async function entryNames(dir) {
  const ents = await fs.readdir(dir, { withFileTypes: true });
  return ents;
}

function hasMp3(ents) {
  return ents.some((e) => e.isFile() && e.name.toLowerCase().endsWith('.mp3'));
}

// A song folder is one that directly contains a .mp3. If `root` is itself a
// song folder, return [root]; otherwise recurse exactly one level.
export async function findSongFolders(root) {
  const abs = path.resolve(root);
  const ents = await entryNames(abs);
  if (hasMp3(ents)) return [abs];
  const out = [];
  for (const e of ents) {
    if (!e.isDirectory()) continue;
    const sub = path.join(abs, e.name);
    if (hasMp3(await entryNames(sub))) out.push(sub);
  }
  return out.sort();
}

// Resolve the assets for a single song folder. `title` is the mp3 basename.
// Image variants are matched case-insensitively by exact name.
export async function resolveSongAssets(folder) {
  const abs = path.resolve(folder);
  const files = (await entryNames(abs)).filter((e) => e.isFile()).map((e) => e.name);
  const mp3 = files.find((n) => n.toLowerCase().endsWith('.mp3'));
  if (!mp3) return null;
  const title = mp3.replace(/\.mp3$/i, '');
  const find = (name) => {
    const hit = files.find((n) => n.toLowerCase() === name.toLowerCase());
    return hit ? path.join(abs, hit) : null;
  };
  return {
    title,
    folder: abs,
    mp3: path.join(abs, mp3),
    landscape: find(`${title}.png`),
    tiktok: find(`${title} Tik Tok.png`),
    youtube: find(`${title} Youtube shorts.png`),
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd tools/batch-render && node --test test/discover.test.mjs`
Expected: PASS — 4 tests passing.

- [ ] **Step 5: Commit**

```bash
git add tools/batch-render/discover.mjs tools/batch-render/test/discover.test.mjs
git commit -m "feat(batch-render): song-folder + asset discovery with tests"
```

---

## Task 4: Locked settings profile

**Files:**
- Create: `tools/batch-render/profile.mjs`

- [ ] **Step 1: Write `profile.mjs`**

```js
// Locked look for automated renders. Each key is a DOM control id; each value
// is that control's option `value` (selects) or raw value (range inputs).
// Confirmed against music_visualizer.html on 2026-05-31. Edit here to retune.
const SHARED = {
  // Particles
  partStyle: 'sparksint',   // Sparks Intensified
  partIntensity: '2',       // High
  partAmount: '500',        // Tons (500)
  partSpeed: '1',           // Fast
  partSize: '1',            // Normal
  partLife: '4',            // Very Long
  bassReact: '70',          // Strong
  // Spectrum Bars (barIntensity is set per-tab below)
  barThreshold: '0.08',     // Low
  barCount: '100',
  barWidth: '2.5',          // Normal
  barLength: '0.07',        // Short
  barSmoothing: '0.003',    // Smooth
  innerRadius: '110',       // Small
  barCaps: '0',             // Off
  barGlow: '6',             // Subtle
  reactRadius: '0.5',       // Strong
  // Visual
  colorScheme: 'imageColors',
  overlay: '0',             // None
  centerShadow: '0.9',      // Very Dark
  logoTint: '40',           // 40%
  partGlow: '8',            // Subtle
  partTrails: '0.5',        // Faint
  vigColor: '0',            // Off
  colorCycle: '0',          // Off
  // Background FX
  bassZoom: '0.003',        // Very Subtle
  brightPulse: '0',         // Off
  vigPulse: '0.35',         // Strong
  hueShift: '0.1',          // Very Slow (inert while Enable Hue is off)
  hueSat: '100',            // 100%
  cameraShake: '1',         // Very Subtle
};

export const LANDSCAPE_PROFILE = { ...SHARED, barIntensity: '2' };   // High
export const SHORTS_PROFILE = { ...SHARED, barIntensity: '1.5', shortsDur: '58' }; // Medium-High, 60 sec
export const HUE_ENABLED = false; // "Enable Hue" checkbox

// Runs IN THE PAGE (passed to page.evaluate). Sets every control and fires the
// input/change events the visualizer listens for. `hueOn` toggles the checkbox.
export function applyProfileInPage(values, hueOn) {
  for (const [id, val] of Object.entries(values)) {
    const el = document.getElementById(id);
    if (!el) continue;
    el.value = String(val);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
  const hue = document.getElementById('hueShiftOn');
  if (hue) {
    hue.checked = !!hueOn;
    hue.dispatchEvent(new Event('change', { bubbles: true }));
  }
}
```

- [ ] **Step 2: Sanity-check the module loads and exports profiles**

Run:
```bash
cd tools/batch-render && node -e "import('./profile.mjs').then(m=>console.log(m.LANDSCAPE_PROFILE.barIntensity, m.SHORTS_PROFILE.barIntensity, m.SHORTS_PROFILE.shortsDur, m.HUE_ENABLED))"
```
Expected: `2 1.5 58 false`

- [ ] **Step 3: Commit**

```bash
git add tools/batch-render/profile.mjs
git commit -m "feat(batch-render): locked settings profile + in-page applier"
```

---

## Task 5: Orchestrator (render.mjs)

**Files:**
- Create: `tools/batch-render/render.mjs`

- [ ] **Step 1: Write `render.mjs` (complete)**

```js
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
  const out = { overwrite: false, headful: false, concurrency: 1, folder: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--overwrite') out.overwrite = true;
    else if (a === '--headful') out.headful = true;
    else if (a === '--concurrency') out.concurrency = Math.max(1, parseInt(argv[++i], 10) || 1);
    else if (!a.startsWith('--')) out.folder = a;
  }
  return out;
}

// ---- Browser helpers ----
async function launch(headful) {
  return puppeteer.launch({ executablePath: CHROME, headless: headful ? false : 'new', args: LAUNCH_ARGS });
}

async function openPage(browser, url) {
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => { try { delete window.showSaveFilePicker; } catch {} });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForSelector('#dlBtn');
  return page;
}

async function setDownloadDir(page, dir) {
  const client = await page.target().createCDPSession();
  await client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: dir });
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
  const page = await openPage(browser, origin + '/music_visualizer.html');
  const dlDir = await fs.mkdtemp(path.join(assets.folder, '.render-tmp-'));
  try {
    await setDownloadDir(page, dlDir);
    if (kind === 'landscape') {
      await page.click('.tab-btn[data-tab="landscape"]');
      await uploadAndWait(page, '#imgInput', assets.landscape, 'imgLabel');
      await uploadAndWait(page, '#audioInput', assets.mp3, 'audioLabel');
      await uploadAndWait(page, '#logoInput', LOGO, 'logoLabel');
      await page.evaluate(applyProfileInPage, LANDSCAPE_PROFILE, HUE_ENABLED);
      await page.waitForFunction(() => !document.getElementById('dlBtn').disabled, { timeout: 60000 });
      await page.click('#dlBtn');
      await awaitStatusDone(page, 'status', RENDER_TIMEOUT_MS);
    } else {
      const portrait = kind === 'tiktok' ? assets.tiktok : assets.youtube;
      await page.click('.tab-btn[data-tab="shorts"]');
      await uploadAndWait(page, '#portraitInput', portrait, 'portraitLabel');
      await uploadAndWait(page, '#shortsAudioInput', assets.mp3, 'shortsAudioLabel');
      await uploadAndWait(page, '#shortsLogoInput', LOGO, 'shortsLogoLabel');
      await page.evaluate(applyProfileInPage, SHORTS_PROFILE, HUE_ENABLED);
      await page.waitForFunction(() => !document.getElementById('shortsDlBtn').disabled, { timeout: 60000 });
      await page.click('#shortsDlBtn');
      await awaitStatusDone(page, 'shortsStatus', RENDER_TIMEOUT_MS);
    }
    const webm = await waitForWebm(dlDir, 60000);
    await fs.rename(webm, outPath);
  } finally {
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
    console.error('Usage: node render.mjs "<folder>" [--overwrite] [--headful] [--concurrency N]');
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
  let browser = await launch(args.headful);

  // WebCodecs probe; relaunch headful if unavailable headless.
  if (!args.headful) {
    const probe = await openPage(browser, origin + '/music_visualizer.html');
    const ok = await probe.evaluate(() => typeof VideoEncoder !== 'undefined');
    await probe.close();
    if (!ok) {
      console.warn('WebCodecs unavailable headless — relaunching headful.');
      await browser.close();
      browser = await launch(true);
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
```

- [ ] **Step 2: Make it executable**

Run: `chmod +x tools/batch-render/render.mjs`
Expected: no output.

- [ ] **Step 3: Verify usage guard (no folder arg)**

Run: `cd tools/batch-render && node render.mjs; echo "exit=$?"`
Expected: prints the `Usage:` line and `exit=2`.

- [ ] **Step 4: Commit**

```bash
git add tools/batch-render/render.mjs
git commit -m "feat(batch-render): headless orchestrator driving the visualizer"
```

---

## Task 6: End-to-end test against the real folder

**Files:** none (verification only)

- [ ] **Step 1: Pre-clean any stale outputs in the test folder**

Run:
```bash
ls "/home/maurice/Downloads/Epic Viking Warrior Music/Age Of Heroes/"*.webm 2>/dev/null || echo "no webm yet"
```
Expected: `no webm yet` (if `.webm` files exist from a prior run and you want a clean test, delete them or rely on `--overwrite`).

- [ ] **Step 2: Run the full batch on the test folder**

Run:
```bash
cd /home/maurice/Projects/mortek.github.io/tools/batch-render && node render.mjs "/home/maurice/Downloads/Epic Viking Warrior Music/Age Of Heroes"
```
Expected console order: `RENDER Age Of Heroes [tiktok]` → `DONE` → `[youtube]` → `DONE` → `[landscape]` → `DONE`, then `Summary: 3 rendered, 0 skipped, 0 failed.` and exit 0.
(If WebCodecs is unavailable headless you'll see the relaunch-headful warning first — that's expected and fine.)

- [ ] **Step 3: Verify the three output files exist and are non-trivial**

Run:
```bash
cd "/home/maurice/Downloads/Epic Viking Warrior Music/Age Of Heroes" && ls -la "Age Of Heroes.webm" "Age Of Heroes Tik Tok.webm" "Age Of Heroes Youtube shorts.webm"
```
Expected: three `.webm` files, each well over 100 KB (landscape largest, full-song length).

- [ ] **Step 4: Verify each file is a valid WebM with video + audio**

Run (uses ffprobe if available; otherwise inspect headers):
```bash
cd "/home/maurice/Downloads/Epic Viking Warrior Music/Age Of Heroes"
if command -v ffprobe >/dev/null; then
  for f in "Age Of Heroes.webm" "Age Of Heroes Tik Tok.webm" "Age Of Heroes Youtube shorts.webm"; do
    echo "== $f =="; ffprobe -v error -show_entries stream=codec_type,codec_name,width,height,duration -of default=noprint_wrappers=1 "$f";
  done
else
  for f in *.webm; do echo "$f:"; head -c4 "$f" | xxd; done
fi
```
Expected with ffprobe: each shows a `vp8` video stream and an `opus` audio stream; the two shorts report `width=1080 height=1920` and duration ≈ 60 s + outro; the landscape reports `width=1920 height=1080` and duration ≈ full song + 5 s fade. Without ffprobe: each file starts with the EBML magic `1a45 dfa3`.

- [ ] **Step 5: Verify skip-existing on re-run**

Run:
```bash
cd /home/maurice/Projects/mortek.github.io/tools/batch-render && node render.mjs "/home/maurice/Downloads/Epic Viking Warrior Music/Age Of Heroes"
```
Expected: three `SKIP ... — output already exists` lines and `Summary: 0 rendered, 3 skipped, 0 failed.`, exit 0.

- [ ] **Step 6: Spot-check the look (manual)**

Open `Age Of Heroes.webm` in a player and confirm it visually matches the intended profile (Image Colors scheme, Very Dark center shadow, Strong vignette pulse, spark particles, no hue rotation). If it differs, adjust `profile.mjs` and re-run with `--overwrite`.

---

## Task 7: Claude skill wrapper

**Files:**
- Create: `.claude/skills/render-music-videos/SKILL.md`

- [ ] **Step 1: Write `SKILL.md`**

```markdown
---
name: render-music-videos
description: Use when the user wants to batch-render Mortek music-visualizer videos for a song folder — generates the TikTok short, YouTube short, and landscape .webm by driving music_visualizer.html headlessly. Triggers - "render the videos for <folder>", "make the visualizer videos", "batch render music videos".
---

# Render Music Videos

Batch-renders the three visualizer videos (TikTok short, YouTube short, landscape) for one song folder or a parent of song folders, using the headless renderer at `tools/batch-render/`.

## Expected folder contents (per song)

- `<title>.mp3` — audio (defines `<title>`)
- `<title>.png` — landscape image
- `<title> Tik Tok.png` — TikTok portrait image
- `<title> Youtube shorts.png` — YouTube Shorts portrait image (matched case-insensitively)

The logo is always `/home/maurice/Documents/Music/Youtube/profile_picture_transparant_background.png`.

## How to run

1. Ensure deps are installed (first time only):
   `cd tools/batch-render && npm install`
2. Run the batch (shorts first, then landscape; skips existing `.webm`):
   `node tools/batch-render/render.mjs "<folder>"`
3. Flags: `--overwrite` (re-render existing), `--headful` (visible Chrome), `--concurrency N` (parallel renders, default 1 — raising it competes for CPU).

Outputs (`<title> Tik Tok.webm`, `<title> Youtube shorts.webm`, `<title>.webm`) land in the same folder. Report the final `Summary:` line and any `FAIL`/`SKIP` reasons to the user. A non-zero exit means something failed or an image variant was missing.

## Tuning the look

The locked visual profile lives at the top of `tools/batch-render/profile.mjs` (`LANDSCAPE_PROFILE` / `SHORTS_PROFILE`). Edit values there and re-run with `--overwrite` to change the look.
```

- [ ] **Step 2: Verify the skill is discoverable**

Run: `cat .claude/skills/render-music-videos/SKILL.md | head -5`
Expected: shows the YAML frontmatter with `name: render-music-videos`.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/render-music-videos/SKILL.md
git commit -m "feat(batch-render): add render-music-videos skill wrapper"
```

---

## Task 8: Final verification & push

**Files:** none

- [ ] **Step 1: Run discovery unit tests once more**

Run: `cd tools/batch-render && node --test`
Expected: all tests PASS.

- [ ] **Step 2: Confirm clean git state**

Run: `git status --short`
Expected: clean (all work committed).

- [ ] **Step 3: Push**

Run: `git push`
Expected: pushes the new commits to `master`. (No cache-bust needed — no site CSS/JS/HTML changed.)

---

## Self-Review Notes

- **Spec coverage:** offline-encoder reuse (Tasks 5–6), secure-context serving (Task 2), `showSaveFilePicker` deletion + download capture (Task 5 `openPage`/`setDownloadDir`), case-insensitive asset discovery ignoring decoys (Task 3), shorts-first order (Task 5 `jobsForSong`), locked per-tab profile incl. Shorts=Medium-High / Landscape=High and Enable-Hue-off (Task 4), 60-sec shorts via `shortsDur:'58'` (Task 4), skip-existing (Task 5 `shouldSkip` + Task 6 Step 5), sequential default w/ `--concurrency` (Task 5 `runPool`), headless→headful fallback (Task 5 `main` probe), move-into-folder with canonical names (Task 5 `renderOne`/`jobsForSong`), summary + non-zero exit on failure/missing (Task 5 `main`), E2E test on Age Of Heroes (Task 6). All covered.
- **Placeholder scan:** none — all steps contain runnable code/commands.
- **Type consistency:** `findSongFolders`/`resolveSongAssets` signatures match between `discover.mjs`, its test, and `render.mjs`; `applyProfileInPage(values, hueOn)` matches the `page.evaluate(applyProfileInPage, PROFILE, HUE_ENABLED)` calls; label ids passed to `uploadAndWait` (`imgLabel`, `audioLabel`, `logoLabel`, `portraitLabel`, `shortsAudioLabel`, `shortsLogoLabel`) and status ids (`status`, `shortsStatus`) match the verified DOM.
```
