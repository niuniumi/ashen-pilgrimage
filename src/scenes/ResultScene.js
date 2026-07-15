import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENES } from '../game/constants.js';
import { SaveManager } from '../game/SaveManager.js';
import { buildResultSummary, recordResultStats } from '../game/ResultSummary.js';
import { EndingSystem } from '../systems/EndingSystem.js';
import { THEME, textStyle } from '../game/Theme.js';
import { UIButton } from '../ui/UIButton.js';
import { drawVignette } from '../ui/UIOrnament.js';
import { drawHeroArt } from '../ui/UICharacterArt.js';
import { attachSceneServices, preloadSceneAssets } from './SceneHelpers.js';
import { PIXEL_PALETTE } from '../art/PixelArtSystem.js';
import { PIXEL_DECORATIONS } from '../art/PixelAssetCatalog.js';

class ResultButton extends UIButton {
  getBounds(output = new Phaser.Geom.Rectangle()) {
    const matrix = this.getWorldTransformMatrix();
    const halfWidth = this.widthValue / 2;
    const halfHeight = this.heightValue / 2;
    const corners = [
      matrix.transformPoint(-halfWidth, -halfHeight),
      matrix.transformPoint(halfWidth, -halfHeight),
      matrix.transformPoint(halfWidth, halfHeight),
      matrix.transformPoint(-halfWidth, halfHeight)
    ];
    return Phaser.Geom.Rectangle.FromPoints(corners, output);
  }
}

function formatElapsed(seconds) {
  const value = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(value / 60);
  const remainder = Math.floor(value % 60);
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

function compactName(value, maxLength = 11) {
  const text = String(value ?? '未知卡牌');
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

export default class ResultScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Result);
  }

  init(data) {
    this.victory = Boolean(data?.victory);
    this.resultRun = data?.run ?? null;
  }

  preload() {
    preloadSceneAssets(this, SCENES.Result, {
      run: this.resultRun,
      victory: this.victory,
      restartData: { victory: this.victory, run: this.resultRun },
      title: this.victory ? '整理胜利铭文' : '刻下旅途终点'
    });
  }

  create() {
    attachSceneServices(this);
    this.run = this.resultRun ?? this.registry.get('run') ?? SaveManager.loadRun() ?? {};
    this.ending = EndingSystem.resolve(this.run, this.victory);
    this.summary = buildResultSummary(this.run);
    this.motionEnabled = SaveManager.readSettings().animation !== false;
    this.audio?.startAmbience?.(this.victory ? 'story' : 'defeat');

    this.drawBackdrop();
    this.recordStats();
    const figureRegion = this.drawResultFigure(this.run);
    const narrativeRegion = this.drawNarrativePanel();
    const statsRegion = this.drawStatistics();
    const deckRegion = this.drawDeckSummary();
    this.drawActions();
    this.playEntrance({
      figureTargets: figureRegion.list,
      narrativeTargets: narrativeRegion.list,
      statsTargets: statsRegion.list,
      deckTargets: deckRegion.list
    });
    this.audio?.play(this.victory ? 'victory' : 'defeat');
  }

  createResultRegion(name, targets, depth) {
    return this.add.container(0, 0, targets).setName(name).setDepth(depth);
  }

  drawBackdrop() {
    const g = this.add.graphics().setDepth(0);
    if (this.victory) {
      g.fillGradientStyle(0x100b0d, 0x100b0d, 0x2d1510, 0x130b0d, 1);
      g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      g.fillStyle(0x5d2a18, 0.34);
      g.fillCircle(298, 384, 282);
      g.fillStyle(0xd79d45, 0.12);
      g.fillCircle(298, 384, 210);
      g.fillStyle(0xffdc86, 0.08);
      g.fillCircle(298, 384, 132);
      g.fillStyle(0x090708, 0.62);
      g.fillRect(646, 0, 890, GAME_HEIGHT);
      g.fillStyle(0xb88935, 0.48);
      g.fillRect(640, 0, 4, GAME_HEIGHT);
      g.fillStyle(0x6f291d, 0.74);
      g.fillTriangle(116, 704, 324, 204, 504, 704);
      g.fillStyle(0x171014, 0.82);
      g.fillTriangle(146, 704, 324, 276, 470, 704);
      this.addVictoryEmbers();
    } else {
      g.fillGradientStyle(0x090a0e, 0x0c0b10, 0x191017, 0x08080b, 1);
      g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      g.fillStyle(0x171923, 0.9);
      g.fillTriangle(0, 174, 498, 72, 654, 316);
      g.fillStyle(0x25222c, 0.64);
      g.fillTriangle(0, 320, 420, 158, 684, 386);
      g.fillStyle(0x08080b, 0.68);
      g.fillRect(646, 0, 890, GAME_HEIGHT);
      g.fillStyle(0x76232a, 0.7);
      g.fillRect(640, 0, 4, 306);
      g.fillRect(640, 348, 4, 516);
      g.fillStyle(0x27151b, 0.48);
      g.fillEllipse(292, 706, 590, 138);
      this.addDefeatStorm();
    }
    g.fillStyle(0x070607, 0.76);
    g.fillRect(0, 786, GAME_WIDTH, 78);
    drawVignette(this, 3);
  }

  addVictoryEmbers() {
    const embers = this.add.graphics().setDepth(2);
    const points = [
      [118, 616, 4], [168, 532, 3], [218, 638, 4], [276, 486, 3],
      [338, 594, 4], [392, 442, 3], [454, 612, 4], [516, 520, 3]
    ];
    embers.fillStyle(0xe6ad55, 0.72);
    for (const [x, y, size] of points) embers.fillRect(x, y, size, size * 2);
    if (!this.motionEnabled) return;
    this.tweens.add({
      targets: embers,
      y: -12,
      alpha: 0.46,
      duration: 1900,
      ease: 'Sine.InOut',
      yoyo: true,
      repeat: -1
    });
  }

  addDefeatStorm() {
    const fog = this.add.graphics().setDepth(2);
    fog.fillStyle(0x30323d, 0.25);
    fog.fillEllipse(306, 620, 660, 90);
    fog.fillStyle(0x4b343e, 0.18);
    fog.fillEllipse(170, 548, 440, 68);
    if (!this.motionEnabled) return;
    this.tweens.add({
      targets: fog,
      x: 24,
      alpha: 0.68,
      duration: 3600,
      ease: 'Sine.InOut',
      yoyo: true,
      repeat: -1
    });
    const strike = () => {
      if (!this.scene.isActive()) return;
      const localLight = this.add
        .triangle(484, 144, 0, -116, -92, 132, 104, 132, 0xc8ccd8, 0.14)
        .setDepth(11)
        .setName('defeat-lightning-local');
      const lightning = this.add.graphics().setDepth(12);
      lightning.lineStyle(4, 0xc8ccd8, 0.72);
      lightning.beginPath();
      lightning.moveTo(516, 36);
      lightning.lineTo(478, 114);
      lightning.lineTo(512, 142);
      lightning.lineTo(448, 242);
      lightning.strokePath();
      this.tweens.add({
        targets: [localLight, lightning],
        alpha: 0,
        duration: 180,
        ease: 'Sine.Out',
        onComplete: () => {
          localLight.destroy();
          lightning.destroy();
        }
      });
      this.time.delayedCall(3600 + Phaser.Math.Between(0, 2200), strike);
    };
    this.time.delayedCall(1200, strike);
  }

  drawResultFigure(run) {
    const targets = [];
    const ground = this.add.ellipse(326, 692, 516, 82, 0x060507, 0.78);
    const groundGlow = this.add.ellipse(326, 680, 386, 38, this.victory ? 0x9f5d27 : 0x5f2027, 0.32);
    targets.push(ground, groundGlow);

    if (this.victory) {
      const haloOuter = this.add.circle(304, 354, 208, 0x000000, 0).setStrokeStyle(2, 0xe6bd6a, 0.12);
      const haloMid = this.add.circle(304, 354, 166, 0x000000, 0).setStrokeStyle(2, 0xe6bd6a, 0.34);
      const haloInner = this.add.circle(304, 354, 148, 0x000000, 0).setStrokeStyle(4, 0xb88935, 0.58);
      const haloRays = this.add.graphics();
      haloRays.lineStyle(2, 0xe6bd6a, 0.34);
      for (let index = 0; index < 8; index += 1) {
        const angle = (Math.PI * 2 * index) / 8;
        haloRays.lineBetween(
          304 + Math.cos(angle) * 178,
          354 + Math.sin(angle) * 178,
          304 + Math.cos(angle) * 208,
          354 + Math.sin(angle) * 208
        );
      }
      const hero = drawHeroArt(this, run.characterId ?? 'exiled-knight', 324, 650, 1.08, {
        idle: false,
        battle: true,
        generatedHeight: 438
      }).setDepth(7);
      const flame = this.add.graphics().setDepth(8);
      flame.fillStyle(0x9f4b24, 0.96);
      flame.fillTriangle(116, 658, 142, 584, 166, 658);
      flame.fillStyle(0xe0a64d, 1);
      flame.fillTriangle(126, 658, 144, 606, 158, 658);
      flame.fillStyle(0xffdda0, 1);
      flame.fillRect(138, 638, 10, 20);
      flame.fillStyle(0x24100c, 1);
      flame.fillRect(112, 658, 58, 8);
      const caption = this.add.text(82, 718, '余火仍在行者身后燃烧', textStyle(18, '#dfc98e', { strokeThickness: 4 })).setDepth(8);
      targets.push(haloOuter, haloMid, haloInner, haloRays, hero, flame, caption);
      return this.createResultRegion('result-figure', targets, 5);
    }

    const tombstone = PIXEL_DECORATIONS.defeatTombstone;
    if (this.textures.exists(tombstone.key)) {
      const displayHeight = tombstone.displayHeight ?? 560;
      const displayWidth = Math.round(displayHeight * ((tombstone.sourceWidth ?? 400) / (tombstone.sourceHeight ?? 640)));
      const image = this.add.image(324, 688, tombstone.key).setOrigin(0.5, 1).setDepth(7);
      image.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
      image.setDisplaySize(displayWidth, displayHeight).setName('defeat-tombstone-art');
      this.tombstoneArt = image;
      targets.push(image);
    } else {
      const fallback = this.add.graphics().setDepth(7);
      fallback.fillStyle(PIXEL_PALETTE.iron, 1);
      fallback.fillRect(228, 270, 192, 390);
      fallback.fillStyle(PIXEL_PALETTE.ironLight, 1);
      fallback.fillRect(244, 286, 160, 18);
      fallback.fillStyle(PIXEL_PALETTE.black, 0.72);
      fallback.fillRect(260, 324, 128, 300);
      fallback.fillStyle(PIXEL_PALETTE.blood, 0.9);
      fallback.fillRect(196, 632, 52, 34);
      targets.push(fallback);
    }
    const caption = this.add.text(82, 718, '烛火已灭，灰烬记得来路', textStyle(18, '#c4b7ae', { strokeThickness: 4 })).setDepth(8);
    targets.push(caption);
    return this.createResultRegion('result-figure', targets, 5);
  }

  drawNarrativePanel() {
    const accent = this.victory ? '#d2a656' : '#a34b52';
    const eyebrow = this.add
      .text(700, 48, this.victory ? '圣途终章 / VICTORY' : '旅途止步 / DEFEAT', textStyle(16, accent, { strokeThickness: 3 }))
      .setDepth(8);
    const title = this.add
      .text(700, 78, this.ending.title, textStyle(50, THEME.css.paleGold, { strokeThickness: 7 }))
      .setDepth(8);
    const subtitle = this.add
      .text(704, 142, this.ending.subtitle, textStyle(19, THEME.css.body, { strokeThickness: 4 }))
      .setDepth(8);
    const body = this.add
      .text(704, 178, this.ending.body, {
        ...textStyle(17, THEME.css.muted, { strokeThickness: 4 }),
        wordWrap: { width: 720, useAdvancedWrap: true },
        maxLines: 2
      })
      .setDepth(8);
    const outcomeRule = this.add.rectangle(1078, 225.5, 756, 3, this.victory ? THEME.colors.candle : THEME.colors.blood, 0.8);
    const ironRule = this.add.rectangle(1078, 231.5, 756, 1, THEME.colors.iron, 0.42);
    return this.createResultRegion('result-narrative', [eyebrow, title, subtitle, body, outcomeRule, ironRule], 7);
  }

  drawStatistics() {
    const background = this.drawSectionGround(700, 275, 360, 380, this.victory ? 0x2a1b13 : 0x21161b);
    const heading = this.add.text(720, 296, '旅途统计', textStyle(25, THEME.css.paleGold, { strokeThickness: 5 })).setDepth(8);
    const rule = this.add.rectangle(875, 334, 310, 2, this.victory ? THEME.colors.candle : THEME.colors.blood, 0.62);
    const rows = [
      ['行者', this.run.characterName ?? '未知行者'],
      ['抵达', this.summary.progress],
      ['击败', `${this.summary.kills} 名敌人`],
      ['遗物 / 誓约', `${this.summary.relics} / ${this.summary.vows}`],
      ['最终金币', `${this.summary.gold}`],
      ['旅途用时', formatElapsed(this.summary.elapsed)]
    ];
    const targets = [...background, heading, rule];
    rows.forEach(([label, value], index) => {
      const y = 354 + index * 47;
      const labelText = this.add.text(720, y, label, textStyle(15, '#9e9188', { strokeThickness: 3 })).setDepth(8);
      const valueText = this.add
        .text(1034, y - 2, compactName(value, 15), textStyle(18, THEME.css.body, { strokeThickness: 4, align: 'right' }))
        .setOrigin(1, 0)
        .setDepth(8);
      targets.push(labelText, valueText);
    });
    return this.createResultRegion('result-stats', targets, 6);
  }

  drawDeckSummary() {
    const background = this.drawSectionGround(1100, 275, 360, 380, this.victory ? 0x241812 : 0x1c151a);
    const heading = this.add.text(1120, 296, '最终牌组', textStyle(25, THEME.css.paleGold, { strokeThickness: 5 })).setDepth(8);
    const count = Array.isArray(this.run.deck) ? this.run.deck.length : 0;
    const total = this.add.text(1438, 302, `${count} 张`, textStyle(15, '#a89a8e', { strokeThickness: 3, align: 'right' })).setOrigin(1, 0).setDepth(8);
    const rule = this.add.rectangle(1275, 334, 310, 2, this.victory ? THEME.colors.candle : THEME.colors.blood, 0.62);
    const targets = [...background, heading, total, rule];
    if (!this.summary.deckGroups.length) {
      const empty = this.add.text(1120, 364, '牌组记录缺失', textStyle(17, THEME.css.muted, { strokeThickness: 3 })).setDepth(8);
      targets.push(empty);
      return this.createResultRegion('result-deck', targets, 6);
    }
    this.summary.deckGroups.forEach((group, index) => {
      const y = 354 + index * 29;
      const label = group.overflow
        ? `另有 ${group.count} 张卡牌`
        : `${compactName(group.name)}${group.upgraded ? ' +' : ''}`;
      const name = this.add
        .text(1120, y, label, textStyle(16, group.overflow ? '#a99a91' : THEME.css.body, { strokeThickness: 3 }))
        .setDepth(8);
      targets.push(name);
      if (!group.overflow) {
        const quantity = this.add
          .text(1434, y, `×${group.count}`, textStyle(16, group.upgraded ? '#e1b45d' : '#9f9389', { strokeThickness: 3, align: 'right' }))
          .setOrigin(1, 0)
          .setDepth(8);
        targets.push(quantity);
      }
    });
    return this.createResultRegion('result-deck', targets, 6);
  }

  drawSectionGround(x, y, width, height, fill) {
    return [
      this.add.rectangle(x + width / 2, y + height / 2, width, height, fill, 0.66),
      this.add.rectangle(x + width / 2, y + height - 6, width, 12, 0x050506, 0.42),
      this.add.rectangle(x + 1, y + height / 2, 2, height, THEME.colors.iron, 0.3)
    ];
  }

  drawActions() {
    const rule = this.add.rectangle(1078, 709, 756, 2, THEME.colors.iron, 0.38).setName('result-actions-rule');
    const caption = this.add.text(700, 728, this.victory ? '圣途已完成' : '灰烬仍可重燃', textStyle(15, '#8f8178', { strokeThickness: 3 })).setDepth(8);
    const restart = new ResultButton(this, 1040, 776, 236, 56, '再次启程', () => {
      SaveManager.clearRun();
      this.registry.remove('run');
      this.scene.start(SCENES.CharacterSelect);
    }, { fontSize: 22, fill: this.victory ? 0x56361f : 0x4b252a }).setName('result-action-restart');
    const menu = new ResultButton(this, 1328, 776, 236, 56, '返回主菜单', () => {
      SaveManager.clearRun();
      this.registry.remove('run');
      this.scene.start(SCENES.MainMenu);
    }, { fontSize: 22, fill: 0x30282a }).setName('result-action-menu');
    return this.createResultRegion('result-actions', [rule, caption, restart, menu], 8);
  }

  playEntrance({ figureTargets, narrativeTargets, statsTargets, deckTargets }) {
    if (!this.motionEnabled) return;
    this.revealTargets(figureTargets, -18, 0);
    this.revealTargets(narrativeTargets, 20, 45);
    this.revealTargets(statsTargets, 16, 100);
    this.revealTargets(deckTargets, 16, 145);
  }

  revealTargets(targets, offsetX, delay) {
    for (const target of targets) {
      target.x += offsetX;
      target.setAlpha(0);
      this.tweens.add({
        targets: target,
        x: target.x - offsetX,
        alpha: 1,
        duration: 320,
        delay,
        ease: 'Cubic.Out'
      });
    }
  }

  recordStats() {
    const result = recordResultStats(SaveManager.readSettings(), this.run, this.victory);
    if (result.recorded) SaveManager.saveSettings(result.settings);
  }
}
