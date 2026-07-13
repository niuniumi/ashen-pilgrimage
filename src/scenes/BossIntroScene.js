import Phaser from 'phaser';
import { getActDefinition } from '../data/acts.js';
import { bossIntro as fallbackBossIntro } from '../data/story.js';
import { GAME_HEIGHT, GAME_WIDTH, SCENES } from '../game/constants.js';
import { THEME, textStyle, titleStyle } from '../game/Theme.js';
import { addAmbientAsh } from '../effects/AmbientParticles.js';
import { screenShake } from '../effects/ScreenShake.js';
import { StoryDialog } from '../ui/StoryDialog.js';
import { SceneTransition } from '../ui/SceneTransition.js';
import { drawDivider, drawVignette } from '../ui/UIOrnament.js';
import { attachSceneServices, getActiveRun, saveActiveRun } from './SceneHelpers.js';
import { addHandPaintedBackground, HANDPAINTED_KEYS } from '../art/HandPaintedAssets.js';
import { drawEnemyArt } from '../ui/UICharacterArt.js';

export default class BossIntroScene extends Phaser.Scene {
  constructor() {
    super(SCENES.BossIntro);
  }

  create() {
    attachSceneServices(this);
    this.run = getActiveRun(this);
    if (!this.run) {
      this.scene.start(SCENES.MainMenu);
      return;
    }
    this.chapter = getActDefinition(this.run.act ?? this.run.map?.act ?? 1);
    this.drawBackdrop();
    this.add.text(768, 80, this.chapter.bossPlace, titleStyle(48)).setOrigin(0.5);
    this.add.text(768, 130, `${this.chapter.shortTitle} · 首领登场`, textStyle(22, THEME.css.muted)).setOrigin(0.5);
    drawDivider(this, 768, 162, 520);
    this.audio?.startAmbience?.('boss');
    this.audio?.play('bossIntro');
    screenShake(this, 0.004, 460);
    new StoryDialog(this, this.chapter.bossName, this.chapter.bossIntro ?? fallbackBossIntro, {
      nextLabel: '迎战',
      skipLabel: '直接迎战',
      onComplete: () => {
        this.run.pendingScene = 'battle';
        this.run.pendingBattleType = 'boss';
        saveActiveRun(this, this.run);
        SceneTransition.fadeTo(this, SCENES.Battle, { battleType: 'boss' }, 520);
      }
    });
    this.cameras.main.fadeIn(420, 0, 0, 0);
  }

  drawBackdrop() {
    const bossId = this.chapter?.bossId ?? 'headless-grave-knight';
    if (addHandPaintedBackground(this, HANDPAINTED_KEYS.battleBg, { depth: 0 })) {
      const boss = drawEnemyArt(this, bossId, 768, 442, 1.35, { idle: true, type: 'boss', phase: 1, depth: 3 });
      boss.setAlpha(0.88);
      addAmbientAsh(this, { count: 46, depth: 8 });
      return;
    }
    const g = this.add.graphics();
    g.fillGradientStyle(0x08070c, 0x08070c, 0x29172a, 0x050303, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    g.fillStyle(0x0d0d12, 0.95);
    g.fillRect(0, 590, GAME_WIDTH, 274);
    g.fillStyle(0x17151c, 0.95);
    g.fillTriangle(250, 590, 442, 336, 640, 590);
    g.fillTriangle(890, 590, 1090, 315, 1300, 590);
    g.fillStyle(0x09090c, 1);
    g.fillRect(642, 302, 252, 288);
    g.fillTriangle(620, 302, 768, 170, 916, 302);
    g.fillStyle(0x3e1b2b, 0.82);
    g.fillCircle(768, 372, 124);
    g.fillStyle(0x0a0808, 0.95);
    g.fillEllipse(768, 645, 620, 72);
    this.drawBossShadow(g, 768, 482);
    drawVignette(this, 5);
    addAmbientAsh(this, { count: 84, depth: 8 });
  }

  drawBossShadow(g, x, y) {
    g.fillStyle(0x050506, 0.98);
    g.fillRect(x - 42, y - 156, 84, 190);
    g.fillRect(x - 70, y - 44, 140, 44);
    g.fillTriangle(x - 112, y - 18, x - 42, y - 118, x - 22, y - 12);
    g.fillTriangle(x + 112, y - 18, x + 42, y - 118, x + 22, y - 12);
    g.lineStyle(12, 0x1b1a20, 1);
    g.lineBetween(x + 42, y - 128, x + 142, y + 38);
    g.lineStyle(5, THEME.colors.darkGold, 0.58);
    g.lineBetween(x - 32, y - 118, x + 28, y - 118);
  }
}
