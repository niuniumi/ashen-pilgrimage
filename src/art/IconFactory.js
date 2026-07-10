import { THEME } from '../game/Theme.js';
import { drawCandleFlame } from './PixelSpriteFactory.js';

export function drawBadgeIcon(g, x, y, kind, size = 36, options = {}) {
  const r = size / 2;
  g.fillStyle(options.bg ?? 0x17100e, options.alpha ?? 0.94);
  g.fillCircle(x, y, r);
  g.lineStyle(2, options.stroke ?? THEME.colors.darkGold, 0.82);
  g.strokeCircle(x, y, r);
  g.lineStyle(1, 0x000000, 0.45);
  g.strokeCircle(x, y, r - 5);

  if (kind === 'battle' || kind === 'attack') drawSword(g, x, y, r);
  else if (kind === 'elite') drawElite(g, x, y, r);
  else if (kind === 'boss') drawBossMark(g, x, y, r);
  else if (kind === 'shop') drawCoin(g, x, y, r);
  else if (kind === 'event') drawScroll(g, x, y, r);
  else if (kind === 'rest') drawCandleFlame(g, x, y + r * 0.08, r / 18);
  else if (kind === 'chest') drawChest(g, x, y, r);
  else if (kind === 'shield' || kind === 'defense') drawShield(g, x, y, r);
  else if (kind === 'poison') drawVial(g, x, y, r);
  else drawRelic(g, x, y, r);
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
