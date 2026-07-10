import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENES } from '../game/constants.js';
import { getCard } from '../data/cards.js';
import { CardSystem } from '../systems/CardSystem.js';
import { RelicSystem } from '../systems/RelicSystem.js';
import { VowSystem } from '../systems/VowSystem.js';
import { MapSystem } from '../systems/MapSystem.js';
import { clamp } from '../game/random.js';
import { SCENE_TITLES, THEME, textStyle, titleStyle } from '../game/Theme.js';
import { addAmbientAsh } from '../effects/AmbientParticles.js';
import { UIButton } from '../ui/UIButton.js';
import { UIFrame } from '../ui/UIFrame.js';
import { UIIcon } from '../ui/UIIcon.js';
import { drawCandle, drawDivider, drawVignette } from '../ui/UIOrnament.js';
import { installPauseMenu } from '../ui/PauseMenu.js';
import { addToast, attachSceneServices, getActiveRun, saveActiveRun } from './SceneHelpers.js';
import { addHandPaintedBackground, addVfxAsset, HANDPAINTED_KEYS } from '../art/HandPaintedAssets.js';

export default class RestScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Rest);
  }

  create() {
    attachSceneServices(this);
    this.audio?.startAmbience?.('rest');
    this.run = getActiveRun(this);
    if (!this.run) return;
    this.drawBackdrop();
    this.drawHeader();
    this.renderRest();
    installPauseMenu(this, { allowMap: false });
  }

  drawBackdrop() {
    if (addHandPaintedBackground(this, HANDPAINTED_KEYS.folioBg, { depth: 0 })) {
      addVfxAsset(this, 'blessingA', 768, 538, { displayWidth: 420, displayHeight: 330, alpha: 0.28, depth: 2 });
      addAmbientAsh(this, { count: 22, depth: 4 });
      return;
    }
    const g = this.add.graphics();
    g.fillGradientStyle(0x15111f, 0x15111f, 0x45251c, 0x0c0706, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    g.fillStyle(0x0d0a08, 0.95);
    g.fillRect(0, 612, GAME_WIDTH, 252);
    g.fillStyle(0x2b1912, 0.95);
    g.fillEllipse(768, 650, 620, 78);
    g.fillStyle(0xf1c76a, 0.16);
    g.fillCircle(768, 520, 190);
    g.fillStyle(0x3c2114, 0.98);
    g.fillTriangle(704, 620, 768, 426, 842, 620);
    g.fillStyle(0xf1c76a, 0.95);
    g.fillTriangle(726, 620, 770, 486, 820, 620);
    g.fillStyle(0xe5672d, 0.9);
    g.fillTriangle(760, 620, 794, 520, 844, 620);
    g.lineStyle(12, 0x27140d, 0.95);
    g.lineBetween(682, 646, 852, 596);
    g.lineBetween(684, 600, 856, 650);
    drawCandle(this, 360, 566, 1);
    drawCandle(this, 1176, 566, 1);
    drawVignette(this, 3);
    addAmbientAsh(this, { count: 46, depth: 4 });
  }

  drawHeader() {
    const [title, subtitle] = SCENE_TITLES.rest;
    this.add.text(768, 52, title, titleStyle(42)).setOrigin(0.5);
    this.add.text(768, 96, subtitle, textStyle(18, THEME.css.muted, { align: 'center' })).setOrigin(0.5);
    drawDivider(this, 768, 124, 520);
  }

  renderRest() {
    new UIFrame(this, 768, 444, 930, 500, { fill: THEME.colors.panel, alpha: 0.86, stroke: THEME.colors.darkGold });
    this.add.text(768, 220, `当前生命：${this.run.hp}/${this.run.maxHp}`, titleStyle(30)).setOrigin(0.5);
    const full = this.run.hp >= this.run.maxHp;
    this.add
      .text(768, 262, full ? '你的生命已满，强化可能更有价值。' : '休息可回复最大生命 30%，生命低时更稳。', {
        ...textStyle(19, THEME.css.muted, { align: 'center' }),
        wordWrap: { width: 720 }
      })
      .setOrigin(0.5);
    this.drawChoiceCard(548, 470, '休息', '回复生命', 'rest', `回复 ${this.restAmount()} 点生命。`, () => this.rest());
    this.drawChoiceCard(988, 470, '强化', '升级一张牌', 'relic', '随机强化一张尚未升级的牌。', () => this.upgrade());
    new UIButton(this, 768, 724, 190, 52, '离开', () => this.leave(), { fontSize: 23, fill: 0x302822 });
  }

  drawChoiceCard(x, y, title, command, icon, body, action) {
    new UIFrame(this, x, y, 330, 250, { fill: 0x21140f, alpha: 0.94, stroke: THEME.colors.darkGold });
    new UIIcon(this, x, y - 72, icon, { size: 54 });
    this.add.text(x, y - 22, title, titleStyle(28)).setOrigin(0.5);
    this.add
      .text(x, y + 24, body, {
        ...textStyle(17, THEME.css.body, { align: 'center' }),
        wordWrap: { width: 260 }
      })
      .setOrigin(0.5);
    new UIButton(this, x, y + 88, 190, 44, command, action, { fontSize: 20, fill: 0x4a3421 });
  }

  rest() {
    if (this.uiPaused) return;
    const amount = this.restAmount();
    this.run.hp = clamp(this.run.hp + amount, 0, this.run.maxHp);
    addToast(this, `回复 ${amount} 生命。`);
    this.audio?.play('heal');
    this.leave();
  }

  restAmount() {
    return Math.ceil(this.run.maxHp * 0.3) + RelicSystem.value(this.run, 'restHealBonus') + VowSystem.value(this.run, 'restHealBonus');
  }

  upgrade() {
    if (this.uiPaused) return;
    const upgraded = CardSystem.upgradeRandom(this.run);
    if (!upgraded) {
      addToast(this, '没有可升级的卡牌。', 'error');
      return;
    }
    addToast(this, `强化：${getCard(upgraded.cardId).name}+`);
    this.audio?.play('relic');
    this.leave();
  }

  leave() {
    MapSystem.finishActiveNode(this.run);
    saveActiveRun(this, this.run);
    this.time.delayedCall(350, () => this.scene.start(SCENES.Map));
  }
}
