import Phaser from 'phaser';
import { COLORS } from '../game/constants.js';
import { addUiAsset, choosePanelFrame, HANDPAINTED_KEYS, hasTexture } from '../art/HandPaintedAssets.js';

export class UIPanel extends Phaser.GameObjects.Container {
  constructor(scene, x, y, width, height, options = {}) {
    super(scene, x, y);
    this.widthValue = width;
    this.heightValue = height;
    this.options = options;
    this.asset = hasTexture(scene, HANDPAINTED_KEYS.ui)
      ? addUiAsset(scene, choosePanelFrame(width, height), 0, 0, {
          displayWidth: width,
          displayHeight: height,
          alpha: options.alpha ?? 0.94
        })
      : null;
    this.bg = scene.add.graphics();
    this.add([this.asset, this.bg].filter(Boolean));
    scene.add.existing(this);
    this.draw();
  }

  draw() {
    const w = this.widthValue;
    const h = this.heightValue;
    const fill = this.options.fill ?? COLORS.deep;
    const alpha = this.options.alpha ?? 0.9;
    const radius = this.options.radius ?? 7;
    this.bg.clear();
    if (this.asset) {
      this.asset.setDisplaySize(w, h);
      this.asset.setAlpha(alpha);
      this.drawGildedOverlay(w, h, this.options.stroke ?? COLORS.gold, this.options.strokeAlpha ?? 0.55);
      return;
    }
    this.bg.fillStyle(0x050403, Math.min(0.36, alpha * 0.4));
    this.bg.fillRoundedRect(-w / 2 - 4, -h / 2 + 5, w + 8, h + 4, radius + 2);
    this.bg.fillStyle(fill, alpha);
    this.bg.fillRoundedRect(-w / 2, -h / 2, w, h, radius);
    this.bg.fillStyle(0xffffff, 0.035);
    this.bg.fillRoundedRect(-w / 2 + 8, -h / 2 + 7, w - 16, Math.min(34, h * 0.24), Math.max(3, radius - 2));
    for (let i = 0; i < 22; i += 1) {
      this.bg.fillStyle(i % 2 ? 0xb88935 : 0x000000, i % 2 ? 0.035 : 0.045);
      this.bg.fillRect(-w / 2 + 18 + ((i * 41) % Math.max(20, w - 36)), -h / 2 + 18 + ((i * 59) % Math.max(20, h - 36)), 2 + (i % 3), 1 + (i % 2));
    }
    this.bg.lineStyle(this.options.lineWidth ?? 2, this.options.stroke ?? COLORS.gold, this.options.strokeAlpha ?? 0.72);
    this.bg.strokeRoundedRect(-w / 2, -h / 2, w, h, radius);
    this.bg.lineStyle(1, 0x000000, 0.42);
    this.bg.strokeRoundedRect(-w / 2 + 7, -h / 2 + 7, w - 14, h - 14, Math.max(3, radius - 3));
    this.bg.lineStyle(1, 0xf2c86d, 0.16);
    this.bg.strokeRoundedRect(-w / 2 + 13, -h / 2 + 13, w - 26, h - 26, Math.max(3, radius - 4));
    const corner = 18;
    this.bg.lineStyle(2, this.options.stroke ?? COLORS.gold, (this.options.strokeAlpha ?? 0.72) * 0.7);
    this.bg.lineBetween(-w / 2 + 10, -h / 2 + corner, -w / 2 + 10, -h / 2 + 10);
    this.bg.lineBetween(-w / 2 + 10, -h / 2 + 10, -w / 2 + corner, -h / 2 + 10);
    this.bg.lineBetween(w / 2 - 10, -h / 2 + corner, w / 2 - 10, -h / 2 + 10);
    this.bg.lineBetween(w / 2 - 10, -h / 2 + 10, w / 2 - corner, -h / 2 + 10);
    this.bg.lineBetween(-w / 2 + 10, h / 2 - corner, -w / 2 + 10, h / 2 - 10);
    this.bg.lineBetween(-w / 2 + 10, h / 2 - 10, -w / 2 + corner, h / 2 - 10);
    this.bg.lineBetween(w / 2 - 10, h / 2 - corner, w / 2 - 10, h / 2 - 10);
    this.bg.lineBetween(w / 2 - 10, h / 2 - 10, w / 2 - corner, h / 2 - 10);
    this.drawGildedOverlay(w, h, this.options.stroke ?? COLORS.gold, this.options.strokeAlpha ?? 0.55);
  }

  drawGildedOverlay(w, h, color, alpha = 0.55) {
    const x = w / 2;
    const y = h / 2;
    this.bg.lineStyle(1, 0xf2c86d, alpha * 0.28);
    this.bg.lineBetween(-x + 28, -y + 10, x - 28, -y + 10);
    this.bg.lineBetween(-x + 28, y - 10, x - 28, y - 10);
    this.bg.lineStyle(2, color, alpha * 0.5);
    [
      [-x + 14, -y + 14, 1, 1],
      [x - 14, -y + 14, -1, 1],
      [-x + 14, y - 14, 1, -1],
      [x - 14, y - 14, -1, -1]
    ].forEach(([cx, cy, sx, sy]) => {
      this.bg.lineBetween(cx, cy, cx + sx * 22, cy);
      this.bg.lineBetween(cx, cy, cx, cy + sy * 22);
      this.bg.fillStyle(0xf4d89c, alpha * 0.34);
      this.bg.fillCircle(cx, cy, 2.5);
    });
  }
}
