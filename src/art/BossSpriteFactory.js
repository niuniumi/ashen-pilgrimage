import { THEME } from '../game/Theme.js';
import { addIdleTween, addShadow, createArtContainer, drawCandleGlow, drawPixelGrain } from './PixelSpriteFactory.js';
import { FINAL_ART } from './FinalArtAssets.js';

export function drawBossSprite(scene, bossId = 'headless-grave-knight', x = 0, y = 0, scale = 1, options = {}) {
  const svgArt = drawBossSvg(scene, bossId, x, y, scale, options);
  if (svgArt) return svgArt;

  const container = createArtContainer(scene, x, y, options);
  addShadow(scene, container, 150 * scale, 264 * scale, 34 * scale, 0.42);
  const g = scene.add.graphics();
  container.add(g);
  drawHeadlessGraveKnight(g, scale, options.phase ?? 1);
  if (options.idle !== false) addIdleTween(scene, container, { amount: 4 * scale, duration: 1700 });
  return container;
}

function drawBossSvg(scene, bossId, x, y, scale, options = {}) {
  if (options.preferSvg !== true) return null;
  const asset = FINAL_ART.bosses[bossId];
  if (!asset || !scene.textures.exists(asset.key)) return null;
  const container = createArtContainer(scene, x, y, options);
  const displayHeight = (options.displayHeight ?? 350) * scale;
  const displayWidth = displayHeight * (asset.width / asset.height);
  const bottomY = (options.imageYOffset ?? 150) * scale;
  addShadow(scene, container, bottomY + 2 * scale, Math.min(displayWidth * 0.78, 270 * scale), 32 * scale, 0.42);
  const image = scene.add.image(0, bottomY, asset.key).setOrigin(0.5, 1);
  image.setDisplaySize(displayWidth, displayHeight);
  image.setName(`${bossId}-svg`);
  if ((options.phase ?? 1) >= 3) image.setTint(0xffd0ca);
  container.add(image);
  if (options.idle !== false) addIdleTween(scene, container, { amount: 4 * scale, duration: 1700 });
  return container;
}

function drawHeadlessGraveKnight(g, s, phase) {
  const phase2 = phase >= 2;
  const phase3 = phase >= 3;
  drawCandleGlow(g, 0, -119 * s, (phase3 ? 80 : phase2 ? 65 : 50) * s, phase3 ? 0.24 : 0.17);
  g.fillStyle(phase3 ? 0x431117 : 0x09070a, phase3 ? 0.34 : 0.26);
  g.fillCircle(0, -36 * s, 126 * s);

  g.fillStyle(0x15191d, 1);
  g.fillRoundedRect(-67 * s, -86 * s, 134 * s, 168 * s, 12 * s);
  g.fillStyle(0x252c31, 1);
  g.fillRoundedRect(-51 * s, -74 * s, 102 * s, 143 * s, 9 * s);
  g.fillStyle(0x0d1012, 1);
  g.fillRect(-89 * s, -52 * s, 30 * s, 148 * s);
  g.fillRect(60 * s, -51 * s, 31 * s, 149 * s);
  g.fillStyle(0x111416, 1);
  g.fillRect(-43 * s, 72 * s, 32 * s, 82 * s);
  g.fillRect(14 * s, 72 * s, 34 * s, 84 * s);
  g.fillStyle(0x09090a, 1);
  g.fillRect(-48 * s, 144 * s, 43 * s, 13 * s);
  g.fillRect(9 * s, 145 * s, 47 * s, 13 * s);

  g.fillStyle(0x6b2535, 0.94);
  g.fillTriangle(-76 * s, -69 * s, -166 * s, 132 * s, -42 * s, 119 * s);
  g.fillStyle(0x2b1118, 0.86);
  g.fillTriangle(-69 * s, -54 * s, -123 * s, 126 * s, -35 * s, 89 * s);
  g.lineStyle(3 * s, THEME.colors.darkGold, 0.78);
  g.lineBetween(-54 * s, -64 * s, 55 * s, -64 * s);
  g.lineBetween(-44 * s, -24 * s, 45 * s, -24 * s);
  g.lineBetween(-38 * s, 25 * s, 38 * s, 25 * s);

  g.fillStyle(0x84919b, 0.55);
  g.fillRect(-48 * s, -57 * s, 36 * s, 12 * s);
  g.fillRect(11 * s, -55 * s, 38 * s, 12 * s);
  g.fillStyle(THEME.colors.bone, 0.7);
  g.fillTriangle(-14 * s, -13 * s, 0, 12 * s, 14 * s, -13 * s);
  g.fillStyle(phase3 ? THEME.colors.blood : 0xd9d0b0, phase3 ? 0.84 : 0.72);
  g.lineStyle(4 * s, phase3 ? THEME.colors.blood : 0xd9d0b0, phase3 ? 0.9 : 0.64);
  g.lineBetween(-18 * s, 2 * s, 18 * s, 2 * s);
  g.lineBetween(0, -17 * s, 0, 24 * s);

  g.fillStyle(0x070604, 1);
  g.fillCircle(0, -116 * s, 25 * s);
  g.fillStyle(phase3 ? THEME.colors.blood : phase2 ? THEME.colors.arcane : 0x6e4cb0, phase3 ? 0.42 : 0.32);
  g.fillCircle(0, -116 * s, 44 * s);
  g.lineStyle(5 * s, phase3 ? THEME.colors.blood : THEME.colors.arcane, phase3 ? 0.88 : 0.72);
  g.strokeCircle(0, -116 * s, 31 * s);
  g.fillStyle(0xffffff, 0.2);
  g.fillCircle(-8 * s, -129 * s, 7 * s);

  g.lineStyle(10 * s, 0x1b1f24, 1);
  g.lineBetween(83 * s, -91 * s, -111 * s, 145 * s);
  g.lineStyle(6 * s, 0xb88935, 0.92);
  g.lineBetween(84 * s, -90 * s, -109 * s, 143 * s);
  g.lineStyle(2 * s, 0xfff0b5, 0.62);
  g.lineBetween(92 * s, -86 * s, -99 * s, 141 * s);
  g.fillStyle(0x2e1d15, 0.95);
  g.fillRoundedRect(57 * s, -72 * s, 55 * s, 13 * s, 4 * s);
  g.fillStyle(0xd8bd8a, 0.92);
  g.fillTriangle(-117 * s, 150 * s, -96 * s, 142 * s, -108 * s, 167 * s);

  if (phase2) {
    g.lineStyle(3 * s, THEME.colors.arcane, 0.68);
    g.lineBetween(-78 * s, -92 * s, -103 * s, -31 * s);
    g.lineBetween(73 * s, -98 * s, 105 * s, -26 * s);
    g.lineBetween(-21 * s, -116 * s, -48 * s, -157 * s);
    g.lineBetween(21 * s, -115 * s, 45 * s, -153 * s);
  }
  if (phase3) {
    g.lineStyle(5 * s, THEME.colors.blood, 0.72);
    g.lineBetween(-52 * s, -50 * s, -11 * s, 58 * s);
    g.lineBetween(47 * s, -53 * s, 8 * s, 67 * s);
    g.lineBetween(-35 * s, 84 * s, -63 * s, 146 * s);
    g.lineBetween(41 * s, 76 * s, 76 * s, 143 * s);
  }
  drawPixelGrain(g, -84 * s, -84 * s, 168 * s, 232 * s, [0xb88935, 0x384145, phase3 ? 0x9e302b : 0x6e4cb0], { count: 50, alpha: 0.08, seed: phase * 11 });
}
