import assert from 'node:assert/strict';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { enemies } from '../src/data/enemies.js';
import { PIXEL_ACTORS, PIXEL_DECORATIONS, resolvePixelActorAsset } from '../src/art/PixelAssetCatalog.js';

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
  for (const enemy of enemies) {
    const resolved = resolvePixelActorAsset(enemy.id);
    assert.ok(resolved, `${enemy.id} should resolve to a pixel asset`);
    assert.equal(resolved.assetId, enemy.id === 'graveyard-skeleton' ? 'grave-skeleton' : enemy.id);
  }
});

test('curated enemy PNGs record their actual source orientation', () => {
  const leftFacingFrames = new Set(['plague-rat-swarm', 'crownless-hound']);
  const atlasEnemyIds = [
    'rotting-villager',
    'plague-rat-swarm',
    'crow-messenger',
    'armor-broken-militia',
    'fallen-paladin',
    'wax-novice',
    'cinder-acolyte',
    'bell-tower-sentry',
    'choir-exorcist',
    'ash-veiled-prioress',
    'hollow-spearman',
    'ashen-banneret',
    'crownless-hound',
    'gate-iron-vicar',
    'royal-pyre-knight',
    'clockwork-confessor'
  ];

  for (const enemyId of atlasEnemyIds) {
    const expected = leftFacingFrames.has(enemyId) ? 'left' : 'right';
    assert.equal(PIXEL_ACTORS[enemyId].facing, expected, `${enemyId} source orientation should be ${expected}`);
  }
});

test('every production enemy uses its own semantic PNG instead of a shared procedural atlas frame', () => {
  const urls = new Set();
  for (const enemy of enemies) {
    const resolved = resolvePixelActorAsset(enemy.id);
    assert.ok(resolved, `${enemy.id} should resolve to a dedicated actor`);
    assert.equal(resolved.asset.frameIndex, undefined, `${enemy.id} should not use a procedural atlas frame`);
    assert.match(resolved.asset.url, new RegExp(`/sprites/${resolved.assetId}\\.png$`));
    assert.equal(urls.has(resolved.asset.url), false, `${enemy.id} reuses ${resolved.asset.url}`);
    urls.add(resolved.asset.url);
  }
  assert.equal(urls.size, enemies.length);
});

test('candle nun hero and ash veiled prioress resolve to visibly independent source files', () => {
  assert.equal(PIXEL_ACTORS['candle-nun'].url, 'assets/pixel/actors/sprites/candle-nun-v2.png');
  assert.equal(PIXEL_ACTORS['ash-veiled-prioress'].url, 'assets/pixel/actors/sprites/ash-veiled-prioress.png');
  assert.notEqual(PIXEL_ACTORS['candle-nun'].url, PIXEL_ACTORS['ash-veiled-prioress'].url);
});

test('defeat result uses a bundled transparent tombstone asset', async () => {
  assert.equal(PIXEL_DECORATIONS.defeatTombstone.url, 'assets/pixel/ui/defeat-tombstone.png');
  const info = await stat(path.join(root, 'pixel', 'ui', 'defeat-tombstone.png'));
  assert.ok(info.size > 20_000, 'defeat tombstone should contain production artwork');
});
