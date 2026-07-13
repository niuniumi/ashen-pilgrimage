import Phaser from 'phaser';
import { COLORS } from '../game/constants.js';
import { SaveManager } from '../game/SaveManager.js';
import { FONT } from '../design/textStyles.js';
import { PIXEL_PALETTE, snapPixel } from '../art/PixelArtSystem.js';


export class UIHealthBar extends Phaser.GameObjects.Container {
  constructor(scene, x, y, width, height, label = '') {
    super(scene, x, y);
    this.widthValue = width;
    this.heightValue = height;
    this.label = label;
    this.value = 1;
    this.displayValue = 1;
    this.max = 1;
    this.block = 0;
    this.bg = scene.add.graphics();
    this.text = scene.add
      .text(0, 0, '', {
        fontFamily: FONT,
        fontSize: Math.max(13, Math.min(17, height - 7)),
        color: '#fff4d8',
        stroke: '#120b08',
        strokeThickness: 3
      })
      .setOrigin(0.5);
    this.add([this.bg, this.text]);
    scene.add.existing(this);
    this.once('destroy', () => {
      scene.tweens.killTweensOf(this);
    });
    this.setValue(1, 1, 0);
  }

  setValue(value, max, block = 0, animate = false) {
    const nextValue = Math.max(0, Number.isFinite(value) ? value : 0);
    this.max = Math.max(1, Number.isFinite(max) ? max : 1);
    this.block = Math.max(0, Number.isFinite(block) ? block : 0);
    this.value = nextValue;
    if (animate && SaveManager.readSettings().animation) {
      this.scene.tweens.killTweensOf(this);
      this.scene.tweens.add({
        targets: this,
        displayValue: nextValue,
        duration: 260,
        ease: 'Sine.Out',
        onUpdate: () => this.draw(),
        onComplete: () => {
          this.displayValue = nextValue;
          this.draw();
        }
      });
    } else {
      this.displayValue = nextValue;
      this.draw();
    }
  }

  draw() {
    if (!this.active || !this.bg?.active || !this.text?.active) return;
    const w = this.widthValue;
    const h = this.heightValue;
    const ratio = Math.max(0, Math.min(1, this.displayValue / this.max));
    this.bg.clear();
    const left = snapPixel(-w / 2);
    const top = snapPixel(-h / 2);
    const pw = snapPixel(w);
    const ph = snapPixel(h);
    const valueWidth = Math.max(0, snapPixel((pw - 8) * ratio));
    this.bg.fillStyle(PIXEL_PALETTE.goldDark, 0.96);
    this.bg.fillRect(left, top, pw, ph);
    this.bg.fillStyle(PIXEL_PALETTE.void, 1);
    this.bg.fillRect(left + 4, top + 4, pw - 8, ph - 8);
    this.bg.fillStyle(PIXEL_PALETTE.blood, 0.96);
    this.bg.fillRect(left + 4, top + 4, valueWidth, ph - 8);
    this.bg.fillStyle(PIXEL_PALETTE.candle, 0.18);
    this.bg.fillRect(left + 4, top + 4, valueWidth, 4);
    this.bg.lineStyle(1, 0x5c201c, 0.4);
    for (let i = 1; i < 8; i += 1) {
      const tx = -w / 2 + 4 + ((w - 8) * i) / 8;
      this.bg.lineBetween(tx, -h / 2 + 5, tx, h / 2 - 5);
    }
    if (this.block > 0) {
      const shieldWidth = Math.min(w - 8, Math.max(26, this.block * 7));
      this.bg.fillStyle(COLORS.blueSteel, 0.9);
      this.bg.fillRect(snapPixel(w / 2 - shieldWidth - 4), top + 4, snapPixel(shieldWidth), ph - 8);
    }
    this.text.setText(`${this.label}${Math.ceil(this.value)}/${this.max}${this.block > 0 ? `  护甲 ${this.block}` : ''}`);
  }
}
