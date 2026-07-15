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
import { SceneChoiceController } from '../ui/SceneChoiceController.js';
import { UIFrame } from '../ui/UIFrame.js';
import { UIIcon } from '../ui/UIIcon.js';
import { drawDivider, drawVignette } from '../ui/UIOrnament.js';
import { installPauseMenu } from '../ui/PauseMenu.js';
import { addToast, attachSceneServices, getActiveRun, preloadSceneAssets, saveActiveRun } from './SceneHelpers.js';
import { addHandPaintedBackground, HANDPAINTED_KEYS } from '../art/HandPaintedAssets.js';

export default class RewardScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Reward);
  }

  preload() {
    preloadSceneAssets(this, SCENES.Reward, { title: '整理战利品' });
  }

  create() {
    attachSceneServices(this);
    this.audio?.startAmbience?.('story');
    this.run = getActiveRun(this);
    if (!this.run) return;
    this.claiming = false;
    this.motionEnabled = SaveManager.readSettings().animation !== false;
    if (!this.run.pendingReward) this.run.pendingReward = RewardSystem.createReward(this.run, this.run.lastBattleType ?? 'battle');
    this.setupChoices(this.run.pendingReward.cards.map((card) => card.id));
    this.drawBackdrop();
    this.drawHeader();
    this.renderReward();
    installPauseMenu(this, { allowMap: false });
    if (!this.motionEnabled) this.tweens.killAll();
  }

  setupChoices(ids) {
    this.choiceViews = [];
    this.choiceController = new SceneChoiceController(ids);
    this.choiceUnsubscribe = this.choiceController.subscribe((state) => this.updateChoiceState(state));
    this.choiceKeyHandler = (event) => {
      if (this.uiPaused) return;
      const code = event.code || event.key;
      const handled = code === 'Enter' || code === 'NumpadEnter' || code === 'Space' || code === ' '
        ? this.confirmChoice()
        : this.choiceController?.handleKey(code);
      if (handled) event.preventDefault?.();
    };
    this.input.keyboard?.on('keydown', this.choiceKeyHandler);
    this.events.once('shutdown', this.cleanupChoices, this);
  }

  cleanupChoices() {
    this.input.keyboard?.off('keydown', this.choiceKeyHandler);
    this.choiceUnsubscribe?.();
    this.choiceController?.destroy();
    this.choiceController = null;
    this.choiceKeyHandler = null;
    this.choiceUnsubscribe = null;
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

    this.add.text(768, 348, '选择一张卡，再确认收入牌组', titleStyle(27)).setOrigin(0.5);
    drawDivider(this, 768, 380, 420);
    const cardSpacing = reward.cards.length <= 3 ? 220 : 202;
    const startX = 768 - ((reward.cards.length - 1) * cardSpacing) / 2;
    reward.cards.forEach((card, index) => {
      const x = startX + index * cardSpacing;
      const view = new UICard(this, x, 502, { ...card, activeText: card.text, upgraded: false }, {
        baseY: 502,
        selectionRaise: 12,
        onClick: () => this.selectChoice(card.id)
      });
      view.setName(`reward-choice-${card.id}`);
      this.choiceViews.push({ id: card.id, view });
    });
    this.confirmButton = new UIButton(this, 646, 734, 220, 56, '确认选择', () => this.confirmChoice(), {
      fontSize: 23,
      fill: 0x4a3421,
      disabled: true
    }).setName('choice-confirm');
    this.skipButton = new UIButton(this, 890, 734, 220, 56, '跳过奖励', () => this.skipReward(), {
      fontSize: 23,
      fill: 0x302822
    }).setName('reward-skip');
    this.updateChoiceState(this.choiceController.state);
  }

  selectChoice(id) {
    if (this.uiPaused) return false;
    return this.choiceController?.select(id) ?? false;
  }

  updateChoiceState(state) {
    for (const { id, view } of this.choiceViews ?? []) {
      const selected = state.selectedId === id;
      view.setSelected(selected, this.motionEnabled);
      view.setConfirmed(state.locked && selected);
      view.setDisabled(state.locked);
    }
    this.confirmButton?.setDisabled(state.locked || state.selectedId === null);
    this.skipButton?.setDisabled(state.locked);
  }

  confirmChoice() {
    if (this.uiPaused) return false;
    const cardId = this.choiceController?.confirm();
    if (cardId === null || cardId === undefined) return false;
    this.playRewardFeedback(cardId);
    this.settleReward(cardId);
    return true;
  }

  skipReward() {
    if (this.uiPaused || !this.choiceController?.lock()) return false;
    this.skipButton?.setConfirmed(true);
    addToast(this, '牌组不是越厚越好，跳过也是一种策略。');
    this.settleReward(null);
    return true;
  }

  playRewardFeedback(cardId) {
    const view = this.choiceViews.find((item) => item.id === cardId)?.view;
    if (!view || !this.motionEnabled) return;
    this.tweens.killTweensOf(view);
    this.tweens.add({
      targets: view,
      scale: view.baseScale * 1.04,
      duration: 110,
      yoyo: true,
      ease: 'Sine.InOut',
      onComplete: () => view.setScale(view.baseScale)
    });
  }

  settleReward(cardId) {
    if (this.claiming || this.run.rewardClaimed) {
      addToast(this, '奖励已经领取。', 'error');
      return;
    }
    const reward = this.run.pendingReward;
    if (!reward) {
      addToast(this, '奖励状态已失效，正在返回地图。', 'error');
      this.time.delayedCall(240, () => this.scene.start(SCENES.Map));
      return;
    }
    this.claiming = true;
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
    delete this.run.pendingScene;
    delete this.run.pendingBattleType;
    MapSystem.finishActiveNode(this.run);
    saveActiveRun(this, this.run);
    this.time.delayedCall(500, () => this.scene.start(SCENES.Map));
  }
}
