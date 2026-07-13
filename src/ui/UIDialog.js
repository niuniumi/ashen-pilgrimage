import Phaser from 'phaser';
import { COLORS } from '../game/constants.js';
import { UIButton } from './UIButton.js';
import { UIPanel } from './UIPanel.js';
import { FONT } from '../design/textStyles.js';

export class UIDialog extends Phaser.GameObjects.Container {
  constructor(scene, title, body, buttons = [], options = {}) {
    super(scene, 768, 432);
    this.overlay = scene.add.rectangle(0, 0, 1536, 864, 0x000000, 0.52);
    this.panel = new UIPanel(scene, 0, 0, options.width ?? 620, options.height ?? 370, { fill: COLORS.deep, stroke: COLORS.gold });
    this.titleText = scene.add
      .text(0, -135, title, {
        fontFamily: FONT,
        fontSize: 32,
        color: '#f4d89c',
        align: 'center'
      })
      .setOrigin(0.5);
    this.bodyText = scene.add
      .text(0, -28, body, {
        fontFamily: FONT,
        fontSize: 22,
        color: '#f6edd0',
        align: 'left',
        lineSpacing: 8,
        wordWrap: { width: (options.width ?? 620) - 90 }
      })
      .setOrigin(0.5);
    this.add([this.overlay, this.panel, this.titleText, this.bodyText]);
    scene.audio?.play('dialogOpen');
    buttons.forEach((button, index) => {
      const btn = new UIButton(scene, (index - (buttons.length - 1) / 2) * 190, 132, 170, 54, button.label, () => {
        button.onClick?.();
        if (button.close !== false) {
          scene.audio?.play('dialogClose');
          this.destroy();
        }
      });
      this.add(btn);
    });
    this.setDepth(900);
    scene.add.existing(this);
  }
}
