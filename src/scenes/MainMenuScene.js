import Phaser from 'phaser';
import { BUILD_TIME, BUILD_VERSION, GAME_WIDTH, SCENES } from '../game/constants.js';
import { drawRebuiltMenuBackdrop } from '../art/RebuiltVisualFactory.js';
import { SCENE_TITLES, THEME, textStyle, titleStyle } from '../game/Theme.js';
import { SaveManager } from '../game/SaveManager.js';
import { restoreBattleCheckpoint } from '../game/BattleCheckpoint.js';
import { addAmbientAsh } from '../effects/AmbientParticles.js';
import { UIButton } from '../ui/UIButton.js';
import { UIDialog } from '../ui/UIDialog.js';
import { UIFrame } from '../ui/UIFrame.js';
import { drawHeroArt } from '../ui/UICharacterArt.js';
import { drawCandle, drawDivider, drawVignette } from '../ui/UIOrnament.js';
import { addToast, attachSceneServices } from './SceneHelpers.js';
import { HANDPAINTED_KEYS, hasTexture } from '../art/HandPaintedAssets.js';

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super(SCENES.MainMenu);
  }

  create() {
    attachSceneServices(this);
    this.audio?.startAmbience?.('menu');
    this.drawBackdrop();
    this.addJourneyFirelight();
    this.addJourneyMicroMotion();
    if (!this.hasJourneyBackdrop()) this.addHeroStudy();
    this.addTitle();
    this.addMenu();
  }

  drawBackdrop() {
    drawRebuiltMenuBackdrop(this);
    return;
    const g = this.add.graphics();
    g.fillGradientStyle(0x17111f, 0x17111f, 0x4a2a25, 0x1a0f0c, 1);
    g.fillRect(0, 0, 1536, 864);
    g.fillStyle(0x72503c, 0.16);
    g.fillEllipse(650, 385, 850, 180);
    this.drawCloud(g, 500, 175, 1.1);
    this.drawCloud(g, 950, 145, 0.86);
    g.fillStyle(0x272338, 0.78);
    g.fillTriangle(0, 590, 300, 320, 620, 590);
    g.fillTriangle(410, 590, 810, 260, 1200, 590);
    g.fillStyle(0x15141d, 0.92);
    g.fillTriangle(100, 610, 360, 370, 650, 610);
    g.fillTriangle(680, 610, 1010, 310, 1320, 610);
    this.drawVillage(g);
    this.drawCamp(g);
    drawVignette(this, 3);
    addAmbientAsh(this, { count: 58, depth: 4 });
  }

  hasJourneyBackdrop() {
    return hasTexture(this, HANDPAINTED_KEYS.menuJourneyBgV2) || hasTexture(this, HANDPAINTED_KEYS.menuJourneyBg);
  }

  drawCloud(g, x, y, scale) {
    g.fillStyle(0xd2b989, 0.08);
    g.fillEllipse(x, y, 180 * scale, 44 * scale);
    g.fillEllipse(x + 70 * scale, y + 8 * scale, 230 * scale, 38 * scale);
    g.fillEllipse(x - 90 * scale, y + 12 * scale, 150 * scale, 34 * scale);
  }

  drawVillage(g) {
    g.fillStyle(0x0d0d12, 0.94);
    for (let i = 0; i < 7; i += 1) {
      const x = 690 + i * 70;
      const h = 96 + (i % 3) * 32;
      g.fillRect(x, 548 - h, 46, h);
      g.fillTriangle(x - 10, 548 - h, x + 23, 500 - h, x + 56, 548 - h);
      g.fillStyle(0xf1c76a, 0.16);
      g.fillRect(x + 16, 520 - h + (i % 2) * 22, 7, 18);
      g.fillStyle(0x0d0d12, 0.94);
    }
    g.fillRect(1050, 322, 64, 226);
    g.fillTriangle(1025, 322, 1082, 250, 1138, 322);
    g.fillRect(1082, 228, 42, 106);
    g.fillTriangle(1062, 228, 1103, 154, 1144, 228);
  }

  drawCamp(g) {
    g.fillStyle(0x170d0a, 1);
    g.fillRect(0, 585, 1536, 279);
    g.fillStyle(0x362017, 0.88);
    g.fillRect(0, 585, 1536, 62);
    for (let i = 0; i < 40; i += 1) {
      g.fillStyle(0x7a5832, 0.22);
      g.fillEllipse(45 + ((i * 83) % 1360), 632 + ((i * 31) % 180), 12 + (i % 8), 3 + (i % 4));
    }
    g.fillStyle(0x0b0908, 0.85);
    g.fillEllipse(368, 732, 320, 42);
    g.fillStyle(0x382013, 0.95);
    g.fillCircle(365, 692, 92);
    g.fillStyle(0x4f2a17, 0.95);
    g.fillTriangle(318, 704, 366, 575, 420, 704);
    g.fillStyle(THEME.colors.candle, 0.96);
    g.fillTriangle(337, 705, 370, 613, 408, 705);
    g.fillStyle(0xe5672d, 0.88);
    g.fillTriangle(360, 706, 384, 642, 428, 706);
    drawCandle(this, 208, 590, 1.2);
    drawCandle(this, 252, 620, 0.8);
  }

  addTitle() {
    this.addTitleParchment();
    return;
    const [title, subtitle] = SCENE_TITLES.menu;
    this.add.text(120, 130, title, titleStyle(78)).setOrigin(0, 0.5);
    this.add.text(128, 198, subtitle, textStyle(30, '#cfa65b')).setOrigin(0, 0.5);
    drawDivider(this, 320, 238, 390);
    this.add
      .text(128, 286, '穿过暮鸦村、墓园与修道院，寻找灰白圣火的源头。', {
        ...textStyle(22, '#e6cf9b'),
        wordWrap: { width: 560 }
      })
      .setOrigin(0, 0.5);
  }

  addMenu() {
    this.addMenuParchment();
    return;
    new UIFrame(this, 1132, 460, 360, 500, { fill: THEME.colors.panel, alpha: 0.88, stroke: THEME.colors.darkGold });
    this.add.text(1132, 248, '旅途菜单', titleStyle(30)).setOrigin(0.5);
    drawDivider(this, 1132, 286, 260);
    const hasRun = SaveManager.hasRun();
    const buttons = [
      ['继续旅途', () => this.continueRun(), !hasRun],
      ['开始新旅程', () => this.startNewJourney(), false],
      ['旅途指南', () => this.scene.start(SCENES.Guide), false],
      ['图鉴', () => this.scene.start(SCENES.Codex), false],
      [this.musicLabel(), () => this.toggleMusic(), false],
      ['设置', () => this.scene.start(SCENES.Settings), false],
      ['制作组', () => this.showCredits(), false],
      ['离开', () => this.showExitNotice(), false]
    ];
    buttons.forEach(([label, action, disabled], index) => {
      new UIButton(this, 1132, 330 + index * 56, 248, 44, label, action, { disabled, fontSize: 21 });
    });
    this.add
      .text(GAME_WIDTH - 86, 818, `${BUILD_VERSION} · ${BUILD_TIME}`, textStyle(15, '#a98b5d'))
      .setOrigin(1, 0.5);
  }

  addHeroStudy() {
    if (this.textures.exists('hp-heroes')) {
      const g = this.add.graphics().setDepth(1);
      g.fillStyle(0xb88935, 0.08);
      g.fillEllipse(708, 472, 514, 622);
      g.lineStyle(1, 0x6d5233, 0.18);
      g.strokeEllipse(710, 470, 548, 652);
      g.lineStyle(2, 0xb88935, 0.25);
      g.lineBetween(488, 758, 852, 760);
      const hero = drawHeroArt(this, 'exiled-knight', 716, 822, 1, {
        idle: false,
        artPortrait: true,
        generatedHeight: 690,
        generatedBottom: 0,
        depth: 2
      });
      hero.setDepth?.(2);
      hero.setAlpha?.(0.96);
      this.tweens.add({ targets: hero, y: 808, duration: 2400, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      return;
    }
    const g = this.add.graphics().setDepth(2);
    g.fillStyle(0x29353a, 0.78);
    g.fillRoundedRect(650, 242, 112, 330, 24);
    g.fillStyle(0x7a2730, 0.72);
    g.fillTriangle(626, 300, 568, 652, 724, 566);
    g.fillTriangle(756, 300, 860, 650, 716, 560);
    g.fillStyle(0xe4caa0, 0.86);
    g.fillRoundedRect(676, 186, 58, 66, 18);
  }

  addTitleParchment() {
    const [title, subtitle] = SCENE_TITLES.menu;
    if (this.hasJourneyBackdrop()) {
      this.add
        .text(720, 92, title, {
          ...titleStyle(68),
          color: '#815f35',
          stroke: '#fff2d7',
          strokeThickness: 6
        })
        .setOrigin(0.5)
        .setDepth(4);
      this.add
        .text(720, 154, subtitle, {
          ...textStyle(28, '#634934'),
          stroke: '#fff2d7',
          strokeThickness: 3
        })
        .setOrigin(0.5)
        .setDepth(4);
      drawDivider(this, 720, 194, 390).setDepth?.(4);
      this.add
        .text(720, 235, '“余烬照亮旅途，也照见每一次抉择。”', {
          ...textStyle(21, '#594638', { align: 'center' }),
          stroke: '#fff2d7',
          strokeThickness: 2
        })
        .setOrigin(0.5)
        .setDepth(4);
      this.add
        .text(720, 294, '穿过暮带村、墓园与修道院，整理牌组，点亮营火，寻找灰白圣火的源头。', {
          ...textStyle(20, '#4f4132', { align: 'center' }),
          stroke: '#fff2d7',
          strokeThickness: 2,
          wordWrap: { width: 520 }
        })
        .setOrigin(0.5)
        .setDepth(4);
      return;
    }
    if (hasTexture(this, HANDPAINTED_KEYS.menuJourneyBg)) {
      this.add
        .text(836, 102, title, {
          ...titleStyle(66),
          color: '#815f35',
          stroke: '#fff2d7',
          strokeThickness: 6
        })
        .setOrigin(0, 0.5)
        .setDepth(4);
      this.add
        .text(846, 164, subtitle, {
          ...textStyle(28, '#634934'),
          stroke: '#fff2d7',
          strokeThickness: 3
        })
        .setOrigin(0, 0.5)
        .setDepth(4);
      drawDivider(this, 1036, 205, 380).setDepth?.(4);
      this.add
        .text(848, 242, '“愿余烬照亮旅途，也照见每一次抉择。”', {
          ...textStyle(21, '#594638', { align: 'left' }),
          stroke: '#fff2d7',
          strokeThickness: 2
        })
        .setOrigin(0, 0.5)
        .setDepth(4);
      this.add
        .text(848, 304, '穿过暮鸦村、墓园与修道院，整理牌组，点亮营火，寻找灰白圣火的源头。', {
          ...textStyle(20, '#4f4132'),
          stroke: '#fff2d7',
          strokeThickness: 2,
          wordWrap: { width: 470 }
        })
        .setOrigin(0, 0.5)
        .setDepth(4);
      return;
    }
    this.add
      .text(112, 132, title, {
        ...titleStyle(74),
        color: '#8b6734',
        stroke: '#f7ecd5',
        strokeThickness: 5
      })
      .setOrigin(0, 0.5)
      .setDepth(4);
    this.add
      .text(124, 198, subtitle, {
        ...textStyle(30, '#6d5233'),
        stroke: '#f7ecd5',
        strokeThickness: 3
      })
      .setOrigin(0, 0.5)
      .setDepth(4);
    drawDivider(this, 318, 238, 390).setDepth?.(4);
    this.add
      .text(152, 257, '“愿余烬照亮旅途，也照见每一次抉择。”', {
        ...textStyle(22, '#66513c', { align: 'center' }),
        stroke: '#f7ecd5',
        strokeThickness: 2
      })
      .setOrigin(0, 0.5)
      .setDepth(4);
    this.add
      .text(128, 320, '穿过暮鸦村、墓园与修道院，整理牌组、点亮营火，寻找灰白圣火的源头。', {
        ...textStyle(21, '#594638'),
        stroke: '#f7ecd5',
        strokeThickness: 2,
        wordWrap: { width: 470 }
      })
      .setOrigin(0, 0.5)
      .setDepth(4);
    this.drawLeftNotes();
  }

  addMenuParchment() {
    if (this.hasJourneyBackdrop()) {
      this.drawJourneyMenuWash(1190, 520, 410, 500);
      this.add
        .text(1190, 292, '旅途菜单', {
          ...titleStyle(34),
          color: '#6b4c2f',
          stroke: '#fff0d2',
          strokeThickness: 4
        })
        .setOrigin(0.5)
        .setDepth(5);
      drawDivider(this, 1190, 336, 300).setDepth?.(5);
      const hasRun = SaveManager.hasRun();
      const buttons = [
        ...(hasRun ? [['继续旅途', () => this.continueRun(), false]] : []),
        ['开始新旅程', () => this.startNewJourney(), false],
        ['旅途指南', () => this.scene.start(SCENES.Guide), false],
        ['图鉴', () => this.scene.start(SCENES.Codex), false],
        [this.musicLabel(), () => this.toggleMusic(), false],
        ['设置', () => this.scene.start(SCENES.Settings), false],
        ['制作组', () => this.showCredits(), false],
        ['离开', () => this.showExitNotice(), false]
      ];
      buttons.forEach(([label, action, disabled], index) => {
        const button = new UIButton(this, 1190, 386 + index * 50, 292, 44, label, action, {
          disabled,
          fontSize: label === '开始新旅程' ? 23 : 21,
          fill: label === '开始新旅程' ? 0x31515a : 0x2f4546
        });
        button.setDepth(6);
      });
      this.add
        .text(GAME_WIDTH - 86, 820, `${BUILD_VERSION} · ${BUILD_TIME}`, {
          ...textStyle(14, '#6a5841'),
          stroke: '#fff1d5',
          strokeThickness: 2
        })
        .setOrigin(1, 0.5)
        .setDepth(4);
      return;
    }
    if (hasTexture(this, HANDPAINTED_KEYS.menuJourneyBg)) {
      this.drawJourneyMenuWash(1200, 548, 340, 416);
      this.add
        .text(1200, 362, '旅途菜单', {
          ...titleStyle(30),
          color: '#6b4c2f',
          stroke: '#fff0d2',
          strokeThickness: 4
        })
        .setOrigin(0.5)
        .setDepth(5);
      drawDivider(this, 1200, 400, 260).setDepth?.(5);
      const hasRun = SaveManager.hasRun();
      const buttons = [
        ...(hasRun ? [['继续旅途', () => this.continueRun(), false]] : []),
        ['开始新旅程', () => this.startNewJourney(), false],
        ['旅途指南', () => this.scene.start(SCENES.Guide), false],
        ['图鉴', () => this.scene.start(SCENES.Codex), false],
        [this.musicLabel(), () => this.toggleMusic(), false],
        ['设置', () => this.scene.start(SCENES.Settings), false],
        ['制作组', () => this.showCredits(), false],
        ['离开', () => this.showExitNotice(), false]
      ];
      buttons.forEach(([label, action, disabled], index) => {
        const button = new UIButton(this, 1200, 448 + index * 50, 238, 40, label, action, {
          disabled,
          fontSize: label === '开始新旅程' ? 21 : 19,
          fill: label === '开始新旅程' ? 0x31515a : 0x2f4546
        });
        button.setDepth(6);
      });
      this.add
        .text(GAME_WIDTH - 86, 820, `${BUILD_VERSION} · ${BUILD_TIME}`, {
          ...textStyle(14, '#6a5841'),
          stroke: '#fff1d5',
          strokeThickness: 2
        })
        .setOrigin(1, 0.5)
        .setDepth(4);
      return;
    }
    this.drawMenuPaper(1132, 456, 360, 500);
    this.add
      .text(1132, 238, '旅途菜单', {
        ...titleStyle(30),
        color: '#725027',
        stroke: '#f8ecd5',
        strokeThickness: 4
      })
      .setOrigin(0.5)
      .setDepth(5);
    drawDivider(this, 1132, 282, 260).setDepth?.(5);
    const hasRun = SaveManager.hasRun();
    const buttons = [
      ['继续旅途', () => this.continueRun(), !hasRun],
      ['开始新旅程', () => this.startNewJourney(), false],
      ['旅途指南', () => this.scene.start(SCENES.Guide), false],
      ['图鉴', () => this.scene.start(SCENES.Codex), false],
      [this.musicLabel(), () => this.toggleMusic(), false],
      ['设置', () => this.scene.start(SCENES.Settings), false],
      ['制作组', () => this.showCredits(), false],
      ['离开', () => this.showExitNotice(), false]
    ];
    buttons.forEach(([label, action, disabled], index) => {
      const button = new UIButton(this, 1132, 326 + index * 56, 248, 44, label, action, {
        disabled,
        fontSize: 21,
        fill: 0x31515a
      });
      button.setDepth(6);
    });
    this.add
      .text(GAME_WIDTH - 86, 818, `${BUILD_VERSION} · ${BUILD_TIME}`, {
        ...textStyle(15, '#7d6546'),
        stroke: '#f7ecd5',
        strokeThickness: 2
      })
      .setOrigin(1, 0.5)
      .setDepth(4);
  }

  addJourneyFirelight() {
    if (this.hasJourneyBackdrop()) {
      const glow = this.add.graphics().setDepth(3);
      glow.fillStyle(0xf4b45b, 0.08);
      glow.fillEllipse(560, 708, 310, 148);
      glow.fillStyle(0xffe7a8, 0.045);
      glow.fillEllipse(560, 696, 220, 102);
      this.tweens.add({
        targets: glow,
        alpha: 0.58,
        scaleX: 1.025,
        scaleY: 1.03,
        yoyo: true,
        repeat: -1,
        duration: 1520,
        ease: 'Sine.InOut'
      });
      for (let i = 0; i < 8; i += 1) {
        const spark = this.add
          .circle(522 + ((i * 23) % 78), 688 + ((i * 17) % 30), 0.8 + (i % 2) * 0.3, i % 2 ? 0xffdd8a : 0xf2a65d, 0.34)
          .setDepth(7);
        this.tweens.add({
          targets: spark,
          x: spark.x + (i % 2 ? 12 : -9),
          y: spark.y - 36 - (i % 3) * 10,
          alpha: 0,
          scale: 0.55,
          duration: 1700 + (i % 5) * 260,
          delay: i * 210,
          repeat: -1,
          ease: 'Sine.Out'
        });
      }
      return;
    }
    if (!hasTexture(this, HANDPAINTED_KEYS.menuJourneyBg)) return;
    const glow = this.add.graphics().setDepth(3);
    glow.fillStyle(0xf4b45b, 0.12);
    glow.fillEllipse(625, 675, 330, 180);
    glow.fillStyle(0xffe7a8, 0.07);
    glow.fillEllipse(628, 662, 230, 120);
    this.tweens.add({
      targets: glow,
      alpha: 0.68,
      scaleX: 1.035,
      scaleY: 1.045,
      yoyo: true,
      repeat: -1,
      duration: 1280,
      ease: 'Sine.InOut'
    });
    for (let i = 0; i < 18; i += 1) {
      const spark = this.add
        .circle(548 + ((i * 31) % 170), 654 + ((i * 17) % 58), 1.2 + (i % 3) * 0.45, i % 2 ? 0xffdd8a : 0xf2a65d, 0.5)
        .setDepth(7);
      this.tweens.add({
        targets: spark,
        x: spark.x + (i % 2 ? 18 : -14),
        y: spark.y - 58 - (i % 4) * 14,
        alpha: 0,
        scale: 0.55,
        duration: 1500 + (i % 5) * 220,
        delay: i * 75,
        repeat: -1,
        ease: 'Sine.Out'
      });
    }
  }

  addJourneyMicroMotion() {
    if (!this.hasJourneyBackdrop()) return;
    const breath = this.add.graphics().setDepth(3);
    breath.fillStyle(0xf1c76a, 0.07);
    breath.fillEllipse(455, 724, 128, 44);
    breath.fillStyle(0xffffff, 0.035);
    breath.fillEllipse(470, 712, 74, 24);
    this.tweens.add({
      targets: breath,
      alpha: 0.42,
      scaleX: 1.08,
      scaleY: 1.12,
      yoyo: true,
      repeat: -1,
      duration: 2600,
      ease: 'Sine.InOut'
    });
    for (let i = 0; i < 18; i += 1) {
      const firefly = this.add
        .circle(420 + ((i * 83) % 460), 382 + ((i * 61) % 240), 1.2 + (i % 3) * 0.35, i % 2 ? 0xf1c76a : 0x9fd7b5, 0.22)
        .setDepth(8);
      this.tweens.add({
        targets: firefly,
        x: firefly.x + (i % 2 ? 26 : -18),
        y: firefly.y - 18 + (i % 3) * 11,
        alpha: 0.04 + (i % 4) * 0.05,
        scale: 1.4,
        yoyo: true,
        repeat: -1,
        duration: 2400 + (i % 6) * 420,
        delay: i * 90,
        ease: 'Sine.InOut'
      });
    }
  }

  drawJourneyMenuWash(x, y, w, h) {
    const g = this.add.graphics().setDepth(3);
    g.fillStyle(0xf4e4c5, 0.22);
    g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 18);
    g.lineStyle(1, 0x8a6a3c, 0.26);
    g.strokeRoundedRect(x - w / 2 + 8, y - h / 2 + 8, w - 16, h - 16, 16);
    g.lineStyle(2, 0xb88935, 0.28);
    g.lineBetween(x - w / 2 + 36, y - h / 2 + 80, x + w / 2 - 36, y - h / 2 + 64);
    g.lineBetween(x - w / 2 + 28, y + h / 2 - 52, x + w / 2 - 42, y + h / 2 - 70);
    g.fillStyle(0xffffff, 0.1);
    g.fillEllipse(x + 22, y - 148, w * 0.76, 52);
    g.fillStyle(0x6b5133, 0.08);
    g.fillEllipse(x - 12, y + 142, w * 0.82, 68);
  }

  drawLeftNotes() {
    const g = this.add.graphics().setDepth(4);
    g.lineStyle(1, 0x7f6340, 0.28);
    g.lineBetween(128, 392, 448, 380);
    g.lineBetween(126, 544, 392, 528);
    g.lineStyle(2, 0xb88935, 0.46);
    g.strokeCircle(188, 464, 42);
    g.lineBetween(188, 428, 188, 500);
    g.lineBetween(158, 464, 218, 464);
    g.strokeCircle(222, 630, 32);
    g.strokeCircle(252, 630, 30);
    this.add
      .text(128, 416, 'Notes', {
        ...textStyle(24, '#7b5e39'),
        fontStyle: 'italic',
        stroke: '#f7ecd5',
        strokeThickness: 2
      })
      .setOrigin(0, 0.5)
      .setDepth(4);
    this.add
      .text(128, 504, '轻装上路，\n让每一张牌都像行囊。', {
        ...textStyle(18, '#66513c', { lineSpacing: 8 }),
        stroke: '#f7ecd5',
        strokeThickness: 2
      })
      .setOrigin(0, 0.5)
      .setDepth(4);
  }

  drawMenuPaper(x, y, w, h) {
    const g = this.add.graphics().setDepth(3);
    g.fillStyle(0x6b5133, 0.18);
    g.fillRoundedRect(x - w / 2 + 8, y - h / 2 + 12, w, h, 12);
    g.fillStyle(0xf3e3c5, 0.94);
    g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 12);
    g.fillStyle(0xffffff, 0.16);
    g.fillRoundedRect(x - w / 2 + 14, y - h / 2 + 14, w - 28, 72, 8);
    g.lineStyle(2, 0xb88935, 0.74);
    g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 12);
    g.lineStyle(1, 0x6b5133, 0.28);
    g.strokeRoundedRect(x - w / 2 + 13, y - h / 2 + 13, w - 26, h - 26, 8);
    for (let i = 0; i < 26; i += 1) {
      g.fillStyle(i % 2 ? 0x7b6040 : 0xffffff, i % 2 ? 0.045 : 0.08);
      g.fillEllipse(x - w / 2 + 24 + ((i * 37) % (w - 48)), y - h / 2 + 24 + ((i * 61) % (h - 48)), 9 + (i % 8), 3 + (i % 4));
    }
  }

  musicLabel() {
    const settings = SaveManager.readSettings();
    return `音乐：${settings.music && !settings.muted ? '开' : '关'}`;
  }

  toggleMusic() {
    const settings = SaveManager.readSettings();
    settings.music = !settings.music;
    if (settings.music) settings.muted = false;
    SaveManager.saveSettings(settings);
    if (settings.music) {
      this.audio?.unlock?.();
      this.audio?.playBgm?.('menu');
    } else {
      this.audio?.stopBgm?.();
    }
    this.scene.restart();
  }

  startNewJourney() {
    this.audio?.unlock?.();
    this.audio?.playBgm?.('menu');
    SaveManager.clearRun();
    this.registry.remove('run');
    const settings = SaveManager.readSettings();
    this.scene.start(settings.storySeen ? SCENES.CharacterSelect : SCENES.Prologue);
  }

  continueRun() {
    this.audio?.unlock?.();
    const run = SaveManager.loadRun();
    if (!run) {
      addToast(this, '存档已损坏，请开始新旅程。', 'error');
      return;
    }
    this.registry.set('run', run);
    const checkpoint = restoreBattleCheckpoint(run);
    if (checkpoint) {
      run.rngState = checkpoint.rngState;
      this.registry.set('run', run);
      this.scene.start(SCENES.Battle, { restoredBattle: checkpoint.battle });
      return;
    }
    this.scene.start(SCENES.Map);
  }

  showCredits() {
    new UIDialog(
      this,
      '制作组',
      '灰烬圣途 · Phaser Canvas 试玩版\n程序化像素美术、卡牌战斗、地图、事件、商店、图鉴与本地存档均在浏览器中运行。\n参考图仅用于风格和色彩方向，不作为整张背景素材。',
      [{ label: '返回', onClick: () => {} }],
      { width: 760, height: 390 }
    );
  }

  showExitNotice() {
    new UIDialog(
      this,
      '离开说明',
      '网页版无法直接关闭浏览器。你可以直接关闭当前标签页，旅途进度会保存在本地浏览器中。',
      [{ label: '知道了', onClick: () => {} }],
      { width: 700, height: 320 }
    );
  }
}
