import Phaser from 'phaser';
import { characters } from '../data/characters.js';
import { SCENES } from '../game/constants.js';
import { drawRebuiltCharacterSelectBackdrop } from '../art/RebuiltVisualFactory.js';
import { createNewRun } from '../game/GameState.js';
import { SaveManager } from '../game/SaveManager.js';
import { SCENE_TITLES, THEME, textStyle, titleStyle } from '../game/Theme.js';
import { UIButton } from '../ui/UIButton.js';
import { UIFrame } from '../ui/UIFrame.js';
import { drawBackArrowButton, drawDivider } from '../ui/UIOrnament.js';
import { addToast, attachSceneServices } from './SceneHelpers.js';
import { addUiAsset, HANDPAINTED_KEYS, hasTexture } from '../art/HandPaintedAssets.js';

export default class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super(SCENES.CharacterSelect);
  }

  create() {
    attachSceneServices(this);
    this.audio?.startAmbience?.('menu');
    this.selected = null;
    this.cards = [];
    this.drawBackdrop();
    this.addHeader();
    this.createCharacterSelectionLayout();
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
    characters.forEach((character, index) => this.createNewCharacterCard(character, layout[index].x, layout[index].y));
    this.startButton = new UIButton(this, 1324, 798, 236, 56, '开始旅途', () => this.startRun(), {
      fontSize: 24,
      disabled: true,
      fill: 0x31515a
    });
    this.startButton.setDepth(26);
    this.updateCharacterDetail(characters[0], false);
  }

  createDetailPanel() {
    this.detailPanel = new UIFrame(this, 1324, 454, 280, 592, {
      fill: 0xf2dfbd,
      alpha: 0.94,
      stroke: 0xb88935,
      strokeAlpha: 0.78,
      parchment: true,
      radius: 12
    });
    this.detailPanel.setDepth?.(20);
    this.add
      .text(1324, 188, '行者札记', {
        ...titleStyle(28),
        color: '#725027',
        stroke: '#f8ecd5',
        strokeThickness: 4
      })
      .setOrigin(0.5)
      .setDepth(22);
    drawDivider(this, 1324, 224, 210, { color: 0xb88935, alpha: 0.56 }).setDepth?.(22);
    this.detailName = this.add
      .text(1210, 262, '', {
        ...titleStyle(25),
        color: '#604225',
        stroke: '#f8ecd5',
        strokeThickness: 3,
        wordWrap: { width: 226 }
      })
      .setOrigin(0, 0)
      .setDepth(22);
    this.detailBody = this.add
      .text(1210, 324, '', {
        ...textStyle(17, '#4f3a28', { lineSpacing: 8 }),
        stroke: '#f8ecd5',
        strokeThickness: 2,
        wordWrap: { width: 226, useAdvancedWrap: true }
      })
      .setOrigin(0, 0)
      .setDepth(22);
    this.detailHint = this.add
      .text(1210, 690, '移入角色卡可展开立绘与说明，点击后锁定选择。', {
        ...textStyle(16, '#70583c', { lineSpacing: 7 }),
        stroke: '#f8ecd5',
        strokeThickness: 2,
        wordWrap: { width: 226, useAdvancedWrap: true }
      })
      .setOrigin(0, 0)
      .setDepth(22);
  }

  createNewCharacterCard(character, x, y) {
    const w = 286;
    const h = 580;
    const container = this.add.container(x, y).setDepth(12);
    const panel = new UIFrame(this, 0, 0, w, h, {
      fill: 0xf2dfbd,
      alpha: 0.96,
      stroke: 0xb88935,
      strokeAlpha: 0.74,
      parchment: true,
      radius: 12
    });
    container.add(panel);

    const artFrame = new UIFrame(this, 0, -45, 244, 326, {
      fill: 0xf6ead1,
      alpha: 0.72,
      stroke: 0xb88935,
      strokeAlpha: 0.46,
      parchment: true,
      radius: 10
    });
    container.add(artFrame);
    const art = this.createCharacterCardFaceImages(character.id, 0, -45, 236, 316);
    container.add([art.front, art.back]);

    container.add(
      this.add
        .text(0, -250, character.name, {
          ...titleStyle(29),
          color: '#725027',
          stroke: '#f8ecd5',
          strokeThickness: 4
        })
        .setOrigin(0.5)
    );
    container.add(drawDivider(this, 0, -215, 218, { color: 0xb88935, alpha: 0.58 }));
    container.add(
      this.add
        .text(0, 146, character.mechanic, {
          ...titleStyle(22),
          color: '#604225',
          stroke: '#f8ecd5',
          strokeThickness: 3
        })
        .setOrigin(0.5)
    );
    container.add(
      this.add
        .text(0, 184, '移入翻开完整立绘', {
          ...textStyle(15, '#70583c', { align: 'center' }),
          stroke: '#f8ecd5',
          strokeThickness: 2,
          wordWrap: { width: 230 }
        })
        .setOrigin(0.5)
    );
    this.addDeckTagsParchment(container, character);

    const hit = this.add.zone(x, y, w, h).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const card = { container, panel, hit, character, baseY: y, frontArt: art.front, backArt: art.back, hovered: false };
    hit.on('pointerover', () => {
      card.hovered = true;
      this.audio?.play('uiHover');
      this.revealCharacterCard(card, true, true);
      this.updateCharacterDetail(character, true);
    });
    hit.on('pointerout', () => {
      card.hovered = false;
      if (this.selected !== character.id) this.revealCharacterCard(card, false, true);
      this.tweens.add({ targets: container, scale: this.selected === character.id ? 1.025 : 1, duration: 130, ease: 'Sine.Out' });
    });
    hit.on('pointerup', () => this.selectCharacter(character.id));
    this.cards.push(card);
  }

  createCharacterCardFaceImages(characterId, x, y, width, height) {
    const ready = this.ensureCharacterCardFaceFrames();
    const frontFrame = `${characterId}-front`;
    const backFrame = `${characterId}-back`;
    if (!ready) {
      throw new Error('generated-character-card-faces-atlas texture is required before rendering character cards');
    }
    const front = this.add
      .image(x, y, 'generated-character-card-faces-atlas', frontFrame)
      .setDisplaySize(width, height)
      .setAlpha(0.98);
    const back = this.add
      .image(x, y, 'generated-character-card-faces-atlas', backFrame)
      .setDisplaySize(width, height)
      .setAlpha(0)
      .setVisible(false);
    return { front, back };
  }

  ensureCharacterCardFaceFrames() {
    if (!this.textures.exists('generated-character-card-faces-atlas')) return false;
    const texture = this.textures.get('generated-character-card-faces-atlas');
    if (texture.has('exiled-knight-front')) return true;
    const source = texture.getSourceImage();
    const totalW = source.width;
    const totalH = source.height;
    const colW = Math.floor(totalW / 3);
    const rowH = Math.floor(totalH / 2);
    const frames = [
      ['exiled-knight-front', 0, 0, colW, rowH],
      ['candle-nun-front', colW, 0, colW, rowH],
      ['ashblood-alchemist-front', colW * 2, 0, totalW - colW * 2, rowH],
      ['exiled-knight-back', 0, rowH, colW, totalH - rowH],
      ['candle-nun-back', colW, rowH, colW, totalH - rowH],
      ['ashblood-alchemist-back', colW * 2, rowH, totalW - colW * 2, totalH - rowH]
    ];
    frames.forEach(([name, x, y, w, h]) => texture.add(name, 0, x, y, w, h));
    return true;
  }

  revealCharacterCard(card, visible, animate = false) {
    const { frontArt, backArt, container } = card;
    if (!frontArt || !backArt) return;
    const apply = () => {
      frontArt.setVisible(!visible);
      frontArt.setAlpha(visible ? 0 : 0.98);
      backArt.setVisible(visible);
      backArt.setAlpha(visible ? 0.98 : 0);
    };
    if (!animate) {
      apply();
      return;
    }
    this.tweens.add({
      targets: container,
      scaleX: 0.94,
      duration: 70,
      ease: 'Sine.In',
      onComplete: () => {
        apply();
        this.tweens.add({
          targets: container,
          scaleX: this.selected === card.character.id ? 1.025 : 1,
          scaleY: this.selected === card.character.id ? 1.025 : 1,
          duration: 120,
          ease: 'Sine.Out'
        });
      }
    });
  }

  updateCharacterDetail(character, active = true) {
    if (!this.detailName || !this.detailBody) return;
    this.detailName.setText(active ? character.name : '选择一名行者');
    this.detailBody.setText(
      active
        ? [
            `定位：${this.wrapPanelText(character.role, 12)}`,
            `机制：${character.mechanic}`,
            `生命：${character.maxHp ?? character.hp}    能量：${character.energyMax ?? character.energy}`,
            `难度：${character.difficulty}`,
            '',
            this.wrapPanelText(character.mechanicText, 13),
            '',
            this.wrapPanelText(character.recommendation, 13)
          ].join('\n')
        : ['三名行者通往灰白圣火的道路不同。', '', '移入角色卡查看完整立绘、机制说明与初始牌组。'].join('\n')
    );
  }

  wrapPanelText(text, limit = 13) {
    const clean = String(text ?? '').replace(/\s+/g, '').trim();
    const lines = [];
    for (let i = 0; i < clean.length; i += limit) {
      lines.push(clean.slice(i, i + limit));
    }
    return lines.join('\n');
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
    drawBackArrowButton(this, 126, 808, '返回', () => this.scene.start(SCENES.MainMenu), {
      width: 180,
      height: 54,
      fontSize: 20,
      depth: 28
    });
  }

  addDeckTagsParchment(container, character) {
    if (!hasTexture(this, HANDPAINTED_KEYS.ui)) {
      throw new Error('hand-painted UI texture is required before rendering character deck tags');
    }
    const entries = this.deckEntries(character);
    entries.forEach((entry, index) => {
      const x = -96 + index * 96;
      const y = 238;
      const tag = addUiAsset(this, 'ribbon', x, y, { displayWidth: 88, displayHeight: 32, alpha: 0.88 });
      const text = this.add
        .text(x, y, entry, {
          ...textStyle(12, '#4f3a28', { align: 'center', strokeThickness: 2 }),
          stroke: '#f8ecd5'
        })
        .setOrigin(0.5);
      container.add([tag, text]);
    });
  }

  deckEntries(character) {
    const counts = {};
    character.startingDeck.forEach((id) => {
      counts[id] = (counts[id] ?? 0) + 1;
    });
    const nameMap = {
      'knight-cleave': '劈砍',
      'knight-block': '格挡',
      'knight-rend': '撕裂斩',
      'nun-flame': '烛火',
      'nun-prayer-shield': '祷盾',
      'nun-confession-mark': '忏悔印',
      'alc-acid-vial': '酸蚀',
      'alc-leather-guard': '皮革护具',
      'alc-forbidden-test': '禁药'
    };
    return Object.entries(counts)
      .slice(0, 3)
      .map(([id, count]) => `${nameMap[id] ?? id} x${count}`);
  }

  selectCharacter(characterId) {
    this.selected = characterId;
    this.audio?.play('cardSelect');
    this.startButton.setDisabled(false);
    const selectedCharacter = characters.find((item) => item.id === characterId);
    if (selectedCharacter) this.updateCharacterDetail(selectedCharacter, true);
    this.cards.forEach((card) => {
      const { container, panel, character, baseY } = card;
      const selected = character.id === characterId;
      panel.options.stroke = selected ? THEME.colors.candle : THEME.colors.darkGold;
      panel.options.strokeAlpha = selected ? 1 : 0.78;
      panel.draw();
      this.revealCharacterCard(card, selected || card.hovered, false);
      this.tweens.add({
        targets: container,
        y: baseY,
        scale: selected ? 1.025 : 1,
        duration: 140,
        ease: 'Sine.Out'
      });
    });
  }

  startRun() {
    if (!this.selected) {
      addToast(this, '请先选择一名行者。', 'error');
      return;
    }
    SaveManager.clearRun();
    this.registry.remove('run');
    const run = createNewRun(this.selected);
    this.registry.set('run', run);
    SaveManager.saveRun(run);
    this.scene.start(SCENES.Vow);
  }
}
