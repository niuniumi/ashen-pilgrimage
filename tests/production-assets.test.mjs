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

test('the actor catalog contains exactly the playable heroes and production enemies', () => {
  const expected = new Set([
    'exiled-knight',
    'candle-nun',
    'ashblood-alchemist',
    ...enemies.map((enemy) => enemy.id === 'graveyard-skeleton' ? 'grave-skeleton' : enemy.id)
  ]);
  assert.deepEqual(new Set(Object.keys(PIXEL_ACTORS)), expected);
});

test('every curated enemy PNG is normalized to face the player on the left', () => {
  for (const enemy of enemies) {
    const resolved = resolvePixelActorAsset(enemy.id);
    assert.equal(resolved.asset.facing, 'left', `${enemy.id} source orientation should be left`);
  }
});

test('every production enemy uses its own semantic PNG instead of a shared procedural atlas frame', () => {
  const urls = new Set();
  for (const enemy of enemies) {
    const resolved = resolvePixelActorAsset(enemy.id);
    assert.ok(resolved, `${enemy.id} should resolve to a dedicated actor`);
    assert.equal(resolved.asset.frameIndex, undefined, `${enemy.id} should not use a procedural atlas frame`);
    assert.match(resolved.asset.url, /\/sprites\/[a-z0-9-]+\.png$/);
    assert.equal(urls.has(resolved.asset.url), false, `${enemy.id} reuses ${resolved.asset.url}`);
    urls.add(resolved.asset.url);
  }
  assert.equal(urls.size, enemies.length);
});

test('playable heroes use one cohesive v3 source set and face battle enemies on the right', async () => {
  for (const heroId of ['exiled-knight', 'candle-nun', 'ashblood-alchemist']) {
    const actor = PIXEL_ACTORS[heroId];
    assert.equal(actor.url, `assets/pixel/actors/sprites/${heroId}-v3.png`);
    assert.equal(actor.facing, 'right');
    const info = await stat(path.join(root, 'pixel', 'actors', 'sprites', `${heroId}-v3.png`));
    assert.ok(info.size > 25_000, `${heroId} should contain a detailed production sprite`);
  }
});

test('plague rat swarm is a compact left-facing production enemy', async () => {
  const actor = PIXEL_ACTORS['plague-rat-swarm'];
  assert.equal(actor.url, 'assets/pixel/actors/sprites/plague-rat-swarm-v2.png');
  assert.equal(actor.facing, 'left');
  assert.ok(actor.displayScale <= 0.6, 'rat swarm should remain smaller than humanoid enemies');
  assert.ok(actor.offsetY < 0, 'rat swarm should sit above its name and health bar');
  const info = await stat(path.join(root, 'pixel', 'actors', 'sprites', 'plague-rat-swarm-v2.png'));
  assert.ok(info.size > 25_000, 'rat swarm should contain detailed production artwork');
});

test('generated v3 enemies use the explicit left-facing art set', async () => {
  const v3Enemies = [
    'rotting-villager',
    'grave-skeleton',
    'crow-messenger',
    'armor-broken-militia',
    'candle-monk',
    'pointed-witch',
    'plague-doctor',
    'iron-maiden-nun',
    'fallen-paladin',
    'headless-grave-knight',
    'wax-novice',
    'cinder-acolyte',
    'bell-tower-sentry',
    'choir-exorcist',
    'reliquary-jailer',
    'ash-veiled-prioress',
    'pale-wax-matron',
    'hollow-spearman',
    'ashen-banneret',
    'gutter-fire-archer',
    'gate-iron-vicar',
    'royal-pyre-knight',
    'clockwork-confessor',
    'hollow-crown-regent'
  ];

  for (const enemyId of v3Enemies) {
    const actor = PIXEL_ACTORS[enemyId];
    assert.equal(actor.url, `assets/pixel/actors/sprites/${enemyId}-v3.png`);
    assert.equal(actor.facing, 'left');
    const info = await stat(path.join(root, 'pixel', 'actors', 'sprites', `${enemyId}-v3.png`));
    assert.ok(info.size > 50_000, `${enemyId} v3 sprite should contain production detail`);
  }
});

test('candle nun hero and ash veiled prioress resolve to visibly independent source files', () => {
  assert.equal(PIXEL_ACTORS['candle-nun'].url, 'assets/pixel/actors/sprites/candle-nun-v3.png');
  assert.equal(PIXEL_ACTORS['ash-veiled-prioress'].url, 'assets/pixel/actors/sprites/ash-veiled-prioress-v3.png');
  assert.notEqual(PIXEL_ACTORS['candle-nun'].url, PIXEL_ACTORS['ash-veiled-prioress'].url);
});

test('defeat result uses a bundled transparent tombstone asset', async () => {
  assert.equal(PIXEL_DECORATIONS.defeatTombstone.url, 'assets/pixel/ui/defeat-tombstone.png');
  const info = await stat(path.join(root, 'pixel', 'ui', 'defeat-tombstone.png'));
  assert.ok(info.size > 20_000, 'defeat tombstone should contain production artwork');
});
