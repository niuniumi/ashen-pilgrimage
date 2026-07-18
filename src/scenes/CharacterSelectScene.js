import Phaser from 'phaser';
import { CHARACTER_SELECT_PORTRAIT } from '../art/ActorPresentation.js';
import { drawPixelHero } from '../art/PixelActorFactory.js';
import { PIXEL_PALETTE, drawPixelPanel } from '../art/PixelArtSystem.js';
import { characters } from '../data/characters.js';
import { SCENES } from '../game/constants.js';
import { drawRebuiltCharacterSelectBackdrop } from '../art/RebuiltVisualFactory.js';
import { createNewRun } from '../game/GameState.js';
import { SaveManager } from '../game/SaveManager.js';
import { SCENE_TITLES, THEME, textStyle, titleStyle } from '../game/Theme.js';
import { CharacterSelectInputController } from '../input/CharacterSelectInputController.js';
import { UIButton } from '../ui/UIButton.js';
import { UIFrame } from '../ui/UIFrame.js';
import { drawBackArrowButton, drawDivider } from '../ui/UIOrnament.js';
import { addToast, attachSceneServices, preloadSceneAssets } from './SceneHelpers.js';

export default class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super(SCENES.CharacterSelect);
  }

  preload() {
    preloadSceneAssets(this, SCENES.CharacterSelect, { title: '整理旅者名册' });
  }

  create() {
    this.characterInput?.destroy();
    this.characterInput = null;
    this.runStarting = false;
    attachSceneServices(this);
    this.audio?.startAmbience?.('menu');
    this.motionEnabled = SaveManager.readSettings().animation !== false;
    this.selected = null;
    this.cards = [];
    this.drawBackdrop();
    this.addHeader();
    this.createCharacterSelectionLayout();
    this.installCharacterInput();
  }

  drawBackdrop() {
    drawRebuiltCharacterSelectBackdrop(this);
  }

  addHeader() {
    this.addHeaderParchment();
  }

  createCharacterSelectionLayout() {
    this.createDetailPanel();
    const layout = [
      { x: 300, y: 462 },
      { x: 640, y: 462 },
      { x: 980, y: 462 }
    ];
    characters.forEach((character, index) => this.createNewCharacterCard(character, layout[index].x, layout[index].y, index));
    this.startButton = new UIButton(this, 1324, 798, 236, 56, '开始旅途', () => this.startRun(), {
      fontSize: 24,
      disabled: false,
      fill: 0x31515a
    });
    this.startButton.setDepth(26);
    this.selectCharacter(characters[0].id, { silent: true, animate: false });
    this.playCardEntranceSequence();
  }

  installCharacterInput() {
    const controller = new CharacterSelectInputController(characters.map((character) => character.id), {
      selectedId: this.selected,
      onSelect: (characterId) => this.selectCharacter(characterId),
      onConfirm: () => this.startRun(),
      onBack: () => this.returnToMenu(true)
    });
    this.characterInput = controller;
    controller.install(this.input.keyboard);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      controller.destroy();
      if (this.characterInput === controller) this.characterInput = null;
    });
  }

  createDetailPanel() {
    this.detailPanel = new UIFrame(this, 1324, 454, 280, 592, {
      fill: 0x1b1d24,
      alpha: 0.94,
      stroke: 0x566675,
      strokeAlpha: 0.78,
      parchment: false
    });
    this.detailPanel.setDepth?.(20);
    this.add
      .text(1324, 188, '行者札记', {
        ...titleStyle(28),
        color: '#f4e7c5',
        stroke: '#08090d',
        strokeThickness: 4
      })
      .setOrigin(0.5)
      .setDepth(22);
    drawDivider(this, 1324, 224, 210, { color: 0xb88935, alpha: 0.56 }).setDepth?.(22);
    this.detailName = this.add
      .text(1210, 262, '', {
        ...titleStyle(25),
        color: '#ffd36a',
        stroke: '#08090d',
        strokeThickness: 3,
        wordWrap: { width: 226 }
      })
      .setOrigin(0, 0)
      .setDepth(22);
    this.detailBody = this.add
      .text(1210, 324, '', {
        ...textStyle(16, '#d6c7a5', { lineSpacing: 6 }),
        stroke: '#08090d',
        strokeThickness: 2,
        wordWrap: { width: 232, useAdvancedWrap: true }
      })
      .setOrigin(0, 0)
      .setDepth(22);
  }

  createNewCharacterCard(character, x, y, index) {
    const w = 286;
    const h = 580;
    const accent = character.id === 'candle-nun' ? 0xd0a24f : character.id === 'ashblood-alchemist' ? 0x35706b : 0x91303a;
    const container = this.add.container(x, y).setDepth(12);
    const panel = new UIFrame(this, 0, 0, w, h, {
      fill: 0x1b1d24,
      alpha: 0.96,
      stroke: accent,
      strokeAlpha: 0.74,
      parchment: false
    });
    container.add(panel);

    const artFrame = new UIFrame(this, 0, -45, CHARACTER_SELECT_PORTRAIT.frameWidth, CHARACTER_SELECT_PORTRAIT.frameHeight, {
      fill: 0x2c3540,
      alpha: 0.78,
      stroke: accent,
      strokeAlpha: 0.58,
      parchment: false
    });
    container.add(artFrame);

    const selectionGlow = this.add.graphics().setAlpha(0);
    selectionGlow.lineStyle(4, THEME.colors.candle, 0.9);
    selectionGlow.strokeRect(
      -CHARACTER_SELECT_PORTRAIT.frameWidth / 2 + 2,
      -45 - CHARACTER_SELECT_PORTRAIT.frameHeight / 2 + 2,
      CHARACTER_SELECT_PORTRAIT.frameWidth - 4,
      CHARACTER_SELECT_PORTRAIT.frameHeight - 4
    );
    container.add(selectionGlow);

    const art = this.createCharacterCardArt(character.id, 0, -45);
    container.add(art);

    container.add(
      this.add
        .text(0, -250, character.name, {
          ...titleStyle(29),
          color: '#f4e7c5',
          stroke: '#08090d',
          strokeThickness: 4
        })
        .setOrigin(0.5)
    );
    container.add(drawDivider(this, 0, -215, 218, { color: 0xb88935, alpha: 0.58 }));
    const selectionMark = this.add
      .text(112, -188, '◆', {
        ...textStyle(16, '#ffd36a', { align: 'center', strokeThickness: 2 }),
        stroke: '#08090d'
      })
      .setOrigin(0.5)
      .setAlpha(0);
    container.add(selectionMark);
    container.add(
      this.add
        .text(0, 146, character.mechanic, {
          ...titleStyle(22),
          color: '#ffd36a',
          stroke: '#08090d',
          strokeThickness: 3
        })
        .setOrigin(0.5)
    );
    container.add(drawDivider(this, 0, 188, 190, { color: accent, alpha: 0.36 }));
    this.addDeckTagsParchment(container, character);

    const hit = this.add.zone(x, y, w, h).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const card = {
      container,
      panel,
      hit,
      character,
      art,
      selectionGlow,
      selectionMark,
      baseY: y,
      index,
      hovered: false
    };
    hit.on('pointerover', () => {
      card.hovered = true;
      this.audio?.play('uiHover', { cooldown: 72, variance: 0.025, volume: 0.86 });
      this.syncCharacterCardPresentation(card, true);
      this.updateCharacterDetail(character, true);
    });
    hit.on('pointerout', () => {
      card.hovered = false;
      this.syncCharacterCardPresentation(card, true);
      const selectedCharacter = characters.find((item) => item.id === this.selected);
      if (selectedCharacter) this.updateCharacterDetail(selectedCharacter, true);
    });
    hit.on('pointerup', () => this.selectCharacter(character.id));
    this.cards.push(card);
  }

  createCharacterCardArt(characterId, x, frameCenterY) {
    const y = frameCenterY + CHARACTER_SELECT_PORTRAIT.frameHeight / 2 - CHARACTER_SELECT_PORTRAIT.baselineY - 4;
    const art = drawPixelHero(this, characterId, x, y, 1, {
      artPortrait: true,
      idle: false,
      generatedHeight: CHARACTER_SELECT_PORTRAIT.targetHeight,
      maxWidth: CHARACTER_SELECT_PORTRAIT.maxWidth
    });
    art.setAlpha(0.84);
    return art;
  }

  syncCharacterCardPresentation(card, animate = false) {
    const { art, character, container, panel, selectionGlow, selectionMark } = card;
    const selected = character.id === this.selected;
    const active = selected || card.hovered;
    panel.options.stroke = selected ? THEME.colors.candle : card.hovered ? character.palette[2] : THEME.colors.darkGold;
    panel.options.strokeAlpha = selected ? 1 : card.hovered ? 0.92 : 0.68;
    panel.draw();

    const target = {
      y: card.baseY,
      artAlpha: active ? 1 : 0.82,
      glowAlpha: selected ? 0.72 : card.hovered ? 0.28 : 0,
      markAlpha: selected ? 1 : 0
    };
    const apply = () => {
      container.setY(target.y).setScale(1);
      art.setAlpha(target.artAlpha);
      selectionGlow.setAlpha(target.glowAlpha);
      selectionMark.setAlpha(target.markAlpha);
    };
    if (!animate || !this.motionEnabled) {
      apply();
      return;
    }

    this.tweens.killTweensOf(container);
    this.tweens.killTweensOf(art);
    this.tweens.killTweensOf(selectionGlow);
    this.tweens.killTweensOf(selectionMark);
    this.tweens.add({
      targets: container,
      y: target.y,
      duration: 150,
      ease: 'Cubic.Out'
    });
    this.tweens.add({ targets: art, alpha: target.artAlpha, duration: 130, ease: 'Sine.Out' });
    this.tweens.add({ targets: selectionGlow, alpha: target.glowAlpha, duration: 170, ease: 'Sine.Out' });
    this.tweens.add({ targets: selectionMark, alpha: target.markAlpha, duration: 130, ease: 'Sine.Out' });
  }

  playCardEntranceSequence() {
    if (!this.motionEnabled) return;
    this.cards.forEach((card, index) => {
      const finalY = card.container.y;
      card.container.setY(finalY + 18).setAlpha(0);
      this.tweens.add({
        targets: card.container,
        y: finalY,
        alpha: 1,
        delay: 70 + index * 90,
        duration: 260,
        ease: 'Cubic.Out'
      });
    });
  }

  updateCharacterDetail(character, active = true) {
    if (!this.detailName || !this.detailBody) return;
    this.detailName.setText(active ? character.name : '选择一名行者');
    this.detailBody.setText(
      active
        ? [
            '战斗定位',
            character.role,
            '',
            `核心机制  ${character.mechanic}`,
            character.mechanicText,
            '',
            `生命：${character.maxHp ?? character.hp}  ·  能量：${character.energyMax ?? character.energy}`,
            `上手难度  ${character.difficulty}`,
            '',
            `建议：${character.recommendation}`
          ].join('\n')
        : ['三名行者通往灰白圣火的道路不同。', '', '移入角色卡查看完整立绘、机制说明与初始牌组。'].join('\n')
    );
    if (this.motionEnabled && active) {
      this.tweens.killTweensOf([this.detailName, this.detailBody]);
      this.detailName.setAlpha(0.55);
      this.detailBody.setAlpha(0.55);
      this.tweens.add({ targets: [this.detailName, this.detailBody], alpha: 1, duration: 150, ease: 'Sine.Out' });
    }
  }

  addHeaderParchment() {
    const [title, subtitle] = SCENE_TITLES.character;
    this.add
      .text(768, 58, title, {
        ...titleStyle(42),
        color: '#8b6734',
        stroke: '#f7ecd5',
        strokeThickness: 4
      })
      .setOrigin(0.5);
    this.add
      .text(768, 104, subtitle, {
        ...textStyle(19, '#66513c', { align: 'center' }),
        stroke: '#f7ecd5',
        strokeThickness: 2
      })
      .setOrigin(0.5);
    drawDivider(this, 768, 132, 520, { color: 0xb88935, alpha: 0.56 });
    drawBackArrowButton(this, 126, 808, '返回', () => this.returnToMenu(), {
      width: 180,
      height: 54,
      fontSize: 20,
      depth: 28
    });
  }

  addDeckTagsParchment(container, character) {
    const entries = this.deckEntries(character);
    const tag = this.add.graphics();
    drawPixelPanel(tag, 0, 238, 244, 40, {
      fill: PIXEL_PALETTE.paperDark,
      inner: PIXEL_PALETTE.black,
      stroke: PIXEL_PALETTE.goldDark,
      dither: false
    });
    const text = this.add
      .text(0, 238, `牌组  ${entries.join(' · ')}`, {
        ...textStyle(13, '#d6c7a5', { align: 'center', strokeThickness: 2 }),
        stroke: '#08090d'
      })
      .setOrigin(0.5);
    container.add([tag, text]);
  }

  deckEntries(character) {
    const counts = {};
    character.startingDeck.forEach((id) => {
      counts[id] = (counts[id] ?? 0) + 1;
    });
    const nameMap = {
      'knight-cleave': '劈砍',
      'knight-block': '格挡',
      'knight-rend': '撕裂',
      'nun-flame': '烛火',
      'nun-prayer-shield': '祷盾',
      'nun-confession-mark': '忏悔',
      'alc-acid-vial': '酸蚀',
      'alc-leather-guard': '护具',
      'alc-forbidden-test': '禁药'
    };
    return Object.entries(counts)
      .slice(0, 3)
      .map(([id, count]) => `${nameMap[id] ?? id} x${count}`);
  }

  selectCharacter(characterId, options = {}) {
    if (!characters.some((character) => character.id === characterId)) return false;
    if (this.characterInput && this.characterInput.selectedId !== characterId) {
      return this.characterInput.setSelected(characterId);
    }
    const changed = this.selected !== characterId;
    this.selected = characterId;
    if (!options.silent && changed) this.audio?.play('cardSelect', { variance: 0.02, volume: 0.92 });
    this.startButton.setDisabled(false);
    const selectedCharacter = characters.find((item) => item.id === characterId);
    if (selectedCharacter) this.updateCharacterDetail(selectedCharacter, true);
    this.cards.forEach((card) => {
      this.syncCharacterCardPresentation(card, options.animate !== false);
    });
    return true;
  }

  startRun() {
    if (this.runStarting) return;
    if (!this.selected) {
      addToast(this, '请先选择一名行者。', 'error');
      return;
    }
    if (this.characterInput && !this.characterInput.locked && !this.characterInput.lock()) return;
    this.runStarting = true;
    this.startButton.setDisabled(true);
    this.audio?.play('uiClick', { cooldown: 120, volume: 0.9 });
    SaveManager.clearRun();
    this.registry.remove('run');
    const run = createNewRun(this.selected);
    run.pendingScene = 'vow';
    this.registry.set('run', run);
    SaveManager.saveRun(run);
    this.scene.start(SCENES.Vow);
  }

  returnToMenu(inputLocked = false) {
    if (!inputLocked && this.characterInput && !this.characterInput.lock()) return;
    this.audio?.play('uiClick', { cooldown: 120, volume: 0.82 });
    this.scene.start(SCENES.MainMenu);
  }
}
