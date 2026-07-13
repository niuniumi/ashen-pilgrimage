import Phaser from 'phaser';
import { COLORS } from '../game/constants.js';
import { drawPixelPanel } from '../art/PixelArtSystem.js';

export class UIPanel extends Phaser.GameObjects.Container {
  constructor(scene, x, y, width, height, options = {}) {
    super(scene, x, y);
    this.widthValue = width;
    this.heightValue = height;
    this.options = options;
    this.asset = null;
    this.bg = scene.add.graphics();
    this.add([this.asset, this.bg].filter(Boolean));
    scene.add.existing(this);
    this.draw();
  }

  draw() {
    const w = this.widthValue;
    const h = this.heightValue;
    const fill = this.options.pixelFill ?? this.options.fill ?? 0x1b1d24;
    const alpha = this.options.alpha ?? 0.9;
    this.bg.clear();
    drawPixelPanel(this.bg, 0, 0, w, h, {
      fill,
      inner: this.options.inner ?? 0x11131a,
      stroke: this.options.stroke ?? COLORS.gold,
      strokeAlpha: this.options.strokeAlpha ?? 0.82,
      alpha,
      seed: Math.round(w * 0.5 + h)
    });
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
