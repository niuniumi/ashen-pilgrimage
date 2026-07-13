import { THEME } from '../game/Theme.js';
import { drawCandleFlame } from './PixelSpriteFactory.js';
import { PIXEL_PALETTE, snapPixel } from './PixelArtSystem.js';

export function drawBadgeIcon(g, x, y, kind, size = 36, options = {}) {
  const s = Math.max(4, snapPixel(size));
  const left = snapPixel(x - s / 2);
  const top = snapPixel(y - s / 2);
  const alpha = options.alpha ?? 1;
  g.fillStyle(options.stroke ?? PIXEL_PALETTE.goldDark, alpha);
  g.fillRect(left, top, s, s);
  g.fillStyle(options.bg ?? PIXEL_PALETTE.black, alpha);
  g.fillRect(left + 4, top + 4, s - 8, s - 8);
  const color = options.color ?? PIXEL_PALETTE.candle;
  g.fillStyle(color, alpha);
  const cx = snapPixel(x);
  const cy = snapPixel(y);
  if (kind === 'battle' || kind === 'attack' || kind === 'sword') {
    for (let i = -12; i <= 12; i += 4) g.fillRect(cx + i, cy - i - 4, 4, 8);
    g.fillRect(cx - 12, cy + 8, 20, 4);
  } else if (kind === 'shield' || kind === 'defense' || kind === 'block') {
    g.fillRect(cx - 12, cy - 12, 24, 8);
    g.fillRect(cx - 12, cy - 4, 24, 12);
    g.fillRect(cx - 8, cy + 8, 16, 8);
    g.fillRect(cx - 4, cy + 16, 8, 4);
  } else if (kind === 'rest' || kind === 'flame') {
    g.fillStyle(PIXEL_PALETTE.ember, alpha);
    g.fillRect(cx - 8, cy, 16, 12);
    g.fillStyle(PIXEL_PALETTE.candle, alpha);
    g.fillRect(cx - 4, cy - 12, 8, 16);
  } else if (kind === 'shop' || kind === 'coin') {
    g.fillRect(cx - 12, cy - 12, 24, 24);
    g.fillStyle(PIXEL_PALETTE.goldDark, alpha);
    g.fillRect(cx - 4, cy - 8, 8, 16);
  } else if (kind === 'moon') {
    g.fillRect(cx - 8, cy - 16, 12, 4);
    g.fillRect(cx - 12, cy - 12, 16, 4);
    g.fillRect(cx - 16, cy - 8, 16, 16);
    g.fillRect(cx - 12, cy + 8, 16, 4);
    g.fillRect(cx - 8, cy + 12, 12, 4);
    g.fillStyle(options.bg ?? PIXEL_PALETTE.black, alpha);
    g.fillRect(cx - 4, cy - 12, 12, 20);
    g.fillRect(cx, cy + 8, 8, 4);
  } else if (kind === 'heart') {
    g.fillStyle(PIXEL_PALETTE.blood, alpha);
    g.fillRect(cx - 12, cy - 8, 8, 8);
    g.fillRect(cx + 4, cy - 8, 8, 8);
    g.fillRect(cx - 16, cy, 32, 8);
    g.fillRect(cx - 12, cy + 8, 24, 8);
    g.fillRect(cx - 8, cy + 16, 16, 4);
  } else if (kind === 'event') {
    g.fillRect(cx - 12, cy - 12, 24, 24);
    g.fillStyle(PIXEL_PALETTE.paperDark, alpha);
    g.fillRect(cx - 8, cy - 4, 16, 4);
    g.fillRect(cx - 8, cy + 4, 12, 4);
  } else if (kind === 'chest') {
    g.fillStyle(PIXEL_PALETTE.paperDark, alpha);
    g.fillRect(cx - 14, cy - 8, 28, 24);
    g.fillStyle(PIXEL_PALETTE.gold, alpha);
    g.fillRect(cx - 14, cy, 28, 4);
    g.fillRect(cx - 2, cy, 4, 12);
  } else if (kind === 'boss' || kind === 'elite') {
    g.fillStyle(PIXEL_PALETTE.blood, alpha);
    g.fillRect(cx - 12, cy - 4, 24, 16);
    g.fillRect(cx - 8, cy - 12, 4, 8);
    g.fillRect(cx + 4, cy - 12, 4, 8);
    g.fillStyle(PIXEL_PALETTE.void, alpha);
    g.fillRect(cx - 6, cy, 4, 4);
    g.fillRect(cx + 2, cy, 4, 4);
  } else {
    g.fillRect(cx - 12, cy - 4, 24, 8);
    g.fillRect(cx - 4, cy - 12, 8, 24);
    g.fillStyle(PIXEL_PALETTE.violet, alpha);
    g.fillRect(cx - 4, cy - 4, 8, 8);
  }
}

export function createBadgeIcon(scene, x, y, kind, size = 36, options = {}) {
  const container = scene.add.container(x, y);
  const g = scene.add.graphics();
  drawBadgeIcon(g, 0, 0, kind, size, options);
  container.add(g);
  return container;
}

function drawSword(g, x, y, r) {
  g.lineStyle(Math.max(3, r * 0.18), 0xe8d6b0, 0.95);
  g.lineBetween(x - r * 0.36, y + r * 0.38, x + r * 0.34, y - r * 0.4);
  g.lineStyle(2, 0xfff2cf, 0.72);
  g.lineBetween(x - r * 0.18, y + r * 0.28, x + r * 0.42, y - r * 0.34);
  g.lineStyle(3, THEME.colors.darkGold, 0.85);
  g.lineBetween(x - r * 0.44, y + r * 0.18, x - r * 0.08, y + r * 0.52);
}

function drawShield(g, x, y, r) {
  g.fillStyle(THEME.colors.shield, 0.96);
  g.fillTriangle(x, y - r * 0.55, x + r * 0.48, y - r * 0.16, x, y + r * 0.62);
  g.fillTriangle(x, y - r * 0.55, x - r * 0.48, y - r * 0.16, x, y + r * 0.62);
  g.lineStyle(2, 0xe8d6b0, 0.7);
  g.lineBetween(x, y - r * 0.44, x, y + r * 0.44);
}

function drawElite(g, x, y, r) {
  g.fillStyle(THEME.colors.blood, 0.9);
  g.fillTriangle(x, y - r * 0.62, x + r * 0.5, y + r * 0.36, x - r * 0.5, y + r * 0.36);
  g.lineStyle(2, THEME.colors.candle, 0.78);
  g.strokeTriangle(x, y - r * 0.62, x + r * 0.5, y + r * 0.36, x - r * 0.5, y + r * 0.36);
}

function drawBossMark(g, x, y, r) {
  g.fillStyle(0x090609, 1);
  g.fillCircle(x, y - r * 0.08, r * 0.38);
  g.fillStyle(THEME.colors.arcane, 0.45);
  g.fillCircle(x, y - r * 0.08, r * 0.55);
  g.lineStyle(3, THEME.colors.blood, 0.85);
  g.lineBetween(x - r * 0.55, y + r * 0.46, x + r * 0.55, y + r * 0.46);
}

function drawCoin(g, x, y, r) {
  g.fillStyle(THEME.colors.candle, 0.94);
  g.fillCircle(x, y, r * 0.48);
  g.lineStyle(2, 0x8a6133, 0.86);
  g.strokeCircle(x, y, r * 0.48);
  g.fillStyle(0x8a6133, 0.75);
  g.fillRect(x - r * 0.08, y - r * 0.28, r * 0.16, r * 0.56);
}

function drawScroll(g, x, y, r) {
  g.fillStyle(THEME.colors.parchment, 0.96);
  g.fillRoundedRect(x - r * 0.45, y - r * 0.36, r * 0.9, r * 0.72, r * 0.14);
  g.lineStyle(2, 0x8a6133, 0.65);
  g.lineBetween(x - r * 0.28, y - r * 0.12, x + r * 0.25, y - r * 0.12);
  g.lineBetween(x - r * 0.24, y + r * 0.1, x + r * 0.28, y + r * 0.1);
}

function drawChest(g, x, y, r) {
  g.fillStyle(0x5a351f, 0.96);
  g.fillRoundedRect(x - r * 0.48, y - r * 0.1, r * 0.96, r * 0.54, r * 0.08);
  g.fillStyle(0x8a6133, 0.95);
  g.fillRoundedRect(x - r * 0.44, y - r * 0.42, r * 0.88, r * 0.42, r * 0.18);
  g.lineStyle(2, THEME.colors.darkGold, 0.78);
  g.lineBetween(x, y - r * 0.38, x, y + r * 0.42);
}

function drawVial(g, x, y, r) {
  g.fillStyle(0x111713, 0.98);
  g.fillRoundedRect(x - r * 0.26, y - r * 0.46, r * 0.52, r * 0.82, r * 0.12);
  g.fillStyle(THEME.colors.poison, 0.88);
  g.fillRoundedRect(x - r * 0.2, y - r * 0.04, r * 0.4, r * 0.33, r * 0.08);
  g.lineStyle(2, 0xd8bd8a, 0.55);
  g.strokeRoundedRect(x - r * 0.26, y - r * 0.46, r * 0.52, r * 0.82, r * 0.12);
}

function drawRelic(g, x, y, r) {
  g.fillStyle(THEME.colors.arcane, 0.75);
  g.fillCircle(x, y, r * 0.35);
  g.lineStyle(2, THEME.colors.candle, 0.74);
  g.strokeCircle(x, y, r * 0.52);
  g.lineBetween(x - r * 0.52, y, x + r * 0.52, y);
  g.lineBetween(x, y - r * 0.52, x, y + r * 0.52);
}
