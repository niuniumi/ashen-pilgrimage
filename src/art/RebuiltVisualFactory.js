import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/constants.js';
import {
  addHandPaintedBackground,
  addHandPaintedEnemy,
  addHandPaintedHero,
  HANDPAINTED_KEYS
} from './HandPaintedAssets.js';
import { FINAL_ART } from './FinalArtAssets.js';
import { LOW_NOISE_ENEMY_ASSETS, LOW_NOISE_HERO_ASSETS } from './LowNoiseBattleAssets.js';

const GOLD = 0xd6a84d;
const PALE_GOLD = 0xf4d89c;
const INK = 0x080607;
const BLOOD = 0x8e2630;
const BLUE_STEEL = 0x314b5a;
const CANDLE = 0xf3bd67;

const BATTLE_HERO_INDEX = {
  'exiled-knight': 0,
  'candle-nun': 1,
  'ashblood-alchemist': 2
};

const BATTLE_HERO_ACTION_KEY = {
  'exiled-knight': 'generated-battle-knight-action-sheet',
  'candle-nun': 'generated-battle-nun-action-sheet',
  'ashblood-alchemist': 'generated-battle-alchemist-action-sheet'
};

const BATTLE_ENEMY_INDEX = {
  'rotting-villager': 0,
  'black-hound': 0,
  'plague-rat-swarm': 0,
  'crow-messenger': 4,
  'graveyard-skeleton': 1,
  'hollow-spearman': 1,
  'scripture-moth-swarm': 1,
  'armor-broken-militia': 2,
  'bell-tower-sentry': 2,
  'reliquary-jailer': 2,
  'gate-iron-vicar': 2,
  'candle-monk': 3,
  'wax-novice': 3,
  'cinder-acolyte': 3,
  'iron-maiden-nun': 3,
  'pointed-witch': 4,
  'plague-doctor': 4,
  'clockwork-confessor': 4,
  'fallen-paladin': 5,
  'headless-grave-knight': 5,
  'ash-veiled-prioress': 5,
  'pale-wax-matron': 5,
  'ashen-banneret': 5,
  'gutter-fire-archer': 5,
  'crownless-hound': 5,
  'royal-pyre-knight': 5,
  'hollow-crown-regent': 5
};

const BATTLE_SHEET_ENEMY_IDS = new Set([
  'rotting-villager',
  'graveyard-skeleton',
  'armor-broken-militia',
  'candle-monk',
  'plague-doctor',
  'fallen-paladin',
  'headless-grave-knight'
]);

export function drawRebuiltMenuBackdrop(scene, options = {}) {
  const image =
    addHandPaintedBackground(scene, HANDPAINTED_KEYS.menuJourneyBgV2, { depth: options.depth ?? 0 }) ??
    addHandPaintedBackground(scene, HANDPAINTED_KEYS.menuJourneyBg, { depth: options.depth ?? 0 }) ??
    addHandPaintedBackground(scene, HANDPAINTED_KEYS.menuBg, { depth: options.depth ?? 0 });
  if (image) {
    addWarmDust(scene, { count: 34, depth: (options.depth ?? 0) + 4, alpha: 0.1 });
    return image;
  }
  const g = scene.add.graphics().setDepth(options.depth ?? 0);
  paintParchmentSheet(g);
  paintConceptBorder(g);
  paintSoftJourneyLandscape(g, 0, 0);
  paintInkAbbeySketch(g, 1125, 610, 1.06);
  paintCandleStudy(g, 930, 266, 1.04);
  paintRelicStudies(g);
  paintPaletteSwatches(g, 128, 688);
  paintPaperVignette(g, 0.42);
  addWarmDust(scene, { count: 34, depth: (options.depth ?? 0) + 4, alpha: 0.12 });
  return g;
}

export function drawRebuiltCharacterSelectBackdrop(scene, options = {}) {
  const image = addHandPaintedBackground(scene, HANDPAINTED_KEYS.folioBg, { depth: options.depth ?? 0 });
  if (image) {
    addWarmDust(scene, { count: 24, depth: (options.depth ?? 0) + 4, alpha: 0.08 });
    return image;
  }
  const g = scene.add.graphics().setDepth(options.depth ?? 0);
  paintParchmentSheet(g);
  paintConceptBorder(g, { inset: 30, alpha: 0.48 });
  paintSoftJourneyLandscape(g, 0, 38, 0.78);
  paintInkAbbeySketch(g, 1268, 650, 0.72);
  paintCandleStudy(g, 230, 710, 0.58);
  paintPaletteSwatches(g, 1115, 116, 0.86);
  paintPaperVignette(g, 0.34);
  addWarmDust(scene, { count: 28, depth: (options.depth ?? 0) + 4, alpha: 0.1 });
  return g;
}

export function drawRebuiltBattleBackdrop(scene, options = {}) {
  const image = addHandPaintedBackground(scene, HANDPAINTED_KEYS.battleBg, { depth: options.depth ?? 0 });
  if (image) {
    addChapterBattleAtmosphere(scene, options.act ?? 1, (options.depth ?? 0) + 1);
    addWarmDust(scene, { count: 34, depth: (options.depth ?? 0) + 4, alpha: 0.08 });
    return image;
  }
  const g = scene.add.graphics().setDepth(options.depth ?? 0);
  const stage = options.layout?.stage ?? { x: 80, y: 120, w: 1000, h: 520, baseline: 548 };
  paintWarmBattleSky(g);
  paintMoonHaze(g, 554, 365, 850, 0.1);
  paintWarmRidges(g, 0.94);
  paintReadableAbbey(g, stage.baseline + 2);
  paintWarmStageGround(g, stage);
  paintBattleSetDressing(g, stage);
  paintForegroundDebris(g, 574, stage);
  paintSoftBattleVignette(g);
  addWarmDust(scene, { count: 54, depth: (options.depth ?? 0) + 4, alpha: 0.11 });
  return g;
}

function addChapterBattleAtmosphere(scene, act, depth) {
  if (act <= 1) return;
  const g = scene.add.graphics().setDepth(depth);
  if (act === 2) {
    g.fillStyle(0xe8e2cd, 0.065);
    g.fillRect(0, 0, 1536, 864);
    g.fillStyle(0xf4e6b8, 0.08);
    for (let index = 0; index < 7; index += 1) {
      const x = 188 + index * 190;
      g.fillEllipse(x, 352 + (index % 2) * 48, 42, 160);
      g.fillCircle(x, 278 + (index % 2) * 48, 18);
    }
    return;
  }
  g.fillStyle(0x4b1720, 0.085);
  g.fillRect(0, 0, 1536, 864);
  g.fillStyle(0xa34231, 0.07);
  g.fillEllipse(430, 560, 760, 160);
  g.fillEllipse(1040, 520, 680, 140);
  g.lineStyle(3, 0xd29d48, 0.1);
  for (let index = 0; index < 6; index += 1) {
    g.lineBetween(170 + index * 240, 120, 260 + index * 220, 560);
  }
}

export function drawRebuiltHero(scene, characterId, x = 0, y = 0, scale = 1, options = {}) {
  const container = scene.add.container(x, y);
  if (Number.isFinite(options.depth)) container.setDepth(options.depth);
  const g = scene.add.graphics();
  container.add(g);
  if (!options.artPortrait) {
    drawGroundShadow(g, 0, 116 * scale, heroShadow(characterId) * scale, 28 * scale, 0.38);
  }
  const battleHero = !options.artPortrait && options.battle !== false ? addLowNoiseHeroSprite(scene, container, characterId, scale, options) : null;
  if (battleHero) {
    addSpriteRim(g, scale, 112, characterId === 'candle-nun' ? CANDLE : characterId === 'ashblood-alchemist' ? 0x4f8f88 : BLOOD);
  } else if (!options.battle) {
    const paintedHero = addHandPaintedHero(scene, container, characterId, scale, options);
    if (paintedHero) {
    addSpriteRim(g, scale, options.artPortrait ? 88 : 104, characterId === 'candle-nun' ? CANDLE : characterId === 'ashblood-alchemist' ? 0x4f8f88 : BLOOD);
    } else if (characterId === 'exiled-knight' && options.artPortrait && addGeneratedSprite(scene, container, 'generated-exiled-knight-portrait', scale, options)) {
    addSpriteRim(g, scale, 104, CANDLE);
    } else if (characterId === 'exiled-knight' && addGeneratedSprite(scene, container, 'generated-exiled-knight-warm-battle', scale, options)) {
    addSpriteRim(g, scale, 108, BLOOD);
    } else if (characterId === 'candle-nun') drawCandleNun(g, scale);
    else if (characterId === 'ashblood-alchemist') drawAshbloodAlchemist(g, scale);
    else drawExiledKnight(g, scale);
  }
  if (options.idle !== false && !options.battle) {
    scene.tweens.add({
      targets: container,
      y: y - 5 * scale,
      yoyo: true,
      repeat: -1,
      duration: characterId === 'candle-nun' ? 1540 : characterId === 'ashblood-alchemist' ? 1290 : 1380,
      ease: 'Sine.InOut'
    });
  }
  return container;
}

export function drawRebuiltEnemy(scene, enemyId, x = 0, y = 0, scale = 1, options = {}) {
  const container = scene.add.container(x, y);
  if (Number.isFinite(options.depth)) container.setDepth(options.depth);
  const g = scene.add.graphics();
  container.add(g);
  const boss = options.type === 'boss' || enemyId === 'headless-grave-knight';
  drawGroundShadow(g, 0, (boss ? 150 : 116) * scale, (boss ? 260 : enemyShadow(enemyId)) * scale, (boss ? 34 : 24) * scale, boss ? 0.48 : 0.36);

  const battleEnemy = options.battle !== false ? addLowNoiseEnemySprite(scene, container, enemyId, scale, options) : null;
  if (battleEnemy) {
    addSpriteRim(g, scale, boss ? 134 : 102, boss ? 0xd9c48a : 0x6f8a4c);
  } else if (!options.battle) {
    const paintedEnemy = addHandPaintedEnemy(scene, container, enemyId, scale, options);
    if (paintedEnemy) {
    addSpriteRim(g, scale, boss ? 126 : 94, boss ? 0xd9c48a : 0x6f8a4c);
    } else if (enemyId === 'rotting-villager' && addGeneratedSprite(scene, container, 'generated-rotting-villager-warm-battle', scale, { ...options, enemy: true })) {
    addSpriteRim(g, scale, 94, 0x6f8a4c);
    } else if (boss) drawHeadlessGraveKnight(g, scale, options.phase ?? 1);
    else if (enemyId === 'black-hound') drawBlackHound(g, scale);
    else if (enemyId === 'plague-rat-swarm') drawRatSwarm(g, scale);
    else if (enemyId === 'crow-messenger') drawCrowMessenger(g, scale);
    else if (enemyId === 'graveyard-skeleton') drawGraveSkeleton(g, scale);
    else if (enemyId === 'armor-broken-militia') drawBrokenMilitia(g, scale);
    else if (enemyId === 'candle-monk') drawCandleMonk(g, scale);
    else if (enemyId === 'pointed-witch') drawPointedWitch(g, scale);
    else if (enemyId === 'plague-doctor') drawPlagueDoctor(g, scale);
    else if (enemyId === 'iron-maiden-nun') drawIronMaidenNun(g, scale);
    else if (enemyId === 'fallen-paladin') drawFallenPaladin(g, scale);
    else drawRottingVillager(g, scale);
  }

  if (options.idle !== false && !options.battle) {
    scene.tweens.add({
      targets: container,
      angle: boss ? 0 : enemyId === 'black-hound' || enemyId === 'plague-rat-swarm' ? 0 : 1.4,
      yoyo: true,
      repeat: -1,
      duration: enemyId === 'crow-messenger' ? 820 : boss ? 1660 : 1120,
      ease: 'Sine.InOut'
    });
    if (enemyId === 'crow-messenger') {
      scene.tweens.add({ targets: container, y: y - 10 * scale, yoyo: true, repeat: -1, duration: 920, ease: 'Sine.InOut' });
    }
  }
  return container;
}

function paintParchmentSheet(g) {
  g.fillGradientStyle(0xf8f0df, 0xf6ead2, 0xdfcba6, 0xf1dfbf, 1);
  g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  g.fillStyle(0xffffff, 0.14);
  g.fillEllipse(865, 245, 1060, 430);
  g.fillStyle(0xc89d62, 0.055);
  g.fillEllipse(278, 620, 740, 210);
  g.fillEllipse(1220, 178, 520, 190);
  for (let i = 0; i < 150; i += 1) {
    const x = 24 + ((i * 97) % (GAME_WIDTH - 48));
    const y = 18 + ((i * 53) % (GAME_HEIGHT - 36));
    g.fillStyle(i % 3 === 0 ? 0x7b6040 : i % 3 === 1 ? 0xffffff : 0xb7894c, i % 3 === 1 ? 0.07 : 0.045);
    g.fillEllipse(x, y, 7 + (i % 13), 2 + (i % 5));
  }
  for (let y = 34; y < GAME_HEIGHT; y += 28) {
    g.fillStyle(0x8c6c43, 0.018);
    g.fillRect(0, y, GAME_WIDTH, 2);
  }
}

function paintConceptBorder(g, options = {}) {
  const inset = options.inset ?? 36;
  const alpha = options.alpha ?? 0.62;
  g.lineStyle(2, 0x8a6a3c, alpha);
  g.strokeRoundedRect(inset, inset, GAME_WIDTH - inset * 2, GAME_HEIGHT - inset * 2, 10);
  g.lineStyle(1, 0x4f4130, alpha * 0.5);
  g.strokeRoundedRect(inset + 13, inset + 12, GAME_WIDTH - (inset + 13) * 2, GAME_HEIGHT - (inset + 12) * 2, 7);
  sketchLine(g, 70, 74, 418, 50, 0x4a4034, 0.34);
  sketchLine(g, 1116, 52, 1454, 78, 0x4a4034, 0.28);
  sketchLine(g, 72, 812, 394, 782, 0x4a4034, 0.22);
  sketchLine(g, 1180, 806, 1450, 792, 0x4a4034, 0.2);
}

function paintSoftJourneyLandscape(g, ox = 0, oy = 0, alpha = 1) {
  g.fillStyle(0xe5cfa8, 0.35 * alpha);
  g.fillEllipse(720 + ox, 470 + oy, 1000, 140);
  g.fillStyle(0xcfb182, 0.26 * alpha);
  poly(g, [[0 + ox, 614 + oy], [260 + ox, 394 + oy], [530 + ox, 614 + oy]]);
  poly(g, [[462 + ox, 616 + oy], [790 + ox, 338 + oy], [1115 + ox, 616 + oy]]);
  poly(g, [[1008 + ox, 616 + oy], [1230 + ox, 440 + oy], [1536 + ox, 616 + oy]]);
  g.fillStyle(0xb8945e, 0.12 * alpha);
  poly(g, [[160 + ox, 864], [564 + ox, 580 + oy], [744 + ox, 580 + oy], [1032 + ox, 864]]);
  g.lineStyle(1, 0x7b6040, 0.18 * alpha);
  for (let i = 0; i < 9; i += 1) {
    const x = 330 + i * 58 + ox;
    g.lineBetween(x, 656 + oy, 600 + i * 28 + ox, 864);
  }
  g.lineStyle(2, 0x8b6a42, 0.16 * alpha);
  g.lineBetween(0, 616 + oy, GAME_WIDTH, 616 + oy);
}

function paintInkAbbeySketch(g, x, y, scale = 1) {
  const ink = 0x4b4033;
  const gold = 0xb88935;
  glow(g, x + 22 * scale, y - 188 * scale, 140 * scale, CANDLE, 0.08);
  g.lineStyle(3 * scale, ink, 0.42);
  g.strokeRoundedRect(x - 92 * scale, y - 250 * scale, 184 * scale, 238 * scale, 86 * scale);
  g.lineStyle(2 * scale, ink, 0.32);
  g.strokeRoundedRect(x - 68 * scale, y - 214 * scale, 136 * scale, 200 * scale, 68 * scale);
  g.lineStyle(2 * scale, gold, 0.42);
  g.lineBetween(x, y - 214 * scale, x, y - 38 * scale);
  g.lineBetween(x - 42 * scale, y - 152 * scale, x + 42 * scale, y - 152 * scale);
  g.lineStyle(1 * scale, ink, 0.24);
  for (let i = -2; i <= 2; i += 1) {
    g.lineBetween(x + i * 32 * scale, y - 194 * scale, x + i * 18 * scale, y - 16 * scale);
  }
  for (let i = 0; i < 5; i += 1) {
    const cx = x - 72 * scale + i * 36 * scale;
    sketchLine(g, cx, y - 248 * scale, cx + 20 * scale, y - 272 * scale, ink, 0.18, 3 * scale);
  }
  g.fillStyle(0xd0b987, 0.18);
  g.fillRoundedRect(x - 146 * scale, y - 14 * scale, 292 * scale, 28 * scale, 8 * scale);
  for (let i = 0; i < 5; i += 1) {
    const cx = x - 92 * scale + i * 45 * scale;
    g.fillStyle(0xf4dfb2, 0.9);
    g.fillRoundedRect(cx - 6 * scale, y - 46 * scale, 12 * scale, 43 * scale, 3 * scale);
    drawFlame(g, cx, y - 48 * scale, 0.42 * scale);
  }
}

function paintCandleStudy(g, x, y, scale = 1) {
  glow(g, x, y - 210 * scale, 116 * scale, CANDLE, 0.18);
  g.lineStyle(2 * scale, 0x816032, 0.58);
  g.strokeCircle(x, y - 215 * scale, 64 * scale);
  g.lineStyle(1 * scale, 0x816032, 0.26);
  g.strokeCircle(x, y - 215 * scale, 92 * scale);
  g.lineBetween(x - 110 * scale, y - 215 * scale, x - 78 * scale, y - 215 * scale);
  g.lineBetween(x + 78 * scale, y - 215 * scale, x + 112 * scale, y - 215 * scale);
  g.lineBetween(x, y - 328 * scale, x, y - 294 * scale);
  g.lineBetween(x, y - 136 * scale, x, y - 100 * scale);
  g.lineStyle(8 * scale, 0x4f3a28, 0.86);
  g.lineBetween(x, y - 182 * scale, x, y + 116 * scale);
  g.lineStyle(3 * scale, 0xb88935, 0.92);
  g.lineBetween(x, y - 182 * scale, x, y + 116 * scale);
  g.fillStyle(0xf1dfbf, 0.96);
  g.fillRoundedRect(x - 16 * scale, y - 244 * scale, 32 * scale, 80 * scale, 7 * scale);
  g.lineStyle(2 * scale, 0x8a6a3c, 0.46);
  g.strokeRoundedRect(x - 16 * scale, y - 244 * scale, 32 * scale, 80 * scale, 7 * scale);
  drawFlame(g, x, y - 252 * scale, 1.08 * scale);
  g.fillStyle(0x8a6335, 0.92);
  g.fillRoundedRect(x - 42 * scale, y - 154 * scale, 84 * scale, 18 * scale, 6 * scale);
  g.fillRoundedRect(x - 30 * scale, y + 108 * scale, 60 * scale, 16 * scale, 6 * scale);
  g.fillStyle(0xc79b4f, 0.9);
  g.fillCircle(x - 39 * scale, y - 146 * scale, 8 * scale);
  g.fillCircle(x + 39 * scale, y - 146 * scale, 8 * scale);
}

function paintRelicStudies(g) {
  const ink = 0x594637;
  g.lineStyle(2, ink, 0.38);
  g.strokeRoundedRect(94, 354, 174, 150, 22);
  g.lineStyle(2, 0xb88935, 0.55);
  g.strokeCircle(181, 424, 42);
  g.lineBetween(181, 388, 181, 462);
  g.lineBetween(151, 424, 211, 424);
  g.lineStyle(2, ink, 0.28);
  sketchLine(g, 86, 535, 268, 516, ink, 0.24);
  sketchLine(g, 92, 558, 246, 560, ink, 0.18);
  g.lineStyle(3, 0xb88935, 0.58);
  g.strokeCircle(158, 606, 36);
  g.strokeCircle(188, 604, 34);
  g.lineStyle(1, ink, 0.22);
  g.strokeCircle(160, 606, 49);
  g.strokeCircle(188, 604, 46);
}

function paintPaletteSwatches(g, x, y, scale = 1) {
  const colors = [0xf2e5cc, 0xd7bd8d, 0x9e8261, 0x4f4b44, 0x242a2d, 0xc39148];
  colors.forEach((color, index) => {
    const sx = x + index * 33 * scale;
    const points = [[sx, y - 14 * scale], [sx + 14 * scale, y], [sx, y + 14 * scale], [sx - 14 * scale, y]];
    g.fillStyle(color, 0.96);
    poly(g, points);
    g.lineStyle(1, 0x5f4c37, 0.34);
    g.beginPath();
    g.moveTo(points[0][0], points[0][1]);
    points.slice(1).forEach(([px, py]) => g.lineTo(px, py));
    g.closePath();
    g.strokePath();
  });
  g.lineStyle(1, 0x8a6a3c, 0.26);
  sketchLine(g, x - 16 * scale, y + 34 * scale, x + 206 * scale, y + 28 * scale, 0x8a6a3c, 0.24, 2 * scale);
}

function paintPaperVignette(g, strength = 0.32) {
  for (let i = 0; i < 16; i += 1) {
    const alpha = strength * (0.012 + i * 0.005);
    g.fillStyle(0x7b5a34, alpha);
    g.fillRect(i * 10, 0, 16, GAME_HEIGHT);
    g.fillRect(GAME_WIDTH - 16 - i * 10, 0, 16, GAME_HEIGHT);
    g.fillRect(0, i * 8, GAME_WIDTH, 12);
    g.fillRect(0, GAME_HEIGHT - 12 - i * 8, GAME_WIDTH, 12);
  }
}

function paintWarmBattleSky(g) {
  g.fillGradientStyle(0xefe0c4, 0xe9d0a6, 0xb98258, 0x68422e, 1);
  g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  g.fillStyle(0xffffff, 0.12);
  g.fillEllipse(552, 284, 960, 260);
  g.fillStyle(0xf4d7a1, 0.18);
  g.fillEllipse(742, 384, 1080, 150);
  for (let i = 0; i < 12; i += 1) {
    g.fillStyle(0xffffff, 0.026);
    g.fillRect(0, i * 43, GAME_WIDTH, 12);
  }
}

function paintWarmRidges(g, alpha = 1) {
  g.fillStyle(0x9f876d, 0.36 * alpha);
  poly(g, [[0, 570], [296, 338], [620, 570]]);
  poly(g, [[518, 572], [824, 312], [1210, 572]]);
  poly(g, [[980, 572], [1250, 374], [1536, 572]]);
  g.fillStyle(0x6f665e, 0.44 * alpha);
  poly(g, [[92, 600], [360, 398], [648, 600]]);
  poly(g, [[694, 600], [1008, 348], [1328, 600]]);
  g.fillStyle(0xf0d4a4, 0.12 * alpha);
  g.fillEllipse(640, 408, 980, 104);
}

function paintReadableAbbey(g, groundY) {
  g.fillStyle(0x6c655d, 0.23);
  g.fillEllipse(790, groundY - 96, 780, 74);
  g.fillStyle(0x383b3e, 0.62);
  const towers = [
    [526, 120, 42],
    [592, 158, 48],
    [670, 220, 70],
    [766, 184, 56],
    [850, 128, 44],
    [1004, 354, 72]
  ];
  towers.forEach(([x, h, w], index) => {
    g.fillRect(x, groundY - h, w, h);
    g.fillTriangle(x - w * 0.24, groundY - h, x + w * 0.5, groundY - h - 58 - index * 5, x + w * 1.24, groundY - h);
    g.fillStyle(0xffe2a5, 0.15);
    g.fillRect(x + w * 0.38, groundY - 60 - (index % 3) * 22, 7, 24);
    g.fillStyle(0x383b3e, 0.62);
  });
  g.fillStyle(0x2f3338, 0.68);
  g.fillRect(638, groundY - 276, 194, 276);
  g.fillStyle(0x383a40, 0.7);
  poly(g, [[626, groundY - 276], [744, groundY - 390], [852, groundY - 276]]);
  g.fillStyle(0x1e2228, 0.62);
  poly(g, [[690, groundY], [718, groundY - 158], [750, groundY], [736, groundY]]);
  poly(g, [[770, groundY], [788, groundY - 118], [810, groundY], [798, groundY]]);
  g.lineStyle(2, 0xf4d89c, 0.12);
  g.strokeRoundedRect(706, groundY - 188, 26, 88, 14);
  g.strokeRoundedRect(778, groundY - 164, 24, 76, 12);
  g.lineStyle(2, 0x8a6a3c, 0.24);
  g.lineBetween(500, groundY + 2, 1010, groundY + 2);
}

function paintWarmStageGround(g, stage) {
  g.fillGradientStyle(0x865538, 0x7b4f35, 0x3b2417, 0x25180f, 1);
  g.fillRect(0, 574, GAME_WIDTH, GAME_HEIGHT - 574);
  g.fillStyle(0xe0bb7b, 0.14);
  g.fillRect(0, 574, GAME_WIDTH, 74);
  g.fillStyle(0x7b5434, 0.54);
  g.fillRoundedRect(stage.x, 598, stage.w, 54, 8);
  g.fillStyle(0xa77b4b, 0.16);
  poly(g, [
    [stage.x + 155, 650],
    [stage.x + 400, stage.baseline + 8],
    [stage.x + 520, stage.baseline + 8],
    [stage.x + 750, 650]
  ]);
  g.lineStyle(1, 0xf0d4a4, 0.18);
  for (let i = 0; i < 13; i += 1) {
    const left = stage.x + 198 + i * 38;
    g.lineBetween(left, 648, stage.x + 430 + i * 8, stage.baseline + 10);
  }
  for (let i = 0; i < 7; i += 1) {
    const y = stage.baseline + 12 + i * 13;
    g.lineBetween(stage.x + 180 + i * 18, y, stage.x + 720 - i * 14, y + (i % 2) * 5);
  }
  g.fillStyle(0xf2d4a0, 0.16);
  g.fillEllipse(stage.x + 262, 609, 270, 24);
  g.fillEllipse(stage.x + 705, 614, 320, 28);
  g.lineStyle(3, 0xd6a84d, 0.42);
  g.lineBetween(stage.x + 70, stage.baseline, stage.x + stage.w - 70, stage.baseline);
  g.lineStyle(1, 0x412916, 0.42);
  g.lineBetween(stage.x + 70, stage.baseline + 4, stage.x + stage.w - 70, stage.baseline + 4);
}

function paintSoftBattleVignette(g) {
  for (let i = 0; i < 10; i += 1) {
    const alpha = 0.018 + i * 0.008;
    g.fillStyle(0x3d2418, alpha);
    g.fillRect(i * 12, 0, 18, GAME_HEIGHT);
    g.fillRect(GAME_WIDTH - 18 - i * 12, 0, 18, GAME_HEIGHT);
    g.fillRect(0, GAME_HEIGHT - 14 - i * 8, GAME_WIDTH, 14);
  }
}

function sketchLine(g, x1, y1, x2, y2, color, alpha, offset = 3) {
  g.lineStyle(1, color, alpha);
  g.lineBetween(x1, y1, x2, y2);
  g.lineStyle(1, color, alpha * 0.42);
  g.lineBetween(x1 - offset, y1 + offset * 0.4, x2 + offset, y2 - offset * 0.4);
}

function paintSky(g, topLeft, topRight, bottomLeft, bottomRight) {
  g.fillGradientStyle(topLeft, topRight, bottomLeft, bottomRight, 1);
  g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  for (let i = 0; i < 12; i += 1) {
    g.fillStyle(0xffffff, 0.012 + i * 0.002);
    g.fillRect(0, i * 42, GAME_WIDTH, 18);
  }
}

function paintMoonHaze(g, x, y, width, alpha) {
  g.fillStyle(0x8f6644, alpha);
  g.fillEllipse(x, y, width, width * 0.22);
  g.fillStyle(0xf3bd67, alpha * 0.18);
  g.fillEllipse(x - width * 0.18, y - 20, width * 0.46, width * 0.09);
  g.fillStyle(0x8f7a6c, alpha * 0.2);
  g.fillEllipse(x + width * 0.18, y + 10, width * 0.5, width * 0.08);
}

function paintDistantRidge(g, alpha = 1) {
  g.fillStyle(0x39344c, 0.66 * alpha);
  poly(g, [[0, 590], [310, 330], [602, 590]]);
  poly(g, [[520, 590], [825, 260], [1210, 590]]);
  g.fillStyle(0x242336, 0.82 * alpha);
  poly(g, [[100, 612], [358, 386], [640, 612]]);
  poly(g, [[682, 612], [1012, 318], [1325, 612]]);
  g.fillStyle(0x7b5034, 0.2 * alpha);
  g.fillEllipse(610, 416, 960, 104);
}

function paintPilgrimRoad(g) {
  g.fillStyle(0x22130e, 1);
  g.fillRect(0, 585, GAME_WIDTH, GAME_HEIGHT - 585);
  g.fillStyle(0x563323, 0.82);
  g.fillRect(0, 585, GAME_WIDTH, 64);
  g.fillStyle(0x4b2a1d, 0.56);
  poly(g, [[170, 864], [388, 585], [472, 585], [720, 864]]);
  g.fillStyle(0x1f100b, 0.76);
  poly(g, [[312, 864], [402, 585], [448, 585], [550, 864]]);
}

function paintCathedralInteriorHint(g) {
  g.fillStyle(0x19151e, 0.54);
  for (let i = 0; i < 7; i += 1) {
    const x = 78 + i * 230;
    g.fillRect(x, 170, 34, 690);
    g.fillTriangle(x - 23, 170, x + 17, 112, x + 57, 170);
  }
  g.fillStyle(0xf3bd67, 0.075);
  g.fillEllipse(768, 385, 880, 280);
  g.fillStyle(0x251611, 0.7);
  g.fillRect(0, 620, GAME_WIDTH, 244);
}

function paintCathedralSilhouette(g, x, groundY, scale = 1) {
  g.fillStyle(0x090a0f, 0.94);
  g.fillRect(x, groundY - 244 * scale, 66 * scale, 244 * scale);
  g.fillTriangle(x - 34 * scale, groundY - 244 * scale, x + 33 * scale, groundY - 324 * scale, x + 100 * scale, groundY - 244 * scale);
  g.fillRect(x + 34 * scale, groundY - 352 * scale, 42 * scale, 126 * scale);
  g.fillTriangle(x + 13 * scale, groundY - 352 * scale, x + 55 * scale, groundY - 438 * scale, x + 98 * scale, groundY - 352 * scale);
  g.fillStyle(CANDLE, 0.12);
  g.fillRect(x + 23 * scale, groundY - 176 * scale, 8 * scale, 28 * scale);
  g.fillRect(x + 50 * scale, groundY - 300 * scale, 7 * scale, 24 * scale);
}

function paintBurnedAbbey(g, groundY) {
  g.fillStyle(0x2a2230, 0.26);
  g.fillEllipse(742, groundY - 104, 760, 74);
  g.fillStyle(0x11131c, 0.88);
  const towers = [
    [515, 118, 42],
    [588, 162, 48],
    [662, 230, 70],
    [756, 186, 56],
    [836, 128, 44],
    [1010, 388, 84]
  ];
  towers.forEach(([x, h, w], index) => {
    g.fillRect(x, groundY - h, w, h);
    g.fillTriangle(x - w * 0.24, groundY - h, x + w * 0.5, groundY - h - 62 - index * 6, x + w * 1.24, groundY - h);
    g.fillStyle(0xe0b15e, 0.11);
    g.fillRect(x + w * 0.38, groundY - 62 - (index % 3) * 26, 7, 24);
    g.fillStyle(0x11131c, 0.88);
  });
  g.fillStyle(0x161b25, 0.92);
  g.fillRect(630, groundY - 292, 202, 292);
  g.fillStyle(0x1c1a28, 0.92);
  poly(g, [[620, groundY - 292], [745, groundY - 412], [852, groundY - 292]]);
  g.fillStyle(0x08090d, 0.92);
  poly(g, [[690, groundY], [718, groundY - 172], [750, groundY], [736, groundY]]);
  poly(g, [[770, groundY], [788, groundY - 126], [810, groundY], [798, groundY]]);
  g.fillStyle(0x211d2b, 0.42);
  poly(g, [[745, groundY - 412], [852, groundY - 292], [712, groundY - 292]]);
  g.fillStyle(0xd8bd8a, 0.075);
  g.fillRect(710, groundY - 190, 9, 33);
  g.fillRect(780, groundY - 164, 7, 28);
  g.fillRect(604, groundY - 102, 6, 22);
  g.lineStyle(2, 0x2e2d36, 0.34);
  for (let i = 0; i < 5; i += 1) {
    const x = 532 + i * 80;
    g.strokeRoundedRect(x, groundY - 108 - (i % 2) * 20, 44, 104 + (i % 2) * 20, 22);
    g.fillStyle(0x0b0c12, 0.7);
    g.fillRoundedRect(x + 8, groundY - 94 - (i % 2) * 20, 28, 90 + (i % 2) * 20, 14);
  }
  g.lineStyle(2, 0x7d5b36, 0.24);
  g.lineBetween(500, groundY + 2, 1010, groundY + 2);
}

function paintStageGround(g, stage) {
  g.fillStyle(0x24130d, 1);
  g.fillRect(0, 574, GAME_WIDTH, GAME_HEIGHT - 574);
  g.fillStyle(0x5a3422, 0.82);
  g.fillRect(0, 574, GAME_WIDTH, 76);
  g.fillStyle(0x352116, 0.9);
  g.fillRoundedRect(stage.x, 598, stage.w, 54, 8);
  g.fillStyle(0x3f281d, 0.42);
  poly(g, [
    [stage.x + 170, 650],
    [stage.x + 400, stage.baseline + 8],
    [stage.x + 520, stage.baseline + 8],
    [stage.x + 730, 650]
  ]);
  g.lineStyle(1, 0x6b4a31, 0.28);
  for (let i = 0; i < 13; i += 1) {
    const left = stage.x + 198 + i * 38;
    g.lineBetween(left, 648, stage.x + 430 + i * 8, stage.baseline + 10);
  }
  for (let i = 0; i < 7; i += 1) {
    const y = stage.baseline + 12 + i * 13;
    g.lineBetween(stage.x + 180 + i * 18, y, stage.x + 720 - i * 14, y + (i % 2) * 5);
  }
  g.fillStyle(0x7b5832, 0.14);
  g.fillEllipse(stage.x + 262, 609, 270, 24);
  g.fillEllipse(stage.x + 705, 614, 320, 28);
  g.lineStyle(3, 0xb88935, 0.32);
  g.lineBetween(stage.x + 70, stage.baseline, stage.x + stage.w - 70, stage.baseline);
  g.lineStyle(1, 0x000000, 0.46);
  g.lineBetween(stage.x + 70, stage.baseline + 4, stage.x + stage.w - 70, stage.baseline + 4);
}

function paintBattleSetDressing(g, stage) {
  g.fillStyle(0x060505, 0.52);
  g.fillRect(stage.x, stage.baseline + 50, stage.w, 96);
  const candles = [
    [stage.x + 138, stage.baseline + 38, 0.62],
    [stage.x + 178, stage.baseline + 47, 0.44],
    [stage.x + 908, stage.baseline + 36, 0.56],
    [stage.x + 946, stage.baseline + 50, 0.38]
  ];
  candles.forEach(([x, y, scale]) => {
    glow(g, x, y - 26 * scale, 34 * scale, CANDLE, 0.18);
    g.fillStyle(0xd8bd8a, 0.9);
    g.fillRoundedRect(x - 5 * scale, y - 32 * scale, 10 * scale, 34 * scale, 2 * scale);
    drawFlame(g, x, y - 35 * scale, scale * 0.6);
  });
  g.lineStyle(2, 0x5d3d22, 0.28);
  g.lineBetween(stage.x + 56, stage.baseline + 78, stage.x + 280, stage.baseline + 118);
  g.lineBetween(stage.x + stage.w - 60, stage.baseline + 78, stage.x + stage.w - 300, stage.baseline + 116);
  for (let i = 0; i < 18; i += 1) {
    const x = stage.x + 42 + ((i * 67) % (stage.w - 84));
    const y = stage.baseline + 44 + ((i * 31) % 78);
    g.fillStyle(i % 2 ? 0x6b4a31 : 0x2b1a15, 0.28);
    g.fillEllipse(x, y, 18 + (i % 7), 5 + (i % 3));
  }
}

function paintForegroundCamp(g, x, y, scale) {
  drawGroundShadow(g, x + 4 * scale, y + 25 * scale, 340 * scale, 48 * scale, 0.55);
  glow(g, x, y - 30 * scale, 118 * scale, CANDLE, 0.22);
  g.fillStyle(0x3a2013, 0.95);
  g.fillCircle(x, y - 12 * scale, 94 * scale);
  g.fillStyle(0x4f2818, 0.96);
  poly(g, [[x - 48 * scale, y], [x + 4 * scale, y - 132 * scale], [x + 58 * scale, y]]);
  g.fillStyle(CANDLE, 0.98);
  poly(g, [[x - 30 * scale, y], [x + 6 * scale, y - 92 * scale], [x + 44 * scale, y]]);
  g.fillStyle(0xe56b2f, 0.9);
  poly(g, [[x - 6 * scale, y], [x + 18 * scale, y - 63 * scale], [x + 64 * scale, y]]);
  for (let i = 0; i < 4; i += 1) {
    const cx = x - 165 * scale + i * 40 * scale;
    const cy = y - 98 * scale + (i % 2) * 26 * scale;
    g.fillStyle(0xd8bd8a, 0.92);
    g.fillRoundedRect(cx - 7 * scale, cy, 14 * scale, (64 - i * 5) * scale, 3 * scale);
    drawFlame(g, cx, cy - 2 * scale, scale * 0.72);
  }
}

function paintForegroundDebris(g, groundY, stage = null) {
  const minX = stage?.x ?? 0;
  const width = stage?.w ?? GAME_WIDTH;
  for (let i = 0; i < 72; i += 1) {
    const x = minX + 20 + ((i * 83) % Math.max(1, width - 40));
    const y = groundY + 38 + ((i * 31) % 220);
    g.fillStyle(i % 2 ? 0x7a5832 : 0x2a1710, i % 2 ? 0.22 : 0.36);
    g.fillEllipse(x, y, 9 + (i % 8), 3 + (i % 4));
  }
  for (let i = 0; i < 40; i += 1) {
    const x = minX + 24 + ((i * 61) % Math.max(1, width - 48));
    const y = groundY + ((i * 29) % 112);
    g.lineStyle(1 + (i % 2), i % 3 === 0 ? 0x6f6c41 : 0x4b3422, 0.2);
    g.lineBetween(x, y, x + 16 + (i % 8), y + 9 + (i % 4));
  }
}

function paintVignette(g) {
  for (let i = 0; i < 12; i += 1) {
    const alpha = 0.03 + i * 0.015;
    g.fillStyle(0x020101, alpha);
    g.fillRect(i * 12, 0, 18, GAME_HEIGHT);
    g.fillRect(GAME_WIDTH - 18 - i * 12, 0, 18, GAME_HEIGHT);
    g.fillRect(0, i * 9, GAME_WIDTH, 14);
    g.fillRect(0, GAME_HEIGHT - 14 - i * 9, GAME_WIDTH, 14);
  }
}

function drawExiledKnight(g, s) {
  glow(g, -34 * s, 6 * s, 112 * s, BLOOD, 0.1);
  cape(g, s, [[-66, -58], [-135, 23], [-112, 118], [-68, 86], [-30, 123], [-12, 34], [-30, -52]], 0x7b1f2d, 0.96);
  cape(g, s, [[-48, -36], [-96, 96], [-18, 70], [-8, -24]], 0x2a1014, 0.88);
  armorLegs(g, s, -24, 38, 0x0a0e10, 0x222b2e);
  g.fillStyle(0x1d272b, 1);
  g.fillRoundedRect(-43 * s, -48 * s, 88 * s, 105 * s, 12 * s);
  g.fillStyle(0x10171a, 1);
  poly(g, [[-50 * s, -47 * s], [0, -75 * s], [52 * s, -47 * s], [31 * s, 52 * s], [0, 69 * s], [-31 * s, 52 * s]]);
  g.fillStyle(0x48585d, 0.8);
  poly(g, [[-24 * s, -39 * s], [0, -65 * s], [26 * s, -39 * s], [7 * s, -6 * s], [-8 * s, -6 * s]]);
  g.fillStyle(0x6d7b7f, 0.42);
  poly(g, [[-17 * s, -34 * s], [0, -56 * s], [16 * s, -34 * s], [0, -23 * s]]);
  g.fillStyle(0x0b1012, 0.92);
  g.fillRoundedRect(-53 * s, -47 * s, 32 * s, 22 * s, 9 * s);
  g.fillRoundedRect(23 * s, -47 * s, 32 * s, 22 * s, 9 * s);
  g.lineStyle(2 * s, 0x6d7b7f, 0.44);
  g.lineBetween(-42 * s, -40 * s, -24 * s, -34 * s);
  g.lineBetween(24 * s, -34 * s, 44 * s, -40 * s);
  g.fillStyle(0xb83035, 0.94);
  g.fillRoundedRect(-38 * s, 9 * s, 77 * s, 15 * s, 3 * s);
  g.lineStyle(2 * s, GOLD, 0.72);
  g.lineBetween(-38 * s, -8 * s, 38 * s, -8 * s);
  g.lineBetween(-34 * s, 33 * s, 34 * s, 33 * s);
  g.fillStyle(0x0a0f11, 1);
  g.fillRoundedRect(-67 * s, -37 * s, 25 * s, 88 * s, 7 * s);
  g.fillRoundedRect(43 * s, -38 * s, 25 * s, 88 * s, 7 * s);
  g.fillStyle(0x3d4a4d, 0.62);
  g.fillRect(-61 * s, -30 * s, 7 * s, 46 * s);
  g.fillRect(50 * s, -31 * s, 7 * s, 46 * s);
  g.fillStyle(0x2b3639, 1);
  g.fillRoundedRect(-31 * s, -113 * s, 62 * s, 56 * s, 12 * s);
  g.fillStyle(0x111719, 1);
  poly(g, [[-42 * s, -89 * s], [0, -132 * s], [43 * s, -89 * s]]);
  g.fillStyle(0xd5b56b, 0.84);
  g.fillRect(-25 * s, -88 * s, 50 * s, 7 * s);
  g.fillStyle(0x060708, 1);
  g.fillRoundedRect(-20 * s, -76 * s, 40 * s, 10 * s, 3 * s);
  g.fillStyle(0xf1d88e, 0.52);
  g.fillRect(-16 * s, -74 * s, 32 * s, 3 * s);
  g.fillStyle(0xe8d5a2, 0.42);
  g.fillRect(8 * s, -110 * s, 8 * s, 20 * s);
  g.fillStyle(BLUE_STEEL, 0.96);
  g.fillRoundedRect(-96 * s, -26 * s, 66 * s, 96 * s, 19 * s);
  g.fillStyle(0x172c36, 0.72);
  poly(g, [[-82 * s, -10 * s], [-51 * s, 21 * s], [-82 * s, 54 * s]]);
  g.lineStyle(4 * s, GOLD, 0.88);
  g.strokeRoundedRect(-96 * s, -26 * s, 66 * s, 96 * s, 19 * s);
  g.lineStyle(2 * s, 0xd8d0b8, 0.62);
  g.lineBetween(-86 * s, -4 * s, -43 * s, 44 * s);
  g.lineBetween(-84 * s, 20 * s, -35 * s, 20 * s);
  g.lineStyle(7 * s, 0x151b1d, 0.96);
  g.lineBetween(74 * s, -1 * s, 137 * s, -100 * s);
  g.lineStyle(4 * s, 0xf0dfaf, 0.96);
  g.lineBetween(76 * s, -8 * s, 138 * s, -104 * s);
  g.lineStyle(2 * s, 0xffffff, 0.64);
  g.lineBetween(87 * s, -22 * s, 137 * s, -102 * s);
  g.fillStyle(GOLD, 0.94);
  g.fillRoundedRect(56 * s, -11 * s, 36 * s, 8 * s, 3 * s);
  g.lineStyle(2 * s, 0xffffff, 0.18);
  g.lineBetween(-120 * s, 82 * s, -88 * s, 33 * s);
  g.lineBetween(-106 * s, 107 * s, -60 * s, 84 * s);
  grain(g, -100 * s, -118 * s, 210 * s, 236 * s, [0xd8bd8a, 0x141b1e, 0x9c2830], 34, 0.07, s);
}

function drawCandleNun(g, s) {
  glow(g, 0, -60 * s, 126 * s, CANDLE, 0.22);
  glow(g, 78 * s, -92 * s, 74 * s, CANDLE, 0.24);
  cape(g, s, [[-62, -52], [0, -128], [68, -50], [82, 118], [-82, 118]], 0x18181c, 1);
  g.fillStyle(0x26272d, 1);
  g.fillRoundedRect(-47 * s, -62 * s, 94 * s, 145 * s, 15 * s);
  g.fillStyle(0x121316, 1);
  poly(g, [[-45 * s, -49 * s], [0, 31 * s], [46 * s, -49 * s]]);
  g.fillStyle(0xf2ead8, 1);
  g.fillRoundedRect(-45 * s, -112 * s, 90 * s, 66 * s, 22 * s);
  g.fillStyle(0xeadfc9, 0.96);
  poly(g, [[-54 * s, -98 * s], [0, -140 * s], [54 * s, -98 * s]]);
  g.fillStyle(0x101114, 1);
  g.fillRoundedRect(-27 * s, -91 * s, 54 * s, 35 * s, 13 * s);
  g.fillStyle(0xf0dfaf, 0.92);
  g.fillCircle(-10 * s, -77 * s, 5 * s);
  g.fillCircle(10 * s, -77 * s, 5 * s);
  g.fillStyle(0xe8d6b0, 0.92);
  g.fillRect(-54 * s, -52 * s, 108 * s, 19 * s);
  g.lineStyle(3 * s, GOLD, 0.8);
  g.strokeCircle(0, -78 * s, 52 * s);
  g.lineStyle(8 * s, CANDLE, 0.12);
  g.strokeCircle(0, -78 * s, 68 * s);
  g.lineStyle(2 * s, GOLD, 0.7);
  g.lineBetween(0, -30 * s, 0, 38 * s);
  g.lineBetween(-15 * s, -5 * s, 15 * s, -5 * s);
  g.fillStyle(0x202127, 1);
  g.fillRoundedRect(-62 * s, -24 * s, 24 * s, 104 * s, 7 * s);
  g.fillRoundedRect(38 * s, -23 * s, 24 * s, 104 * s, 7 * s);
  g.fillStyle(0xf2e3c2, 0.94);
  g.fillCircle(-50 * s, 55 * s, 9 * s);
  g.fillCircle(50 * s, 52 * s, 9 * s);
  g.lineStyle(6 * s, 0xd8bd8a, 0.9);
  g.lineBetween(80 * s, -68 * s, 80 * s, 88 * s);
  g.fillStyle(0x9d7b51, 0.96);
  g.fillRoundedRect(70 * s, -72 * s, 20 * s, 52 * s, 5 * s);
  drawFlame(g, 80 * s, -78 * s, 1.18 * s);
  for (let i = 0; i < 4; i += 1) {
    const cx = (-112 + i * 75) * s;
    g.fillStyle(0xd8bd8a, 0.86);
    g.fillRoundedRect(cx - 7 * s, 34 * s, 14 * s, 76 * s, 3 * s);
    drawFlame(g, cx, 31 * s, 0.78 * s);
  }
  g.fillStyle(0x0d0d10, 0.38);
  g.fillEllipse(0, 113 * s, 138 * s, 22 * s);
  grain(g, -76 * s, -122 * s, 154 * s, 232 * s, [0xffffff, 0xc9aa69, 0x1a1a20], 38, 0.06, s);
}

function drawAshbloodAlchemist(g, s) {
  glow(g, -78 * s, 0, 74 * s, 0x70a85d, 0.18);
  glow(g, 68 * s, -84 * s, 66 * s, 0x6e4cb0, 0.18);
  cape(g, s, [[-70, -62], [62, -58], [88, 118], [22, 88], [-84, 116]], 0x24160f, 0.98);
  g.fillStyle(0x5b3a20, 1);
  g.fillRoundedRect(-52 * s, -65 * s, 104 * s, 140 * s, 13 * s);
  g.fillStyle(0x2c1c14, 0.96);
  poly(g, [[-54 * s, -40 * s], [-88 * s, 112 * s], [-12 * s, 90 * s]]);
  poly(g, [[54 * s, -40 * s], [88 * s, 112 * s], [12 * s, 90 * s]]);
  g.fillStyle(0x6b4a28, 0.88);
  g.fillRect(-46 * s, -37 * s, 92 * s, 16 * s);
  g.fillStyle(0x3d2819, 0.86);
  g.fillRoundedRect(-38 * s, -15 * s, 76 * s, 80 * s, 8 * s);
  g.fillStyle(0x6b4a28, 0.42);
  g.fillRect(-35 * s, 5 * s, 70 * s, 6 * s);
  g.fillRect(-29 * s, 29 * s, 58 * s, 5 * s);
  g.lineStyle(3 * s, GOLD, 0.58);
  g.lineBetween(-42 * s, 4 * s, 44 * s, 4 * s);
  g.lineBetween(-33 * s, 43 * s, 38 * s, 42 * s);
  g.fillStyle(0x211c19, 1);
  g.fillRoundedRect(-42 * s, -119 * s, 78 * s, 58 * s, 18 * s);
  g.fillStyle(0x0a0908, 0.96);
  poly(g, [[15 * s, -102 * s], [116 * s, -84 * s], [18 * s, -66 * s]]);
  g.fillStyle(0xd8bd8a, 0.94);
  g.fillCircle(-15 * s, -92 * s, 6 * s);
  g.fillStyle(0x70a85d, 0.95);
  g.fillCircle(76 * s, -80 * s, 6 * s);
  g.fillStyle(0x17100d, 1);
  g.fillRoundedRect(-68 * s, -131 * s, 108 * s, 18 * s, 8 * s);
  poly(g, [[-17 * s, -184 * s], [19 * s, -131 * s], [-50 * s, -131 * s]]);
  g.fillStyle(0xd8bd8a, 0.9);
  g.fillCircle(-60 * s, 72 * s, 8 * s);
  g.fillCircle(62 * s, 71 * s, 8 * s);
  drawBottle(g, -85 * s, 6 * s, s, 0x70a85d);
  drawBottle(g, -26 * s, 40 * s, s * 0.86, 0x6e4cb0);
  drawBottle(g, -3 * s, 40 * s, s * 0.86, CANDLE);
  drawBottle(g, 20 * s, 40 * s, s * 0.86, BLOOD);
  g.lineStyle(3 * s, 0xd8bd8a, 0.78);
  g.lineBetween(67 * s, 6 * s, 97 * s, 74 * s);
  g.fillStyle(0x15100f, 1);
  poly(g, [[92 * s, 66 * s], [108 * s, 77 * s], [84 * s, 83 * s]]);
  grain(g, -90 * s, -130 * s, 190 * s, 250 * s, [0xd8bd8a, 0x70a85d, 0x1a100c], 52, 0.07, s);
}

function drawRottingVillager(g, s) {
  actorAura(g, s, 0x4e6440);
  g.fillStyle(0x1a241c, 1);
  poly(g, [[-42 * s, 40 * s], [-56 * s, 118 * s], [-16 * s, 118 * s], [-5 * s, 40 * s]]);
  poly(g, [[18 * s, 40 * s], [1 * s, 118 * s], [38 * s, 118 * s], [38 * s, 42 * s]]);
  g.fillStyle(0x5b4535, 0.96);
  poly(g, [[-58 * s, -42 * s], [40 * s, -34 * s], [25 * s, 62 * s], [-54 * s, 50 * s]]);
  g.fillStyle(0x3b2b21, 0.88);
  poly(g, [[-54 * s, -38 * s], [-20 * s, -56 * s], [38 * s, -33 * s], [10 * s, 8 * s], [-41 * s, 2 * s]]);
  g.fillStyle(0x734032, 0.72);
  g.fillRect(-28 * s, 10 * s, 20 * s, 7 * s);
  g.fillRect(9 * s, 34 * s, 26 * s, 6 * s);
  g.fillStyle(0x44543d, 1);
  g.fillRoundedRect(-42 * s, -65 * s, 80 * s, 105 * s, 14 * s);
  g.fillStyle(0x596a4a, 0.56);
  g.fillRoundedRect(-31 * s, -54 * s, 26 * s, 86 * s, 8 * s);
  g.fillStyle(0x2a3328, 0.78);
  poly(g, [[8 * s, -58 * s], [38 * s, -34 * s], [20 * s, 58 * s], [1 * s, 22 * s]]);
  g.fillStyle(0x6d7857, 0.96);
  g.fillRoundedRect(-30 * s, -105 * s, 46 * s, 43 * s, 13 * s);
  g.fillStyle(0x303626, 0.9);
  poly(g, [[-37 * s, -102 * s], [-3 * s, -126 * s], [24 * s, -101 * s]]);
  g.fillStyle(0x171b15, 1);
  g.fillCircle(-13 * s, -87 * s, 5 * s);
  g.fillStyle(BLOOD, 0.9);
  g.fillCircle(7 * s, -85 * s, 5 * s);
  g.fillStyle(0x262b23, 1);
  g.fillRoundedRect(-68 * s, -37 * s, 15 * s, 91 * s, 5 * s);
  g.fillRoundedRect(41 * s, -26 * s, 14 * s, 86 * s, 5 * s);
  g.lineStyle(5 * s, 0x72512c, 0.92);
  g.lineBetween(60 * s, -17 * s, 91 * s, 68 * s);
  g.lineStyle(2 * s, 0xd8bd8a, 0.38);
  g.lineBetween(-42 * s, -42 * s, 31 * s, 32 * s);
  g.lineBetween(-49 * s, 1 * s, 18 * s, -30 * s);
  g.lineStyle(2 * s, 0x111612, 0.62);
  g.lineBetween(-56 * s, 118 * s, -15 * s, 118 * s);
  g.lineBetween(2 * s, 118 * s, 42 * s, 118 * s);
  grain(g, -70 * s, -70 * s, 152 * s, 190 * s, [0x8a6133, 0x28382e, BLOOD], 34, 0.09, s);
}

function drawCandleMonk(g, s) {
  glow(g, 58 * s, -107 * s, 72 * s, CANDLE, 0.22);
  actorAura(g, s, 0x5a4026);
  cape(g, s, [[-64, 118], [-8, -116], [64, 118]], 0x3d3024, 1);
  cape(g, s, [[-44, 108], [-6, -86], [42, 108]], 0x241b16, 1);
  g.fillStyle(0x5a412b, 0.52);
  poly(g, [[-58 * s, 116 * s], [-38 * s, -12 * s], [-18 * s, 116 * s]]);
  poly(g, [[58 * s, 116 * s], [38 * s, -8 * s], [18 * s, 116 * s]]);
  g.fillStyle(0x201814, 1);
  g.fillRoundedRect(-32 * s, -102 * s, 64 * s, 54 * s, 23 * s);
  g.fillStyle(0x080807, 0.95);
  g.fillCircle(-10 * s, -80 * s, 4 * s);
  g.fillCircle(10 * s, -80 * s, 4 * s);
  g.fillStyle(0xd8bd8a, 0.62);
  g.fillRoundedRect(-21 * s, -60 * s, 42 * s, 7 * s, 3 * s);
  g.lineStyle(7 * s, 0x805a37, 0.96);
  g.lineBetween(60 * s, -80 * s, 60 * s, 108 * s);
  g.fillStyle(0xd8bd8a, 0.86);
  g.fillRoundedRect(49 * s, -116 * s, 22 * s, 40 * s, 5 * s);
  drawFlame(g, 60 * s, -118 * s, s);
  g.lineStyle(2 * s, GOLD, 0.48);
  g.lineBetween(-23 * s, -20 * s, 24 * s, -20 * s);
  g.lineBetween(0, -44 * s, 0, 73 * s);
  g.fillStyle(0x0f0c0a, 0.82);
  poly(g, [[-49 * s, 118 * s], [-28 * s, 79 * s], [-10 * s, 118 * s]]);
  poly(g, [[10 * s, 118 * s], [31 * s, 78 * s], [52 * s, 118 * s]]);
  grain(g, -66 * s, -108 * s, 136 * s, 230 * s, [0x8f6b3e, 0x17100c, CANDLE], 40, 0.08, s);
}

function drawCrowMessenger(g, s) {
  glow(g, 5 * s, -10 * s, 92 * s, 0x3c3b55, 0.16);
  g.fillStyle(0x09090f, 1);
  poly(g, [[-14 * s, -32 * s], [-112 * s, 28 * s], [-20 * s, 42 * s]]);
  poly(g, [[14 * s, -32 * s], [112 * s, 25 * s], [20 * s, 42 * s]]);
  g.fillStyle(0x171721, 1);
  g.fillRoundedRect(-31 * s, -58 * s, 62 * s, 110 * s, 26 * s);
  g.fillStyle(0x252538, 0.62);
  g.fillRoundedRect(-18 * s, -49 * s, 22 * s, 88 * s, 14 * s);
  g.fillRoundedRect(-23 * s, -96 * s, 46 * s, 46 * s, 16 * s);
  g.fillStyle(0x0a0a0f, 1);
  poly(g, [[-30 * s, 35 * s], [-62 * s, 98 * s], [-6 * s, 46 * s]]);
  poly(g, [[30 * s, 35 * s], [64 * s, 98 * s], [6 * s, 46 * s]]);
  g.fillStyle(CANDLE, 0.95);
  g.fillCircle(8 * s, -78 * s, 5 * s);
  poly(g, [[18 * s, -74 * s], [70 * s, -67 * s], [18 * s, -58 * s]]);
  g.fillStyle(0x4b2f1d, 0.95);
  g.fillRoundedRect(22 * s, 12 * s, 44 * s, 23 * s, 3 * s);
  g.lineStyle(2 * s, 0xd8bd8a, 0.52);
  g.lineBetween(25 * s, 24 * s, 66 * s, 24 * s);
  for (let i = 0; i < 4; i += 1) {
    g.lineStyle(2 * s, 0x393747, 0.72);
    g.lineBetween((-82 + i * 18) * s, (18 + i * 3) * s, (-14 - i * 4) * s, (30 + i * 3) * s);
    g.lineBetween((14 + i * 4) * s, (31 + i * 3) * s, (34 + i * 18) * s, (16 + i * 4) * s);
  }
  g.lineStyle(2 * s, 0x0d0d14, 0.9);
  g.lineBetween(-8 * s, 50 * s, -25 * s, 82 * s);
  g.lineBetween(8 * s, 50 * s, 27 * s, 82 * s);
}

function drawRatSwarm(g, s) {
  actorAura(g, s, 0x3a3020);
  for (let i = 0; i < 9; i += 1) {
    const x = (-66 + (i % 5) * 34 + (i > 4 ? 18 : 0)) * s;
    const y = (54 + Math.floor(i / 5) * 30 + (i % 2) * 6) * s;
    g.fillStyle(i % 2 ? 0x4a4a36 : 0x24231d, 0.98);
    g.fillEllipse(x, y, 44 * s, 23 * s);
    g.fillStyle(0x6b5d3c, 0.28);
    g.fillEllipse(x - 7 * s, y - 5 * s, 19 * s, 8 * s);
    poly(g, [[x + 17 * s, y - 6 * s], [x + 42 * s, y - 15 * s], [x + 23 * s, y + 3 * s]]);
    g.lineStyle(2 * s, 0x6b4a31, 0.7);
    g.lineBetween(x - 17 * s, y + 4 * s, x - 46 * s, y + 15 * s);
    g.fillStyle(BLOOD, 0.98);
    g.fillCircle(x + 10 * s, y - 4 * s, 3 * s);
    g.fillStyle(0x11100c, 0.9);
    g.fillCircle(x + 20 * s, y - 1 * s, 2 * s);
  }
}

function drawBlackHound(g, s) {
  actorAura(g, s, 0x111111);
  g.fillStyle(0x08080a, 1);
  g.fillRoundedRect(-82 * s, -38 * s, 130 * s, 62 * s, 29 * s);
  g.fillStyle(0x15151a, 0.86);
  g.fillRoundedRect(-54 * s, -49 * s, 82 * s, 26 * s, 14 * s);
  poly(g, [[-58 * s, -26 * s], [-110 * s, -58 * s], [-76 * s, -2 * s]]);
  g.fillStyle(0x171517, 1);
  g.fillRoundedRect(35 * s, -73 * s, 52 * s, 54 * s, 18 * s);
  poly(g, [[46 * s, -70 * s], [58 * s, -114 * s], [70 * s, -70 * s]]);
  poly(g, [[66 * s, -68 * s], [86 * s, -103 * s], [80 * s, -60 * s]]);
  [-52, -14, 26, 58].forEach((xx, index) => {
    g.fillStyle(0x09090a, 1);
    g.fillRoundedRect(xx * s, (index === 3 ? -5 : 15) * s, 12 * s, (index === 3 ? 100 : 92) * s, 3 * s);
  });
  g.fillStyle(BLOOD, 0.96);
  g.fillCircle(65 * s, -52 * s, 5 * s);
  g.fillStyle(0x2a2524, 0.82);
  g.fillCircle(77 * s, -47 * s, 4 * s);
  poly(g, [[78 * s, -43 * s], [112 * s, -36 * s], [78 * s, -24 * s]]);
  g.fillStyle(0x0d0d10, 0.9);
  poly(g, [[-84 * s, -40 * s], [-132 * s, -80 * s], [-102 * s, -32 * s]]);
  g.lineStyle(2 * s, 0xd8bd8a, 0.56);
  g.lineBetween(78 * s, -29 * s, 99 * s, -33 * s);
}

function drawGraveSkeleton(g, s) {
  actorAura(g, s, 0x5b584b);
  const bone = 0xcfc196;
  g.fillStyle(0x5f5c58, 0.72);
  poly(g, [[-50 * s, -28 * s], [-78 * s, 102 * s], [-10 * s, 61 * s]]);
  g.fillStyle(bone, 0.98);
  g.fillRoundedRect(-27 * s, -103 * s, 54 * s, 48 * s, 13 * s);
  g.fillStyle(0x16110e, 1);
  g.fillCircle(-12 * s, -84 * s, 6 * s);
  g.fillCircle(13 * s, -84 * s, 6 * s);
  g.fillRect(-13 * s, -66 * s, 26 * s, 4 * s);
  g.lineStyle(5 * s, bone, 0.96);
  g.lineBetween(-38 * s, -31 * s, 38 * s, -31 * s);
  g.lineBetween(-32 * s, -21 * s, 32 * s, -21 * s);
  g.lineBetween(-25 * s, -10 * s, 25 * s, -10 * s);
  g.lineBetween(-12 * s, -31 * s, -19 * s, 46 * s);
  g.lineBetween(12 * s, -31 * s, 19 * s, 46 * s);
  g.lineBetween(-36 * s, -27 * s, -58 * s, 38 * s);
  g.lineBetween(37 * s, -28 * s, 65 * s, 25 * s);
  g.lineBetween(-19 * s, 42 * s, -36 * s, 118 * s);
  g.lineBetween(20 * s, 42 * s, 34 * s, 118 * s);
  g.fillStyle(0x2e3540, 0.94);
  g.fillRoundedRect(44 * s, 7 * s, 45 * s, 56 * s, 9 * s);
  g.lineStyle(5 * s, 0x9a723f, 0.92);
  g.lineBetween(-80 * s, -44 * s, 45 * s, 61 * s);
}

function drawBrokenMilitia(g, s) {
  actorAura(g, s, 0x373331);
  g.fillStyle(0x242220, 1);
  g.fillRect(-23 * s, 37 * s, 17 * s, 82 * s);
  g.fillRect(18 * s, 36 * s, 18 * s, 83 * s);
  g.fillStyle(0x4a4238, 1);
  g.fillRoundedRect(-48 * s, -66 * s, 92 * s, 112 * s, 11 * s);
  g.fillStyle(0x6b5438, 0.96);
  g.fillRect(-44 * s, -18 * s, 87 * s, 15 * s);
  g.fillStyle(0x9b6b37, 0.96);
  g.fillRoundedRect(-31 * s, -108 * s, 58 * s, 42 * s, 9 * s);
  g.fillStyle(0x2a2c2d, 0.94);
  g.fillRect(-36 * s, -108 * s, 69 * s, 13 * s);
  g.lineStyle(5 * s, 0x8b724c, 0.95);
  g.lineBetween(58 * s, -114 * s, 70 * s, 119 * s);
  g.fillStyle(0x2e3540, 0.98);
  g.fillRoundedRect(-88 * s, -20 * s, 52 * s, 82 * s, 10 * s);
  g.lineStyle(2 * s, GOLD, 0.62);
  g.strokeRoundedRect(-88 * s, -20 * s, 52 * s, 82 * s, 10 * s);
  g.lineStyle(2 * s, 0xd8bd8a, 0.34);
  g.lineBetween(-40 * s, -46 * s, 32 * s, 20 * s);
  g.lineBetween(-44 * s, -5 * s, 35 * s, -22 * s);
}

function drawPointedWitch(g, s) {
  actorAura(g, s, 0x402048);
  cape(g, s, [[-58, 118], [-11, -82], [60, 118]], 0x281630, 1);
  g.fillStyle(0x34203f, 0.98);
  g.fillRoundedRect(-27 * s, -101 * s, 54 * s, 47 * s, 18 * s);
  g.fillStyle(0x1d1026, 1);
  poly(g, [[-84 * s, -86 * s], [3 * s, -186 * s], [74 * s, -83 * s]]);
  g.fillRoundedRect(-84 * s, -91 * s, 162 * s, 21 * s, 8 * s);
  g.fillStyle(0x7a5934, 0.95);
  poly(g, [[18 * s, -78 * s], [51 * s, -70 * s], [20 * s, -60 * s]]);
  g.fillStyle(0x0d0a0e, 0.95);
  g.fillCircle(-8 * s, -80 * s, 3 * s);
  g.lineStyle(5 * s, 0x8b6a42, 0.96);
  g.lineBetween(58 * s, -31 * s, 94 * s, 118 * s);
  g.fillStyle(0xd08a49, 0.96);
  g.fillCircle(94 * s, -10 * s, 15 * s);
}

function drawPlagueDoctor(g, s) {
  actorAura(g, s, 0x2b5b3a);
  cape(g, s, [[-52, -52], [50, -52], [72, 118], [-72, 118]], 0x141414, 1);
  g.fillStyle(0x26221f, 1);
  g.fillRoundedRect(-38 * s, -70 * s, 76 * s, 123 * s, 10 * s);
  g.fillStyle(0x171413, 1);
  g.fillRoundedRect(-33 * s, -120 * s, 65 * s, 55 * s, 18 * s);
  poly(g, [[18 * s, -103 * s], [98 * s, -86 * s], [21 * s, -74 * s]]);
  g.fillStyle(0xd4caa2, 0.86);
  g.fillCircle(-14 * s, -97 * s, 5 * s);
  g.fillStyle(0x70a85d, 0.92);
  g.fillCircle(72 * s, -84 * s, 5 * s);
  drawBottle(g, -60 * s, -20 * s, s * 0.9, 0x70a85d);
  drawBottle(g, -22 * s, 46 * s, s * 0.8, 0x70a85d);
  drawBottle(g, 0, 46 * s, s * 0.8, 0x6e4cb0);
  drawBottle(g, 22 * s, 46 * s, s * 0.8, BLOOD);
  g.lineStyle(5 * s, 0xc9c19a, 0.76);
  g.lineBetween(59 * s, 0, 90 * s, 63 * s);
}

function drawIronMaidenNun(g, s) {
  actorAura(g, s, 0x30303a);
  g.fillStyle(0x282a2f, 1);
  g.fillRoundedRect(-56 * s, -124 * s, 112 * s, 226 * s, 20 * s);
  g.fillStyle(0x111114, 0.98);
  g.fillRoundedRect(-37 * s, -101 * s, 74 * s, 47 * s, 14 * s);
  g.fillStyle(0xe8d6b0, 0.78);
  g.fillRect(-24 * s, -121 * s, 48 * s, 12 * s);
  g.fillStyle(0x7a2730, 0.94);
  poly(g, [[-65 * s, -43 * s], [-103 * s, 92 * s], [-31 * s, 72 * s]]);
  poly(g, [[65 * s, -41 * s], [103 * s, 92 * s], [31 * s, 72 * s]]);
  g.lineStyle(2 * s, GOLD, 0.7);
  g.strokeRoundedRect(-56 * s, -124 * s, 112 * s, 226 * s, 20 * s);
  for (let i = 0; i < 7; i += 1) {
    const y = (-67 + i * 24) * s;
    g.fillStyle(0xa7a09a, 0.72);
    poly(g, [[-43 * s, y], [-24 * s, y + 7 * s], [-43 * s, y + 14 * s]]);
    poly(g, [[43 * s, y], [24 * s, y + 7 * s], [43 * s, y + 14 * s]]);
  }
}

function drawFallenPaladin(g, s) {
  glow(g, 0, -42 * s, 112 * s, BLOOD, 0.12);
  actorAura(g, s, 0x242a32);
  g.fillStyle(0x20272d, 1);
  g.fillRoundedRect(-56 * s, -83 * s, 112 * s, 152 * s, 11 * s);
  g.fillStyle(0x11161a, 1);
  g.fillRect(-43 * s, 60 * s, 33 * s, 65 * s);
  g.fillRect(14 * s, 60 * s, 34 * s, 66 * s);
  g.fillStyle(0x171b20, 1);
  g.fillRoundedRect(-40 * s, -133 * s, 80 * s, 54 * s, 10 * s);
  g.fillStyle(GOLD, 0.92);
  g.fillRect(-48 * s, -56 * s, 96 * s, 10 * s);
  g.fillRect(-12 * s, -80 * s, 24 * s, 140 * s);
  g.fillStyle(BLOOD, 0.85);
  g.fillRect(-32 * s, -23 * s, 64 * s, 6 * s);
  g.lineStyle(9 * s, 0x2d3038, 1);
  g.lineBetween(74 * s, -118 * s, 120 * s, 124 * s);
  g.lineStyle(3 * s, 0xd8bd8a, 0.66);
  g.lineBetween(78 * s, -113 * s, 117 * s, 119 * s);
  cape(g, s, [[-70, -94], [-120, 22], [-44, 9]], 0x2d1116, 0.95);
}

function drawHeadlessGraveKnight(g, s, phase) {
  glow(g, 0, -120 * s, (phase >= 3 ? 96 : phase >= 2 ? 78 : 62) * s, phase >= 3 ? BLOOD : 0x6e4cb0, 0.22);
  actorAura(g, s, phase >= 3 ? BLOOD : 0x20242d);
  g.fillStyle(0x15191d, 1);
  g.fillRoundedRect(-70 * s, -90 * s, 140 * s, 176 * s, 13 * s);
  g.fillStyle(0x252c31, 1);
  g.fillRoundedRect(-53 * s, -77 * s, 106 * s, 148 * s, 9 * s);
  g.fillStyle(0x0d1012, 1);
  g.fillRect(-92 * s, -54 * s, 32 * s, 154 * s);
  g.fillRect(61 * s, -53 * s, 33 * s, 155 * s);
  g.fillRect(-44 * s, 72 * s, 34 * s, 86 * s);
  g.fillRect(14 * s, 72 * s, 36 * s, 88 * s);
  cape(g, s, [[-78, -72], [-170, 135], [-43, 121]], 0x682334, 0.94);
  g.lineStyle(3 * s, GOLD, 0.78);
  g.lineBetween(-56 * s, -66 * s, 57 * s, -66 * s);
  g.lineBetween(-45 * s, -26 * s, 47 * s, -26 * s);
  g.lineBetween(-39 * s, 27 * s, 39 * s, 27 * s);
  g.fillStyle(0x070604, 1);
  g.fillCircle(0, -120 * s, 27 * s);
  g.lineStyle(5 * s, phase >= 3 ? BLOOD : 0x6e4cb0, 0.84);
  g.strokeCircle(0, -120 * s, 34 * s);
  g.lineStyle(10 * s, 0x1b1f24, 1);
  g.lineBetween(86 * s, -94 * s, -114 * s, 150 * s);
  g.lineStyle(6 * s, GOLD, 0.92);
  g.lineBetween(87 * s, -93 * s, -112 * s, 148 * s);
  if (phase >= 2) {
    g.lineStyle(3 * s, 0x6e4cb0, 0.68);
    g.lineBetween(-80 * s, -94 * s, -106 * s, -31 * s);
    g.lineBetween(75 * s, -100 * s, 108 * s, -26 * s);
  }
  if (phase >= 3) {
    g.lineStyle(5 * s, BLOOD, 0.72);
    g.lineBetween(-54 * s, -51 * s, -11 * s, 60 * s);
    g.lineBetween(49 * s, -54 * s, 8 * s, 69 * s);
  }
  grain(g, -88 * s, -92 * s, 176 * s, 254 * s, [GOLD, 0x384145, phase >= 3 ? BLOOD : 0x6e4cb0], 54, 0.075, s);
}

function actorAura(g, s, color) {
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(0, 8 * s, 132 * s, 172 * s);
  glow(g, 0, -20 * s, 96 * s, color, 0.06);
}

function armorLegs(g, s, x, y, dark, mid) {
  g.fillStyle(dark, 1);
  g.fillRect((x - 8) * s, y * s, 20 * s, 72 * s);
  g.fillRect((x + 38) * s, (y - 1) * s, 21 * s, 73 * s);
  g.fillStyle(mid, 1);
  g.fillRoundedRect((x - 13) * s, (y + 38) * s, 33 * s, 16 * s, 5 * s);
  g.fillRoundedRect((x + 31) * s, (y + 38) * s, 35 * s, 16 * s, 5 * s);
  g.fillStyle(0x07090a, 1);
  g.fillRect((x - 16) * s, (y + 66) * s, 35 * s, 13 * s);
  g.fillRect((x + 30) * s, (y + 66) * s, 38 * s, 13 * s);
}

function heroShadow(id) {
  if (id === 'candle-nun') return 164;
  if (id === 'ashblood-alchemist') return 184;
  return 190;
}

function addLowNoiseHeroSprite(scene, container, characterId, scale, options = {}) {
  const poses = LOW_NOISE_HERO_ASSETS[characterId];
  if (!poses?.idle || !scene.textures.exists(poses.idle.key)) return null;
  const image = scene.add.image(0, 0, poses.idle.key).setOrigin(0.5, 1);
  image.setName(`low-noise-hero-${characterId}`);
  image.setData('battleActor', true);
  image.setData('actorType', 'hero');
  image.setData('assetId', characterId);
  container.add(image);

  const displayHeight = (options.generatedHeight ?? options.displayHeight ?? (characterId === 'candle-nun' ? 332 : 342)) * scale;
  const bottom = (options.generatedBottom ?? options.bottom ?? 118) * scale;
  const xOffset = (options.generatedX ?? options.offsetX ?? 0) * scale;

  const applyPose = (pose = 'idle') => {
    const asset = poses[pose] && scene.textures.exists(poses[pose].key) ? poses[pose] : poses.idle;
    const width = asset.width ?? 360;
    const height = asset.height ?? 420;
    image.setTexture(asset.key);
    image.clearTint();
    image.setAlpha(options.alpha ?? 1);
    image.setDisplaySize(displayHeight * (width / Math.max(1, height)), displayHeight);
    image.setPosition(xOffset, bottom + (pose === 'idle' ? 12 : 22) * scale);
    image.setAngle(0);
    if (pose === 'attack') {
      image.setAngle(characterId === 'candle-nun' ? -2 : -4);
      image.x += 16 * scale;
      image.y -= 3 * scale;
    } else if (pose === 'defend') {
      image.setAngle(3);
      image.x -= 8 * scale;
      image.setTint(0xd9edf4);
    } else if (pose === 'hit') {
      image.setTint(0xff7f72);
      image.setAngle(4);
      image.x -= 12 * scale;
    }
    image.setData('pose', pose);
    image.setData('textureKey', asset.key);
    return true;
  };

  container.actorSprite = image;
  container.setBattlePose = applyPose;
  applyPose(options.pose ?? 'idle');
  return image;
}

function addLowNoiseEnemySprite(scene, container, enemyId, scale, options = {}) {
  const poses = LOW_NOISE_ENEMY_ASSETS[enemyId];
  if (!poses?.idle || !scene.textures.exists(poses.idle.key)) return null;
  const boss = options.type === 'boss' || enemyId === 'headless-grave-knight' || enemyId === 'pale-wax-matron' || enemyId === 'hollow-crown-regent';
  const image = scene.add.image(0, 0, poses.idle.key).setOrigin(0.5, 1);
  image.setName(`low-noise-enemy-${enemyId}`);
  image.setData('battleActor', true);
  image.setData('actorType', 'enemy');
  image.setData('assetId', enemyId);
  container.add(image);

  const displayHeight =
    (options.generatedHeight ??
      options.displayHeight ??
      (enemyId === 'black-hound' || enemyId === 'plague-rat-swarm' || enemyId === 'scripture-moth-swarm' ? 250 : enemyId === 'crow-messenger' ? 260 : boss ? 372 : 306)) * scale;
  const bottom = (options.generatedBottom ?? options.bottom ?? (boss ? 150 : 118)) * scale;
  const xOffset = (options.generatedX ?? options.offsetX ?? 0) * scale;

  const applyPose = (pose = 'idle') => {
    const normalizedPose = pose === 'attack' || pose === 'hit' ? pose : 'idle';
    const asset = poses[normalizedPose] && scene.textures.exists(poses[normalizedPose].key) ? poses[normalizedPose] : poses.idle;
    const width = asset.width ?? 320;
    const height = asset.height ?? 360;
    image.setTexture(asset.key);
    image.clearTint();
    image.setAlpha(options.alpha ?? 1);
    image.setDisplaySize(displayHeight * (width / Math.max(1, height)), displayHeight);
    image.setPosition(xOffset, bottom + (boss ? 24 : 14) * scale);
    image.setAngle(0);
    if (normalizedPose === 'attack') {
      image.setAngle(enemyId === 'black-hound' || enemyId === 'crownless-hound' ? -3 : 4);
      image.x -= 14 * scale;
      image.y -= 2 * scale;
    } else if (normalizedPose === 'hit') {
      image.setTint(0xff766f);
      image.setAngle(-5);
      image.x += 10 * scale;
    }
    image.setData('pose', normalizedPose);
    image.setData('textureKey', asset.key);
    return true;
  };

  container.actorSprite = image;
  container.setBattlePose = applyPose;
  applyPose(options.pose ?? 'idle');
  return image;
}

function addFinalHeroSprite(scene, container, characterId, scale, options = {}) {
  const asset = FINAL_ART.heroes?.[characterId]?.battle;
  if (!asset || !scene.textures.exists(asset.key)) return null;
  const image = scene.add.image(0, 0, asset.key).setOrigin(0.5, 1);
  image.setName('final-battle-actor-sprite');
  image.setData('battleActor', true);
  image.setData('actorType', 'hero');
  const displayHeight = (options.generatedHeight ?? options.displayHeight ?? (characterId === 'candle-nun' ? 332 : 342)) * scale;
  const displayWidth = displayHeight * (asset.width / Math.max(1, asset.height));
  const bottom = (options.generatedBottom ?? options.bottom ?? 118) * scale;
  const xOffset = (options.generatedX ?? options.offsetX ?? 0) * scale;
  image.setDisplaySize(displayWidth, displayHeight);
  image.setPosition(xOffset, bottom);
  image.setData('baseX', image.x);
  image.setData('baseY', image.y);
  image.setData('baseScaleX', image.scaleX);
  image.setData('baseScaleY', image.scaleY);
  image.setData('baseAngle', image.angle);
  container.add(image);

  const applyPose = (pose = 'idle') => {
    const baseX = image.getData('baseX');
    const baseY = image.getData('baseY');
    const baseScaleX = image.getData('baseScaleX');
    const baseScaleY = image.getData('baseScaleY');
    image.clearTint();
    image.setAlpha(options.alpha ?? 1);
    image.setPosition(baseX, baseY);
    image.setScale(baseScaleX, baseScaleY);
    image.setAngle(0);
    if (pose === 'attack') {
      image.setAngle(characterId === 'candle-nun' ? -4 : -6);
      image.setPosition(baseX + (characterId === 'ashblood-alchemist' ? 12 : 16) * scale, baseY - 4 * scale);
      image.setScale(baseScaleX * 1.035, baseScaleY * 1.035);
    } else if (pose === 'defend') {
      image.setAngle(characterId === 'candle-nun' ? 2 : 4);
      image.setPosition(baseX - 8 * scale, baseY + 2 * scale);
      image.setTint(0xd7e8f0);
    } else if (pose === 'hit') {
      image.setTint(0xff7777);
      image.setAngle(5);
      image.setPosition(baseX - 10 * scale, baseY + 2 * scale);
    }
    image.setData('pose', pose);
    return true;
  };

  container.actorSprite = image;
  container.setBattlePose = applyPose;
  applyPose(options.pose ?? 'idle');
  return image;
}

function addFinalEnemySprite(scene, container, enemyId, scale, options = {}) {
  const asset = FINAL_ART.bosses?.[enemyId] ?? FINAL_ART.enemies?.[enemyId];
  if (!asset || !scene.textures.exists(asset.key)) return null;
  const boss = options.type === 'boss' || enemyId === 'headless-grave-knight' || Boolean(FINAL_ART.bosses?.[enemyId]);
  const image = scene.add.image(0, 0, asset.key).setOrigin(0.5, 1);
  image.setName('final-battle-actor-sprite');
  image.setData('battleActor', true);
  image.setData('actorType', 'enemy');
  const displayHeight =
    (options.generatedHeight ??
      options.displayHeight ??
      (enemyId === 'black-hound' || enemyId === 'plague-rat-swarm' ? 250 : enemyId === 'crow-messenger' ? 260 : boss ? 372 : 306)) * scale;
  const displayWidth = displayHeight * (asset.width / Math.max(1, asset.height));
  const bottom = (options.generatedBottom ?? options.bottom ?? (boss ? 150 : 118)) * scale;
  const xOffset = (options.generatedX ?? options.offsetX ?? 0) * scale;
  image.setDisplaySize(displayWidth, displayHeight);
  image.setPosition(xOffset, bottom);
  image.setData('baseX', image.x);
  image.setData('baseY', image.y);
  image.setData('baseScaleX', image.scaleX);
  image.setData('baseScaleY', image.scaleY);
  container.add(image);

  const applyPose = (pose = 'idle') => {
    const baseX = image.getData('baseX');
    const baseY = image.getData('baseY');
    const baseScaleX = image.getData('baseScaleX');
    const baseScaleY = image.getData('baseScaleY');
    image.clearTint();
    image.setAlpha(options.alpha ?? 1);
    image.setPosition(baseX, baseY);
    image.setScale(baseScaleX, baseScaleY);
    image.setAngle(0);
    if (pose === 'attack') {
      image.setAngle(enemyId === 'black-hound' || enemyId === 'crownless-hound' ? -3 : 5);
      image.setPosition(baseX - 14 * scale, baseY - 2 * scale);
      image.setScale(baseScaleX * 1.035, baseScaleY * 1.035);
    } else if (pose === 'hit') {
      image.setTint(0xff6f6f);
      image.setAngle(-5);
      image.setPosition(baseX + 10 * scale, baseY + 2 * scale);
    }
    image.setData('pose', pose);
    return true;
  };

  container.actorSprite = image;
  container.setBattlePose = applyPose;
  applyPose(options.pose ?? 'idle');
  return image;
}

function addBattleHeroSprite(scene, container, characterId, scale, options = {}) {
  if (!scene.textures.exists('generated-battle-hero-idle-sheet')) return null;
  const image = scene.add.image(0, 0, 'generated-battle-hero-idle-sheet').setOrigin(0.5, 1);
  image.setName('battle-actor-sprite');
  image.setData('battleActor', true);
  image.setData('actorType', 'hero');
  container.add(image);

  const displayHeight = (options.generatedHeight ?? options.displayHeight ?? (characterId === 'candle-nun' ? 332 : 342)) * scale;
  const bottom = (options.generatedBottom ?? options.bottom ?? 118) * scale;
  const xOffset = (options.generatedX ?? options.offsetX ?? 0) * scale;
  const heroIndex = BATTLE_HERO_INDEX[characterId] ?? 0;
  const actionKey = BATTLE_HERO_ACTION_KEY[characterId];
  const poseIndex = { idle: 0, attack: 1, defend: 2, hit: 3 };

  const applyPose = (pose = 'idle') => {
    const key = pose === 'idle' || !scene.textures.exists(actionKey) ? 'generated-battle-hero-idle-sheet' : actionKey;
    const frameCount = key === 'generated-battle-hero-idle-sheet' ? 3 : 4;
    const frameIndex = key === 'generated-battle-hero-idle-sheet' ? heroIndex : poseIndex[pose] ?? 0;
    if (!applySheetFrame(scene, image, key, frameIndex, frameCount, displayHeight)) return false;
    image.setPosition(xOffset, bottom + (key === 'generated-battle-hero-idle-sheet' ? 16 : 42) * scale);
    image.setData('pose', pose);
    return true;
  };

  container.actorSprite = image;
  container.setBattlePose = applyPose;
  applyPose(options.pose ?? 'idle');
  return image;
}

function addBattleEnemySprite(scene, container, enemyId, scale, options = {}) {
  if (!scene.textures.exists('generated-battle-enemy-idle-sheet')) return null;
  if (!BATTLE_SHEET_ENEMY_IDS.has(enemyId)) return null;
  const boss = options.type === 'boss' || enemyId === 'headless-grave-knight';
  const image = scene.add.image(0, 0, 'generated-battle-enemy-idle-sheet').setOrigin(0.5, 1);
  image.setName('battle-actor-sprite');
  image.setData('battleActor', true);
  image.setData('actorType', 'enemy');
  container.add(image);

  const displayHeight =
    (options.generatedHeight ??
      options.displayHeight ??
      (enemyId === 'black-hound' || enemyId === 'plague-rat-swarm' ? 250 : enemyId === 'crow-messenger' ? 260 : boss ? 372 : 306)) * scale;
  const bottom = (options.generatedBottom ?? options.bottom ?? (boss ? 150 : 118)) * scale;
  const xOffset = (options.generatedX ?? options.offsetX ?? 0) * scale;
  const index = boss ? 5 : BATTLE_ENEMY_INDEX[enemyId] ?? 0;

  const applyPose = (pose = 'idle') => {
    let key = 'generated-battle-enemy-idle-sheet';
    if (pose === 'attack' && scene.textures.exists('generated-battle-enemy-attack-sheet')) key = 'generated-battle-enemy-attack-sheet';
    if (pose === 'hit' && scene.textures.exists('generated-battle-enemy-hit-sheet')) key = 'generated-battle-enemy-hit-sheet';
    if (!applySheetFrame(scene, image, key, index, 6, displayHeight)) return false;
    image.setPosition(xOffset, bottom + (key === 'generated-battle-enemy-idle-sheet' ? 22 : 18) * scale);
    image.setData('pose', pose);
    return true;
  };

  container.actorSprite = image;
  container.setBattlePose = applyPose;
  applyPose(options.pose ?? 'idle');
  return image;
}

function applySheetFrame(scene, image, textureKey, index, frameCount, displayHeight) {
  if (!scene.textures.exists(textureKey)) return false;
  const texture = scene.textures.get(textureKey);
  const source = texture.getSourceImage();
  const width = source?.width ?? 1;
  const height = source?.height ?? 1;
  const frameWidth = width / Math.max(1, frameCount);
  const frameIndex = Phaser.Math.Clamp(index, 0, frameCount - 1);
  const frameName = `${textureKey}-${frameIndex}`;
  if (!texture.has(frameName)) {
    texture.add(frameName, 0, Math.floor(frameWidth * frameIndex), 0, Math.ceil(frameWidth), height);
  }
  image.setTexture(textureKey, frameName);
  image.setScale(displayHeight / Math.max(1, height));
  return true;
}

function addGeneratedSprite(scene, container, textureKey, scale, options = {}) {
  if (!scene.textures.exists(textureKey)) return false;
  const image = scene.add.image(0, 0, textureKey).setOrigin(0.5, 1);
  const source = scene.textures.get(textureKey).getSourceImage();
  const crop = options.crop;
  if (crop) {
    image.setCrop(crop.x ?? 0, crop.y ?? 0, crop.width ?? source?.width ?? 1, crop.height ?? source?.height ?? 1);
  }
  const displayHeight = (options.generatedHeight ?? (options.enemy ? 248 : options.battle ? 300 : 318)) * scale;
  const ratioWidth = crop?.width ?? source?.width ?? 1;
  const ratioHeight = crop?.height ?? source?.height ?? 1;
  const displayWidth = displayHeight * (ratioWidth / Math.max(1, ratioHeight));
  image.setDisplaySize(displayWidth, displayHeight);
  image.setPosition(options.generatedX ?? 0, (options.generatedBottom ?? 118) * scale);
  image.setName(textureKey);
  container.add(image);
  return true;
}

function addSpriteRim(g, scale, radius, color) {
  glow(g, 0, -18 * scale, radius * scale, color, 0.1);
  g.lineStyle(2 * scale, PALE_GOLD, 0.12);
  g.strokeEllipse(0, 2 * scale, radius * 1.16 * scale, radius * 1.68 * scale);
}

function enemyShadow(id) {
  if (id === 'black-hound') return 178;
  if (id === 'plague-rat-swarm') return 170;
  if (id === 'crow-messenger') return 132;
  return 160;
}

function drawGroundShadow(g, x, y, w, h, alpha) {
  g.fillStyle(0x000000, alpha);
  g.fillEllipse(x, y, w, h);
  g.fillStyle(0x2b170d, alpha * 0.36);
  g.fillEllipse(x - w * 0.08, y - 2, w * 0.58, h * 0.45);
}

function glow(g, x, y, radius, color, alpha) {
  g.fillStyle(color, alpha * 0.32);
  g.fillCircle(x, y, radius);
  g.fillStyle(color, alpha * 0.2);
  g.fillCircle(x, y, radius * 1.42);
}

function drawFlame(g, x, y, s = 1) {
  g.fillStyle(0xffe59a, 0.96);
  poly(g, [[x - 9 * s, y + 10 * s], [x, y - 24 * s], [x + 10 * s, y + 10 * s]]);
  g.fillStyle(0xe5672d, 0.86);
  poly(g, [[x - 5 * s, y + 8 * s], [x + 2 * s, y - 13 * s], [x + 12 * s, y + 8 * s]]);
  g.fillStyle(0xffffff, 0.46);
  poly(g, [[x - 3 * s, y + 4 * s], [x + 1 * s, y - 8 * s], [x + 5 * s, y + 4 * s]]);
}

function drawBottle(g, x, y, s, color) {
  g.fillStyle(0x14100d, 0.95);
  g.fillRoundedRect(x - 8 * s, y - 6 * s, 16 * s, 32 * s, 4 * s);
  g.fillStyle(color, 0.86);
  g.fillRoundedRect(x - 5 * s, y + 3 * s, 10 * s, 19 * s, 3 * s);
  g.lineStyle(2 * s, 0xd4c27d, 0.58);
  g.strokeRoundedRect(x - 8 * s, y - 6 * s, 16 * s, 32 * s, 4 * s);
}

function cape(g, s, points, color, alpha) {
  g.fillStyle(color, alpha);
  poly(g, points.map(([x, y]) => [x * s, y * s]));
}

function poly(g, points) {
  if (!points.length) return;
  g.beginPath();
  g.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) g.lineTo(points[i][0], points[i][1]);
  g.closePath();
  g.fillPath();
}

function grain(g, x, y, w, h, colors, count, alpha, s) {
  const width = Math.max(1, Math.floor(w));
  const height = Math.max(1, Math.floor(h));
  const effectiveCount = Math.max(0, Math.round(count * 0.38));
  const effectiveAlpha = alpha * 0.42;
  for (let i = 0; i < effectiveCount; i += 1) {
    const px = x + ((i * 37 + 19) % width);
    const py = y + ((i * 53 + 11) % height);
    g.fillStyle(colors[i % colors.length], effectiveAlpha * (0.58 + (i % 3) * 0.14));
    g.fillRect(px, py, Math.max(1, (1 + (i % 2)) * s), Math.max(1, s));
  }
}

function addRebuiltAsh(scene, options = {}) {
  const count = options.count ?? 60;
  const depth = options.depth ?? 4;
  for (let i = 0; i < count; i += 1) {
    const x = 24 + ((i * 137) % (GAME_WIDTH - 48));
    const y = 44 + ((i * 79) % (GAME_HEIGHT - 90));
    const mote = scene.add.circle(x, y, 1 + (i % 3) * 0.7, i % 3 === 0 ? CANDLE : 0x8c6742, 0.08 + (i % 5) * 0.022).setDepth(depth);
    scene.tweens.add({
      targets: mote,
      y: y - 26 - (i % 4) * 10,
      x: x + ((i % 2 ? 1 : -1) * (8 + (i % 5) * 2)),
      alpha: 0.02,
      duration: 2800 + (i % 7) * 360,
      delay: i * 24,
      repeat: -1,
      ease: 'Sine.InOut'
    });
  }
}

function addWarmDust(scene, options = {}) {
  const count = Math.max(0, Math.round((options.count ?? 36) * (options.density ?? 0.34)));
  const depth = options.depth ?? 4;
  const alpha = (options.alpha ?? 0.1) * (options.alphaScale ?? 0.42);
  for (let i = 0; i < count; i += 1) {
    const x = 34 + ((i * 149) % (GAME_WIDTH - 68));
    const y = 42 + ((i * 91) % (GAME_HEIGHT - 84));
    const color = i % 3 === 0 ? 0xd6a84d : i % 3 === 1 ? 0xffffff : 0xb58a52;
    const mote = scene.add.circle(x, y, 0.65 + (i % 2) * 0.36, color, alpha * (0.34 + (i % 4) * 0.09)).setDepth(depth);
    scene.tweens.add({
      targets: mote,
      y: y - 14 - (i % 4) * 7,
      x: x + ((i % 2 ? 1 : -1) * (5 + (i % 5))),
      alpha: alpha * 0.08,
      duration: 4300 + (i % 7) * 520,
      delay: i * 32,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.InOut'
    });
  }
}
