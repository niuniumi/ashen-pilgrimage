import Phaser from 'phaser';
import { FONT } from '../design/textStyles.js';
import { PIXEL_PALETTE, snapPixel } from '../art/PixelArtSystem.js';

export class UITooltip extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, 0, 0);
    this.bg = scene.add.graphics();
    this.text = scene.add.text(0, 0, '', {
      fontFamily: FONT,
      fontSize: 17,
      color: '#f6edd0',
      lineSpacing: 5,
      wordWrap: { width: 300 }
    });
    this.add([this.bg, this.text]);
    this.setDepth(1000);
    this.setVisible(false);
    scene.add.existing(this);
  }

  show(x, y, text) {
    this.text.setText(text);
    const bounds = this.text.getBounds();
    const w = Math.max(160, bounds.width + 26);
    const h = Math.max(44, bounds.height + 22);
    this.bg.clear();
    const width = snapPixel(w);
    const height = snapPixel(h);
    this.bg.fillStyle(PIXEL_PALETTE.void, 0.7);
    this.bg.fillRect(-8, -4, width, height);
    this.bg.fillStyle(PIXEL_PALETTE.goldDark, 1);
    this.bg.fillRect(-12, -8, width, height);
    this.bg.fillStyle(PIXEL_PALETTE.black, 0.98);
    this.bg.fillRect(-8, -4, width - 8, height - 8);
    this.setPosition(Math.min(x, 1536 - w - 24), Math.min(y, 864 - h - 24));
    this.setVisible(true);
  }

  hide() {
    this.setVisible(false);
  }
}
