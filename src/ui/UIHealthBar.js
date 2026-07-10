import Phaser from 'phaser';
import { COLORS } from '../game/constants.js';
import { SaveManager } from '../game/SaveManager.js';

const FONT = 'Georgia, "Microsoft YaHei", serif';

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
    this.bg.fillStyle(0x090605, 0.96);
    this.bg.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
    this.bg.fillStyle(0x2b1712, 0.92);
    this.bg.fillRoundedRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 4);
    this.bg.fillStyle(0x000000, 0.22);
    this.bg.fillRoundedRect(-w / 2 + 6, -h / 2 + 6, w - 12, h - 12, 3);
    this.bg.fillStyle(COLORS.red, 0.94);
    this.bg.fillRoundedRect(-w / 2 + 4, -h / 2 + 4, Math.max(0, (w - 8) * ratio), h - 8, 4);
    this.bg.fillStyle(0xf3bd67, 0.18);
    this.bg.fillRoundedRect(-w / 2 + 4, -h / 2 + 4, Math.max(0, (w - 8) * ratio), Math.max(4, (h - 8) * 0.34), 4);
    this.bg.lineStyle(1, 0x5c201c, 0.4);
    for (let i = 1; i < 8; i += 1) {
      const tx = -w / 2 + 4 + ((w - 8) * i) / 8;
      this.bg.lineBetween(tx, -h / 2 + 5, tx, h / 2 - 5);
    }
    if (this.block > 0) {
      const shieldWidth = Math.min(w - 8, Math.max(26, this.block * 7));
      this.bg.fillStyle(COLORS.blueSteel, 0.9);
      this.bg.fillRoundedRect(w / 2 - shieldWidth - 4, -h / 2 + 4, shieldWidth, h - 8, 4);
      this.bg.lineStyle(1, 0xcbe6ff, 0.5);
      this.bg.strokeRoundedRect(w / 2 - shieldWidth - 4, -h / 2 + 4, shieldWidth, h - 8, 4);
    }
    this.bg.lineStyle(2, 0x9d7438, 0.82);
    this.bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);
    this.bg.lineStyle(1, 0xf2c86d, 0.24);
    this.bg.strokeRoundedRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4, 5);
    this.bg.lineStyle(1, 0x000000, 0.5);
    this.bg.strokeRoundedRect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6, 4);
    this.text.setText(`${this.label}${Math.ceil(this.value)}/${this.max}${this.block > 0 ? `  护甲 ${this.block}` : ''}`);
  }
}
