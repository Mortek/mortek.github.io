import { promises as fs } from 'node:fs';
import path from 'node:path';

async function entryNames(dir) {
  const ents = await fs.readdir(dir, { withFileTypes: true });
  return ents;
}

function hasWav(ents) {
  return ents.some((e) => e.isFile() && e.name.toLowerCase().endsWith('.wav'));
}

// A song folder is one that directly contains a .wav. If `root` is itself a
// song folder, return [root]; otherwise recurse exactly one level.
export async function findSongFolders(root) {
  const abs = path.resolve(root);
  const ents = await entryNames(abs);
  if (hasWav(ents)) return [abs];
  const out = [];
  for (const e of ents) {
    if (!e.isDirectory()) continue;
    const sub = path.join(abs, e.name);
    if (hasWav(await entryNames(sub))) out.push(sub);
  }
  return out.sort();
}

// Resolve the assets for a single song folder. `title` is the wav basename.
// Image variants are matched case-insensitively by exact name.
export async function resolveSongAssets(folder) {
  const abs = path.resolve(folder);
  const files = (await entryNames(abs)).filter((e) => e.isFile()).map((e) => e.name);
  const wav = files.find((n) => n.toLowerCase().endsWith('.wav'));
  if (!wav) return null;
  const title = wav.replace(/\.wav$/i, '');
  const find = (name) => {
    const hit = files.find((n) => n.toLowerCase() === name.toLowerCase());
    return hit ? path.join(abs, hit) : null;
  };
  return {
    title,
    folder: abs,
    audio: path.join(abs, wav),
    landscape: find(`${title}.png`),
    youtube: find(`${title} Youtube shorts.png`),
  };
}
