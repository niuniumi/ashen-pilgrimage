import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { characters } from '../src/data/characters.js';
import { enemies } from '../src/data/enemies.js';
import { PIXEL_ASSETS, resolvePixelActorAsset } from '../src/art/PixelAssetCatalog.js';

const root = process.cwd();
const actorSource = fs.readFileSync(path.join(root, 'src/art/PixelActorFactory.js'), 'utf8');
const preloadSource = fs.readFileSync(path.join(root, 'src/scenes/PreloadScene.js'), 'utf8');
const visualCatalog = fs.readFileSync(path.join(root, 'src/game/VisualCatalog.js'), 'utf8');

assert.equal(characters.length, 3, 'all three production heroes must remain available');
assert.ok(enemies.length >= 28, 'full production enemy roster must remain available');
assert.ok(actorSource.includes('drawPixelHero'), 'pixel hero factory is not bound');
assert.ok(actorSource.includes('drawPixelEnemy'), 'pixel enemy factory is not bound');
assert.ok(actorSource.includes('getEnemy(enemyId)'), 'enemy visuals must derive from the production roster');
assert.ok(preloadSource.includes('queuePixelAssets'), 'preload must bind pixel production assets');
assert.equal(preloadSource.includes('flattenFinalArtAssets'), false, 'legacy SVG assets must not be preloaded');
assert.equal(preloadSource.includes('flattenRelicAssets'), false, 'legacy relic bitmaps must not be preloaded');
assert.equal(visualCatalog.includes('assets/generated'), false, 'deferred visuals must not restore generated legacy assets');
assert.equal(visualCatalog.includes('assets/handpainted'), false, 'deferred visuals must not restore hand-painted legacy assets');

for (const asset of Object.values(PIXEL_ASSETS)) {
  assert.ok(fs.existsSync(path.join(root, 'public', asset.url)), `missing pixel asset ${asset.url}`);
}

for (const enemy of enemies) {
  const resolved = resolvePixelActorAsset(enemy.id);
  assert.ok(resolved, `enemy ${enemy.id} must resolve to a production pixel actor`);
  if (enemy.id === 'graveyard-skeleton') {
    assert.equal(resolved.assetId, 'grave-skeleton');
  } else {
    assert.equal(resolved.assetId, enemy.id, `enemy ${enemy.id} must not reuse ${resolved.assetId}`);
  }
  assert.equal(resolved.asset.facing === 'left' || resolved.asset.facing === 'right', true);
}

console.log(JSON.stringify({ ok: true, heroes: characters.length, enemies: enemies.length, pixelAssets: Object.keys(PIXEL_ASSETS).length, boundEnemies: enemies.length }, null, 2));
