import { THEME } from '../game/Theme.js';
import { addShadow, addSwayTween, createArtContainer, drawCandleFlame, drawCandleGlow, drawPixelGrain, drawSmallBottles } from './PixelSpriteFactory.js';
import { FINAL_ART } from './FinalArtAssets.js';

export const ENEMY_ART_IDS = [
  'rotting-villager',
  'graveyard-skeleton',
  'black-hound',
  'plague-rat-swarm',
  'crow-messenger',
  'armor-broken-militia',
  'candle-monk',
  'pointed-witch',
  'plague-doctor',
  'iron-maiden-nun',
  'fallen-paladin'
];

export function drawEnemySprite(scene, enemyId, x = 0, y = 0, scale = 1, options = {}) {
  const svgArt = drawEnemySvg(scene, enemyId, x, y, scale, options);
  if (svgArt) return svgArt;

  const container = createArtContainer(scene, x, y, options);
  const bossLike = options.large;
  addShadow(scene, container, shadowY(enemyId) * scale, shadowW(enemyId) * scale, (bossLike ? 28 : 22) * scale, 0.34);
  const g = scene.add.graphics();
  container.add(g);

  switch (enemyId) {
    case 'graveyard-skeleton':
      drawSkeleton(g, scale);
      break;
    case 'black-hound':
      drawHound(g, scale);
      break;
    case 'plague-rat-swarm':
      drawRatSwarm(g, scale);
      break;
    case 'crow-messenger':
      drawCrow(g, scale);
      break;
    case 'armor-broken-militia':
      drawMilitia(g, scale);
      break;
    case 'candle-monk':
      drawCandleMonk(g, scale);
      break;
    case 'pointed-witch':
      drawWitch(g, scale);
      break;
    case 'plague-doctor':
      drawPlagueDoctor(g, scale);
      break;
    case 'iron-maiden-nun':
      drawIronMaidenNun(g, scale);
      break;
    case 'fallen-paladin':
      drawFallenPaladin(g, scale);
      break;
    default:
      drawRottingVillager(g, scale);
      break;
  }

  if (options.idle !== false) {
    addSwayTween(scene, container, {
      angle: enemyId === 'black-hound' || enemyId === 'plague-rat-swarm' ? 0 : 1.6,
      duration: enemyId === 'crow-messenger' ? 820 : 1120,
      idle: true
    });
    if (enemyId === 'crow-messenger') {
      scene.tweens.add({ targets: container, y: container.y - 8 * scale, yoyo: true, repeat: -1, duration: 920, ease: 'Sine.InOut' });
    }
  }
  return container;
}

function drawEnemySvg(scene, enemyId, x, y, scale, options = {}) {
  if (options.preferSvg !== true) return null;
  const asset = FINAL_ART.enemies[enemyId];
  if (!asset || !scene.textures.exists(asset.key)) return null;
  const container = createArtContainer(scene, x, y, options);
  const displayHeight = (options.displayHeight ?? (enemyId === 'black-hound' || enemyId === 'plague-rat-swarm' ? 178 : 224)) * scale;
  const displayWidth = displayHeight * (asset.width / asset.height);
  const bottomY = (options.imageYOffset ?? 118) * scale;
  addShadow(scene, container, bottomY + 2 * scale, Math.min(displayWidth * 0.78, 166 * scale), 22 * scale, 0.34);
  const image = scene.add.image(0, bottomY, asset.key).setOrigin(0.5, 1);
  image.setDisplaySize(displayWidth, displayHeight);
  image.setName(`${enemyId}-svg`);
  container.add(image);
  if (options.idle !== false) {
    addSwayTween(scene, container, {
      angle: enemyId === 'black-hound' || enemyId === 'plague-rat-swarm' ? 0 : 1.2,
      duration: enemyId === 'crow-messenger' ? 820 : 1120,
      idle: true
    });
    if (enemyId === 'crow-messenger') {
      scene.tweens.add({ targets: container, y: container.y - 8 * scale, yoyo: true, repeat: -1, duration: 920, ease: 'Sine.InOut' });
    }
  }
  return container;
}

function shadowY(id) {
  if (id === 'crow-messenger') return 126;
  if (id === 'black-hound' || id === 'plague-rat-swarm') return 112;
  return 118;
}

function shadowW(id) {
  if (id === 'black-hound') return 176;
  if (id === 'plague-rat-swarm') return 166;
  if (id === 'crow-messenger') return 130;
  return 154;
}

function drawRottingVillager(g, s) {
  g.fillStyle(0x0a0b09, 0.38);
  g.fillEllipse(1 * s, 8 * s, 126 * s, 176 * s);
  g.fillStyle(0x1b271f, 1);
  g.fillTriangle(-31 * s, 45 * s, -52 * s, 118 * s, -18 * s, 118 * s);
  g.fillTriangle(19 * s, 45 * s, 1 * s, 118 * s, 34 * s, 118 * s);
  g.fillStyle(0x5f4637, 0.98);
  g.fillTriangle(-53 * s, -44 * s, 39 * s, -31 * s, 22 * s, 58 * s);
  g.fillTriangle(-45 * s, -36 * s, -13 * s, 78 * s, -68 * s, 51 * s);
  g.fillTriangle(3 * s, -29 * s, 65 * s, 22 * s, 14 * s, 79 * s);
  g.fillStyle(0x46503b, 1);
  g.fillRoundedRect(-42 * s, -60 * s, 79 * s, 97 * s, 13 * s);
  g.fillStyle(0x657357, 0.92);
  g.fillRoundedRect(-28 * s, -101 * s, 43 * s, 41 * s, 13 * s);
  g.fillStyle(0x21271e, 1);
  g.fillCircle(-12 * s, -85 * s, 4 * s);
  g.fillStyle(0x8e2f2a, 0.92);
  g.fillCircle(5 * s, -84 * s, 4 * s);
  g.fillRect(10 * s, 18 * s, 20 * s, 7 * s);
  g.fillRect(-38 * s, -22 * s, 18 * s, 6 * s);
  g.fillStyle(0x2d3028, 1);
  g.fillRoundedRect(-66 * s, -34 * s, 13 * s, 89 * s, 4 * s);
  g.fillRoundedRect(40 * s, -24 * s, 13 * s, 83 * s, 4 * s);
  g.lineStyle(5 * s, 0x6f4b25, 0.9);
  g.lineBetween(58 * s, -16 * s, 88 * s, 66 * s);
  g.lineStyle(2 * s, 0xd8bd8a, 0.42);
  g.lineBetween(61 * s, -13 * s, 88 * s, 62 * s);
  g.fillStyle(0x22261d, 0.94);
  g.fillTriangle(-47 * s, -61 * s, -5 * s, -93 * s, 37 * s, -54 * s);
  g.fillStyle(0x8e2f2a, 0.72);
  g.fillCircle(-22 * s, -12 * s, 5 * s);
  g.fillRect(13 * s, 34 * s, 26 * s, 5 * s);
  g.lineStyle(2 * s, 0xb49765, 0.32);
  g.lineBetween(-37 * s, -39 * s, 29 * s, 31 * s);
  g.lineBetween(-47 * s, 2 * s, 19 * s, -28 * s);
  g.lineStyle(2 * s, 0x111612, 0.62);
  g.lineBetween(-52 * s, 117 * s, -12 * s, 117 * s);
  g.lineBetween(0, 118 * s, 42 * s, 118 * s);
  drawPixelGrain(g, -67 * s, -61 * s, 134 * s, 178 * s, [0x8a6133, 0x28382e, 0x9e302b], { count: 28, alpha: 0.1, seed: 2 });
}

function drawSkeleton(g, s) {
  const bone = 0xcfc196;
  g.fillStyle(0x5f5c58, 0.74);
  g.fillTriangle(-49 * s, -28 * s, -76 * s, 99 * s, -11 * s, 59 * s);
  g.fillStyle(bone, 0.98);
  g.fillRoundedRect(-25 * s, -99 * s, 50 * s, 45 * s, 12 * s);
  g.fillStyle(0x17120e, 1);
  g.fillCircle(-11 * s, -82 * s, 6 * s);
  g.fillCircle(12 * s, -82 * s, 6 * s);
  g.fillStyle(0x2f6484, 0.76);
  g.fillCircle(-11 * s, -82 * s, 3 * s);
  g.fillCircle(12 * s, -82 * s, 3 * s);
  g.fillStyle(0x17120e, 1);
  g.fillRect(-12 * s, -65 * s, 24 * s, 4 * s);
  g.lineStyle(5 * s, bone, 0.96);
  g.lineBetween(-36 * s, -30 * s, 36 * s, -30 * s);
  g.lineBetween(-31 * s, -20 * s, 31 * s, -20 * s);
  g.lineBetween(-24 * s, -9 * s, 24 * s, -9 * s);
  g.lineBetween(-12 * s, -31 * s, -19 * s, 45 * s);
  g.lineBetween(12 * s, -31 * s, 19 * s, 45 * s);
  g.lineBetween(-35 * s, -27 * s, -57 * s, 37 * s);
  g.lineBetween(36 * s, -28 * s, 64 * s, 24 * s);
  g.lineBetween(-18 * s, 41 * s, -35 * s, 116 * s);
  g.lineBetween(19 * s, 41 * s, 33 * s, 116 * s);
  g.fillStyle(0x2e3540, 0.92);
  g.fillRoundedRect(43 * s, 6 * s, 43 * s, 55 * s, 9 * s);
  g.lineStyle(2 * s, 0x9d7438, 0.66);
  g.strokeRoundedRect(43 * s, 6 * s, 43 * s, 55 * s, 9 * s);
  g.lineStyle(5 * s, 0x9a723f, 0.92);
  g.lineBetween(-78 * s, -42 * s, 43 * s, 60 * s);
  g.lineStyle(2 * s, 0xf2c86d, 0.55);
  g.lineBetween(-70 * s, -40 * s, 47 * s, 54 * s);
}

function drawHound(g, s) {
  g.fillStyle(0x09090a, 1);
  g.fillRoundedRect(-76 * s, -35 * s, 122 * s, 58 * s, 28 * s);
  g.fillTriangle(-55 * s, -23 * s, -104 * s, -55 * s, -73 * s, -2 * s);
  g.fillStyle(0x171517, 1);
  g.fillRoundedRect(34 * s, -70 * s, 49 * s, 52 * s, 17 * s);
  g.fillTriangle(45 * s, -67 * s, 56 * s, -111 * s, 69 * s, -67 * s);
  g.fillTriangle(64 * s, -66 * s, 82 * s, -100 * s, 78 * s, -59 * s);
  g.fillStyle(0x0b0a0a, 1);
  [-50, -14, 25, 56].forEach((x, index) => g.fillRoundedRect(x * s, (index === 3 ? -4 : 15) * s, 11 * s, (index === 3 ? 98 : 90) * s, 3 * s));
  g.fillStyle(0x2d2b2e, 0.8);
  g.fillTriangle(-30 * s, -58 * s, 7 * s, -35 * s, -9 * s, -19 * s);
  g.fillTriangle(0, -60 * s, 31 * s, -36 * s, 16 * s, -20 * s);
  g.fillStyle(0xb84a34, 0.98);
  g.fillCircle(62 * s, -51 * s, 4 * s);
  g.fillTriangle(77 * s, -43 * s, 109 * s, -36 * s, 77 * s, -24 * s);
  g.lineStyle(2 * s, 0xd8bd8a, 0.62);
  g.lineBetween(77 * s, -28 * s, 95 * s, -32 * s);
  g.lineBetween(74 * s, -23 * s, 91 * s, -26 * s);
}

function drawRatSwarm(g, s) {
  for (let i = 0; i < 8; i += 1) {
    const x = (-64 + (i % 4) * 41 + (i > 3 ? 15 : 0)) * s;
    const y = (55 + Math.floor(i / 4) * 32 + (i % 2) * 5) * s;
    g.fillStyle(i % 2 ? 0x4a4a36 : 0x24231d, 0.98);
    g.fillEllipse(x, y, 43 * s, 23 * s);
    g.fillTriangle(x + 17 * s, y - 6 * s, x + 40 * s, y - 15 * s, x + 23 * s, y + 3 * s);
    g.lineStyle(2 * s, 0x6b4a31, 0.7);
    g.lineBetween(x - 17 * s, y + 4 * s, x - 44 * s, y + 14 * s);
    g.fillStyle(0xa05238, 0.98);
    g.fillCircle(x + 10 * s, y - 4 * s, 3 * s);
  }
}

function drawCrow(g, s) {
  g.fillStyle(0x06060a, 0.32);
  g.fillEllipse(8 * s, -3 * s, 160 * s, 120 * s);
  g.fillStyle(0x0c0c12, 1);
  g.fillTriangle(-12 * s, -31 * s, -110 * s, 26 * s, -19 * s, 39 * s);
  g.fillTriangle(12 * s, -31 * s, 110 * s, 23 * s, 19 * s, 39 * s);
  g.fillStyle(0x171620, 1);
  g.fillRoundedRect(-29 * s, -56 * s, 58 * s, 103 * s, 26 * s);
  g.fillRoundedRect(-21 * s, -92 * s, 42 * s, 42 * s, 16 * s);
  g.fillStyle(0x0a0a0f, 1);
  g.fillTriangle(-28 * s, 33 * s, -58 * s, 94 * s, -6 * s, 44 * s);
  g.fillTriangle(28 * s, 33 * s, 60 * s, 94 * s, 6 * s, 44 * s);
  g.fillStyle(0xc69a45, 0.96);
  g.fillCircle(8 * s, -76 * s, 4 * s);
  g.fillTriangle(17 * s, -73 * s, 68 * s, -66 * s, 18 * s, -58 * s);
  g.fillStyle(0x5d3d22, 0.95);
  g.fillRoundedRect(23 * s, 12 * s, 40 * s, 22 * s, 3 * s);
  g.lineStyle(2 * s, 0xd8bd8a, 0.55);
  g.lineBetween(25 * s, 23 * s, 63 * s, 23 * s);
  g.lineStyle(2 * s, 0x353345, 0.72);
  [-82, -58, -34].forEach((x, index) => g.lineBetween(x * s, (18 + index * 4) * s, (-14 - index * 4) * s, (30 + index * 3) * s));
  [34, 58, 82].forEach((x, index) => g.lineBetween(14 * s, (31 + index * 3) * s, x * s, (15 + index * 5) * s));
  g.fillStyle(0x342018, 0.88);
  g.fillRoundedRect(-2 * s, 17 * s, 34 * s, 13 * s, 3 * s);
  g.fillStyle(0xf1c76a, 0.7);
  g.fillCircle(8 * s, -76 * s, 6 * s);
  g.lineStyle(2 * s, 0x14121a, 0.95);
  g.lineBetween(-8 * s, 45 * s, -24 * s, 72 * s);
  g.lineBetween(8 * s, 46 * s, 25 * s, 72 * s);
}

function drawMilitia(g, s) {
  g.fillStyle(0x070707, 0.34);
  g.fillEllipse(-3 * s, 8 * s, 142 * s, 184 * s);
  g.fillStyle(0x242220, 1);
  g.fillRect(-21 * s, 36 * s, 16 * s, 81 * s);
  g.fillRect(17 * s, 35 * s, 17 * s, 82 * s);
  g.fillStyle(0x4a4238, 1);
  g.fillRoundedRect(-46 * s, -64 * s, 87 * s, 109 * s, 10 * s);
  g.fillStyle(0x6b5438, 0.96);
  g.fillRect(-42 * s, -18 * s, 83 * s, 14 * s);
  g.fillStyle(0x9b6b37, 0.96);
  g.fillRoundedRect(-29 * s, -104 * s, 54 * s, 40 * s, 9 * s);
  g.fillStyle(0x2a2c2d, 0.9);
  g.fillRect(-34 * s, -104 * s, 65 * s, 12 * s);
  g.lineStyle(5 * s, 0x8b724c, 0.95);
  g.lineBetween(57 * s, -110 * s, 68 * s, 118 * s);
  g.fillStyle(0x6f4b25, 0.9);
  g.fillTriangle(61 * s, -124 * s, 75 * s, -110 * s, 57 * s, -107 * s);
  g.fillStyle(0x2e3540, 0.98);
  g.fillRoundedRect(-86 * s, -19 * s, 49 * s, 80 * s, 10 * s);
  g.lineStyle(2 * s, THEME.colors.darkGold, 0.66);
  g.strokeRoundedRect(-86 * s, -19 * s, 49 * s, 80 * s, 10 * s);
  g.fillStyle(0x171a1c, 0.96);
  g.fillRoundedRect(-24 * s, -94 * s, 49 * s, 16 * s, 4 * s);
  g.fillStyle(0x090a0b, 0.96);
  g.fillRect(-21 * s, -83 * s, 43 * s, 7 * s);
  g.fillStyle(0xa66a35, 0.78);
  g.fillCircle(8 * s, -80 * s, 3 * s);
  g.lineStyle(2 * s, 0xd8bd8a, 0.34);
  g.lineBetween(-38 * s, -45 * s, 31 * s, 18 * s);
  g.lineBetween(-42 * s, -5 * s, 34 * s, -22 * s);
  g.fillStyle(0x7f2730, 0.72);
  g.fillTriangle(64 * s, -98 * s, 105 * s, -50 * s, 69 * s, -40 * s);
}

function drawCandleMonk(g, s) {
  drawCandleGlow(g, 58 * s, -106 * s, 54 * s, 0.14);
  g.fillStyle(0x090606, 0.34);
  g.fillEllipse(0, 10 * s, 146 * s, 196 * s);
  g.fillStyle(0x3f3327, 1);
  g.fillTriangle(-60 * s, 118 * s, 0, -112 * s, 61 * s, 118 * s);
  g.fillStyle(0x2a211a, 0.96);
  g.fillTriangle(-44 * s, 108 * s, -8 * s, -82 * s, 39 * s, 108 * s);
  g.fillStyle(0x594431, 0.72);
  g.fillTriangle(-61 * s, 118 * s, -42 * s, -6 * s, -21 * s, 118 * s);
  g.fillTriangle(61 * s, 118 * s, 39 * s, -2 * s, 19 * s, 118 * s);
  g.fillStyle(0x231b16, 1);
  g.fillRoundedRect(-30 * s, -99 * s, 60 * s, 50 * s, 22 * s);
  g.fillStyle(0x0f0e0d, 0.95);
  g.fillCircle(-9 * s, -78 * s, 4 * s);
  g.fillCircle(9 * s, -78 * s, 4 * s);
  g.fillStyle(0xd8bd8a, 0.56);
  g.fillRoundedRect(-19 * s, -58 * s, 38 * s, 7 * s, 3 * s);
  g.lineStyle(2 * s, 0x8c6237, 0.72);
  g.lineBetween(-30 * s, -48 * s, 31 * s, -48 * s);
  g.lineBetween(0, -43 * s, 0, 72 * s);
  g.lineStyle(7 * s, 0x825a38, 0.96);
  g.lineBetween(59 * s, -78 * s, 59 * s, 106 * s);
  g.fillStyle(0xd8bd8a, 0.86);
  g.fillRoundedRect(49 * s, -114 * s, 21 * s, 38 * s, 5 * s);
  drawCandleFlame(g, 60 * s, -116 * s, s);
  g.lineStyle(2 * s, THEME.colors.darkGold, 0.5);
  g.lineBetween(-20 * s, -18 * s, 22 * s, -17 * s);
  g.fillStyle(0x6a3d20, 0.75);
  g.fillRect(-26 * s, 46 * s, 52 * s, 8 * s);
  g.fillStyle(0x12100e, 0.9);
  g.fillTriangle(-52 * s, 118 * s, -30 * s, 82 * s, -10 * s, 118 * s);
  g.fillTriangle(12 * s, 118 * s, 36 * s, 83 * s, 54 * s, 118 * s);
  g.lineStyle(2 * s, 0xd8bd8a, 0.25);
  g.lineBetween(-41 * s, -2 * s, -22 * s, 88 * s);
  g.lineBetween(38 * s, 4 * s, 23 * s, 88 * s);
  drawPixelGrain(g, -60 * s, -98 * s, 122 * s, 216 * s, [0x8f6b3e, 0x17100c, 0xf1c76a], { count: 34, alpha: 0.08, seed: 21 });
}

function drawWitch(g, s) {
  g.fillStyle(0x26162f, 1);
  g.fillTriangle(-55 * s, 118 * s, -11 * s, -78 * s, 57 * s, 118 * s);
  g.fillStyle(0x32203d, 0.98);
  g.fillRoundedRect(-25 * s, -98 * s, 50 * s, 44 * s, 18 * s);
  g.fillStyle(0x201029, 1);
  g.fillTriangle(-80 * s, -85 * s, 3 * s, -180 * s, 70 * s, -82 * s);
  g.fillRoundedRect(-82 * s, -90 * s, 158 * s, 20 * s, 8 * s);
  g.fillStyle(0x7a5934, 0.95);
  g.fillTriangle(16 * s, -78 * s, 47 * s, -70 * s, 19 * s, -60 * s);
  g.fillStyle(0x0d0a0e, 0.95);
  g.fillCircle(-7 * s, -80 * s, 3 * s);
  g.lineStyle(5 * s, 0x8b6a42, 0.96);
  g.lineBetween(55 * s, -30 * s, 91 * s, 116 * s);
  g.fillStyle(0xd08a49, 0.96);
  g.fillCircle(91 * s, -9 * s, 14 * s);
  g.fillStyle(THEME.colors.arcane, 0.2);
  g.fillCircle(-57 * s, 25 * s, 39 * s);
  g.fillCircle(54 * s, 41 * s, 27 * s);
}

function drawPlagueDoctor(g, s) {
  g.fillStyle(THEME.colors.poison, 0.15);
  g.fillCircle(-61 * s, -12 * s, 48 * s);
  g.fillStyle(0x141414, 1);
  g.fillTriangle(-49 * s, -50 * s, 47 * s, -50 * s, 68 * s, 118 * s);
  g.fillStyle(0x26221f, 1);
  g.fillRoundedRect(-36 * s, -67 * s, 72 * s, 118 * s, 10 * s);
  g.fillStyle(0x171413, 1);
  g.fillRoundedRect(-31 * s, -116 * s, 61 * s, 51 * s, 18 * s);
  g.fillTriangle(16 * s, -99 * s, 94 * s, -84 * s, 19 * s, -72 * s);
  g.fillStyle(0xd4caa2, 0.85);
  g.fillCircle(-13 * s, -95 * s, 5 * s);
  g.fillStyle(THEME.colors.poison, 0.91);
  g.fillCircle(69 * s, -82 * s, 5 * s);
  g.fillStyle(0x477050, 0.95);
  g.fillRoundedRect(-58 * s, -21 * s, 19 * s, 87 * s, 5 * s);
  g.fillRoundedRect(43 * s, -18 * s, 18 * s, 84 * s, 5 * s);
  drawSmallBottles(g, -19 * s, 45 * s, s * 0.85, [THEME.colors.poison, THEME.colors.arcane, THEME.colors.blood]);
  g.lineStyle(5 * s, 0xc9c19a, 0.76);
  g.lineBetween(57 * s, 0, 86 * s, 61 * s);
}

function drawIronMaidenNun(g, s) {
  g.fillStyle(0x282a2f, 1);
  g.fillRoundedRect(-52 * s, -121 * s, 104 * s, 222 * s, 19 * s);
  g.fillStyle(0x111114, 0.98);
  g.fillRoundedRect(-35 * s, -99 * s, 70 * s, 45 * s, 14 * s);
  g.fillStyle(0xe8d6b0, 0.8);
  g.fillRect(-22 * s, -118 * s, 44 * s, 12 * s);
  g.fillStyle(0x7a2730, 0.94);
  g.fillTriangle(-62 * s, -42 * s, -98 * s, 90 * s, -30 * s, 70 * s);
  g.fillTriangle(62 * s, -40 * s, 99 * s, 90 * s, 30 * s, 70 * s);
  g.lineStyle(2 * s, 0xb88935, 0.75);
  g.strokeRoundedRect(-52 * s, -121 * s, 104 * s, 222 * s, 19 * s);
  for (let i = 0; i < 7; i += 1) {
    const y = (-66 + i * 24) * s;
    g.fillStyle(0xa7a09a, 0.75);
    g.fillTriangle(-41 * s, y, -24 * s, y + 7 * s, -41 * s, y + 14 * s);
    g.fillTriangle(41 * s, y, 24 * s, y + 7 * s, 41 * s, y + 14 * s);
  }
  g.fillStyle(THEME.colors.blood, 0.9);
  g.fillRect(-12 * s, -8 * s, 24 * s, 7 * s);
  g.fillRect(-3 * s, -19 * s, 6 * s, 28 * s);
}

function drawFallenPaladin(g, s) {
  g.fillStyle(0x09080b, 0.42);
  g.fillCircle(0, -42 * s, 90 * s);
  g.fillStyle(0x20272d, 1);
  g.fillRoundedRect(-53 * s, -80 * s, 106 * s, 148 * s, 10 * s);
  g.fillStyle(0x11161a, 1);
  g.fillRect(-41 * s, 59 * s, 31 * s, 64 * s);
  g.fillRect(13 * s, 59 * s, 32 * s, 65 * s);
  g.fillStyle(0x171b20, 1);
  g.fillRoundedRect(-38 * s, -129 * s, 76 * s, 51 * s, 10 * s);
  g.fillStyle(0x9c743b, 0.96);
  g.fillRect(-46 * s, -55 * s, 92 * s, 10 * s);
  g.fillRect(-11 * s, -78 * s, 22 * s, 138 * s);
  g.fillStyle(0x8b222b, 0.85);
  g.fillRect(-30 * s, -22 * s, 60 * s, 6 * s);
  g.fillRect(-5 * s, -36 * s, 10 * s, 38 * s);
  g.lineStyle(9 * s, 0x2d3038, 1);
  g.lineBetween(72 * s, -116 * s, 116 * s, 122 * s);
  g.lineStyle(3 * s, 0xd8bd8a, 0.66);
  g.lineBetween(76 * s, -111 * s, 113 * s, 117 * s);
  g.fillStyle(0x2d1116, 0.95);
  g.fillTriangle(-70 * s, -92 * s, -117 * s, 20 * s, -42 * s, 8 * s);
}
