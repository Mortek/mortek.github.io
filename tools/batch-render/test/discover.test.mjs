import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { findSongFolders, resolveSongAssets } from '../discover.mjs';

const FOLDER = '/home/maurice/Downloads/Epic Viking Warrior Music/Age Of Heroes';

test('findSongFolders returns the folder itself when it contains a wav', async () => {
  const folders = await findSongFolders(FOLDER);
  assert.deepEqual(folders, [FOLDER]);
});

test('findSongFolders recurses one level into a parent of song folders', async () => {
  const parent = path.dirname(FOLDER);
  const folders = await findSongFolders(parent);
  assert.ok(folders.includes(FOLDER), 'should include the Age Of Heroes subfolder');
});

test('resolveSongAssets finds the audio + image variants and ignores decoys', async () => {
  const a = await resolveSongAssets(FOLDER);
  assert.equal(a.title, 'Age Of Heroes');
  assert.equal(path.basename(a.audio), 'Age Of Heroes.wav');
  assert.equal(path.basename(a.landscape), 'Age Of Heroes.png');
  assert.equal(path.basename(a.youtube), 'Age Of Heroes Youtube shorts.png');
  assert.ok(!a.landscape.includes('2MB'));
});

test('resolveSongAssets matches image suffixes case-insensitively', async () => {
  const a = await resolveSongAssets(FOLDER);
  assert.ok(a.youtube && a.youtube.toLowerCase().endsWith('youtube shorts.png'));
});
