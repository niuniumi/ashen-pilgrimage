import Phaser from 'phaser';
import { drawBadgeIcon } from '../art/IconFactory.js';
import { UI_ICON_ATLAS, resolveUIIconFrame } from '../art/UIIconAssetCatalog.js';
import { THEME } from '../game/Theme.js';

export class UIIcon extends Phaser.GameObjects.Container {
  constructor(scene, x, y, type, options = {}) {
    super(scene, x, y);
    this.type = type;
    this.size = options.size ?? 42;
    this.options = options;
    this.relicImage = null;
    const frame = resolveUIIconFrame(scene, type);
    this.asset = frame
      ? scene.add
        .image(0, 0, UI_ICON_ATLAS.key, frame)
        .setDisplaySize(this.size, this.size)
        .setAlpha(options.alpha ?? (options.muted ? 0.45 : 1))
      : null;
    this.g = scene.add.graphics();
    this.add([this.relicImage, this.asset, this.g].filter(Boolean));
    scene.add.existing(this);
    this.draw();
  }

  draw() {
    if (this.relicImage) return;
    if (this.asset) return;
    drawIcon(this.g, 0, 0, this.type, this.size, this.options);
  }
}

function iconAssetFor(type) {
  if (type === 'battle' || type === 'attack' || type === 'sword') return 'attackIcon';
  if (type === 'block' || type === 'shield') return 'attackIcon';
  if (type === 'elite' || type === 'boss') return 'skull';
  if (type === 'event') return 'scroll';
  if (type === 'shop' || type === 'coin') return 'coin';
  if (type === 'rest' || type === 'flame') return 'camp';
  if (type === 'chest') return 'chest';
  if (type === 'relic') return 'relic';
  if (type === 'pause') return 'pause';
  if (type === 'map') return 'map';
  if (type === 'settings') return 'settings';
  return 'relic';
}

export function drawIcon(g, x, y, type, size = 42, options = {}) {
  if (options.native !== true) {
    drawBadgeIcon(g, x, y, type, size, options);
    return;
  }
  const r = size / 2;
  const muted = options.muted ?? false;
  const alpha = options.alpha ?? (muted ? 0.45 : 1);
  const bg = options.bg ?? 0x17110f;
  g.fillStyle(bg, 0.86 * alpha);
  g.fillCircle(x, y, r);
  g.lineStyle(Math.max(2, size * 0.055), options.stroke ?? THEME.colors.darkGold, 0.86 * alpha);
  g.strokeCircle(x, y, r);
  g.lineStyle(Math.max(2, size * 0.075), options.color ?? THEME.colors.candle, 0.9 * alpha);

  if (type === 'battle' || type === 'attack' || type === 'sword') {
    g.lineBetween(x - r * 0.45, y + r * 0.45, x + r * 0.42, y - r * 0.42);
    g.lineStyle(Math.max(1, size * 0.035), 0xffffff, 0.6 * alpha);
    g.lineBetween(x - r * 0.2, y + r * 0.42, x + r * 0.5, y - r * 0.18);
  } else if (type === 'block' || type === 'shield') {
    g.fillStyle(THEME.colors.shield, 0.86 * alpha);
    g.fillTriangle(x, y - r * 0.6, x + r * 0.62, y - r * 0.14, x, y + r * 0.66);
    g.fillTriangle(x, y - r * 0.6, x - r * 0.62, y - r * 0.14, x, y + r * 0.66);
  } else if (type === 'elite') {
    g.strokeCircle(x, y - r * 0.1, r * 0.32);
    g.lineBetween(x - r * 0.42, y + r * 0.42, x + r * 0.42, y + r * 0.42);
    g.lineBetween(x, y - r * 0.52, x, y + r * 0.55);
  } else if (type === 'event') {
    g.strokeCircle(x, y - r * 0.18, r * 0.26);
    g.lineBetween(x, y + r * 0.1, x, y + r * 0.54);
  } else if (type === 'shop' || type === 'coin') {
    g.strokeRoundedRect(x - r * 0.52, y - r * 0.2, r * 1.04, r * 0.82, 4);
    g.lineBetween(x - r * 0.32, y - r * 0.2, x - r * 0.18, y - r * 0.52);
    g.lineBetween(x + r * 0.32, y - r * 0.2, x + r * 0.18, y - r * 0.52);
  } else if (type === 'rest' || type === 'flame') {
    g.fillStyle(THEME.colors.candle, 0.92 * alpha);
    g.fillTriangle(x - r * 0.46, y + r * 0.48, x, y - r * 0.62, x + r * 0.5, y + r * 0.48);
    g.fillStyle(0xe5672d, 0.9 * alpha);
    g.fillTriangle(x - r * 0.18, y + r * 0.42, x + r * 0.05, y - r * 0.24, x + r * 0.28, y + r * 0.42);
  } else if (type === 'chest') {
    g.strokeRoundedRect(x - r * 0.56, y - r * 0.34, r * 1.12, r * 0.82, 4);
    g.lineBetween(x - r * 0.56, y, x + r * 0.56, y);
    g.fillStyle(THEME.colors.darkGold, 0.85 * alpha);
    g.fillRect(x - r * 0.12, y, r * 0.24, r * 0.32);
  } else if (type === 'boss') {
    g.strokeCircle(x, y + r * 0.12, r * 0.36);
    g.lineBetween(x - r * 0.56, y - r * 0.34, x + r * 0.56, y - r * 0.34);
    g.lineBetween(x - r * 0.26, y - r * 0.6, x, y - r * 0.34);
    g.lineBetween(x + r * 0.26, y - r * 0.6, x, y - r * 0.34);
  } else if (type === 'relic') {
    g.strokeCircle(x, y, r * 0.45);
    g.lineBetween(x, y - r * 0.58, x, y + r * 0.58);
    g.lineBetween(x - r * 0.58, y, x + r * 0.58, y);
  } else if (type === 'pause') {
    g.lineStyle(Math.max(3, size * 0.1), options.color ?? THEME.colors.candle, 0.9 * alpha);
    g.lineBetween(x - r * 0.22, y - r * 0.42, x - r * 0.22, y + r * 0.42);
    g.lineBetween(x + r * 0.22, y - r * 0.42, x + r * 0.22, y + r * 0.42);
  } else {
    g.strokeCircle(x, y, r * 0.36);
    g.fillStyle(options.color ?? THEME.colors.candle, 0.85 * alpha);
    g.fillCircle(x, y, r * 0.12);
  }
}
