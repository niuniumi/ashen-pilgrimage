import Phaser from 'phaser';
import { getCard } from '../data/cards.js';
import { GAME_HEIGHT, GAME_WIDTH, SCENES } from '../game/constants.js';
import { SaveManager } from '../game/SaveManager.js';
import { formatRunProgress } from '../game/RunProgress.js';
import { EndingSystem } from '../systems/EndingSystem.js';
import { SCENE_TITLES, THEME, textStyle, titleStyle } from '../game/Theme.js';
import { UIButton } from '../ui/UIButton.js';
import { UIFrame } from '../ui/UIFrame.js';
import { UIIcon } from '../ui/UIIcon.js';
import { drawDivider, drawVignette } from '../ui/UIOrnament.js';
import { drawHeroArt } from '../ui/UICharacterArt.js';
import { attachSceneServices } from './SceneHelpers.js';
import { addHandPaintedBackground, addVfxAsset, HANDPAINTED_KEYS } from '../art/HandPaintedAssets.js';
import { PIXEL_PALETTE } from '../art/PixelArtSystem.js';

export default class ResultScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Result);
  }

  init(data) {
    this.victory = Boolean(data?.victory);
    this.resultRun = data?.run ?? null;
  }

  create() {
    attachSceneServices(this);
    this.audio?.startAmbience?.(this.victory ? 'story' : 'defeat');
    this.run = this.resultRun ?? this.registry.get('run') ?? SaveManager.loadRun();
    this.ending = EndingSystem.resolve(this.run, this.victory);
    this.drawBackdrop();
    this.drawHeader();
    new UIFrame(this, 768, 466, 980, 560, {
      fill: THEME.colors.panel,
      alpha: 0.9,
      stroke: this.victory ? THEME.colors.candle : THEME.colors.blood
    });
    this.recordStats();
    this.renderResult();
    this.audio?.play(this.victory ? 'victory' : 'defeat');
  }

  drawBackdrop() {
    if (addHandPaintedBackground(this, HANDPAINTED_KEYS.folioBg, { depth: 0 })) {
      addVfxAsset(this, this.victory ? 'blessingC' : 'dustD', 768, 420, {
        displayWidth: 470,
        displayHeight: 350,
        alpha: this.victory ? 0.34 : 0.26,
        depth: 2
      });
      if (!this.victory) this.addDefeatStorm();
      return;
    }
    const g = this.add.graphics();
    const bottom = this.victory ? 0x3f2718 : 0x2b1414;
    g.fillGradientStyle(0x14101d, 0x14101d, bottom, 0x090606, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    g.fillStyle(0x0d0a08, 0.96);
    g.fillRect(0, 610, GAME_WIDTH, 254);
    if (this.victory) {
      g.fillStyle(0xf1c76a, 0.12);
      g.fillCircle(768, 356, 250);
      for (let i = 0; i < 7; i += 1) {
        g.lineStyle(4, 0xb88935, 0.28);
        g.lineBetween(620 + i * 48, 606, 662 + i * 48, 368);
      }
    } else {
      g.fillStyle(0x090808, 0.94);
      g.fillRoundedRect(610, 334, 84, 256, 14);
      g.fillRoundedRect(846, 356, 92, 234, 14);
      g.fillStyle(0x5a1f25, 0.16);
      g.fillCircle(768, 420, 220);
    }
    drawVignette(this, 3);
    if (!this.victory) this.addDefeatStorm();
  }

  addDefeatStorm() {
    const motionEnabled = SaveManager.readSettings().animation !== false;
    const veil = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x09070a, 0.28).setDepth(1.5);
    const fog = this.add.graphics().setDepth(3);
    fog.fillStyle(0x1a1c26, 0.22);
    fog.fillEllipse(768, 610, 970, 96);
    fog.fillStyle(0x3f2b35, 0.16);
    fog.fillEllipse(610, 525, 520, 80);
    if (!motionEnabled) return;
    this.tweens.add({
      targets: fog,
      x: 40,
      alpha: 0.36,
      yoyo: true,
      repeat: -1,
      duration: 4200,
      ease: 'Sine.InOut'
    });
    this.tweens.add({
      targets: veil,
      alpha: 0.36,
      yoyo: true,
      repeat: -1,
      duration: 2400,
      ease: 'Sine.InOut'
    });
    const strike = () => {
      const lightning = this.add.graphics().setDepth(18);
      lightning.lineStyle(5, 0xe8eef7, 0.86);
      lightning.beginPath();
      lightning.moveTo(1030, 70);
      lightning.lineTo(988, 144);
      lightning.lineTo(1032, 170);
      lightning.lineTo(966, 260);
      lightning.lineTo(1008, 286);
      lightning.lineTo(926, 394);
      lightning.strokePath();
      lightning.lineStyle(2, 0x8797ff, 0.58);
      lightning.lineBetween(1000, 176, 936, 212);
      lightning.lineBetween(983, 286, 908, 318);
      this.cameras.main.flash(110, 210, 220, 255, false);
      this.tweens.add({
        targets: lightning,
        alpha: 0,
        duration: 210,
        ease: 'Sine.Out',
        onComplete: () => lightning.destroy()
      });
      this.time.delayedCall(2800 + Phaser.Math.Between(0, 2400), strike);
    };
    this.time.delayedCall(900, strike);
  }

  drawHeader() {
    this.add.text(768, 52, this.ending.title, titleStyle(48)).setOrigin(0.5);
    this.add.text(768, 98, this.ending.subtitle, textStyle(19, THEME.css.muted, { align: 'center' })).setOrigin(0.5);
    drawDivider(this, 768, 126, 520, { color: this.victory ? THEME.colors.candle : THEME.colors.blood });
  }

  recordStats() {
    const settings = SaveManager.readSettings();
    const stats = settings.stats ?? { victories: 0, failures: 0, highestFloor: 0 };
    if (!settings.lastResultRecorded || settings.lastResultRecorded !== this.run?.id) {
      if (this.victory) stats.victories += 1;
      else stats.failures += 1;
      stats.highestFloor = Math.max(stats.highestFloor ?? 0, this.run?.highestFloor ?? this.run?.floor ?? 0);
      settings.stats = stats;
      settings.lastResultRecorded = this.run?.id ?? `result-${Date.now()}`;
      SaveManager.saveSettings(settings);
    }
  }

  renderResult() {
    const run = this.run ?? {};
    const elapsed = run.startTime ? Math.max(1, Math.round((Date.now() - run.startTime) / 1000)) : 0;
    const deckNames = this.formatDeckNames((run.deck ?? []).slice(0, 18));

    this.drawResultFigure(run);
    this.add
      .text(768, 216, this.victory ? '灰白圣火已经沉寂。' : '余火没能抵达王城。', titleStyle(29))
      .setOrigin(0.5);
    this.add
      .text(768, 258, this.ending.body, {
        ...textStyle(17, THEME.css.muted, { align: 'center' }),
        wordWrap: { width: 690 }
      })
      .setOrigin(0.5);

    new UIFrame(this, 720, 414, 330, 250, { fill: 0x21140f, alpha: 0.92, stroke: THEME.colors.darkGold });
    this.add.text(720, 318, '旅途统计', titleStyle(25)).setOrigin(0.5);
    this.add
      .text(580, 360, `使用角色：${run.characterName ?? '未知'}\n到达进度：${formatRunProgress(run)}\n击败敌人：${run.kills ?? 0}\n遗物 / 誓约：${run.relics?.length ?? 0} / ${run.vows?.length ?? 0}\n最终金币：${run.gold ?? 0}\n用时：${elapsed} 秒`, {
        ...textStyle(20, THEME.css.body, { lineSpacing: 9 }),
        wordWrap: { width: 300 }
      })
      .setOrigin(0, 0);

    new UIFrame(this, 1040, 548, 280, 220, { fill: 0x21140f, alpha: 0.92, stroke: THEME.colors.darkGold });
    this.add.text(1040, 468, '最终卡组', titleStyle(25)).setOrigin(0.5);
    this.add
      .text(920, 508, deckNames || '无', {
        ...textStyle(17, THEME.css.muted, { lineSpacing: 6 }),
        wordWrap: { width: 240 }
      })
      .setOrigin(0, 0);

    new UIButton(this, 660, 735, 190, 54, '再来一局', () => {
      SaveManager.clearRun();
      this.registry.remove('run');
      this.scene.start(SCENES.CharacterSelect);
    }, { fontSize: 23, fill: 0x4a3421 });
    new UIButton(this, 884, 735, 190, 54, '返回主菜单', () => {
      SaveManager.clearRun();
      this.registry.remove('run');
      this.scene.start(SCENES.MainMenu);
    }, { fontSize: 23, fill: 0x302822 });
  }

  drawResultFigure(run) {
    if (this.victory) {
      drawHeroArt(this, run.characterId ?? 'exiled-knight', 420, 476, 0.88, { idle: false, battle: true, generatedHeight: 320 });
      new UIIcon(this, 420, 652, 'flame', { size: 72 });
      return;
    }
    const g = this.add.graphics().setDepth(6);
    g.fillStyle(PIXEL_PALETTE.void, 0.72);
    g.fillRect(288, 632, 264, 20);
    g.fillStyle(0x24272d, 1);
    g.fillRect(356, 406, 128, 208);
    g.fillRect(372, 382, 96, 28);
    g.fillRect(388, 366, 64, 20);
    g.fillStyle(0x56606a, 1);
    g.fillRect(364, 414, 112, 12);
    g.fillRect(364, 430, 8, 168);
    g.fillStyle(0x11131a, 0.72);
    g.fillRect(380, 446, 80, 136);
    g.fillStyle(PIXEL_PALETTE.goldDark, 0.7);
    g.fillRect(412, 466, 16, 84);
    g.fillRect(388, 494, 64, 16);
    g.fillStyle(PIXEL_PALETTE.blood, 0.86);
    g.fillRect(324, 594, 28, 20);
    g.fillRect(488, 584, 36, 24);
    g.fillStyle(PIXEL_PALETTE.bone, 0.72);
    g.fillRect(332, 574, 4, 24);
    g.fillRect(504, 566, 4, 24);
  }

  formatDeckNames(deck) {
    const lines = [];
    let line = '';
    for (const card of deck) {
      const name = `${getCard(card.cardId).name}${card.upgraded ? '+' : ''}`;
      const next = line ? `${line}、${name}` : name;
      if (next.length > 18 && line) {
        lines.push(line);
        line = name;
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
    return lines.join('\n');
  }

}
