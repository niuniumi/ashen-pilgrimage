import assert from 'node:assert/strict';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { enemies } from '../src/data/enemies.js';
import { resolvePixelActorAsset } from '../src/art/PixelAssetCatalog.js';

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

test('pixel production backgrounds and Chinese font are bundled locally', async () => {
  const backgrounds = ['menu.png', 'map.png', 'folio.png', 'battle-act-1.png', 'battle-act-2.png', 'battle-act-3.png'];
  for (const background of backgrounds) {
    const info = await stat(path.join(root, 'pixel', 'backgrounds', background));
    assert.ok(info.size > 500_000, `${background} should contain production pixel art`);
  }
  const font = await stat(path.join(root, 'fonts', 'fusion-pixel-10px-zh-hans.woff2'));
  assert.ok(font.size > 100_000, 'pixel Chinese font should be bundled locally');
});

test('every production enemy has a semantic pixel asset binding', () => {
  const atlasFrames = new Set();
  for (const enemy of enemies) {
    const resolved = resolvePixelActorAsset(enemy.id);
    assert.ok(resolved, `${enemy.id} should resolve to a pixel asset`);
    assert.equal(resolved.assetId, enemy.id === 'graveyard-skeleton' ? 'grave-skeleton' : enemy.id);
    if (Number.isInteger(resolved.asset.frameIndex)) {
      assert.equal(atlasFrames.has(resolved.asset.frameIndex), false, `${enemy.id} reuses atlas frame ${resolved.asset.frameIndex}`);
      atlasFrames.add(resolved.asset.frameIndex);
    }
  }
  assert.equal(atlasFrames.size, 16);
});
