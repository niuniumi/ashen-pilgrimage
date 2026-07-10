import { THEME } from '../game/Theme.js';
import { FINAL_ART } from './FinalArtAssets.js';
import {
  addIdleTween,
  addShadow,
  createArtContainer,
  drawCandleFlame,
  drawCandleGlow,
  drawPixelGrain,
  drawSmallBottles,
  drawSlashMarks,
  drawTatteredEdge
} from './PixelSpriteFactory.js';

export function drawHeroPortrait(scene, characterId, x = 0, y = 0, scale = 1, options = {}) {
  const svgArt = drawHeroSvg(scene, characterId, x, y, scale, { ...options, kind: 'portrait' });
  if (svgArt) return svgArt;

  const container = createArtContainer(scene, x, y, options);
  addShadow(scene, container, 118 * scale, heroShadowWidth(characterId) * scale, 27 * scale, 0.36);
  const g = scene.add.graphics();
  container.add(g);

  if (characterId === 'candle-nun') drawCandleNun(g, scale, options);
  else if (characterId === 'ashblood-alchemist') drawAshbloodAlchemist(g, scale, options);
  else drawExiledKnight(g, scale, options);

  if (options.idle !== false) {
    addIdleTween(scene, container, {
      amount: (options.battle ? 4 : 6) * scale,
      duration: characterId === 'candle-nun' ? 1550 : characterId === 'ashblood-alchemist' ? 1280 : 1380,
      idle: true
    });
  }
  return container;
}

export function drawHeroBattleSprite(scene, characterId, x = 0, y = 0, scale = 1, options = {}) {
  const svgArt = drawHeroSvg(scene, characterId, x, y, scale, { ...options, kind: 'battle', battle: true });
  if (svgArt) return svgArt;
  return drawHeroPortrait(scene, characterId, x, y, scale, { ...options, battle: true, preferSvg: false });
}

function drawHeroSvg(scene, characterId, x, y, scale, options = {}) {
  if (options.preferSvg !== true) return null;
  const asset = FINAL_ART.heroes[characterId]?.[options.kind ?? 'portrait'];
  if (!asset || !scene.textures.exists(asset.key)) return null;
  const container = createArtContainer(scene, x, y, options);
  const displayHeight = (options.displayHeight ?? (options.battle ? 245 : 315)) * scale;
  const displayWidth = displayHeight * (asset.width / asset.height);
  const bottomY = (options.imageYOffset ?? (options.battle ? 122 : 74)) * scale;
  addShadow(scene, container, bottomY + 4 * scale, Math.min(displayWidth * 0.78, 178 * scale), 24 * scale, 0.34);
  const image = scene.add.image(0, bottomY, asset.key).setOrigin(0.5, 1);
  image.setDisplaySize(displayWidth, displayHeight);
  image.setName(`${characterId}-${options.kind ?? 'portrait'}-svg`);
  container.add(image);
  if (options.idle !== false) {
    addIdleTween(scene, container, {
      amount: (options.battle ? 4 : 6) * scale,
      duration: characterId === 'candle-nun' ? 1550 : characterId === 'ashblood-alchemist' ? 1280 : 1380,
      idle: true
    });
  }
  return container;
}

function heroShadowWidth(id) {
  if (id === 'candle-nun') return 154;
  if (id === 'ashblood-alchemist') return 172;
  return 182;
}

function drawExiledKnight(g, s, options) {
  const cloak = 0x691f2a;
  const cloakDark = 0x2a1013;
  const iron = 0x263033;
  const ironDark = 0x12191b;
  const ironLight = 0x718086;
  const gold = THEME.colors.darkGold;
  const battle = Boolean(options.battle);

  g.fillStyle(0x0d0707, 0.26);
  g.fillEllipse(-4 * s, 6 * s, 142 * s, 210 * s);

  drawTatteredEdge(
    g,
    [
      [-56 * s, -60 * s],
      [-124 * s, 24 * s],
      [-104 * s, 116 * s],
      [-68 * s, 89 * s],
      [-34 * s, 118 * s],
      [-14 * s, 38 * s],
      [-26 * s, -48 * s]
    ],
    cloak,
    0.94
  );
  g.fillStyle(cloakDark, 0.92);
  g.fillTriangle(-48 * s, -42 * s, -90 * s, 96 * s, -14 * s, 72 * s);
  drawPixelGrain(g, -118 * s, -48 * s, 104 * s, 160 * s, [0x8f2b35, 0x130708], { count: 22, alpha: 0.13, seed: 4 });

  g.fillStyle(0x0b0e0f, 1);
  g.fillRect(-31 * s, 46 * s, 19 * s, 69 * s);
  g.fillRect(13 * s, 45 * s, 20 * s, 70 * s);
  g.fillStyle(0x161c1f, 1);
  g.fillRoundedRect(-36 * s, 82 * s, 31 * s, 15 * s, 5 * s);
  g.fillRoundedRect(7 * s, 82 * s, 33 * s, 15 * s, 5 * s);
  g.fillStyle(0x222a2d, 1);
  g.fillRoundedRect(-40 * s, -38 * s, 80 * s, 92 * s, 8 * s);
  g.fillStyle(ironDark, 1);
  g.fillTriangle(-48 * s, -40 * s, 0, -65 * s, 50 * s, -40 * s);
  g.fillStyle(0x394447, 1);
  g.fillTriangle(-30 * s, -33 * s, 0, -58 * s, 30 * s, -33 * s);
  g.fillStyle(0x14191b, 0.92);
  g.fillTriangle(-37 * s, -30 * s, -10 * s, 51 * s, -1 * s, -17 * s);
  g.fillTriangle(37 * s, -30 * s, 9 * s, 51 * s, 1 * s, -17 * s);
  g.fillStyle(0x4a575a, 0.78);
  g.fillTriangle(-18 * s, -23 * s, 0, -52 * s, 18 * s, -23 * s);
  g.fillStyle(0x0d1214, 1);
  g.fillRoundedRect(-62 * s, -44 * s, 34 * s, 30 * s, 10 * s);
  g.fillRoundedRect(29 * s, -45 * s, 35 * s, 31 * s, 10 * s);
  g.fillStyle(0x536267, 0.46);
  g.fillRect(-57 * s, -39 * s, 20 * s, 6 * s);
  g.fillRect(37 * s, -40 * s, 19 * s, 6 * s);
  g.fillStyle(0x171e21, 1);
  g.fillRect(-35 * s, -18 * s, 70 * s, 18 * s);
  g.fillStyle(THEME.colors.blood, 0.88);
  g.fillRoundedRect(-35 * s, 4 * s, 70 * s, 14 * s, 3 * s);
  g.lineStyle(2 * s, gold, 0.7);
  g.lineBetween(-33 * s, -5 * s, 33 * s, -5 * s);
  g.lineBetween(-30 * s, 29 * s, 31 * s, 29 * s);

  g.fillStyle(ironDark, 1);
  g.fillRoundedRect(-51 * s, -26 * s, 17 * s, 68 * s, 5 * s);
  g.fillRoundedRect(36 * s, -28 * s, 17 * s, 68 * s, 5 * s);
  g.fillStyle(ironLight, 0.45);
  g.fillRect(-30 * s, -28 * s, 7 * s, 66 * s);
  g.fillRect(18 * s, -30 * s, 7 * s, 68 * s);
  g.fillStyle(0x0a0d0e, 1);
  g.fillRect(-35 * s, 103 * s, 28 * s, 12 * s);
  g.fillRect(8 * s, 103 * s, 32 * s, 12 * s);

  g.fillStyle(0x202a2c, 1);
  g.fillRoundedRect(-27 * s, -103 * s, 54 * s, 48 * s, 8 * s);
  g.fillStyle(0x101416, 1);
  g.fillTriangle(-35 * s, -84 * s, 0, -123 * s, 36 * s, -84 * s);
  g.fillStyle(0x151c1f, 1);
  g.fillTriangle(-31 * s, -95 * s, -42 * s, -56 * s, -14 * s, -59 * s);
  g.fillTriangle(31 * s, -95 * s, 43 * s, -56 * s, 14 * s, -59 * s);
  g.fillStyle(0x3a4548, 0.95);
  g.fillRect(-22 * s, -91 * s, 44 * s, 11 * s);
  g.fillStyle(gold, 0.88);
  g.fillRect(-21 * s, -81 * s, 42 * s, 5 * s);
  g.fillStyle(0x050606, 1);
  g.fillRect(-17 * s, -72 * s, 34 * s, 7 * s);
  g.fillStyle(0x0d0f10, 1);
  g.fillTriangle(-24 * s, -66 * s, -10 * s, -45 * s, -2 * s, -66 * s);
  g.fillTriangle(24 * s, -66 * s, 10 * s, -45 * s, 2 * s, -66 * s);
  g.fillStyle(0xe4d4a2, 0.42);
  g.fillRect(7 * s, -100 * s, 8 * s, 18 * s);

  g.fillStyle(0x1a272d, 1);
  g.fillRoundedRect(-86 * s, -22 * s, 58 * s, 86 * s, 18 * s);
  g.fillStyle(0x2f6484, 0.8);
  g.fillTriangle(-58 * s, -7 * s, -31 * s, 20 * s, -58 * s, 50 * s);
  g.lineStyle(4 * s, gold, 0.84);
  g.strokeRoundedRect(-86 * s, -22 * s, 58 * s, 86 * s, 18 * s);
  g.lineStyle(2 * s, 0xd8bd8a, 0.52);
  g.lineBetween(-77 * s, -3 * s, -42 * s, 39 * s);
  g.lineBetween(-80 * s, 18 * s, -35 * s, 18 * s);

  const swordX = battle ? 64 : 74;
  g.lineStyle(7 * s, 0x1d2426, 0.9);
  g.lineBetween(swordX * s, -8 * s, (swordX + 56) * s, -92 * s);
  g.lineStyle(4 * s, 0xd9c585, 0.95);
  g.lineBetween((swordX + 1) * s, -13 * s, (swordX + 58) * s, -95 * s);
  g.lineStyle(2 * s, 0xfff2c9, 0.72);
  g.lineBetween((swordX + 11) * s, -22 * s, (swordX + 59) * s, -91 * s);
  g.fillStyle(gold, 0.92);
  g.fillRoundedRect((swordX - 13) * s, -11 * s, 31 * s, 7 * s, 3 * s);
  if (!battle) drawSlashMarks(g, 83 * s, -68 * s, s * 0.55, 0xf2c86d);
}

function drawCandleNun(g, s) {
  drawCandleGlow(g, 0, -55 * s, 104 * s, 0.18);
  drawCandleGlow(g, 76 * s, -91 * s, 58 * s, 0.2);

  g.fillStyle(0x0d0d0e, 1);
  g.fillTriangle(-58 * s, -54 * s, 54 * s, -52 * s, 78 * s, 118 * s);
  g.fillStyle(0x202024, 1);
  g.fillRoundedRect(-40 * s, -58 * s, 80 * s, 132 * s, 13 * s);
  g.fillStyle(0x111113, 1);
  g.fillTriangle(-42 * s, -50 * s, 0, -10 * s, 42 * s, -50 * s);
  g.fillStyle(0x2e2f35, 1);
  g.fillTriangle(-31 * s, -45 * s, 0, 38 * s, 33 * s, -45 * s);
  g.fillStyle(0xd8bd8a, 0.62);
  g.fillRect(-34 * s, 43 * s, 68 * s, 9 * s);
  g.lineStyle(2 * s, THEME.colors.darkGold, 0.65);
  g.lineBetween(-29 * s, 64 * s, 29 * s, 64 * s);

  g.fillStyle(0xf2e8d3, 1);
  g.fillRoundedRect(-38 * s, -108 * s, 76 * s, 60 * s, 20 * s);
  g.fillStyle(0xe7ddca, 0.98);
  g.fillTriangle(-46 * s, -96 * s, 0, -134 * s, 46 * s, -96 * s);
  g.fillStyle(0x151516, 1);
  g.fillRoundedRect(-24 * s, -91 * s, 48 * s, 31 * s, 12 * s);
  g.fillStyle(0xe8d6b0, 0.95);
  g.fillCircle(-8 * s, -77 * s, 4 * s);
  g.fillCircle(9 * s, -77 * s, 4 * s);
  g.fillStyle(0x3b3330, 1);
  g.fillRect(-15 * s, -61 * s, 30 * s, 5 * s);
  g.fillStyle(0xf0e2c0, 0.92);
  g.fillRect(-48 * s, -53 * s, 96 * s, 18 * s);
  g.lineStyle(3 * s, 0xd8bd8a, 0.85);
  g.strokeCircle(0, -78 * s, 46 * s);

  g.fillStyle(0x27272a, 1);
  g.fillRoundedRect(-53 * s, -21 * s, 22 * s, 92 * s, 7 * s);
  g.fillRoundedRect(31 * s, -20 * s, 22 * s, 92 * s, 7 * s);
  g.fillStyle(0xe9dbc1, 0.96);
  g.fillCircle(-43 * s, 42 * s, 8 * s);
  g.fillCircle(42 * s, 39 * s, 8 * s);

  g.lineStyle(5 * s, 0xd8bd8a, 0.88);
  g.lineBetween(77 * s, -70 * s, 77 * s, 86 * s);
  g.fillStyle(0x9d7b51, 0.95);
  g.fillRoundedRect(68 * s, -72 * s, 18 * s, 51 * s, 5 * s);
  drawCandleFlame(g, 77 * s, -77 * s, s * 1.15);
  g.lineStyle(2 * s, 0xf2c86d, 0.7);
  g.lineBetween(0, -31 * s, 0, 23 * s);
  g.lineBetween(-13 * s, -8 * s, 13 * s, -8 * s);
  g.fillStyle(0xf2c86d, 0.78);
  g.fillCircle(0, -33 * s, 6 * s);
  drawPixelGrain(g, -54 * s, -30 * s, 108 * s, 116 * s, [0xffffff, 0xb99b68], { count: 24, alpha: 0.07, seed: 7 });
}

function drawAshbloodAlchemist(g, s) {
  drawCandleGlow(g, -74 * s, -2 * s, 62 * s, 0.1);
  g.fillStyle(THEME.colors.poison, 0.16);
  g.fillCircle(-74 * s, -2 * s, 55 * s);
  g.fillCircle(60 * s, -84 * s, 38 * s);
  g.fillCircle(94 * s, 14 * s, 28 * s);

  g.fillStyle(0x17100d, 0.92);
  g.fillTriangle(-66 * s, -56 * s, 61 * s, -52 * s, 82 * s, 116 * s);
  g.fillStyle(0x523820, 1);
  g.fillRoundedRect(-48 * s, -63 * s, 96 * s, 132 * s, 13 * s);
  g.fillStyle(0x2a1e17, 0.98);
  g.fillTriangle(-51 * s, -38 * s, -84 * s, 109 * s, -14 * s, 88 * s);
  g.fillTriangle(48 * s, -38 * s, 78 * s, 110 * s, 12 * s, 88 * s);
  g.fillStyle(0x6b4a28, 0.88);
  g.fillRect(-43 * s, -37 * s, 86 * s, 16 * s);
  g.lineStyle(3 * s, 0xa17d45, 0.64);
  g.lineBetween(-39 * s, 2 * s, 42 * s, 1 * s);
  g.lineBetween(-31 * s, 39 * s, 37 * s, 39 * s);

  g.fillStyle(0x241f1b, 1);
  g.fillRoundedRect(-39 * s, -116 * s, 72 * s, 55 * s, 18 * s);
  g.fillStyle(0x141211, 1);
  g.fillTriangle(13 * s, -100 * s, 111 * s, -82 * s, 17 * s, -66 * s);
  g.fillStyle(0x080807, 0.95);
  g.fillTriangle(18 * s, -94 * s, 91 * s, -82 * s, 18 * s, -73 * s);
  g.fillStyle(0xd8bd8a, 0.92);
  g.fillCircle(-14 * s, -92 * s, 6 * s);
  g.fillStyle(THEME.colors.poison, 0.92);
  g.fillCircle(73 * s, -80 * s, 6 * s);
  g.lineStyle(2 * s, 0xd8bd8a, 0.5);
  g.lineBetween(-38 * s, -116 * s, 32 * s, -116 * s);
  g.fillStyle(0x17100d, 1);
  g.fillRoundedRect(-62 * s, -128 * s, 98 * s, 18 * s, 8 * s);
  g.fillTriangle(-17 * s, -180 * s, 17 * s, -128 * s, -48 * s, -128 * s);

  g.fillStyle(0x243127, 1);
  g.fillRoundedRect(-63 * s, -17 * s, 18 * s, 96 * s, 6 * s);
  g.fillRoundedRect(46 * s, -13 * s, 18 * s, 94 * s, 6 * s);
  g.fillStyle(0xd8bd8a, 0.9);
  g.fillCircle(-56 * s, 70 * s, 8 * s);
  g.fillCircle(56 * s, 69 * s, 8 * s);
  g.fillStyle(THEME.colors.poison, 0.94);
  g.fillRoundedRect(-82 * s, 4 * s, 24 * s, 42 * s, 6 * s);
  g.fillStyle(0x112017, 0.86);
  g.fillRoundedRect(-78 * s, 14 * s, 16 * s, 28 * s, 4 * s);
  g.lineStyle(3 * s, 0xc9b36b, 0.82);
  g.strokeRoundedRect(-82 * s, 4 * s, 24 * s, 42 * s, 6 * s);
  drawSmallBottles(g, -24 * s, 37 * s, s, [THEME.colors.poison, THEME.colors.arcane, THEME.colors.candle, THEME.colors.blood]);
  g.lineStyle(3 * s, 0xd8bd8a, 0.8);
  g.lineBetween(62 * s, 4 * s, 90 * s, 68 * s);
  g.fillStyle(0x16110f, 1);
  g.fillTriangle(86 * s, 61 * s, 100 * s, 72 * s, 80 * s, 77 * s);
  drawPixelGrain(g, -82 * s, -61 * s, 154 * s, 171 * s, [0x9f7a45, 0x1a0f0c, 0x5f9f62], { count: 34, alpha: 0.09, seed: 13 });
}
