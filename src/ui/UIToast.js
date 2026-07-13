import Phaser from 'phaser';
import { COLORS } from '../game/constants.js';
import { FONT } from '../design/textStyles.js';
import { PIXEL_PALETTE, drawPixelPanel } from '../art/PixelArtSystem.js';


export class UIToast extends Phaser.GameObjects.Container {
  constructor(scene, x, y, message, kind = 'info') {
    super(scene, x, y);
    const width = Phaser.Math.Clamp(message.length * 17 + 52, 280, 620);
    const bg = scene.add.graphics();
    drawPixelPanel(bg, 0, 0, width, 56, {
      fill: kind === 'error' ? PIXEL_PALETTE.bloodDark : PIXEL_PALETTE.coal,
      inner: PIXEL_PALETTE.black,
      stroke: kind === 'error' ? PIXEL_PALETTE.blood : PIXEL_PALETTE.goldDark,
      dither: false
    });
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
