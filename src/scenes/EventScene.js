import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENES } from '../game/constants.js';
import { EventSystem } from '../systems/EventSystem.js';
import { MapSystem } from '../systems/MapSystem.js';
import { SCENE_TITLES, THEME, textStyle, titleStyle } from '../game/Theme.js';
import { addAmbientAsh } from '../effects/AmbientParticles.js';
import { UIButton } from '../ui/UIButton.js';
import { UIFrame } from '../ui/UIFrame.js';
import { drawCandle, drawDivider, drawVignette } from '../ui/UIOrnament.js';
import { installPauseMenu } from '../ui/PauseMenu.js';
import { addToast, attachSceneServices, getActiveRun, saveActiveRun } from './SceneHelpers.js';
import { addHandPaintedBackground, addUiAsset, HANDPAINTED_KEYS, hasTexture } from '../art/HandPaintedAssets.js';

export default class EventScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Event);
  }

  create() {
    attachSceneServices(this);
    this.audio?.startAmbience?.('story');
    this.run = getActiveRun(this);
    if (!this.run) return;
    this.resolved = false;
    this.event = this.run.currentEvent ?? EventSystem.randomEvent(this.run);
    this.run.currentEvent = this.event;
    this.renderEvent();
  }

  drawBackdrop(subtitle = SCENE_TITLES.event[1]) {
    if (addHandPaintedBackground(this, HANDPAINTED_KEYS.folioBg, { depth: 0 })) {
      this.add.text(768, 52, this.event.title, {
        ...titleStyle(42),
        color: '#f4e7c5',
        stroke: '#08090d',
        strokeThickness: 6
      }).setOrigin(0.5);
      this.add.text(768, 96, subtitle, textStyle(18, '#b99862', { align: 'center' })).setOrigin(0.5);
      drawDivider(this, 768, 124, 520);
      return;
    }
    const g = this.add.graphics();
    g.fillGradientStyle(0x17111f, 0x17111f, 0x4a2b1e, 0x120806, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    g.fillStyle(0x0c0908, 0.92);
    g.fillRect(0, 610, GAME_WIDTH, 254);
    drawCandle(this, 258, 588, 1.15);
    drawCandle(this, 1278, 584, 1.05);
    drawVignette(this, 3);
    addAmbientAsh(this, { count: 36, depth: 4 });
    this.add.text(768, 52, this.event.title, titleStyle(42)).setOrigin(0.5);
    this.add.text(768, 96, subtitle, textStyle(18, THEME.css.muted, { align: 'center' })).setOrigin(0.5);
    drawDivider(this, 768, 124, 520);
  }

  drawBook() {
    new UIFrame(this, 768, 462, 1000, 560, {
      fill: THEME.colors.parchment,
      alpha: 0.95,
      stroke: 0x5d3a1f,
      parchment: true
    });
    if (hasTexture(this, HANDPAINTED_KEYS.ui)) return;
    const fold = this.add.graphics();
    fold.fillStyle(0x8f612f, 0.42);
    fold.fillRect(764, 204, 8, 516);
  }

  renderEvent() {
    this.children.removeAll(true);
    this.drawBackdrop();
    this.drawBook();
    this.add
      .text(768, 278, this.event.description, {
        ...textStyle(28, THEME.css.body, { align: 'center', lineSpacing: 12, strokeThickness: 3 }),
        stroke: '#08090d',
        wordWrap: { width: 820 }
      })
      .setOrigin(0.5);
    this.event.options.forEach((option, index) => {
      const y = 418 + index * 82;
      const enabled = EventSystem.canChoose(this.run, option);
      new UIButton(this, 768, y, 660, 56, `${option.label}  ·  ${option.cost}`, () => this.choose(option), {
        fontSize: 22,
        disabled: !enabled,
        fill: enabled ? 0x35706b : 0x2c3540
      });
    });
    installPauseMenu(this, { allowMap: false });
  }

  choose(option) {
    if (this.uiPaused || this.resolved) return;
    if (!EventSystem.canChoose(this.run, option)) {
      addToast(this, '条件不足。', 'error');
      return;
    }
    this.resolved = true;
    const notes = EventSystem.apply(this.run, option);
    this.run.currentEvent = null;
    delete this.run.pendingScene;
    delete this.run.pendingBattleType;
    MapSystem.finishActiveNode(this.run);
    saveActiveRun(this, this.run);
    this.children.removeAll(true);
    this.drawBackdrop('事件结果');
    this.drawBook();
    this.add
      .text(768, 350, `${option.result}\n\n${notes.join('，') || '没有额外变化。'}`, {
        ...textStyle(27, THEME.css.body, { align: 'center', lineSpacing: 14, strokeThickness: 3 }),
        stroke: '#08090d',
        wordWrap: { width: 820 }
      })
      .setOrigin(0.5);
    new UIButton(this, 768, 642, 220, 56, '继续旅途', () => this.leave(), { fontSize: 24, fill: 0x35706b });
    installPauseMenu(this, { allowMap: false });
  }

  leave() {
    this.run.currentEvent = null;
    saveActiveRun(this, this.run);
    this.scene.start(SCENES.Map);
  }
}
