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
