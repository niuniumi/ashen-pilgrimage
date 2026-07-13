import Phaser from 'phaser';
import { COLORS } from '../game/constants.js';
import { FONT } from '../design/textStyles.js';
import { PIXEL_PALETTE } from '../art/PixelArtSystem.js';

export class UIStatusIcon extends Phaser.GameObjects.Container {
  constructor(scene, x, y, kind, value = '') {
    super(scene, x, y);
    this.kind = kind;
    this.value = value;
    this.g = scene.add.graphics();
    this.text = scene.add
      .text(0, 23, value ? `${value}` : '', {
        fontFamily: FONT,
        fontSize: 16,
        color: '#f6edd0'
      })
      .setOrigin(0.5);
    this.add([this.g, this.text]);
    scene.add.existing(this);
    this.draw();
  }

  draw() {
    this.g.clear();
    this.g.fillStyle(PIXEL_PALETTE.goldDark, 1);
    this.g.fillRect(-20, -20, 40, 40);
    this.g.fillStyle(PIXEL_PALETTE.black, 1);
    this.g.fillRect(-16, -16, 32, 32);
    if (this.kind === 'attack') {
      this.g.lineStyle(5, COLORS.red, 1);
      this.g.lineBetween(-10, 10, 10, -12);
      this.g.lineStyle(2, COLORS.paleGold, 0.9);
      this.g.lineBetween(-3, 12, 13, -3);
    } else if (this.kind === 'block') {
      this.g.fillStyle(COLORS.blueSteel, 0.9);
      this.g.fillTriangle(0, -12, 14, -3, 0, 15);
      this.g.fillTriangle(0, -12, -14, -3, 0, 15);
    } else if (this.kind === 'debuff') {
      this.g.fillStyle(COLORS.purple, 0.9);
      this.g.fillRect(-8, -8, 16, 16);
      this.g.fillRect(-12, 5, 24, 4);
    } else if (this.kind === 'buff') {
      this.g.fillStyle(COLORS.candle, 0.9);
      this.g.fillTriangle(0, -15, 12, 9, -12, 9);
    } else {
      this.g.fillStyle(COLORS.candle, 0.9);
      this.g.fillRect(-8, -8, 16, 16);
    }
  }
}
