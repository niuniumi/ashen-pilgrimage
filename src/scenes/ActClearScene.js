import Phaser from 'phaser';
import { getActDefinition, getNextActDefinition } from '../data/acts.js';
import { actClear as fallbackActClear } from '../data/story.js';
import { GAME_HEIGHT, GAME_WIDTH, SCENES } from '../game/constants.js';
import { THEME, textStyle, titleStyle } from '../game/Theme.js';
import { addAmbientAsh } from '../effects/AmbientParticles.js';
import { StoryDialog } from '../ui/StoryDialog.js';
import { SceneTransition } from '../ui/SceneTransition.js';
import { drawDivider, drawVignette } from '../ui/UIOrnament.js';
import { attachSceneServices, getActiveRun, saveActiveRun } from './SceneHelpers.js';
import { addHandPaintedBackground, addVfxAsset, HANDPAINTED_KEYS } from '../art/HandPaintedAssets.js';
import { MapSystem } from '../systems/MapSystem.js';

export default class ActClearScene extends Phaser.Scene {
  constructor() {
    super(SCENES.ActClear);
  }

  create() {
    this.transitioning = false;
    this.input.enabled = true;
    attachSceneServices(this);
    this.run = getActiveRun(this);
    if (!this.run) {
      this.scene.start(SCENES.MainMenu);
      return;
    }
    this.chapter = getActDefinition(this.run.act ?? this.run.map?.act ?? 1);
    this.nextChapter = getNextActDefinition(this.chapter.number);
    this.drawBackdrop();
    this.add.text(768, 88, this.chapter.clearTitle, titleStyle(50)).setOrigin(0.5);
    this.add.text(768, 140, this.chapter.clearSubtitle, textStyle(22, THEME.css.muted)).setOrigin(0.5);
    drawDivider(this, 768, 172, 520);
    this.audio?.startAmbience?.('story');
    this.audio?.play('victory');
    new StoryDialog(this, '余火未熄', this.chapter.clearStory ?? fallbackActClear, {
      nextLabel: this.nextChapter ? '继续圣途' : '查看结算',
      skipLabel: '跳过',
      onComplete: () => this.finish()
    });
    this.cameras.main.fadeIn(420, 0, 0, 0);
  }

  drawBackdrop() {
    if (addHandPaintedBackground(this, HANDPAINTED_KEYS.folioBg, { depth: 0 })) {
      addVfxAsset(this, 'blessingC', 768, 402, { displayWidth: 420, displayHeight: 330, alpha: 0.32, depth: 2 });
      addAmbientAsh(this, { count: 28, depth: 8 });
      return;
    }
    const g = this.add.graphics();
    g.fillGradientStyle(0x15111f, 0x15111f, 0x4b2c20, 0x0c0706, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    g.fillStyle(0x201b29, 0.78);
    g.fillTriangle(80, 598, 340, 330, 630, 598);
    g.fillTriangle(730, 600, 1030, 306, 1330, 600);
    g.fillStyle(0x0d0d13, 0.88);
    g.fillRect(0, 610, GAME_WIDTH, 254);
    g.fillStyle(0x26150f, 0.95);
    g.fillEllipse(768, 628, 720, 68);
    g.fillStyle(0x25272b, 0.98);
    g.fillRect(710, 444, 116, 164);
    g.fillStyle(0x121114, 0.88);
    g.fillTriangle(675, 604, 768, 350, 858, 604);
    g.lineStyle(9, 0x6b2535, 0.76);
    g.lineBetween(660, 612, 878, 428);
    g.fillStyle(0xf1c76a, 0.16);
    g.fillCircle(768, 430, 150);
    drawVignette(this, 3);
    addAmbientAsh(this, { count: 56, depth: 8 });
  }

  finish() {
    this.run.victoryCount = (this.run.victoryCount ?? 0) + 1;
    if (this.nextChapter) {
      this.run.act = this.nextChapter.number;
      this.run.actPage = 0;
      this.run.floor = 0;
      const generated = MapSystem.createSeededMap(this.nextChapter.number, this.run.rngState);
      this.run.map = generated.map;
      this.run.rngState = generated.state;
      this.run.rewardClaimed = false;
      saveActiveRun(this, this.run);
      SceneTransition.fadeTo(this, SCENES.Vow, {}, 460);
      return;
    }
    this.registry.set('result', { victory: true });
    saveActiveRun(this, this.run);
    SceneTransition.fadeTo(this, SCENES.Result, { victory: true }, 460);
  }
}
