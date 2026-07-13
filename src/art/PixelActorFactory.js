import Phaser from 'phaser';
import { getEnemy } from '../data/enemies.js';
import { PIXEL_PALETTE, snapPixel, stablePixelHash } from './PixelArtSystem.js';
import { PIXEL_ACTORS } from './PixelAssetCatalog.js';

const BEAST_IDS = new Set(['black-hound', 'crownless-hound', 'plague-rat-swarm']);
const FLYING_IDS = new Set(['crow-messenger', 'scripture-moth-swarm']);
const CASTER_IDS = new Set([
  'candle-monk',
  'pointed-witch',
  'plague-doctor',
  'wax-novice',
  'cinder-acolyte',
  'choir-exorcist',
  'ash-veiled-prioress',
  'clockwork-confessor',
  'pale-wax-matron'
]);
const BOSS_IDS = new Set(['headless-grave-knight', 'pale-wax-matron', 'hollow-crown-regent']);

const ENEMY_SPRITES = {
  'armor-broken-militia': 'broken-militia',
  'rotting-villager': 'broken-militia',
  'graveyard-skeleton': 'grave-skeleton',
  'crownless-hound': 'black-hound',
  'plague-rat-swarm': 'black-hound',
  'wax-novice': 'candle-monk',
  'cinder-acolyte': 'candle-monk',
  'ash-veiled-prioress': 'pointed-witch',
  'choir-exorcist': 'pointed-witch',
  'clockwork-confessor': 'plague-doctor',
  'crow-messenger': 'gutter-fire-archer',
  'bell-tower-sentry': 'reliquary-jailer',
  'gate-iron-vicar': 'reliquary-jailer',
  'fallen-paladin': 'reliquary-jailer',
  'royal-pyre-knight': 'reliquary-jailer'
};

function rect(g, x, y, w, h, color, alpha = 1) {
  g.fillStyle(color, alpha);
  g.fillRect(snapPixel(x), snapPixel(y), Math.max(4, snapPixel(w)), Math.max(4, snapPixel(h)));
}

function pixelShadow(g, width, y) {
  rect(g, -width / 2, y, width, 12, PIXEL_PALETTE.void, 0.55);
  rect(g, -width * 0.34, y + 12, width * 0.68, 4, PIXEL_PALETTE.void, 0.32);
}

function addPoseController(container, actor, direction = 1) {
  const baseX = actor.x;
  const baseY = actor.y;
  container.actorSprite = actor;
  container.setBattlePose = (pose = 'idle') => {
    actor.setPosition(baseX, baseY);
    actor.setScale(1);
    actor.setAngle(0);
    if (pose === 'attack') actor.setPosition(baseX + 12 * direction, baseY - 4);
    else if (pose === 'defend') actor.setPosition(baseX - 8 * direction, baseY + 4);
    else if (pose === 'hit') actor.setPosition(baseX - 12 * direction, baseY);
    actor.setData('pose', pose);
    return true;
  };
  container.setBattlePose('idle');
}

function drawAtlasActor(scene, spriteName, x, y, scale, options = {}, actorType = 'enemy') {
  const asset = PIXEL_ACTORS[spriteName];
  if (!asset || !scene.textures.exists(asset.key)) return null;
  const isBoss = actorType === 'enemy' && (options.type === 'boss' || BOSS_IDS.has(spriteName));
  const height = options.generatedHeight ?? (options.artPortrait ? 260 * scale : (isBoss ? 356 : 280) * scale);
  const container = scene.add.container(snapPixel(x), snapPixel(y));
  if (Number.isFinite(options.depth)) container.setDepth(options.depth);
  const shadow = scene.add.graphics();
  shadow.fillStyle(PIXEL_PALETTE.void, 0.58);
  shadow.fillRect(-Math.round(height * 0.28), 108, Math.round(height * 0.56), 16);
  const actor = scene.add.image(0, 112, asset.key).setOrigin(0.5, 1).setDisplaySize(
    Math.round((scene.textures.get(asset.key).getSourceImage().width / scene.textures.get(asset.key).getSourceImage().height) * height),
    Math.round(height)
  );
  actor.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  container.add([shadow, actor]);
  addPoseController(container, actor, actorType === 'hero' ? 1 : -1);
  actor.setData('battleActor', true);
  actor.setData('actorType', actorType);
  actor.setData('assetId', spriteName);
  return container;
}

function heroColors(characterId) {
  if (characterId === 'candle-nun') return [0x2a252d, 0xd8c28c, PIXEL_PALETTE.candle, 0x8f6d38];
  if (characterId === 'ashblood-alchemist') return [0x173033, 0x356d67, 0xc8a66b, 0x8c3038];
  return [0x252b32, 0x5a6670, 0x8d2633, 0xc49a4c];
}

export function drawPixelHero(scene, characterId, x = 0, y = 0, scale = 1, options = {}) {
  const atlasActor = drawAtlasActor(scene, characterId, x, y, scale, options, 'hero');
  if (atlasActor) return atlasActor;
  const container = scene.add.container(snapPixel(x), snapPixel(y));
  if (Number.isFinite(options.depth)) container.setDepth(options.depth);
  const actor = scene.add.container(0, 0);
  const g = scene.add.graphics();
  actor.add(g);
  container.add(actor);
  const [dark, mid, accent, metal] = heroColors(characterId);
  const s = scale * (options.artPortrait ? 1.08 : 1);
  pixelShadow(g, 124 * s, 112 * s);

  if (characterId === 'candle-nun') drawNun(g, s, dark, mid, accent, metal);
  else if (characterId === 'ashblood-alchemist') drawAlchemist(g, s, dark, mid, accent, metal);
  else drawKnight(g, s, dark, mid, accent, metal);

  addPoseController(container, actor, 1);
  actor.setData('battleActor', true);
  actor.setData('actorType', 'hero');
  actor.setData('assetId', characterId);
  return container;
}

function drawKnight(g, s, dark, mid, accent, metal) {
  rect(g, -48 * s, -74 * s, 48 * s, 156 * s, accent);
  rect(g, -28 * s, -38 * s, 64 * s, 112 * s, dark);
  rect(g, -20 * s, -28 * s, 48 * s, 64 * s, mid);
  rect(g, -24 * s, -94 * s, 56 * s, 52 * s, metal);
  rect(g, -20 * s, -86 * s, 48 * s, 12 * s, PIXEL_PALETTE.void);
  rect(g, -12 * s, -82 * s, 8 * s, 4 * s, PIXEL_PALETTE.candle);
  rect(g, 12 * s, -82 * s, 8 * s, 4 * s, PIXEL_PALETTE.candle);
  rect(g, -44 * s, -24 * s, 24 * s, 60 * s, metal);
  rect(g, 28 * s, -20 * s, 20 * s, 64 * s, metal);
  rect(g, -24 * s, 72 * s, 24 * s, 36 * s, dark);
  rect(g, 16 * s, 72 * s, 24 * s, 36 * s, dark);
  rect(g, 48 * s, -58 * s, 8 * s, 142 * s, PIXEL_PALETTE.bone);
  rect(g, 36 * s, 52 * s, 32 * s, 8 * s, accent);
}

function drawNun(g, s, dark, mid, accent, metal) {
  rect(g, -44 * s, -20 * s, 88 * s, 112 * s, dark);
  rect(g, -28 * s, -68 * s, 56 * s, 56 * s, mid);
  rect(g, -20 * s, -58 * s, 40 * s, 32 * s, PIXEL_PALETTE.void);
  rect(g, -8 * s, -48 * s, 16 * s, 12 * s, PIXEL_PALETTE.bone);
  rect(g, -36 * s, 8 * s, 72 * s, 12 * s, metal);
  rect(g, -8 * s, 20 * s, 16 * s, 52 * s, mid);
  rect(g, -48 * s, 80 * s, 96 * s, 16 * s, dark);
  for (let index = 0; index < 5; index += 1) {
    const px = (-40 + index * 20) * s;
    rect(g, px, -94 * s - (index % 2) * 8 * s, 8 * s, 24 * s, metal);
    rect(g, px, -106 * s - (index % 2) * 8 * s, 8 * s, 12 * s, accent);
  }
  rect(g, 38 * s, 4 * s, 28 * s, 44 * s, 0x553329);
  rect(g, 42 * s, 10 * s, 20 * s, 4 * s, PIXEL_PALETTE.gold);
}

function drawAlchemist(g, s, dark, mid, accent, metal) {
  rect(g, -42 * s, -16 * s, 84 * s, 108 * s, dark);
  rect(g, -30 * s, -56 * s, 60 * s, 52 * s, mid);
  rect(g, -18 * s, -48 * s, 36 * s, 20 * s, PIXEL_PALETTE.void);
  rect(g, -14 * s, -44 * s, 12 * s, 12 * s, accent);
  rect(g, 6 * s, -44 * s, 12 * s, 12 * s, accent);
  rect(g, 26 * s, -38 * s, 32 * s, 12 * s, metal);
  rect(g, 46 * s, -34 * s, 12 * s, 8 * s, PIXEL_PALETTE.bone);
  rect(g, -58 * s, 4 * s, 24 * s, 72 * s, mid);
  rect(g, 36 * s, 6 * s, 24 * s, 68 * s, mid);
  rect(g, -32 * s, 34 * s, 64 * s, 12 * s, accent);
  const vialColors = [PIXEL_PALETTE.teal, PIXEL_PALETTE.blood, PIXEL_PALETTE.gold];
  vialColors.forEach((color, index) => {
    rect(g, (-26 + index * 24) * s, 52 * s, 12 * s, 28 * s, PIXEL_PALETTE.void);
    rect(g, (-22 + index * 24) * s, 60 * s, 8 * s, 16 * s, color);
  });
  rect(g, -26 * s, 88 * s, 20 * s, 24 * s, dark);
  rect(g, 14 * s, 88 * s, 20 * s, 24 * s, dark);
}

export function drawPixelEnemy(scene, enemyId, x = 0, y = 0, scale = 1, options = {}) {
  const spriteName = PIXEL_ACTORS[enemyId] ? enemyId : ENEMY_SPRITES[enemyId];
  const atlasActor = drawAtlasActor(scene, spriteName, x, y, scale, options, 'enemy');
  if (atlasActor) {
    atlasActor.actorSprite?.setData('assetId', enemyId);
    return atlasActor;
  }
  const definition = getEnemy(enemyId) ?? { palette: [0x4d4b43, 0x77634b, 0x8f3138], type: options.type ?? 'normal' };
  const boss = options.type === 'boss' || definition.type === 'boss' || BOSS_IDS.has(enemyId);
  const s = scale * (boss ? 1.2 : 1);
  const container = scene.add.container(snapPixel(x), snapPixel(y));
  if (Number.isFinite(options.depth)) container.setDepth(options.depth);
  const actor = scene.add.container(0, 0);
  const g = scene.add.graphics();
  actor.add(g);
  container.add(actor);
  const colors = enemyId === 'headless-grave-knight'
    ? [0x171b22, 0x566675, 0x91303a]
    : [definition.palette?.[0] ?? 0x4d4b43, definition.palette?.[1] ?? 0x77634b, definition.palette?.[2] ?? 0x8f3138];
  pixelShadow(g, (boss ? 160 : 112) * s, (boss ? 132 : 112) * s);

  if (BEAST_IDS.has(enemyId)) drawBeast(g, enemyId, s, colors);
  else if (FLYING_IDS.has(enemyId)) drawFlying(g, enemyId, s, colors);
  else if (CASTER_IDS.has(enemyId)) drawCaster(g, enemyId, s, colors, boss);
  else drawWarrior(g, enemyId, s, colors, boss);

  addPoseController(container, actor, -1);
  actor.setData('battleActor', true);
  actor.setData('actorType', 'enemy');
  actor.setData('assetId', enemyId);
  return container;
}

function drawWarrior(g, id, s, [dark, mid, accent], boss) {
  const hash = stablePixelHash(id);
  const headless = id === 'headless-grave-knight';
  rect(g, -36 * s, -20 * s, 72 * s, (boss ? 126 : 106) * s, dark);
  if (headless) {
    rect(g, -44 * s, -38 * s, 88 * s, 24 * s, PIXEL_PALETTE.goldDark);
    rect(g, -28 * s, -34 * s, 56 * s, 16 * s, PIXEL_PALETTE.void);
    rect(g, -16 * s, -58 * s, 32 * s, 20 * s, PIXEL_PALETTE.bloodDark, 0.72);
  } else {
    rect(g, -28 * s, -62 * s, 56 * s, 48 * s, mid);
    rect(g, -20 * s, -52 * s, 40 * s, 12 * s, PIXEL_PALETTE.void);
    rect(g, -12 * s, -48 * s, 8 * s, 4 * s, accent);
    rect(g, 8 * s, -48 * s, 8 * s, 4 * s, accent);
  }
  rect(g, -52 * s, -8 * s, 20 * s, 64 * s, mid);
  rect(g, 34 * s, -8 * s, 20 * s, 64 * s, mid);
  rect(g, -24 * s, 82 * s, 20 * s, 28 * s, PIXEL_PALETTE.void);
  rect(g, 12 * s, 82 * s, 20 * s, 28 * s, PIXEL_PALETTE.void);
  if (id.includes('skeleton')) {
    rect(g, -20 * s, -68 * s, 40 * s, 40 * s, PIXEL_PALETTE.bone);
    rect(g, -12 * s, -56 * s, 8 * s, 8 * s, PIXEL_PALETTE.void);
    rect(g, 8 * s, -56 * s, 8 * s, 8 * s, PIXEL_PALETTE.void);
  }
  if (!headless && (boss || id.includes('paladin') || id.includes('knight'))) {
    rect(g, -40 * s, -82 * s, 80 * s, 12 * s, PIXEL_PALETTE.goldDark);
    rect(g, -24 * s, -102 * s, 12 * s, 24 * s, accent);
    rect(g, 12 * s, -102 * s, 12 * s, 24 * s, accent);
  }
  const weaponX = hash % 2 === 0 ? 54 : -60;
  rect(g, weaponX * s, -56 * s, 8 * s, 148 * s, PIXEL_PALETTE.bone);
  rect(g, (weaponX - 12) * s, 42 * s, 32 * s, 8 * s, accent);
}

function drawCaster(g, id, s, [dark, mid, accent], boss) {
  rect(g, -46 * s, -6 * s, 92 * s, (boss ? 132 : 112) * s, dark);
  rect(g, -34 * s, -62 * s, 68 * s, 58 * s, mid);
  rect(g, -20 * s, -50 * s, 40 * s, 30 * s, PIXEL_PALETTE.void);
  rect(g, -10 * s, -42 * s, 8 * s, 8 * s, accent);
  rect(g, 8 * s, -42 * s, 8 * s, 8 * s, accent);
  rect(g, -58 * s, 4 * s, 20 * s, 76 * s, mid);
  rect(g, 40 * s, 4 * s, 20 * s, 76 * s, mid);
  rect(g, 56 * s, -76 * s, 8 * s, 174 * s, PIXEL_PALETTE.goldDark);
  rect(g, 44 * s, -88 * s, 32 * s, 20 * s, accent);
  if (id.includes('doctor')) rect(g, 26 * s, -42 * s, 34 * s, 12 * s, PIXEL_PALETTE.bone);
  if (id.includes('witch')) {
    rect(g, -48 * s, -82 * s, 96 * s, 12 * s, dark);
    rect(g, -16 * s, -126 * s, 36 * s, 48 * s, dark);
  }
  if (boss) {
    rect(g, -54 * s, -94 * s, 108 * s, 12 * s, PIXEL_PALETTE.goldDark);
    rect(g, -28 * s, -116 * s, 12 * s, 24 * s, accent);
    rect(g, 16 * s, -116 * s, 12 * s, 24 * s, accent);
  }
}

function drawBeast(g, id, s, [dark, mid, accent]) {
  if (id === 'plague-rat-swarm') {
    for (let index = 0; index < 5; index += 1) {
      const x = (-54 + index * 26) * s;
      const y = (46 + (index % 2) * 22) * s;
      rect(g, x, y, 28 * s, 20 * s, index % 2 ? dark : mid);
      rect(g, x + 20 * s, y + 4 * s, 8 * s, 4 * s, accent);
    }
    return;
  }
  const fur = id === 'crownless-hound' ? 0x3a3038 : 0x252b32;
  const furLight = id === 'crownless-hound' ? 0x66538c : 0x566675;
  rect(g, -68 * s, -2 * s, 116 * s, 68 * s, PIXEL_PALETTE.void);
  rect(g, -60 * s, 6 * s, 108 * s, 52 * s, fur);
  rect(g, -48 * s, 2 * s, 76 * s, 12 * s, furLight);
  rect(g, 34 * s, -34 * s, 60 * s, 62 * s, PIXEL_PALETTE.void);
  rect(g, 42 * s, -26 * s, 48 * s, 48 * s, fur);
  rect(g, 48 * s, -46 * s, 16 * s, 24 * s, fur);
  rect(g, 72 * s, -42 * s, 14 * s, 22 * s, fur);
  rect(g, 54 * s, -12 * s, 8 * s, 8 * s, PIXEL_PALETTE.candle);
  rect(g, 82 * s, 4 * s, 28 * s, 20 * s, PIXEL_PALETTE.void);
  rect(g, 86 * s, 8 * s, 20 * s, 8 * s, furLight);
  rect(g, 92 * s, 18 * s, 4 * s, 8 * s, PIXEL_PALETTE.bone);
  rect(g, -56 * s, 56 * s, 24 * s, 52 * s, PIXEL_PALETTE.void);
  rect(g, -48 * s, 58 * s, 16 * s, 42 * s, fur);
  rect(g, 18 * s, 56 * s, 24 * s, 52 * s, PIXEL_PALETTE.void);
  rect(g, 22 * s, 58 * s, 16 * s, 42 * s, fur);
  rect(g, -96 * s, -8 * s, 36 * s, 12 * s, PIXEL_PALETTE.void);
  rect(g, -112 * s, -28 * s, 24 * s, 12 * s, furLight);
  for (let index = 0; index < 4; index += 1) {
    rect(g, (-32 + index * 18) * s, 24 * s, 6 * s, 24 * s, index % 2 ? accent : PIXEL_PALETTE.bloodDark);
  }
}

function drawFlying(g, id, s, [dark, mid, accent]) {
  const count = id === 'scripture-moth-swarm' ? 5 : 1;
  for (let index = 0; index < count; index += 1) {
    const ox = count === 1 ? 0 : (-48 + (index % 3) * 44) * s;
    const oy = count === 1 ? 0 : (-24 + Math.floor(index / 3) * 52) * s;
    rect(g, ox - 12 * s, oy - 20 * s, 24 * s, 50 * s, dark);
    rect(g, ox - 52 * s, oy - 12 * s, 40 * s, 20 * s, mid);
    rect(g, ox + 12 * s, oy - 12 * s, 40 * s, 20 * s, mid);
    rect(g, ox + 8 * s, oy - 12 * s, 8 * s, 8 * s, accent);
  }
}
