import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/constants.js';
import { THEME, textStyle, titleStyle } from '../game/Theme.js';
import { UIButton } from './UIButton.js';
import { UIFrame } from './UIFrame.js';
import { drawDivider } from './UIOrnament.js';

export class StoryDialog extends Phaser.GameObjects.Container {
  constructor(scene, title, lines, options = {}) {
    super(scene, GAME_WIDTH / 2, GAME_HEIGHT - 212);
    this.lines = lines;
    this.options = options;
    this.index = 0;
    this.currentText = '';
    this.finishedTyping = false;

    this.frame = new UIFrame(scene, 0, 0, options.width ?? 1060, options.height ?? 250, {
      fill: THEME.colors.panel,
      alpha: 0.92,
      stroke: THEME.colors.darkGold
    });
    this.titleText = scene.add.text(0, -92, title, titleStyle(31)).setOrigin(0.5);
    this.divider = drawDivider(scene, GAME_WIDTH / 2, GAME_HEIGHT - 278, 480);
    this.divider.setDepth(901);
    this.bodyText = scene.add
      .text(-470, -40, '', {
        ...textStyle(25, THEME.css.body, { lineSpacing: 12 }),
        wordWrap: { width: 940 }
      })
      .setOrigin(0, 0);
    this.hintText = scene.add.text(-470, 78, '点击文字可加速显示', textStyle(15, THEME.css.muted)).setOrigin(0, 0.5);
    this.nextButton = new UIButton(scene, 330, 82, 170, 46, options.nextLabel ?? '继续', () => this.next(), { fontSize: 20 });
    this.skipButton = new UIButton(scene, 470, -94, 126, 36, options.skipLabel ?? '跳过', () => this.complete(), {
      fontSize: 16,
      fill: 0x302822
    });

    const hit = scene.add.rectangle(0, -10, options.width ?? 1060, 160, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    hit.on('pointerup', () => this.next());

    this.add([this.frame, this.titleText, this.bodyText, this.hintText, this.nextButton, this.skipButton, hit]);
    this.setDepth(900);
    scene.add.existing(this);
    this.typeLine();
  }

  typeLine() {
    this.options.onIndexChange?.(this.index);
    this.timer?.remove(false);
    this.currentText = '';
    this.finishedTyping = false;
    const line = this.lines[this.index] ?? '';
    let cursor = 0;
    this.bodyText.setText('');
    this.scene.audio?.play('storyText');
    this.timer = this.scene.time.addEvent({
      delay: this.options.delay ?? 26,
      repeat: line.length - 1,
      callback: () => {
        cursor += 1;
        this.currentText = line.slice(0, cursor);
        this.bodyText.setText(this.currentText);
        if (cursor >= line.length) this.finishedTyping = true;
      }
    });
  }

  next() {
    const line = this.lines[this.index] ?? '';
    if (!this.finishedTyping) {
      this.timer?.remove(false);
      this.bodyText.setText(line);
      this.finishedTyping = true;
      return;
    }
    if (this.index < this.lines.length - 1) {
      this.index += 1;
      this.scene.audio?.play('pageTurn');
      this.typeLine();
      return;
    }
    this.complete();
  }

  complete() {
    this.timer?.remove(false);
    this.options.onComplete?.();
    this.destroy();
  }

  destroy(fromScene) {
    this.divider?.destroy();
    super.destroy(fromScene);
  }
}
