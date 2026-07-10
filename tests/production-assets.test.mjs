import assert from 'node:assert/strict';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..', 'public', 'assets');

test('all production music routes have ogg and mp3 fallbacks', async () => {
  const tracks = [
    'menu',
    'map-act-1',
    'map-act-2',
    'map-act-3',
    'battle-act-1',
    'battle-act-2',
    'battle-act-3',
    'boss'
  ];
  for (const track of tracks) {
    for (const extension of ['ogg', 'mp3']) {
      const info = await stat(path.join(root, 'audio', 'v2', `bgm-${track}.${extension}`));
      assert.ok(info.size > 100_000, `${track}.${extension} should contain a real music track`);
    }
  }
});

test('defeat art uses the transparent production asset', async () => {
  const info = await stat(path.join(root, 'generated', 'defeat-tombstone-v2.png'));
  assert.ok(info.size > 100_000);
});
