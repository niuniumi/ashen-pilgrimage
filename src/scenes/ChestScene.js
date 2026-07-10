import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENES } from '../game/constants.js';
import { createCardInstance } from '../game/GameState.js';
import { runChance, runRandomInt } from '../game/RunRandom.js';
import { RelicSystem } from '../systems/RelicSystem.js';
import { MapSystem } from '../systems/MapSystem.js';
import { SCENE_TITLES, THEME, textStyle, titleStyle } from '../game/Theme.js';
import { addAmbientAsh } from '../effects/AmbientParticles.js';
import { UIButton } from '../ui/UIButton.js';
import { UIFrame } from '../ui/UIFrame.js';
import { UIIcon } from '../ui/UIIcon.js';
import { drawDivider, drawVignette } from '../ui/UIOrnament.js';
import { installPauseMenu } from '../ui/PauseMenu.js';
import { attachSceneServices, getActiveRun, saveActiveRun } from './SceneHelpers.js';
import { addHandPaintedBackground, addUiAsset, addVfxAsset, HANDPAINTED_KEYS, hasTexture } from '../art/HandPaintedAssets.js';

export default class ChestScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Chest);
  }

  create() {
    attachSceneServices(this);
    this.audio?.startAmbience?.('rest');
    this.run = getActiveRun(this);
    if (!this.run) return;
    this.opened = false;
    this.renderClosed();
  }

  drawBackdrop(title = SCENE_TITLES.chest[0], subtitle = SCENE_TITLES.chest[1]) {
    if (addHandPaintedBackground(this, HANDPAINTED_KEYS.folioBg, { depth: 0 })) {
      addAmbientAsh(this, { count: 20, depth: 4 });
      this.add.text(768, 52, title, titleStyle(42)).setOrigin(0.5);
      this.add.text(768, 96, subtitle, textStyle(18, THEME.css.muted, { align: 'center' })).setOrigin(0.5);
      drawDivider(this, 768, 124, 520);
      return;
    }
    const g = this.add.graphics();
    g.fillGradientStyle(0x15111f, 0x15111f, 0x46261a, 0x0b0706, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    g.fillStyle(0x0d0a08, 0.96);
    g.fillRect(0, 612, GAME_WIDTH, 252);
    g.fillStyle(0xf1c76a, 0.12);
    g.fillCircle(768, 450, 220);
    g.fillStyle(0x2c1b13, 0.94);
    g.fillEllipse(768, 642, 620, 76);
    drawVignette(this, 3);
    addAmbientAsh(this, { count: 38, depth: 4 });
    this.add.text(768, 52, title, titleStyle(42)).setOrigin(0.5);
    this.add.text(768, 96, subtitle, textStyle(18, THEME.css.muted, { align: 'center' })).setOrigin(0.5);
    drawDivider(this, 768, 124, 520);
  }

  renderClosed() {
    this.children.removeAll(true);
    this.drawBackdrop();
    new UIFrame(this, 768, 462, 820, 500, { fill: THEME.colors.panel, alpha: 0.9, stroke: THEME.colors.darkGold });
    this.drawChest(false);
    new UIButton(this, 768, 672, 220, 56, '打开宝箱', () => this.openChest(), { fontSize: 24, fill: 0x4a3421 });
    installPauseMenu(this, { allowMap: false });
  }

  drawChest(open = false) {
    if (hasTexture(this, HANDPAINTED_KEYS.ui)) {
      addUiAsset(this, 'chest', 768, 482, { displayWidth: open ? 260 : 230, displayHeight: open ? 260 : 230, alpha: 0.96 });
      if (open) addVfxAsset(this, 'blessingD', 768, 440, { displayWidth: 330, displayHeight: 260, alpha: 0.58, depth: 4 });
      return;
    }
    const g = this.add.graphics();
    g.fillStyle(0x050404, 0.44);
    g.fillEllipse(768, 562, 330, 42);
    g.fillStyle(0x3c2417, 1);
    g.fillRoundedRect(650, 428, 236, 138, 8);
    g.fillStyle(0x5e3820, 1);
    if (open) {
      g.fillRoundedRect(625, 338, 286, 76, 16);
      g.lineStyle(8, THEME.colors.darkGold, 0.86);
      g.strokeRoundedRect(625, 338, 286, 76, 16);
      g.fillStyle(0xf1c76a, 0.24);
      g.fillTriangle(660, 430, 768, 270, 880, 430);
      g.fillCircle(768, 406, 86);
    } else {
      g.fillRoundedRect(635, 386, 266, 88, 16);
    }
    g.lineStyle(8, THEME.colors.darkGold, 0.86);
    g.strokeRoundedRect(635, 386, 266, 180, 14);
    g.lineStyle(3, 0x1a100b, 0.9);
    g.lineBetween(638, 474, 898, 474);
    g.fillStyle(THEME.colors.darkGold, 0.95);
    g.fillRect(748, 474, 40, 46);
    g.fillStyle(0x120b08, 0.7);
    g.fillCircle(768, 498, 6);
  }

  openChest() {
    if (this.uiPaused || this.opened) return;
    this.opened = true;
    const cursed = runChance(this.run, 0.18);
    const baseGold = runRandomInt(this.run, 32, 58) + RelicSystem.value(this.run, 'chestGold') + (cursed ? 25 : 0);
    const gold = RelicSystem.goldWithBonus(this.run, baseGold, {
      bonusHook: 'chestGoldPercent',
      includeRewardFlat: false
    });
    const relic = RelicSystem.addRandom(this.run);
    this.run.gold += gold;
    if (cursed) this.run.deck.push(createCardInstance('curse-rot'));
    this.children.removeAll(true);
    this.drawBackdrop('宝箱开启', '暗金光芒从箱缝中涌出。');
    new UIFrame(this, 768, 462, 820, 500, { fill: THEME.colors.panel, alpha: 0.9, stroke: THEME.colors.darkGold });
    this.drawChest(true);
    new UIIcon(this, 620, 620, 'coin', { size: 42 });
    new UIIcon(this, 620, 678, 'relic', { size: 42, relicId: relic?.id });
    this.add
      .text(768, 620, `获得 ${gold} 金币\n获得遗物：${relic?.name ?? '无'}${cursed ? '\n灰烬污染了奖励：加入 1 张腐败' : ''}`, {
        ...textStyle(24, THEME.css.paleGold, { align: 'center', lineSpacing: 12 }),
        wordWrap: { width: 610 }
      })
      .setOrigin(0.5);
    new UIButton(this, 768, 724, 220, 56, '继续旅途', () => this.leave(), { fontSize: 24, fill: 0x4a3421 });
    this.audio?.play('relic');
    installPauseMenu(this, { allowMap: false });
  }

  leave() {
    MapSystem.finishActiveNode(this.run);
    saveActiveRun(this, this.run);
    this.scene.start(SCENES.Map);
  }
}
