import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { enemies } from '../src/data/enemies.js';
import { characters } from '../src/data/characters.js';
import { FINAL_ART } from '../src/art/FinalArtAssets.js';
import { LOW_NOISE_ENEMY_ASSETS, LOW_NOISE_HERO_ASSETS, flattenLowNoiseBattleAssets } from '../src/art/LowNoiseBattleAssets.js';

const root = process.cwd();

function exists(asset) {
  return Boolean(asset?.key && asset?.url && fs.existsSync(path.join(root, 'public', asset.url)));
}

for (const character of characters) {
  assert.ok(exists(FINAL_ART.heroes[character.id]?.battle), `missing hero presentation asset: ${character.id}`);
  assert.ok(exists(LOW_NOISE_HERO_ASSETS[character.id]?.idle), `missing low-noise hero idle asset: ${character.id}`);
  assert.ok(exists(LOW_NOISE_HERO_ASSETS[character.id]?.attack), `missing low-noise hero attack asset: ${character.id}`);
  assert.ok(exists(LOW_NOISE_HERO_ASSETS[character.id]?.defend), `missing low-noise hero defend asset: ${character.id}`);
  assert.ok(exists(LOW_NOISE_HERO_ASSETS[character.id]?.hit), `missing low-noise hero hit asset: ${character.id}`);
}

for (const enemy of enemies) {
  const asset = enemy.type === 'boss' ? FINAL_ART.bosses[enemy.id] : FINAL_ART.enemies[enemy.id];
  assert.ok(exists(asset), `missing enemy presentation asset binding: ${enemy.id} / ${enemy.name}`);
  assert.ok(exists(LOW_NOISE_ENEMY_ASSETS[enemy.id]?.idle), `missing low-noise enemy idle asset: ${enemy.id} / ${enemy.name}`);
  assert.ok(exists(LOW_NOISE_ENEMY_ASSETS[enemy.id]?.attack), `missing low-noise enemy attack asset: ${enemy.id} / ${enemy.name}`);
  assert.ok(exists(LOW_NOISE_ENEMY_ASSETS[enemy.id]?.hit), `missing low-noise enemy hit asset: ${enemy.id} / ${enemy.name}`);
}

const lowNoiseKeys = flattenLowNoiseBattleAssets().map((asset) => asset.key);
assert.equal(new Set(lowNoiseKeys).size, lowNoiseKeys.length, 'low-noise battle asset keys must be unique');

const rebuiltVisualFactory = fs.readFileSync(path.join(root, 'src/art/RebuiltVisualFactory.js'), 'utf8');
assert.ok(rebuiltVisualFactory.includes('addLowNoiseHeroSprite'), 'Battle visual factory must load low-noise hero assets');
assert.ok(rebuiltVisualFactory.includes('addLowNoiseEnemySprite'), 'Battle visual factory must load low-noise enemy assets');
assert.equal(
  rebuiltVisualFactory.includes('addBattleEnemySprite(scene, container, enemyId, scale, options) ?? addFinalEnemySprite'),
  false,
  'Battle enemies must not fall through to old final SVG actor assets'
);
assert.equal(
  rebuiltVisualFactory.includes('addBattleHeroSprite(scene, container, characterId, scale, options) ?? addFinalHeroSprite'),
  false,
  'Battle heroes must not fall through to old final SVG actor assets'
);
assert.equal(rebuiltVisualFactory.includes('?? addBattleEnemySprite'), false, 'Battle enemies must not fall through to procedural actor assets');
assert.equal(rebuiltVisualFactory.includes('?? addBattleHeroSprite'), false, 'Battle heroes must not fall through to procedural actor assets');

const sourceFiles = ['src/data/enemies.js', 'docs/ART_ASSET_MANIFEST.md', 'docs/ART_ASSET_MANIFEST_FINAL.md', 'docs/CONTENT_MANIFEST.md'];
for (const file of sourceFiles) {
  const text = fs.readFileSync(file, 'utf8');
  assert.equal(text.includes('铁处女修女'), false, `${file} still contains removed display name`);
}

console.log(JSON.stringify({ ok: true, heroes: characters.length, enemies: enemies.length, lowNoiseAssets: lowNoiseKeys.length }, null, 2));
