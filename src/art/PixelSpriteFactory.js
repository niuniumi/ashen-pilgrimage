import Phaser from 'phaser';
import { THEME } from '../game/Theme.js';

export const ART_DEPTH = {
  background: 0,
  scenery: 2,
  actors: 30,
  ui: 100
};

export function createArtContainer(scene, x = 0, y = 0, options = {}) {
  const container = scene.add.container(x, y);
  if (Number.isFinite(options.depth)) container.setDepth(options.depth);
  return container;
}

export function addShadow(scene, container, y = 116, width = 150, height = 24, alpha = 0.34) {
  const g = scene.add.graphics();
  g.fillStyle(0x000000, alpha);
  g.fillEllipse(0, y, width, height);
  g.fillStyle(0x2b170d, alpha * 0.38);
  g.fillEllipse(-width * 0.08, y - 2, width * 0.58, height * 0.45);
  container.add(g);
  return g;
}

export function addIdleTween(scene, target, options = {}) {
  if (options.idle === false) return null;
  const y = target.y;
  return scene.tweens.add({
    targets: target,
    y: y - (options.amount ?? 5),
    angle: options.angle ?? 0,
    yoyo: true,
    repeat: -1,
    duration: options.duration ?? 1350,
    ease: 'Sine.InOut'
  });
}

export function addSwayTween(scene, target, options = {}) {
  if (options.idle === false) return null;
  return scene.tweens.add({
    targets: target,
    angle: options.angle ?? 1.8,
    x: target.x + (options.x ?? 0),
    yoyo: true,
    repeat: -1,
    duration: options.duration ?? 1150,
    ease: 'Sine.InOut'
  });
}

export function drawPixelGrain(g, left, top, width, height, colors = [0xffffff, 0x000000], options = {}) {
  const count = Math.max(0, Math.round((options.count ?? 42) * (options.density ?? 0.38)));
  const alpha = (options.alpha ?? 0.08) * (options.alphaScale ?? 0.42);
  const seed = options.seed ?? 19;
  for (let i = 0; i < count; i += 1) {
    const x = left + ((i * 37 + seed * 11) % Math.max(1, width));
    const y = top + ((i * 53 + seed * 7) % Math.max(1, height));
    const w = 1 + ((i + seed) % 2);
    const h = 1 + ((i * 3 + seed) % 2);
    g.fillStyle(colors[i % colors.length], alpha * (0.56 + (i % 3) * 0.14));
    g.fillRect(x, y, w, h);
  }
}

export function drawDoubleFrame(g, left, top, width, height, options = {}) {
  const radius = options.radius ?? 8;
  const fill = options.fill ?? THEME.colors.panel;
  const alpha = options.alpha ?? 0.92;
  const stroke = options.stroke ?? THEME.colors.darkGold;
  g.fillStyle(0x050302, 0.42);
  g.fillRoundedRect(left - 5, top + 6, width + 10, height + 2, radius + 2);
  g.fillStyle(fill, alpha);
  g.fillRoundedRect(left, top, width, height, radius);
  g.fillStyle(0xffffff, options.highlightAlpha ?? 0.035);
  g.fillRoundedRect(left + 8, top + 7, width - 16, Math.min(38, height * 0.24), Math.max(4, radius - 3));
  g.lineStyle(options.outerWidth ?? 2, stroke, options.strokeAlpha ?? 0.78);
  g.strokeRoundedRect(left, top, width, height, radius);
  g.lineStyle(1, 0x000000, 0.48);
  g.strokeRoundedRect(left + 7, top + 7, width - 14, height - 14, Math.max(3, radius - 3));
  if (options.corners !== false) drawCornerBrackets(g, left, top, width, height, stroke, options.strokeAlpha ?? 0.78);
}

export function drawCornerBrackets(g, left, top, width, height, color = THEME.colors.darkGold, alpha = 0.72) {
  const l = 22;
  g.lineStyle(2, color, alpha);
  g.lineBetween(left + 9, top + 23, left + 9, top + 9);
  g.lineBetween(left + 9, top + 9, left + 23, top + 9);
  g.lineBetween(left + width - 9, top + 23, left + width - 9, top + 9);
  g.lineBetween(left + width - 9, top + 9, left + width - 23, top + 9);
  g.lineBetween(left + 9, top + height - 23, left + 9, top + height - 9);
  g.lineBetween(left + 9, top + height - 9, left + 23, top + height - 9);
  g.lineBetween(left + width - 9, top + height - 23, left + width - 9, top + height - 9);
  g.lineBetween(left + width - 9, top + height - 9, left + width - l, top + height - 9);
}

export function drawCandleGlow(g, x, y, radius = 56, alpha = 0.16) {
  g.fillStyle(THEME.colors.candle, alpha * 0.44);
  g.fillCircle(x, y, radius);
  g.fillStyle(0xf7d781, alpha * 0.62);
  g.fillCircle(x, y, radius * 0.56);
  g.fillStyle(0xfff1b6, alpha * 0.74);
  g.fillCircle(x, y, radius * 0.23);
}

export function drawCandleFlame(g, x, y, scale = 1, alpha = 1) {
  g.fillStyle(0xffe59a, 0.95 * alpha);
  g.fillTriangle(x - 9 * scale, y + 10 * scale, x, y - 24 * scale, x + 10 * scale, y + 10 * scale);
  g.fillStyle(0xe5672d, 0.85 * alpha);
  g.fillTriangle(x - 5 * scale, y + 8 * scale, x + 2 * scale, y - 13 * scale, x + 12 * scale, y + 8 * scale);
  g.fillStyle(0xffffff, 0.5 * alpha);
  g.fillTriangle(x - 3 * scale, y + 4 * scale, x + 1 * scale, y - 8 * scale, x + 5 * scale, y + 4 * scale);
}

export function drawSlashMarks(g, x, y, scale = 1, color = 0xe7d08f) {
  g.lineStyle(4 * scale, color, 0.92);
  g.lineBetween(x - 32 * scale, y + 20 * scale, x + 42 * scale, y - 26 * scale);
  g.lineStyle(2 * scale, 0xfff1c7, 0.72);
  g.lineBetween(x - 18 * scale, y + 24 * scale, x + 48 * scale, y - 2 * scale);
}

export function drawTatteredEdge(g, points, color, alpha = 1) {
  g.fillStyle(color, alpha);
  g.beginPath();
  g.moveTo(points[0][0], points[0][1]);
  points.slice(1).forEach(([x, y]) => g.lineTo(x, y));
  g.closePath();
  g.fillPath();
}

export function drawActorOutline(g, color = 0x070604, alpha = 0.72, scale = 1) {
  g.lineStyle(3 * scale, color, alpha);
}

export function drawSmallBottles(g, x, y, scale = 1, colors = [THEME.colors.poison, THEME.colors.arcane, THEME.colors.candle]) {
  colors.forEach((color, index) => {
    const bx = x + index * 17 * scale;
    g.fillStyle(0x17120f, 0.95);
    g.fillRoundedRect(bx - 6 * scale, y - 5 * scale, 12 * scale, 23 * scale, 3 * scale);
    g.fillStyle(color, 0.86);
    g.fillRoundedRect(bx - 4 * scale, y + 1 * scale, 8 * scale, 14 * scale, 2 * scale);
    g.lineStyle(1 * scale, 0xd4c27d, 0.58);
    g.strokeRoundedRect(bx - 6 * scale, y - 5 * scale, 12 * scale, 23 * scale, 3 * scale);
  });
}

export function drawMedievalSky(g, width, height, options = {}) {
  g.fillGradientStyle(options.top ?? 0x120d18, options.top2 ?? 0x1b1424, options.bottom ?? 0x4b2b22, options.bottom2 ?? 0x241610, 1);
  g.fillRect(0, 0, width, height);
  g.fillStyle(0xf2c86d, 0.08);
  g.fillEllipse(width * 0.38, height * 0.44, width * 0.58, height * 0.18);
}
