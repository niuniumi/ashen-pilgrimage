import { SCENES } from '../game/constants.js';
import { SaveManager } from '../game/SaveManager.js';
import { MapSystem } from '../systems/MapSystem.js';
import { THEME, textStyle, titleStyle } from '../game/Theme.js';
import { UIButton } from './UIButton.js';
import { UIFrame } from './UIFrame.js';
import { drawDivider } from './UIOrnament.js';

export function installPauseMenu(scene, options = {}) {
  scene.uiPaused = false;
  const menu = new PauseMenu(scene, options);
  scene.pauseMenu = menu;
  scene.input.keyboard?.on('keydown-ESC', () => menu.toggle());
  const button = new UIButton(scene, options.buttonX ?? 1466, options.buttonY ?? 52, 46, 38, 'Ⅱ', () => menu.open(), {
    fontSize: 20,
    tooltip: '暂停',
    ignorePause: true,
    hitDepth: 18000,
    fill: THEME.colors.iron
  });
  return { menu, button };
}

export class PauseMenu {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.options = options;
    this.container = null;
    this.blocker = null;
    this.submenu = 'main';
  }

  toggle() {
    if (this.container) this.close();
    else this.open();
  }

  open() {
    if (this.container) return;
    this.scene.uiPaused = true;
    this.scene.audio?.setBgmDucked?.(true);
    this.scene.audio?.play('pauseOpen');
    this.submenu = 'main';
    this.draw();
  }

  close() {
    this.scene.audio?.play('pauseClose');
    this.container?.destroy();
    this.blocker?.destroy();
    this.container = null;
    this.blocker = null;
    this.scene.uiPaused = false;
    this.scene.audio?.setBgmDucked?.(false);
  }

  redraw(submenu = this.submenu) {
    this.submenu = submenu;
    this.container?.destroy();
    this.blocker?.destroy();
    this.draw();
  }

  draw() {
    const scene = this.scene;
    this.blocker = scene.add.zone(768, 432, 1536, 864).setInteractive().setDepth(19000);
    this.container = scene.add.container(768, 432).setDepth(20000);
    const overlay = scene.add.rectangle(0, 0, 1536, 864, 0x000000, 0.58).setOrigin(0.5);
    const frame = new UIFrame(scene, 0, 0, 570, 560, {
      fill: THEME.colors.panel,
      alpha: 0.97,
      stroke: THEME.colors.darkGold
    });
    const title = scene.add.text(0, -220, this.submenuTitle(), titleStyle(38)).setOrigin(0.5);
    this.container.add([overlay, frame, title, drawDivider(scene, 0, -178, 420)]);
    if (this.submenu === 'settings') this.drawSettings();
    else if (this.submenu === 'guide') this.drawGuide();
    else if (this.submenu === 'confirm-menu') this.drawConfirm('返回主菜单', '当前进度会先保存到本地。确认返回主菜单？', () => this.goMainMenu());
    else if (this.submenu === 'confirm-map') this.drawConfirm('返回地图', '当前战斗进度不会保留。确认返回地图？', () => this.goMap());
    else if (this.submenu === 'confirm-restart') this.drawConfirm('重新开始本局', '这会清除当前旅途并重新选择角色。确认？', () => this.restartRun());
    else if (this.submenu === 'confirm-clear') {
      this.drawConfirm('清除存档', '这会清除当前旅途和设置。确认？', () => {
        SaveManager.clearAll();
        this.scene.registry.remove('run');
        this.goMainMenu();
      });
    }
    else this.drawMain();
  }

  submenuTitle() {
    return {
      main: '暂停',
      settings: '设置',
      guide: '旅途指南',
      'confirm-menu': '确认操作',
      'confirm-map': '确认操作',
      'confirm-restart': '确认操作',
      'confirm-clear': '确认操作'
    }[this.submenu] ?? '暂停';
  }

  addButton(y, label, action, options = {}) {
    const button = new UIButton(this.scene, 0, y, options.width ?? 310, options.height ?? 48, label, action, {
      fontSize: options.fontSize ?? 21,
      fill: options.fill ?? THEME.colors.iron,
      disabled: options.disabled,
      ignorePause: true,
      hitDepth: 21000
    });
    this.container.add(button);
    return button;
  }

  drawMain() {
    this.addButton(-120, '继续游戏', () => this.close());
    this.addButton(-62, '旅途指南', () => this.redraw('guide'));
    this.addButton(-4, '设置', () => this.redraw('settings'));
    this.addButton(54, '返回地图', () => this.redraw('confirm-map'), { disabled: this.options.allowMap === false });
    this.addButton(112, '返回主菜单', () => this.redraw('confirm-menu'), { fill: 0x332a24 });
    this.addButton(170, '重新开始本局', () => this.redraw('confirm-restart'), { fill: 0x4a2522 });
    const hint = this.scene.add.text(0, 236, 'ESC 可打开或关闭暂停菜单', textStyle(16, THEME.css.muted, { align: 'center' })).setOrigin(0.5);
    this.container.add(hint);
  }

  drawGuide() {
    const body = this.scene.add
      .text(-215, -126, '点击卡牌使用；攻击牌需要再点击敌人。\n观察敌人头顶意图，攻击前先考虑防御。\n地图上只能选择发光节点。\n战斗中暂停后不能继续打牌。', {
        ...textStyle(20, THEME.css.body, { lineSpacing: 12 }),
        wordWrap: { width: 430 }
      })
      .setOrigin(0, 0);
    this.container.add(body);
    this.addButton(176, '返回暂停菜单', () => this.redraw('main'));
  }

  drawSettings() {
    this.settings = SaveManager.readSettings();
    const rows = [
      ['音效', 'sound'],
      ['音乐', 'music'],
      ['静音', 'muted'],
      ['动画', 'animation'],
      ['快速模式', 'fastMode']
    ];
    rows.forEach(([label, key], index) => {
      const value = Boolean(this.settings[key]);
      this.addButton(-130 + index * 42, `${label}：${value ? '开启' : '关闭'}`, () => {
        if (key === 'muted') {
          this.scene.audio?.toggleMute?.();
        } else {
          this.settings[key] = !this.settings[key];
          SaveManager.saveSettings(this.settings);
          if (key === 'music') this.scene.audio?.setMusicEnabled?.(this.settings[key]);
        }
        this.redraw('settings');
      }, { fill: value ? THEME.colors.iron : 0x382c27, height: 36, fontSize: 17 });
    });
    this.addSlider(78, 'BGM 音量', 'bgmVolume', (value) => this.scene.audio?.setBgmVolume?.(value));
    this.addSlider(132, '音效音量', 'sfxVolume', (value) => this.scene.audio?.setSfxVolume?.(value));
    this.addButton(188, '重新开启教程', () => {
      SaveManager.resetTutorial();
      this.redraw('settings');
    }, { height: 38, fontSize: 17 });
    this.addButton(234, '清除存档', () => this.redraw('confirm-clear'), { fill: 0x4a2522, height: 38, fontSize: 17 });
    this.addButton(276, '返回暂停菜单', () => this.redraw('main'), { height: 38, fontSize: 17 });
  }

  addSlider(y, label, key, onChange) {
    const value = Math.max(0, Math.min(1, Number(this.settings[key] ?? 0)));
    const labelText = this.scene.add.text(-200, y - 8, `${label} ${Math.round(value * 100)}%`, textStyle(16, THEME.css.body)).setOrigin(0, 0.5);
    const track = this.scene.add.graphics();
    track.lineStyle(6, 0x3c332c, 0.95);
    track.lineBetween(-40, y, 190, y);
    track.lineStyle(4, 0xd0aa62, 0.82);
    track.lineBetween(-40, y, -40 + 230 * value, y);
    const knob = this.scene.add.circle(-40 + 230 * value, y, 9, 0xf2c86d, 1);
    knob.setStrokeStyle(2, 0x1b120e, 0.8);
    const zone = this.scene.add.zone(75, y, 250, 32).setInteractive({ useHandCursor: true, draggable: true });
    const update = (worldX) => {
      const localX = worldX - this.container.x;
      const next = Math.max(0, Math.min(1, (localX + 40) / 230));
      this.settings[key] = next;
      SaveManager.saveSettings(this.settings);
      onChange?.(next);
      this.redraw('settings');
    };
    zone.on('pointerdown', (pointer) => update(pointer.x));
    zone.on('drag', (pointer) => update(pointer.x));
    this.container.add([labelText, track, knob, zone]);
  }

  drawConfirm(title, body, confirmAction) {
    this.container.add(this.scene.add.text(0, -122, title, titleStyle(28)).setOrigin(0.5));
    this.container.add(
      this.scene.add
        .text(0, -34, body, {
          ...textStyle(21, THEME.css.body, { align: 'center', lineSpacing: 10 }),
          wordWrap: { width: 430 }
        })
        .setOrigin(0.5)
    );
    this.addButton(102, '确认', confirmAction, { width: 180, fill: 0x4a2522 });
    this.addButton(166, '取消', () => this.redraw('main'), { width: 180 });
  }

  goMainMenu() {
    const run = this.prepareRunForMapReturn();
    if (run) SaveManager.saveRun(run);
    this.close();
    this.scene.scene.start(SCENES.MainMenu);
  }

  goMap() {
    const run = this.prepareRunForMapReturn();
    if (run) SaveManager.saveRun(run);
    this.close();
    this.scene.scene.start(SCENES.Map);
  }

  prepareRunForMapReturn() {
    const run = this.scene.registry.get('run') ?? SaveManager.loadRun();
    if (!run) return null;
    if (run.map?.activeNode) MapSystem.cancelActiveNode(run);
    this.scene.registry.set('run', run);
    return run;
  }

  restartRun() {
    SaveManager.clearRun();
    this.scene.registry.remove('run');
    this.close();
    this.scene.scene.start(SCENES.CharacterSelect);
  }
}
