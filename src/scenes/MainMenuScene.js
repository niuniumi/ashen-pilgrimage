import Phaser from 'phaser';
import { BUILD_TIME, BUILD_VERSION, GAME_WIDTH, SCENES } from '../game/constants.js';
import { drawRebuiltMenuBackdrop } from '../art/RebuiltVisualFactory.js';
import { SCENE_TITLES, textStyle, titleStyle } from '../game/Theme.js';
import { SaveManager } from '../game/SaveManager.js';
import { restoreBattleCheckpoint } from '../game/BattleCheckpoint.js';
import { getRunResumeTarget } from '../game/RunResume.js';
import { UIButton } from '../ui/UIButton.js';
import { UIDialog } from '../ui/UIDialog.js';
import { UIFrame } from '../ui/UIFrame.js';
import { drawHeroArt } from '../ui/UICharacterArt.js';
import { drawDivider } from '../ui/UIOrnament.js';
import { addToast, attachSceneServices, preloadSceneAssets } from './SceneHelpers.js';
import { HANDPAINTED_KEYS, hasTexture } from '../art/HandPaintedAssets.js';
import { bindMenuInput } from '../input/MenuInputController.js';

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super(SCENES.MainMenu);
  }

  preload() {
    preloadSceneAssets(this, SCENES.MainMenu, { title: '点燃主菜单' });
  }

  create() {
    attachSceneServices(this);
    this.audio?.startAmbience?.('menu');
    this.drawBackdrop();
    this.addJourneyFirelight();
    this.addJourneyMicroMotion();
    this.addTitle();
    this.addMenu();
    this.installMenuInput();
  }

  drawBackdrop() {
    drawRebuiltMenuBackdrop(this);
  }

  hasJourneyBackdrop() {
    return hasTexture(this, HANDPAINTED_KEYS.menuJourneyBgV2) || hasTexture(this, HANDPAINTED_KEYS.menuJourneyBg);
  }

  addTitle() {
    this.addTitleParchment();
  }

  addMenu() {
    this.addMenuParchment();
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
    this.add
      .text(720, 92, title, {
        ...titleStyle(68),
        color: '#f4e7c5',
        stroke: '#08090d',
        strokeThickness: 8
      })
      .setOrigin(0.5)
      .setDepth(5);
    this.add
      .text(720, 154, subtitle, {
        ...textStyle(26, '#d0a24f'),
        stroke: '#08090d',
        strokeThickness: 5
      })
      .setOrigin(0.5)
      .setDepth(5);
    drawDivider(this, 720, 194, 390, { color: 0xd0a24f, alpha: 0.9 }).setDepth?.(5);
    this.add
      .text(720, 235, '余烬照亮旅途，也照见每一次抉择。', {
        ...textStyle(19, '#d6c7a5'),
        stroke: '#08090d',
        strokeThickness: 4,
        align: 'center'
      })
      .setOrigin(0.5)
      .setDepth(5);
    this.add
      .text(720, 294, '穿过暮鸦村、墓园与修道院，整理牌组，\n点亮营火，寻找灰白圣火的源头。', {
        ...textStyle(18, '#b99862'),
        stroke: '#08090d',
        strokeThickness: 4,
        lineSpacing: 8,
        align: 'center',
        wordWrap: { width: 520 }
      })
      .setOrigin(0.5)
      .setDepth(5);
  }

  addMenuParchment() {
    const menuX = 1192;
    const hasRun = SaveManager.hasRun();
    const frame = new UIFrame(this, menuX, 472, 360, 520, {
      fill: 0x1b1d24,
      alpha: 0.94,
      stroke: 0xd0a24f
    });
    frame.setDepth(5);
    this.add.text(menuX, 244, '旅途菜单', titleStyle(30)).setOrigin(0.5).setDepth(6);
    drawDivider(this, menuX, 282, 268, { color: 0xd0a24f, alpha: 0.84 }).setDepth?.(6);
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
    this.menuItems = buttons.map(([label, action, disabled], index) => {
      const button = new UIButton(this, menuX, 326 + index * 54, 280, 42, label, action, {
        disabled,
        fontSize: 19,
        fill: label === '开始新旅程' ? 0x35706b : 0x2c3540
      });
      button.setDepth(7);
      return { label, action, disabled, button };
    });
    this.add
      .text(GAME_WIDTH - 72, 824, `${BUILD_VERSION} · ${BUILD_TIME}`, textStyle(13, '#85745c'))
      .setOrigin(1, 0.5)
      .setDepth(6);
  }

  installMenuInput() {
    this.menuInputCleanup?.();
    const items = this.menuItems ?? [];
    if (items.length === 0) return;
    const binding = bindMenuInput(this.input.keyboard, items, {
      announce: (label) => this.accessibility?.announce?.(`旅途菜单：${label}`),
      onSelection: (index) => { this.menuSelectedIndex = index; }
    });
    const clearActions = this.accessibility?.setActions?.(SCENES.MainMenu, items.map((item) => ({
      label: item.label,
      disabled: item.disabled,
      onActivate: item.action
    })));
    let active = true;
    const cleanup = () => {
      if (!active) return;
      active = false;
      binding.cleanup();
      clearActions?.();
      this.events.off(Phaser.Scenes.Events.SHUTDOWN, cleanup);
      if (this.menuInputCleanup === cleanup) this.menuInputCleanup = null;
    };
    this.menuInputCleanup = cleanup;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
  }

  addJourneyFirelight() {
    if (this.textures.exists('pixel-bg-menu')) {
      const glow = this.add.graphics().setDepth(3);
      glow.fillStyle(0xf4b45b, 0.08);
      glow.fillRect(456, 652, 208, 104);
      glow.fillStyle(0xffe7a8, 0.05);
      glow.fillRect(492, 672, 136, 64);
      this.tweens.add({ targets: glow, alpha: 0.48, yoyo: true, repeat: -1, duration: 1520, ease: 'Sine.InOut' });
      for (let i = 0; i < 10; i += 1) {
        const spark = this.add.rectangle(520 + ((i * 23) % 90), 700 + ((i * 17) % 36), i % 3 === 0 ? 6 : 4, 4, i % 2 ? 0xffdd8a : 0xf2a65d, 0.5).setDepth(7);
        this.tweens.add({
          targets: spark,
          x: spark.x + (i % 2 ? 12 : -8),
          y: spark.y - 42 - (i % 3) * 10,
          alpha: 0,
          duration: 1500 + (i % 5) * 220,
          delay: i * 150,
          repeat: -1,
          ease: 'Linear'
        });
      }
      return;
    }
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
    if (this.textures.exists('pixel-bg-menu')) {
      for (let i = 0; i < 16; i += 1) {
        const mote = this.add.rectangle(360 + ((i * 83) % 520), 330 + ((i * 61) % 300), 4, 4, i % 2 ? 0xf1c76a : 0x7bb5a1, 0.18).setDepth(8);
        this.tweens.add({
          targets: mote,
          x: mote.x + (i % 2 ? 24 : -16),
          y: mote.y - 16 + (i % 3) * 8,
          alpha: 0.04 + (i % 4) * 0.04,
          yoyo: true,
          repeat: -1,
          duration: 2300 + (i % 6) * 360,
          delay: i * 90,
          ease: 'Linear'
        });
      }
      return;
    }
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
    }
    const target = getRunResumeTarget(run, { checkpoint });
    this.scene.start(target.sceneKey, target.data);
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
