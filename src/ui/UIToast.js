import Phaser from 'phaser';
import { COLORS } from '../game/constants.js';

const FONT = 'Georgia, "Microsoft YaHei", serif';

export class UIToast extends Phaser.GameObjects.Container {
  constructor(scene, x, y, message, kind = 'info') {
    super(scene, x, y);
    const width = Phaser.Math.Clamp(message.length * 17 + 52, 280, 620);
    const bg = scene.add.graphics();
    bg.fillStyle(0x080604, 0.58);
    bg.fillRoundedRect(-width / 2 - 4, -28 + 4, width + 8, 56, 8);
    bg.fillStyle(kind === 'error' ? 0x4b1f1f : COLORS.deep, 0.94);
    bg.fillRoundedRect(-width / 2, -28, width, 56, 8);
    bg.fillStyle(0xffffff, 0.04);
    bg.fillRoundedRect(-width / 2 + 8, -23, width - 16, 16, 5);
    bg.lineStyle(2, kind === 'error' ? COLORS.red : 0x9d7438, 0.84);
    bg.strokeRoundedRect(-width / 2, -28, width, 56, 8);
    const text = scene.add
      .text(0, 0, message, {
        fontFamily: FONT,
        fontSize: 20,
        color: '#f6edd0',
        align: 'center',
        wordWrap: { width: width - 36 }
      })
      .setOrigin(0.5);
    this.add([bg, text]);
    this.setDepth(950);
    scene.add.existing(this);
    scene.tweens.add({ targets: this, y: y - 28, alpha: 0, delay: 1350, duration: 420, onComplete: () => this.destroy() });
  }
}
