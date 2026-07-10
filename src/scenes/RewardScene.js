import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENES } from '../game/constants.js';
import { getCard } from '../data/cards.js';
import { SaveManager } from '../game/SaveManager.js';
import { RewardSystem } from '../systems/RewardSystem.js';
import { RelicSystem } from '../systems/RelicSystem.js';
import { MapSystem } from '../systems/MapSystem.js';
import { SCENE_TITLES, THEME, textStyle, titleStyle } from '../game/Theme.js';
import { addAmbientAsh } from '../effects/AmbientParticles.js';
import { UIButton } from '../ui/UIButton.js';
import { UICard } from '../ui/UICard.js';
import { UIFrame } from '../ui/UIFrame.js';
import { UIIcon } from '../ui/UIIcon.js';
import { drawDivider, drawVignette } from '../ui/UIOrnament.js';
import { installPauseMenu } from '../ui/PauseMenu.js';
import { addToast, attachSceneServices, getActiveRun, saveActiveRun } from './SceneHelpers.js';
import { addHandPaintedBackground, HANDPAINTED_KEYS } from '../art/HandPaintedAssets.js';

export default class RewardScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Reward);
  }

  create() {
    attachSceneServices(this);
    this.audio?.startAmbience?.('story');
    this.run = getActiveRun(this);
    if (!this.run) return;
    if (!this.run.pendingReward) this.run.pendingReward = RewardSystem.createReward(this.run, this.run.lastBattleType ?? 'battle');
    this.drawBackdrop();
    this.drawHeader();
    this.renderReward();
    installPauseMenu(this, { allowMap: false });
  }

  drawBackdrop() {
    if (addHandPaintedBackground(this, HANDPAINTED_KEYS.folioBg, { depth: 0 })) {
      addAmbientAsh(this, { count: 14, depth: 4 });
      return;
    }
    const g = this.add.graphics();
    g.fillGradientStyle(0xf7ecd8, 0xf2dfbf, 0xd8b889, 0xae7d50, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    g.fillStyle(0xffffff, 0.13);
    g.fillEllipse(768, 238, 1120, 255);
    g.fillStyle(0xd0ad76, 0.18);
    g.fillEllipse(750, 620, 1200, 150);
    g.lineStyle(1, 0x7f6340, 0.22);
    g.strokeRoundedRect(34, 30, GAME_WIDTH - 68, GAME_HEIGHT - 60, 8);
    g.strokeRoundedRect(47, 43, GAME_WIDTH - 94, GAME_HEIGHT - 86, 6);
    g.fillStyle(0x6f4528, 0.3);
    g.fillRect(0, 604, GAME_WIDTH, 260);
    g.fillStyle(0xb78a55, 0.52);
    g.fillRoundedRect(260, 560, 1016, 116, 10);
    g.lineStyle(3, THEME.colors.darkGold, 0.32);
    g.strokeRoundedRect(260, 560, 1016, 116, 10);
    for (let i = 0; i < 42; i += 1) {
      g.fillStyle(i % 2 ? 0x6a4427 : 0xffffff, i % 2 ? 0.14 : 0.08);
      g.fillEllipse(292 + ((i * 81) % 940), 590 + ((i * 29) % 52), 18 + (i % 8), 4);
    }
    drawVignette(this, 3);
    addAmbientAsh(this, { count: 18, depth: 4 });
  }

  drawHeader() {
    const [title, subtitle] = SCENE_TITLES.reward;
    this.add.text(768, 54, title, titleStyle(42)).setOrigin(0.5);
    this.add.text(768, 98, subtitle, textStyle(18, THEME.css.muted, { align: 'center' })).setOrigin(0.5);
    drawDivider(this, 768, 126, 520);
  }

  renderReward() {
    const reward = this.run.pendingReward;
    new UIFrame(this, 768, 448, 1040, 560, { fill: THEME.colors.panel, alpha: 0.91, stroke: THEME.colors.darkGold });
    new UIFrame(this, 425, 255, 250, 120, { fill: 0x21140f, alpha: 0.92, stroke: THEME.colors.darkGold });
    new UIIcon(this, 335, 255, 'coin', { size: 50 });
    this.add.text(452, 240, '金币奖励', textStyle(18, THEME.css.muted)).setOrigin(0.5);
    this.add.text(452, 276, `${reward.gold}`, titleStyle(32)).setOrigin(0.5);

    new UIFrame(this, 802, 255, 430, 120, { fill: 0x21140f, alpha: 0.92, stroke: THEME.colors.darkGold });
    new UIIcon(this, 612, 255, 'relic', { size: 50, relicId: reward.relic?.id });
    this.add.text(825, 236, reward.relic ? reward.relic.name : '无遗物', titleStyle(reward.relic?.name?.length > 6 ? 23 : 27)).setOrigin(0.5);
    this.add
      .text(825, 278, reward.relic ? reward.relic.text : '普通战斗可能不会掉落遗物。', {
        ...textStyle(16, THEME.css.body, { align: 'center' }),
        wordWrap: { width: 330 }
      })
      .setOrigin(0.5);

    this.add.text(768, 348, '选择一张卡加入牌组', titleStyle(27)).setOrigin(0.5);
    drawDivider(this, 768, 380, 420);
    const cardSpacing = reward.cards.length <= 3 ? 220 : 202;
    const startX = 768 - ((reward.cards.length - 1) * cardSpacing) / 2;
    reward.cards.forEach((card, index) => {
      const x = startX + index * cardSpacing;
      new UICard(this, x, 502, { ...card, activeText: card.text, upgraded: false }, {
        baseY: 502,
        onClick: () => this.claim(card.id)
      });
    });
    new UIButton(this, 768, 734, 220, 56, '跳过奖励', () => {
      addToast(this, '牌组不是越厚越好，跳过也是一种策略。');
      this.claim(null);
    }, { fontSize: 23, fill: 0x302822 });
  }

  claim(cardId) {
    if (this.run.rewardClaimed) {
      addToast(this, '奖励已经领取。', 'error');
      return;
    }
    const reward = this.run.pendingReward;
    this.run.gold += reward.gold;
    this.audio?.play('coin');
    if (cardId) {
      RewardSystem.addCardReward(this.run, cardId);
      addToast(this, `获得卡牌：${getCard(cardId).name}`);
      this.audio?.play('cardSelect');
    }
    if (reward.relic) {
      RelicSystem.addById(this.run, reward.relic.id);
      addToast(this, `获得遗物：${reward.relic.name}`);
      this.audio?.play('relic');
    }
    this.run.rewardClaimed = true;
    this.run.pendingReward = null;
    MapSystem.finishActiveNode(this.run);
    saveActiveRun(this, this.run);
    this.time.delayedCall(500, () => this.scene.start(SCENES.Map));
  }
}
