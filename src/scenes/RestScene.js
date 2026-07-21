import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENES } from '../game/constants.js';
import { getCard } from '../data/cards.js';
import { CardSystem } from '../systems/CardSystem.js';
import { RelicSystem } from '../systems/RelicSystem.js';
import { VowSystem } from '../systems/VowSystem.js';
import { MapSystem } from '../systems/MapSystem.js';
import { clamp } from '../game/random.js';
import { SaveManager } from '../game/SaveManager.js';
import { SCENE_TITLES, THEME, textStyle, titleStyle } from '../game/Theme.js';
import { addAmbientAsh } from '../effects/AmbientParticles.js';
import { UIButton } from '../ui/UIButton.js';
import { SceneChoiceController } from '../ui/SceneChoiceController.js';
import { UIFrame } from '../ui/UIFrame.js';
import { UIIcon } from '../ui/UIIcon.js';
import { drawCandle, drawDivider, drawVignette } from '../ui/UIOrnament.js';
import { installPauseMenu } from '../ui/PauseMenu.js';
import { addToast, attachSceneServices, getActiveRun, preloadSceneAssets, saveActiveRun } from './SceneHelpers.js';
import { addHandPaintedBackground, addVfxAsset, HANDPAINTED_KEYS } from '../art/HandPaintedAssets.js';
import { createKeyboardEventGuard } from '../input/KeyboardEventGuard.js';

export default class RestScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Rest);
  }

  preload() {
    preloadSceneAssets(this, SCENES.Rest, { title: '点燃休憩营火' });
  }

  create() {
    attachSceneServices(this);
    this.audio?.startAmbience?.('rest');
    this.run = getActiveRun(this);
    if (!this.run) return;
    this.resolved = false;
    this.motionEnabled = SaveManager.readSettings().animation !== false;
    this.setupChoices();
    this.drawBackdrop();
    this.drawHeader();
    this.renderRest();
    installPauseMenu(this, { allowMap: false });
    if (!this.motionEnabled) this.tweens.killAll();
  }

  setupChoices() {
    const ids = ['rest', 'upgrade'];
    const enabledIds = this.run.deck.some((card) => !card.upgraded) ? ids : ['rest'];
    this.choiceViews = [];
    this.choiceController = new SceneChoiceController(ids, { enabledIds });
    this.choiceUnsubscribe = this.choiceController.subscribe((state) => this.updateChoiceState(state));
    const acceptKeyEvent = createKeyboardEventGuard();
    this.choiceKeyHandler = (event) => {
      if (!acceptKeyEvent(event)) return;
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
    this.add.text(768, 220, `当前生命：${this.run.hp}/${this.run.maxHp}`, titleStyle(30)).setOrigin(0.5);
    const full = this.run.hp >= this.run.maxHp;
    this.add
      .text(768, 262, full ? '你的生命已满，强化可能更有价值。' : '休息可回复最大生命 30%，生命低时更稳。', {
        ...textStyle(19, THEME.css.muted, { align: 'center' }),
        wordWrap: { width: 720 }
      })
      .setOrigin(0.5);
    this.drawChoiceCard(548, 470, '休息', '回复生命', 'rest', `回复 ${this.restAmount()} 点生命。`, 'rest');
    this.drawChoiceCard(988, 470, '强化', '升级一张牌', 'relic', '随机强化一张尚未升级的牌。', 'upgrade');
    this.confirmButton = new UIButton(this, 652, 724, 190, 52, '确认选择', () => this.confirmChoice(), {
      fontSize: 22,
      fill: 0x4a3421,
      disabled: true
    }).setName('choice-confirm');
    this.leaveButton = new UIButton(this, 884, 724, 190, 52, '离开营火', () => this.leaveRest(), {
      fontSize: 22,
      fill: 0x302822
    }).setName('rest-leave');
    this.updateChoiceState(this.choiceController.state);
  }

  drawChoiceCard(x, y, title, command, icon, body, id) {
    new UIFrame(this, x, y, 330, 250, { fill: 0x21140f, alpha: 0.94, stroke: THEME.colors.darkGold });
    new UIIcon(this, x, y - 72, icon, { size: 54 });
    this.add.text(x, y - 22, title, titleStyle(28)).setOrigin(0.5);
    this.add
      .text(x, y + 24, body, {
        ...textStyle(17, THEME.css.body, { align: 'center' }),
        wordWrap: { width: 260 }
      })
      .setOrigin(0.5);
    const view = new UIButton(this, x, y + 88, 190, 44, command, () => this.selectChoice(id), {
      fontSize: 20,
      fill: 0x4a3421,
      disabled: !this.choiceController.enabledIds.includes(id)
    });
    view.setName(`rest-choice-${id}`);
    this.choiceViews.push({ id, view });
  }

  selectChoice(id) {
    if (this.uiPaused || this.resolved) return false;
    return this.choiceController?.select(id) ?? false;
  }

  updateChoiceState(state) {
    for (const { id, view } of this.choiceViews ?? []) {
      const selected = state.selectedId === id;
      view.setSelected(selected);
      view.setConfirmed(state.locked && selected);
      view.setDisabled(!state.enabledIds.includes(id) || state.locked);
    }
    this.confirmButton?.setDisabled(state.locked || state.selectedId === null);
    this.leaveButton?.setDisabled(state.locked);
  }

  confirmChoice() {
    if (this.uiPaused || this.resolved) return false;
    const id = this.choiceController?.confirm();
    if (id === null || id === undefined) return false;
    this.playRestFeedback(id);
    if (id === 'rest') this.rest();
    else this.upgrade();
    return true;
  }

  leaveRest() {
    if (this.uiPaused || this.resolved || !this.choiceController?.lock()) return false;
    this.resolved = true;
    this.leaveButton?.setConfirmed(true);
    this.leave();
    return true;
  }

  playRestFeedback(id) {
    const selected = this.choiceViews.find((item) => item.id === id)?.view;
    const feedback = this.add.container(selected?.x ?? 768, (selected?.y ?? 558) - 74).setDepth(32).setName('rest-confirm-feedback');
    if (id === 'rest') {
      feedback.add(this.add.circle(0, 0, 54, 0xf3c568, 0.3));
      feedback.add(this.add.circle(0, 0, 30, 0xffefb2, 0.4));
    } else {
      for (const [x, y, angle] of [[-34, 12, -30], [0, -14, 0], [34, 8, 32]]) {
        feedback.add(this.add.rectangle(x, y, 8, 34, 0xf09a3f, 0.74).setAngle(angle));
      }
    }
    if (!this.motionEnabled) return;
    feedback.setAlpha(0).setScale(0.78);
    this.tweens.add({ targets: feedback, alpha: 1, scale: 1, duration: 220, ease: 'Sine.Out' });
  }

  rest() {
    if (this.uiPaused || this.resolved) return;
    this.resolved = true;
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
    if (this.uiPaused || this.resolved) return;
    this.resolved = true;
    const upgraded = CardSystem.upgradeRandom(this.run);
    if (!upgraded) {
      this.resolved = false;
      addToast(this, '没有可升级的卡牌。', 'error');
      return;
    }
    addToast(this, `强化：${getCard(upgraded.cardId).name}+`);
    this.audio?.play('relic');
    this.leave();
  }

  leave() {
    delete this.run.pendingScene;
    delete this.run.pendingBattleType;
    MapSystem.finishActiveNode(this.run);
    saveActiveRun(this, this.run);
    this.time.delayedCall(350, () => this.scene.start(SCENES.Map));
  }
}
