import Phaser from 'phaser';
import { COLORS } from '../game/constants.js';

const FONT = 'Georgia, "Microsoft YaHei", serif';

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
    this.bg.fillStyle(0x070604, 0.54);
    this.bg.fillRoundedRect(-15, -8 + 4, w, h, 7);
    this.bg.fillStyle(COLORS.deep, 0.96);
    this.bg.fillRoundedRect(-12, -10, w, h, 7);
    this.bg.lineStyle(2, 0x9d7438, 0.86);
    this.bg.strokeRoundedRect(-12, -10, w, h, 7);
    this.setPosition(Math.min(x, 1536 - w - 24), Math.min(y, 864 - h - 24));
    this.setVisible(true);
  }

  hide() {
    this.setVisible(false);
  }
}
