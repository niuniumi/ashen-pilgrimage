import Phaser from 'phaser';
import { COLORS, SCENES } from '../game/constants.js';
import { SaveManager } from '../game/SaveManager.js';
import { THEME, textStyle, titleStyle } from '../game/Theme.js';
import { UIButton } from '../ui/UIButton.js';
import { UIFrame } from '../ui/UIFrame.js';
import { drawDivider } from '../ui/UIOrnament.js';
import { addBackButton, addToast, attachSceneServices, drawGameBackdrop } from './SceneHelpers.js';

const FONT = 'Georgia, "Microsoft YaHei", serif';

export default class SettingsScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Settings);
  }

  create() {
    attachSceneServices(this);
    this.audio?.startAmbience?.('menu');
    this.settings = SaveManager.readSettings();
    this.render();
  }

  render() {
    this.children.removeAll(true);
    drawGameBackdrop(this, 'menu');
    this.add.text(768, 58, '设置', { ...titleStyle(44), color: '#76512a', stroke: '#f8ecd5', strokeThickness: 4 }).setOrigin(0.5);
    this.add.text(768, 104, '声音、体验与旅途记录', textStyle(18, '#66513c', { align: 'center' })).setOrigin(0.5);
    drawDivider(this, 768, 132, 520, { color: 0xb88935, alpha: 0.58 });
    addBackButton(this);
    new UIFrame(this, 768, 466, 820, 568, {
      fill: THEME.colors.parchment,
      alpha: 0.96,
      stroke: THEME.colors.darkGold,
      parchment: true
    });
    this.add.text(570, 230, '声音', { ...titleStyle(22), color: '#604225', stroke: '#f8ecd5', strokeThickness: 3 }).setOrigin(0.5);
    this.add.text(966, 230, '体验', { ...titleStyle(22), color: '#604225', stroke: '#f8ecd5', strokeThickness: 3 }).setOrigin(0.5);

    this.toggleButton(570, 292, '音效', 'sound');
    this.toggleButton(570, 350, '音乐', 'music');
    this.toggleButton(570, 408, '静音', 'muted');
    this.toggleButton(966, 292, '动画', 'animation');
    this.toggleButton(966, 350, '快速模式', 'fastMode');
    this.toggleButton(966, 408, '战斗教程', 'tutorialEnabled');
    this.slider(768, 486, 'BGM 音量', 'bgmVolume', (value) => this.audio?.setBgmVolume?.(value));
    this.slider(768, 552, '音效音量', 'sfxVolume', (value) => this.audio?.setSfxVolume?.(value));

    new UIButton(this, 570, 642, 260, 44, '重新开启教程', () => {
      SaveManager.resetTutorial();
      this.settings = SaveManager.readSettings();
      addToast(this, '教程已重新开启。');
      this.render();
    }, { fontSize: 18 });
    new UIButton(this, 768, 642, 260, 44, '重置序章剧情', () => {
      SaveManager.resetStory();
      this.settings = SaveManager.readSettings();
      addToast(this, '序章剧情已重置。');
      this.render();
    }, { fontSize: 18 });
    new UIButton(this, 966, 642, 260, 44, '清除存档', () => {
      SaveManager.clearRun();
      this.registry.remove('run');
      addToast(this, '存档已清除。');
    }, { fontSize: 18, fill: 0x592626 });
  }

  toggleButton(x, y, label, key) {
    const value = Boolean(this.settings[key]);
    new UIButton(this, x, y, 270, 48, `${label}：${value ? '开启' : '关闭'}`, () => {
      if (key === 'muted') {
        this.audio?.toggleMute?.();
      } else {
        this.settings[key] = !this.settings[key];
        SaveManager.saveSettings(this.settings);
        if (key === 'music') this.audio?.setMusicEnabled?.(this.settings[key]);
      }
      this.settings = SaveManager.readSettings();
      this.render();
    }, { fontSize: 19, fill: value ? COLORS.iron : 0x382c27 });
  }

  slider(x, y, label, key, onChange) {
    const value = Math.max(0, Math.min(1, Number(this.settings[key] ?? 0)));
    this.add
      .text(x - 210, y - 28, `${label} ${Math.round(value * 100)}%`, {
        fontFamily: FONT,
        fontSize: 20,
        color: '#4f3520'
      })
      .setOrigin(0, 0.5);
    const track = this.add.graphics();
    track.lineStyle(8, 0x3c332c, 0.95);
    track.lineBetween(x - 210, y, x + 210, y);
    track.lineStyle(6, 0xd0aa62, 0.88);
    track.lineBetween(x - 210, y, x - 210 + 420 * value, y);
    const knob = this.add.circle(x - 210 + 420 * value, y, 12, 0xf2c86d, 1);
    knob.setStrokeStyle(2, 0x1b120e, 0.82);
    const zone = this.add.zone(x, y, 450, 36).setInteractive({ useHandCursor: true, draggable: true });
    const update = (worldX) => {
      const next = Math.max(0, Math.min(1, (worldX - (x - 210)) / 420));
      this.settings[key] = next;
      SaveManager.saveSettings(this.settings);
      onChange?.(next);
      this.settings = SaveManager.readSettings();
      this.render();
    };
    zone.on('pointerdown', (pointer) => update(pointer.x));
    zone.on('drag', (pointer) => update(pointer.x));
  }
}
