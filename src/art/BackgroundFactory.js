import { GAME_HEIGHT, GAME_WIDTH } from '../game/constants.js';
import { THEME } from '../game/Theme.js';
import { addAmbientAsh } from '../effects/AmbientParticles.js';
import { drawCandleFlame, drawMedievalSky, drawPixelGrain } from './PixelSpriteFactory.js';
import { FINAL_ART } from './FinalArtAssets.js';
import { addHandPaintedBackground, HANDPAINTED_KEYS } from './HandPaintedAssets.js';

export function drawMenuBackdrop(scene, options = {}) {
  if (shouldUseSvgBackdrop(options) && drawSvgBackground(scene, FINAL_ART.backgrounds.menu, options.depth ?? 0)) {
    addAmbientAsh(scene, { count: 74, depth: 4 });
    return null;
  }
  const g = scene.add.graphics().setDepth(options.depth ?? 0);
  drawMedievalSky(g, GAME_WIDTH, GAME_HEIGHT, { bottom: 0x4a2a25, bottom2: 0x1a0f0c });
  drawClouds(g);
  drawMountains(g);
  drawCastleRidge(g, 690, 548, 1);
  drawChurch(g, 1050, 548, 1.05);
  drawForegroundGround(g, 585);
  drawCampfire(g, 365, 705, 1.05);
  drawCandles(g, 195, 610);
  drawVignette(g, GAME_WIDTH, GAME_HEIGHT);
  addAmbientAsh(scene, { count: 74, depth: 4 });
  return g;
}

export function drawCharacterSelectBackdrop(scene, options = {}) {
  if (shouldUseSvgBackdrop(options) && drawSvgBackground(scene, FINAL_ART.backgrounds.characterSelect, options.depth ?? 0)) {
    addAmbientAsh(scene, { count: 52, depth: 4 });
    return null;
  }
  const g = scene.add.graphics().setDepth(options.depth ?? 0);
  drawMedievalSky(g, GAME_WIDTH, GAME_HEIGHT, { bottom: 0x3c2321, bottom2: 0x0b0705 });
  drawClouds(g, 0.68);
  drawMountains(g, 0.84);
  drawChurch(g, 1040, 602, 0.72);
  drawForegroundGround(g, 620);
  drawVignette(g, GAME_WIDTH, GAME_HEIGHT);
  addAmbientAsh(scene, { count: 52, depth: 4 });
  return g;
}

export function drawBattleBackdrop(scene, options = {}) {
  if (shouldUseSvgBackdrop(options) && drawSvgBackground(scene, FINAL_ART.backgrounds.battle, options.depth ?? 0)) {
    const ash = scene.add.graphics().setDepth((options.depth ?? 0) + 1);
    for (let i = 0; i < 92; i += 1) {
      const x = 30 + ((i * 149) % 1470);
      const y = 112 + ((i * 83) % 560);
      const alpha = 0.08 + ((i % 5) * 0.027);
      ash.fillStyle(i % 3 === 0 ? THEME.colors.candle : 0x7c593d, alpha);
      ash.fillCircle(x, y, 1 + (i % 3));
    }
    return null;
  }
  const g = scene.add.graphics().setDepth(options.depth ?? 0);
  drawMedievalSky(g, GAME_WIDTH, GAME_HEIGHT, { top: 0x120d18, top2: 0x16142a, bottom: 0x56352a, bottom2: 0x241610 });
  drawClouds(g, 0.55);
  drawBattleMountains(g);
  drawLowFog(g, 548);
  drawRuinedAbbey(g, 430);
  drawCastleRidge(g, 526, 525, 0.82);
  drawChurch(g, 990, 545, 1.0);
  drawPineCluster(g, 1130, 590, 0.82);
  drawForegroundGround(g, 574, { road: true });
  drawStoneRoad(g, options.layout?.stage);
  drawStageLine(g, options.layout?.stage);
  drawBattleForegroundTexture(g, options.layout?.stage);
  drawVignette(g, GAME_WIDTH, GAME_HEIGHT);
  for (let i = 0; i < 92; i += 1) {
    const x = 30 + ((i * 149) % 1470);
    const y = 112 + ((i * 83) % 560);
    const alpha = 0.08 + ((i % 5) * 0.027);
    g.fillStyle(i % 3 === 0 ? THEME.colors.candle : 0x7c593d, alpha);
    g.fillCircle(x, y, 1 + (i % 3));
  }
  return g;
}

export function drawMapBackdrop(scene, options = {}) {
  const painted = addHandPaintedBackground(scene, HANDPAINTED_KEYS.mapBg, { depth: options.depth ?? 0 });
  if (painted) {
    addAmbientAsh(scene, { count: 24, depth: 6 });
    return painted;
  }
  if (shouldUseSvgBackdrop(options) && drawSvgBackground(scene, FINAL_ART.backgrounds.map, options.depth ?? 0)) {
    addAmbientAsh(scene, { count: 44, depth: 6 });
    return null;
  }
  const g = scene.add.graphics().setDepth(options.depth ?? 0);
  g.fillGradientStyle(0xf8f0df, 0xf4e2c1, 0xd7b787, 0xbe8f61, 1);
  g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  g.fillStyle(0xffffff, 0.14);
  g.fillEllipse(768, 250, 1180, 290);
  g.fillStyle(0xd0ad76, 0.2);
  g.fillEllipse(750, 646, 1280, 180);
  g.fillStyle(0xc2a071, 0.18);
  fillMountain(g, [
    [0, 622],
    [300, 388],
    [620, 622]
  ]);
  fillMountain(g, [
    [420, 624],
    [835, 330],
    [1220, 624]
  ]);
  g.fillStyle(0x9e8261, 0.12);
  g.fillRect(0, 620, GAME_WIDTH, GAME_HEIGHT - 620);
  drawParchmentMap(g, 332, 132, 872, 640);
  drawWaxSeal(g, 1124, 708, 30);
  drawLightPaperEdge(g, GAME_WIDTH, GAME_HEIGHT);
  return g;
}

function drawLightPaperEdge(g, width, height) {
  for (let i = 0; i < 96; i += 1) {
    g.fillStyle(i % 2 ? 0x6d5233 : 0xffffff, i % 2 ? 0.032 : 0.05);
    g.fillEllipse(34 + ((i * 97) % (width - 68)), 28 + ((i * 53) % (height - 56)), 8 + (i % 12), 2 + (i % 5));
  }
  g.lineStyle(1, 0x7f6340, 0.3);
  g.strokeRoundedRect(34, 30, width - 68, height - 60, 8);
  g.strokeRoundedRect(47, 43, width - 94, height - 86, 6);
  for (let i = 0; i < 11; i += 1) {
    const alpha = 0.018 + i * 0.008;
    g.fillStyle(0x6b4326, alpha);
    g.fillRect(i * 12, 0, 16, height);
    g.fillRect(width - 16 - i * 12, 0, 16, height);
    g.fillRect(0, i * 9, width, 12);
    g.fillRect(0, height - 12 - i * 9, width, 12);
  }
}

function drawSvgBackground(scene, asset, depth = 0) {
  if (!asset || !scene.textures.exists(asset.key)) return false;
  scene.add.image(0, 0, asset.key).setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(depth);
  return true;
}

function shouldUseSvgBackdrop(options = {}) {
  return options.preferSvg === true;
}

export function drawParchmentMap(g, x, y, width, height) {
  g.fillStyle(0x4b2715, 0.82);
  g.fillRoundedRect(x - 12, y + 10, width + 24, height + 8, 20);
  g.fillStyle(0x704725, 0.96);
  g.fillRoundedRect(x, y, width, height, 18);
  g.fillStyle(THEME.colors.parchment, 0.96);
  g.fillRoundedRect(x + 18, y + 18, width - 36, height - 36, 14);
  g.fillStyle(0x28150d, 0.09);
  g.fillRoundedRect(x + 28, y + 28, width - 56, height - 56, 10);
  g.lineStyle(4, 0x2b170d, 0.55);
  g.strokeRoundedRect(x + 18, y + 18, width - 36, height - 36, 14);
  g.lineStyle(1, 0xffffff, 0.2);
  g.strokeRoundedRect(x + 34, y + 34, width - 68, height - 68, 8);
  for (let i = 0; i < 98; i += 1) {
    g.fillStyle(i % 2 ? 0x4a2f1d : 0xffffff, i % 2 ? 0.05 : 0.055);
    g.fillEllipse(x + 50 + ((i * 83) % (width - 100)), y + 52 + ((i * 47) % (height - 102)), 18 + (i % 13), 4 + (i % 5));
  }
  for (let i = 0; i < 16; i += 1) {
    g.lineStyle(1, 0x4a2f1d, 0.08);
    const yy = y + 64 + i * 34;
    g.lineBetween(x + 56, yy, x + width - 60, yy + ((i % 2) * 5));
  }
}

function drawClouds(g, alphaScale = 1) {
  [
    [500, 175, 1.1],
    [950, 145, 0.86],
    [230, 242, 0.72]
  ].forEach(([x, y, scale]) => {
    g.fillStyle(0xd2b989, 0.08 * alphaScale);
    g.fillEllipse(x, y, 180 * scale, 44 * scale);
    g.fillEllipse(x + 70 * scale, y + 8 * scale, 230 * scale, 38 * scale);
    g.fillEllipse(x - 90 * scale, y + 12 * scale, 150 * scale, 34 * scale);
  });
}

function drawMountains(g, alphaScale = 1) {
  g.fillStyle(0x272338, 0.78 * alphaScale);
  fillMountain(g, [
    [0, 590],
    [300, 320],
    [620, 590]
  ]);
  fillMountain(g, [
    [410, 590],
    [810, 260],
    [1200, 590]
  ]);
  g.fillStyle(0x15141d, 0.92 * alphaScale);
  fillMountain(g, [
    [100, 610],
    [360, 370],
    [650, 610]
  ]);
  fillMountain(g, [
    [680, 610],
    [1010, 310],
    [1320, 610]
  ]);
}

function drawBattleMountains(g) {
  g.fillStyle(0x1f1b2b, 0.72);
  fillMountain(g, [
    [0, 585],
    [160, 470],
    [300, 332],
    [520, 540],
    [725, 365],
    [960, 585]
  ]);
  g.fillStyle(0x292538, 0.82);
  fillMountain(g, [
    [92, 585],
    [350, 306],
    [612, 585],
    [900, 250],
    [1130, 585]
  ]);
  g.fillStyle(0x15151e, 0.92);
  fillMountain(g, [
    [515, 585],
    [690, 468],
    [880, 337],
    [1080, 585]
  ]);
}

function drawLowFog(g, y) {
  g.fillStyle(0xd8bd8a, 0.045);
  g.fillEllipse(360, y - 132, 760, 82);
  g.fillEllipse(795, y - 118, 660, 74);
  g.fillStyle(0x6b4a66, 0.055);
  g.fillEllipse(930, y - 92, 520, 58);
  g.fillStyle(0x201a27, 0.36);
  g.fillEllipse(620, y - 18, 920, 40);
}

function drawRuinedAbbey(g, groundY) {
  g.fillStyle(0x090a0f, 0.9);
  const arches = [
    [516, 92],
    [578, 122],
    [646, 172],
    [722, 120],
    [792, 150],
    [874, 96]
  ];
  arches.forEach(([x, h], index) => {
    g.fillRect(x, groundY - h, 40, h);
    g.fillTriangle(x - 18, groundY - h, x + 20, groundY - h - 40 - (index % 2) * 16, x + 58, groundY - h);
    g.fillStyle(0xd8bd8a, 0.08);
    g.fillRect(x + 16, groundY - 52 - (index % 3) * 14, 6, 22);
    g.fillStyle(0x090a0f, 0.9);
  });
  g.fillStyle(0x11131a, 0.95);
  g.fillRect(638, groundY - 176, 184, 176);
  g.fillStyle(0x050608, 0.95);
  g.fillRect(698, groundY - 126, 42, 126);
  g.fillTriangle(698, groundY - 126, 719, groundY - 166, 740, groundY - 126);
  g.fillRect(763, groundY - 92, 30, 92);
  g.fillTriangle(763, groundY - 92, 778, groundY - 124, 793, groundY - 92);
  g.fillStyle(0x1d1b26, 0.96);
  g.fillTriangle(656, groundY - 176, 745, groundY - 292, 828, groundY - 176);
  g.fillStyle(0x272337, 0.46);
  g.fillTriangle(745, groundY - 292, 828, groundY - 176, 702, groundY - 176);
  g.fillStyle(0xf1c76a, 0.11);
  g.fillRect(713, groundY - 74, 8, 26);
  g.fillRect(884, groundY - 51, 6, 19);
  g.lineStyle(2, 0x6b5132, 0.2);
  g.lineBetween(532, groundY - 4, 1010, groundY - 4);
}

function drawBattleForegroundTexture(g, stage) {
  const left = stage?.x ?? 80;
  const width = stage?.w ?? 1000;
  for (let i = 0; i < 42; i += 1) {
    const x = left + 24 + ((i * 61) % Math.max(1, width - 48));
    const y = 616 + ((i * 29) % 90);
    g.lineStyle(1 + (i % 2), i % 3 === 0 ? 0x6f6c41 : 0x4b3422, 0.22);
    g.lineBetween(x, y, x + 18 + (i % 9), y + 10 + (i % 5));
  }
  for (let i = 0; i < 26; i += 1) {
    const x = left + 40 + ((i * 97) % Math.max(1, width - 80));
    const y = 564 + ((i * 17) % 70);
    g.lineStyle(2, 0x6d6a42, 0.28);
    g.lineBetween(x, y, x + 8, y - 20);
    g.lineBetween(x + 5, y - 2, x + 20, y - 13);
  }
  g.fillStyle(0x0b0706, 0.42);
  g.fillRoundedRect(left, 598, width, 52, 8);
  g.fillStyle(0x8c5b2f, 0.11);
  g.fillEllipse(left + 258, 604, 230, 24);
  g.fillEllipse(left + 705, 611, 270, 28);
}

function fillMountain(g, points, baseY = 620) {
  g.beginPath();
  g.moveTo(points[0][0], points[0][1]);
  points.slice(1).forEach(([x, y]) => g.lineTo(x, y));
  g.lineTo(points[points.length - 1][0], baseY);
  g.lineTo(points[0][0], baseY);
  g.closePath();
  g.fillPath();
}

function drawCastleRidge(g, x, groundY, scale) {
  g.fillStyle(0x0d0d12, 0.94);
  for (let i = 0; i < 7; i += 1) {
    const bx = x + i * 70 * scale;
    const h = (96 + (i % 3) * 32) * scale;
    g.fillRect(bx, groundY - h, 46 * scale, h);
    g.fillTriangle(bx - 10 * scale, groundY - h, bx + 23 * scale, groundY - h - 48 * scale, bx + 56 * scale, groundY - h);
    g.fillStyle(THEME.colors.candle, 0.16);
    g.fillRect(bx + 16 * scale, groundY - h + 20 * scale + (i % 2) * 22 * scale, 7 * scale, 18 * scale);
    g.fillStyle(0x0d0d12, 0.94);
  }
}

function drawChurch(g, x, groundY, scale) {
  g.fillStyle(0x0d0d12, 0.96);
  g.fillRect(x, groundY - 226 * scale, 64 * scale, 226 * scale);
  g.fillTriangle(x - 25 * scale, groundY - 226 * scale, x + 32 * scale, groundY - 298 * scale, x + 88 * scale, groundY - 226 * scale);
  g.fillRect(x + 32 * scale, groundY - 320 * scale, 42 * scale, 106 * scale);
  g.fillTriangle(x + 12 * scale, groundY - 320 * scale, x + 53 * scale, groundY - 394 * scale, x + 94 * scale, groundY - 320 * scale);
  g.fillStyle(THEME.colors.candle, 0.14);
  g.fillRect(x + 22 * scale, groundY - 162 * scale, 8 * scale, 28 * scale);
  g.fillRect(x + 47 * scale, groundY - 276 * scale, 7 * scale, 22 * scale);
}

function drawPineCluster(g, x, y, scale = 1) {
  g.fillStyle(0x090b0e, 0.9);
  for (let i = 0; i < 4; i += 1) {
    const tx = x + i * 42 * scale;
    const h = (140 - i * 17) * scale;
    g.fillRect(tx - 9 * scale, y - h + 58 * scale, 18 * scale, h * 0.62);
    g.fillTriangle(tx - 60 * scale, y - h + 64 * scale, tx, y - h, tx + 60 * scale, y - h + 64 * scale);
    g.fillTriangle(tx - 72 * scale, y - h + 115 * scale, tx, y - h + 38 * scale, tx + 72 * scale, y - h + 115 * scale);
  }
}

function drawForegroundGround(g, y, options = {}) {
  g.fillStyle(0x170d0a, 1);
  g.fillRect(0, y, GAME_WIDTH, GAME_HEIGHT - y);
  g.fillStyle(options.road ? 0x3b241b : 0x362017, 0.88);
  g.fillRect(0, y, GAME_WIDTH, 64);
  for (let i = 0; i < 46; i += 1) {
    g.fillStyle(i % 2 ? 0x7a5832 : 0x2d1b14, 0.22);
    g.fillEllipse(45 + ((i * 83) % 1360), y + 44 + ((i * 31) % 190), 12 + (i % 8), 3 + (i % 4));
  }
}

function drawStoneRoad(g, stage) {
  const left = stage?.x ?? 82;
  const top = 598;
  const width = stage?.w ?? 1000;
  g.fillStyle(0x2b1a15, 0.92);
  g.fillRoundedRect(left, top, width, 52, 8);
  g.lineStyle(2, 0x5f4330, 0.35);
  for (let i = 0; i < 18; i += 1) {
    const x = left + 26 + i * 55;
    g.lineBetween(x, top + 8 + (i % 3) * 7, x + 36, top + 15 + ((i + 1) % 3) * 9);
  }
  for (let i = 0; i < 34; i += 1) {
    const x = left + ((i * 67) % width);
    const y = 620 + ((i * 23) % 160);
    g.fillStyle(i % 2 ? 0x6b4a31 : 0x463023, 0.28);
    g.fillEllipse(x, y, 7 + (i % 5), 3 + (i % 4));
  }
}

function drawStageLine(g, stage) {
  if (!stage) return;
  g.lineStyle(3, THEME.colors.darkGold, 0.34);
  g.lineBetween(stage.x + 70, stage.baseline, stage.x + stage.w - 70, stage.baseline);
  g.lineStyle(1, 0x000000, 0.4);
  g.lineBetween(stage.x + 70, stage.baseline + 4, stage.x + stage.w - 70, stage.baseline + 4);
}

function drawCampfire(g, x, y, scale) {
  g.fillStyle(0x0b0908, 0.85);
  g.fillEllipse(x + 3 * scale, y + 27 * scale, 320 * scale, 42 * scale);
  g.fillStyle(0x382013, 0.95);
  g.fillCircle(x, y - 13 * scale, 92 * scale);
  g.fillStyle(0x4f2a17, 0.95);
  g.fillTriangle(x - 47 * scale, y - 1 * scale, x + 1 * scale, y - 130 * scale, x + 55 * scale, y - 1 * scale);
  g.fillStyle(THEME.colors.candle, 0.96);
  g.fillTriangle(x - 28 * scale, y, x + 5 * scale, y - 92 * scale, x + 43 * scale, y);
  g.fillStyle(0xe5672d, 0.88);
  g.fillTriangle(x - 5 * scale, y + 1 * scale, x + 19 * scale, y - 63 * scale, x + 63 * scale, y + 1 * scale);
  for (let i = 0; i < 18; i += 1) {
    g.fillStyle(THEME.colors.candle, 0.18 + (i % 4) * 0.04);
    g.fillCircle(x - 70 + ((i * 29) % 150), y - 105 - ((i * 31) % 100), 2 + (i % 3));
  }
}

function drawCandles(g, x, y) {
  for (let i = 0; i < 4; i += 1) {
    const cx = x + i * 36;
    const cy = y + (i % 2) * 26;
    g.fillStyle(0xd8bd8a, 0.92);
    g.fillRoundedRect(cx, cy, 13, 64 - i * 5, 3);
    drawCandleFlame(g, cx + 6, cy - 3, 0.72);
  }
}

function drawWaxSeal(g, x, y, r) {
  g.fillStyle(0x7d2223, 0.92);
  g.fillCircle(x, y, r);
  g.fillStyle(0x4d1418, 0.45);
  g.fillCircle(x + 7, y + 5, r * 0.68);
  g.lineStyle(2, THEME.colors.candle, 0.45);
  g.strokeCircle(x, y, r * 0.72);
}

function drawVignette(g, width, height) {
  for (let i = 0; i < 8; i += 1) {
    const alpha = 0.035 + i * 0.018;
    g.fillStyle(0x030202, alpha);
    g.fillRect(i * 14, 0, 18, height);
    g.fillRect(width - 18 - i * 14, 0, 18, height);
    g.fillRect(0, i * 10, width, 13);
    g.fillRect(0, height - 13 - i * 10, width, 13);
  }
}
