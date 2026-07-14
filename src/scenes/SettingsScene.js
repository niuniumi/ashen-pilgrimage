import Phaser from 'phaser';
import { COLORS, SCENES } from '../game/constants.js';
import { SaveManager } from '../game/SaveManager.js';
import { THEME, textStyle, titleStyle } from '../game/Theme.js';
import { UIButton } from '../ui/UIButton.js';
import { UIFrame } from '../ui/UIFrame.js';
import { drawDivider } from '../ui/UIOrnament.js';
import { addBackButton, addToast, attachSceneServices, drawGameBackdrop, preloadSceneAssets } from './SceneHelpers.js';
import { FONT } from '../design/textStyles.js';
import { PIXEL_PALETTE, snapPixel } from '../art/PixelArtSystem.js';


export default class SettingsScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Settings);
  }

  preload() {
    preloadSceneAssets(this, SCENES.Settings, { title: '整理旅途设置' });
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
    this.add.text(768, 58, '设置', { ...titleStyle(44), color: '#f4e7c5', stroke: '#08090d', strokeThickness: 6 }).setOrigin(0.5);
    this.add.text(768, 104, '声音、体验与旅途记录', textStyle(18, '#b99862', { align: 'center' })).setOrigin(0.5);
    drawDivider(this, 768, 132, 520, { color: 0xb88935, alpha: 0.58 });
    addBackButton(this);
    new UIFrame(this, 768, 466, 820, 568, {
      fill: THEME.colors.parchment,
      alpha: 0.96,
      stroke: THEME.colors.darkGold,
      parchment: true
    });
    this.add.text(570, 230, '声音', { ...titleStyle(22), color: '#f4e7c5', stroke: '#08090d', strokeThickness: 3 }).setOrigin(0.5);
    this.add.text(966, 230, '体验', { ...titleStyle(22), color: '#f4e7c5', stroke: '#08090d', strokeThickness: 3 }).setOrigin(0.5);

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
    const labelText = this.add
      .text(x - 210, y - 28, `${label} ${Math.round(value * 100)}%`, {
        fontFamily: FONT,
        fontSize: 20,
        color: '#d6c7a5'
      })
      .setOrigin(0, 0.5);
    const track = this.add.graphics();
    const knob = this.add.rectangle(snapPixel(x - 210 + 420 * value), y, 20, 20, PIXEL_PALETTE.candle, 1);
    knob.setStrokeStyle(4, PIXEL_PALETTE.void, 1);
    const zone = this.add.zone(x, y, 450, 36).setInteractive({ useHandCursor: true, draggable: true });
    const drawValue = (next) => {
      track.clear();
      track.fillStyle(PIXEL_PALETTE.iron, 1);
      track.fillRect(x - 210, y - 4, 420, 8);
      track.fillStyle(PIXEL_PALETTE.gold, 1);
      track.fillRect(x - 210, y - 4, snapPixel(420 * next), 8);
      knob.x = snapPixel(x - 210 + 420 * next);
      labelText.setText(`${label} ${Math.round(next * 100)}%`);
    };
    const update = (worldX) => {
      const next = Math.max(0, Math.min(1, (worldX - (x - 210)) / 420));
      this.settings[key] = next;
      SaveManager.saveSettings(this.settings);
      onChange?.(next);
      drawValue(next);
    };
    drawValue(value);
    zone.on('pointerdown', (pointer) => update(pointer.x));
    zone.on('drag', (pointer) => update(pointer.x));
  }
}
