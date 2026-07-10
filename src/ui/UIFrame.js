import Phaser from 'phaser';
import { THEME } from '../game/Theme.js';
import { addUiAsset, choosePanelFrame, HANDPAINTED_KEYS, hasTexture } from '../art/HandPaintedAssets.js';

export class UIFrame extends Phaser.GameObjects.Container {
  constructor(scene, x, y, width, height, options = {}) {
    super(scene, x, y);
    this.widthValue = width;
    this.heightValue = height;
    this.options = options;
    this.asset = hasTexture(scene, HANDPAINTED_KEYS.ui)
      ? addUiAsset(scene, choosePanelFrame(width, height), 0, 0, {
          displayWidth: width,
          displayHeight: height,
          alpha: options.alpha ?? 0.98
        })
      : null;
    this.g = scene.add.graphics();
    this.add([this.asset, this.g].filter(Boolean));
    scene.add.existing(this);
    this.draw();
  }

  draw() {
    const w = this.widthValue;
    const h = this.heightValue;
    const o = this.options;
    const radius = o.radius ?? 8;
    const fill = o.fill ?? THEME.colors.panel;
    const alpha = o.alpha ?? 0.9;
    const stroke = o.stroke ?? THEME.colors.darkGold;
    this.g.clear();
    if (this.asset) {
      this.asset.setAlpha(alpha);
      this.asset.setDisplaySize(w, h);
      if (o.parchment) this.drawParchmentTexture(w, h);
      this.drawGildedEdges(w, h, o.stroke ?? THEME.colors.darkGold, o.cornerAlpha ?? 0.5);
      return;
    }
    this.g.fillStyle(0x030202, 0.38);
    this.g.fillRoundedRect(-w / 2 - 5, -h / 2 + 6, w + 10, h + 5, radius + 2);
    this.g.fillStyle(fill, alpha);
    this.g.fillRoundedRect(-w / 2, -h / 2, w, h, radius);
    this.g.fillStyle(0xffffff, 0.04);
    this.g.fillRoundedRect(-w / 2 + 8, -h / 2 + 8, w - 16, Math.min(38, h * 0.22), Math.max(3, radius - 2));
    this.g.lineStyle(o.lineWidth ?? 2, stroke, o.strokeAlpha ?? 0.8);
    this.g.strokeRoundedRect(-w / 2, -h / 2, w, h, radius);
    this.g.lineStyle(1, 0x000000, 0.5);
    this.g.strokeRoundedRect(-w / 2 + 7, -h / 2 + 7, w - 14, h - 14, Math.max(3, radius - 3));
    this.drawCorners(w, h, stroke, o.cornerAlpha ?? 0.72);
    this.drawGildedEdges(w, h, stroke, o.cornerAlpha ?? 0.5);
    if (o.parchment) this.drawParchmentTexture(w, h);
  }

  drawGildedEdges(w, h, color, alpha = 0.5) {
    const inset = 13;
    this.g.lineStyle(1, 0xf1c76a, alpha * 0.48);
    this.g.lineBetween(-w / 2 + 34, -h / 2 + inset, w / 2 - 34, -h / 2 + inset);
    this.g.lineBetween(-w / 2 + 34, h / 2 - inset, w / 2 - 34, h / 2 - inset);
    this.g.lineStyle(2, color, alpha * 0.62);
    [
      [-w / 2 + 18, -h / 2 + 18, 1, 1],
      [w / 2 - 18, -h / 2 + 18, -1, 1],
      [-w / 2 + 18, h / 2 - 18, 1, -1],
      [w / 2 - 18, h / 2 - 18, -1, -1]
    ].forEach(([x, y, sx, sy]) => {
      this.g.lineBetween(x, y, x + sx * 30, y + sy * 3);
      this.g.lineBetween(x, y, x + sx * 4, y + sy * 30);
      this.g.fillStyle(0xf4d89c, alpha * 0.38);
      this.g.fillCircle(x, y, 3);
    });
  }

  drawCorners(w, h, color, alpha) {
    const x = w / 2 - 18;
    const y = h / 2 - 18;
    this.g.lineStyle(2, color, alpha);
    [
      [-x, -y, 1, 1],
      [x, -y, -1, 1],
      [-x, y, 1, -1],
      [x, y, -1, -1]
    ].forEach(([cx, cy, sx, sy]) => {
      this.g.lineBetween(cx, cy, cx + sx * 18, cy);
      this.g.lineBetween(cx, cy, cx, cy + sy * 18);
      this.g.fillStyle(color, alpha * 0.5);
      this.g.fillCircle(cx, cy, 3);
    });
  }

  drawParchmentTexture(w, h) {
    for (let i = 0; i < 46; i += 1) {
      const x = -w / 2 + 18 + ((i * 57) % Math.max(1, w - 36));
      const y = -h / 2 + 18 + ((i * 31) % Math.max(1, h - 36));
      this.g.fillStyle(i % 2 ? 0x5b3920 : 0xffffff, i % 2 ? 0.05 : 0.035);
      this.g.fillEllipse(x, y, 12 + (i % 8), 4 + (i % 5));
    }
  }
}
