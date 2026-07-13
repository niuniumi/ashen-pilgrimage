import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENES } from '../game/constants.js';
import { THEME, textStyle, titleStyle } from '../game/Theme.js';
import { addAmbientAsh } from '../effects/AmbientParticles.js';
import { addHandPaintedBackground, addVfxAsset, HANDPAINTED_KEYS } from '../art/HandPaintedAssets.js';
import { VowSystem } from '../systems/VowSystem.js';
import { UIButton } from '../ui/UIButton.js';
import { UIFrame } from '../ui/UIFrame.js';
import { drawDivider, drawVignette, drawWaxSeal } from '../ui/UIOrnament.js';
import { attachSceneServices, getActiveRun, saveActiveRun } from './SceneHelpers.js';

export default class VowScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Vow);
  }

  create() {
    attachSceneServices(this);
    this.run = getActiveRun(this);
    if (!this.run) return;
    this.audio?.startAmbience?.('story');
    this.drawBackdrop();
    const act = this.run.act ?? 1;
    const offer = VowSystem.getOffer(this.run, act);
    saveActiveRun(this, this.run);

    this.add.text(GAME_WIDTH / 2, 70, `第 ${act} 章 · 立誓`, titleStyle(46)).setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 124, '每一份恩典都要求代价。选择一条誓约，它将持续到圣途终点。', textStyle(19, THEME.css.muted))
      .setOrigin(0.5);
    drawDivider(this, GAME_WIDTH / 2, 158, 620);

    if (offer.length === 0) {
      new UIButton(this, GAME_WIDTH / 2, 520, 240, 58, '进入路线', () => {
        delete this.run.pendingScene;
        saveActiveRun(this, this.run);
        this.scene.start(SCENES.Map);
      });
      return;
    }
    const spacing = 402;
    const startX = GAME_WIDTH / 2 - ((offer.length - 1) * spacing) / 2;
    offer.forEach((vow, index) => this.drawVowCard(vow, startX + index * spacing, 456));
    this.cameras.main.fadeIn(360, 0, 0, 0);
  }

  drawBackdrop() {
    if (!addHandPaintedBackground(this, HANDPAINTED_KEYS.folioBg, { depth: 0 })) {
      const g = this.add.graphics();
      g.fillGradientStyle(0x17110f, 0x17110f, 0x3d261b, 0x090706, 1);
      g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      drawVignette(this, 2);
    }
    addVfxAsset(this, 'blessingB', GAME_WIDTH / 2, 458, {
      displayWidth: 540,
      displayHeight: 420,
      alpha: 0.17,
      depth: 1
    });
    addAmbientAsh(this, { count: 28, depth: 4 });
  }

  drawVowCard(vow, x, y) {
    new UIFrame(this, x, y, 354, 500, {
      fill: 0x1d1411,
      alpha: 0.95,
      stroke: THEME.colors.darkGold,
      lineWidth: 2
    });
    drawWaxSeal(this, x, y - 174, 32, 0x91303a);
    this.add.text(x, y - 112, vow.name, titleStyle(29)).setOrigin(0.5);
    this.add
      .text(x, y - 60, vow.motto, {
        ...textStyle(16, THEME.css.muted, { align: 'center', fontStyle: 'italic' }),
        wordWrap: { width: 286 }
      })
      .setOrigin(0.5);
    drawDivider(this, x, y - 10, 230);
    this.add.text(x - 126, y + 34, '恩典', textStyle(16, '#e9c86f')).setOrigin(0, 0.5);
    this.add
      .text(x, y + 68, vow.boon, { ...textStyle(18, THEME.css.body, { align: 'center' }), wordWrap: { width: 280 } })
      .setOrigin(0.5);
    this.add.text(x - 126, y + 116, '代价', textStyle(16, '#d27868')).setOrigin(0, 0.5);
    this.add
      .text(x, y + 150, vow.burden, { ...textStyle(18, '#e9c8bb', { align: 'center' }), wordWrap: { width: 280 } })
      .setOrigin(0.5);
    new UIButton(this, x, y + 212, 210, 52, '立下此誓', () => this.choose(vow.id), {
      fontSize: 21,
      fill: 0x493022
    });
  }

  choose(vowId) {
    if (this.transitioning) return;
    this.transitioning = true;
    VowSystem.apply(this.run, vowId);
    delete this.run.pendingScene;
    delete this.run.pendingBattleType;
    saveActiveRun(this, this.run);
    this.audio?.play('relic');
    this.cameras.main.fadeOut(320, 0, 0, 0);
    this.time.delayedCall(320, () => this.scene.start(SCENES.Map));
  }
}
