import Phaser from 'phaser';
import { getCharacter } from '../data/characters.js';
import { CARD_TYPES, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../game/constants.js';
import { drawRebuiltBattleBackdrop } from '../art/RebuiltVisualFactory.js';
import { SaveManager } from '../game/SaveManager.js';
import { clearBattleCheckpoint, createBattleCheckpoint } from '../game/BattleCheckpoint.js';
import { BattleSystem } from '../systems/BattleSystem.js';
import { computeEnemyLayout, getEnemyVisualMetrics } from '../systems/BattleLayout.js';
import { CardSystem } from '../systems/CardSystem.js';
import { HeroResourceSystem } from '../systems/HeroResourceSystem.js';
import { MapSystem } from '../systems/MapSystem.js';
import { RewardSystem } from '../systems/RewardSystem.js';
import { spawnDamageText } from '../effects/DamageText.js';
import { healEffect } from '../effects/HealEffect.js';
import { shieldEffect } from '../effects/ShieldEffect.js';
import { hitFlash } from '../effects/HitFlash.js';
import { slashEffect } from '../effects/SlashEffect.js';
import { screenShake } from '../effects/ScreenShake.js';
import { showTurnBanner } from '../effects/TurnBanner.js';
import { BattleAnimationDirector } from '../effects/BattleAnimationDirector.js';
import { bossPhaseSurge, hitStop, impactBurst } from '../effects/ImpactFeedback.js';
import { UIButton } from '../ui/UIButton.js';
import { UICard } from '../ui/UICard.js';
import { drawEnemyArt, drawHeroArt } from '../ui/UICharacterArt.js';
import { UIHealthBar } from '../ui/UIHealthBar.js';
import { UIPanel } from '../ui/UIPanel.js';
import { installPauseMenu } from '../ui/PauseMenu.js';
import { addToast, attachSceneServices, getActiveRun, saveActiveRun } from './SceneHelpers.js';
import { addUiAsset, addVfxAsset, HANDPAINTED_KEYS, hasTexture } from '../art/HandPaintedAssets.js';
import { BattleInputController } from '../input/BattleInputController.js';
import { queueLowNoiseBattleAssets } from '../art/LowNoiseBattleAssets.js';

const FONT = 'Georgia, "Microsoft YaHei", serif';

const LAYOUT = {
  status: { x: 96, y: 14, w: 1344, h: 62 },
  stage: { x: 60, y: 104, w: 1088, h: 542, baseline: 564 },
  player: { x: 330, y: 448 },
  enemySingle: { x: 845, y: 448 },
  enemyPair: [
    { x: 748, y: 448 },
    { x: 948, y: 448 }
  ],
  log: { x: 1172, y: 102, w: 320, h: 552 },
  endTurn: { x: 1172, y: 690, w: 320, h: 150, buttonW: 238, buttonH: 64 },
  deck: { x: 112, y: 690, w: 136, h: 150 },
  hand: { x: 272, y: 690, w: 866, h: 150 }
};

const TEXT = {
  primary: '#f4d89c',
  body: '#f6edd0',
  muted: '#c7a96f',
  dim: '#9b835a'
};

function wrapCjkText(text, maxChars = 24) {
  return String(text ?? '')
    .split('\n')
    .map((line) => {
      const chunks = [];
      let current = '';
      for (const char of line) {
        current += char;
        const isPunctuation = /[，。；、：]/.test(char);
        if (current.length >= maxChars || (isPunctuation && current.length >= maxChars - 6)) {
          chunks.push(current.trim());
          current = '';
        }
      }
      if (current.trim()) chunks.push(current.trim());
      return chunks.join('\n');
    })
    .join('\n');
}

export default class BattleScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Battle);
  }

  init(data) {
    this.battleType = data?.battleType ?? 'battle';
    this.restoredBattle = data?.restoredBattle ?? null;
    if (this.restoredBattle?.battleType) this.battleType = this.restoredBattle.battleType;
  }

  preload() {
    const run = this.registry.get('run') ?? SaveManager.loadRun();
    if (!run) return;
    const enemyIds = this.restoredBattle?.enemies?.map((enemy) => enemy.id) ?? this.previewEncounterIds(run);
    queueLowNoiseBattleAssets(this, run.characterId, enemyIds);
  }

  previewEncounterIds(run) {
    const previewRun = structuredClone(run);
    const previewBattle = BattleSystem.createBattle(previewRun, this.battleType);
    return previewBattle.enemies.map((enemy) => enemy.id);
  }

  create() {
    attachSceneServices(this);
    this.run = getActiveRun(this);
    if (!this.run) return;
    this.audio?.startAmbience?.(this.battleType === 'boss' ? 'boss' : `battle-act-${this.run.act ?? 1}`);

    this.selectedUid = null;
    this.keyboardTargetIndex = null;
    this.inputLocked = false;
    this.currentPrompt = '点击一张卡牌使用。';
    this.battle = this.restoredBattle ? structuredClone(this.restoredBattle) : BattleSystem.createBattle(this.run, this.battleType);
    this.battle.player.resource = HeroResourceSystem.normalize(this.run.characterId, this.battle.player.resource);
    this.lastBossPhase = 1;
    this.enemyHitZones = [];
    this.enemyViews = [];
    this.enemyViewsById = new Map();
    this.enemyViewsByUid = new Map();
    this.cardViews = [];

    this.drawBattleBackdrop();
    this.drawStaticBattlefield();
    this.createAutumnWind();
    installPauseMenu(this, { buttonX: 1468, buttonY: 60 });
    this.dynamicLayer = this.add.container(0, 0).setDepth(30);
    this.renderBattle();
    this.animationDirector = new BattleAnimationDirector(this);
    this.inputController = new BattleInputController(this).install();
    this.events.once('shutdown', () => this.inputController?.destroy());
    showTurnBanner(this, '你的回合');
    this.saveCheckpoint();
    this.maybeShowTutorial();
  }

  saveCheckpoint() {
    if (!this.run?.map?.activeNode || !this.battle || this.battle.ended) return false;
    this.run.checkpoint = createBattleCheckpoint(this.run, this.battle, SCENES.Battle);
    saveActiveRun(this, this.run);
    return true;
  }

  drawBattleBackdrop() {
    drawRebuiltBattleBackdrop(this, { layout: LAYOUT, act: this.run?.act ?? 1 });
    return;
    const g = this.add.graphics().setDepth(0);
    g.fillGradientStyle(0x151629, 0x181323, 0x56352a, 0x2d1712, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Distant sky haze.
    g.fillStyle(0x8d5937, 0.13);
    g.fillEllipse(580, 372, 760, 180);
    g.fillStyle(0x1f1b2b, 0.72);
    this.fillMountain(g, [
      [0, 585],
      [160, 470],
      [300, 332],
      [520, 540],
      [725, 365],
      [960, 585]
    ]);
    g.fillStyle(0x292538, 0.82);
    this.fillMountain(g, [
      [92, 585],
      [350, 306],
      [612, 585],
      [900, 250],
      [1130, 585]
    ]);
    g.fillStyle(0x15151e, 0.92);
    this.fillMountain(g, [
      [515, 585],
      [690, 468],
      [880, 337],
      [1080, 585]
    ]);

    this.drawCastleSilhouette(g, 526, 404, 0.82);
    this.drawCastleSilhouette(g, 1002, 360, 1);
    this.drawPineCluster(g, 1120, 570, 0.82);
    this.drawPineCluster(g, 1230, 590, 0.7);

    g.fillStyle(0x201512, 1);
    g.fillRect(0, 574, GAME_WIDTH, 290);
    g.fillStyle(0x3b241b, 0.75);
    g.fillRect(0, 575, GAME_WIDTH, 74);
    g.fillStyle(0x17100e, 0.72);
    g.fillRect(0, 648, GAME_WIDTH, 216);

    this.drawStoneGround(g);

    g.lineStyle(3, 0xb78343, 0.36);
    g.lineBetween(LAYOUT.stage.x + 70, LAYOUT.stage.baseline, LAYOUT.stage.x + LAYOUT.stage.w - 70, LAYOUT.stage.baseline);
    g.lineStyle(1, 0x000000, 0.4);
    g.lineBetween(LAYOUT.stage.x + 70, LAYOUT.stage.baseline + 4, LAYOUT.stage.x + LAYOUT.stage.w - 70, LAYOUT.stage.baseline + 4);

    for (let i = 0; i < 96; i += 1) {
      const x = 30 + ((i * 149) % 1470);
      const y = 112 + ((i * 83) % 560);
      const alpha = 0.11 + ((i % 5) * 0.035);
      g.fillStyle(i % 3 === 0 ? 0xf3bd67 : 0x7c593d, alpha);
      g.fillCircle(x, y, 1 + (i % 4));
    }

    this.drawVignette(g);

    // Static ash specks are used here because Phaser Canvas can report transient
    // null texture sources for particle emitters during automated scene swaps.
  }

  fillMountain(g, points) {
    g.beginPath();
    g.moveTo(points[0][0], points[0][1]);
    points.slice(1).forEach(([x, y]) => g.lineTo(x, y));
    g.lineTo(points[points.length - 1][0], 585);
    g.lineTo(points[0][0], 585);
    g.closePath();
    g.fillPath();
  }

  drawCastleSilhouette(g, x, y, scale = 1) {
    g.fillStyle(0x101017, 0.88);
    g.fillRect(x, y, 52 * scale, 122 * scale);
    g.fillRect(x + 64 * scale, y - 36 * scale, 46 * scale, 158 * scale);
    g.fillRect(x + 122 * scale, y + 20 * scale, 78 * scale, 102 * scale);
    g.fillTriangle(x - 8 * scale, y, x + 26 * scale, y - 58 * scale, x + 60 * scale, y);
    g.fillTriangle(x + 54 * scale, y - 36 * scale, x + 87 * scale, y - 114 * scale, x + 122 * scale, y - 36 * scale);
    g.fillTriangle(x + 116 * scale, y + 20 * scale, x + 160 * scale, y - 46 * scale, x + 210 * scale, y + 20 * scale);
    g.fillStyle(0xf3bd67, 0.18);
    g.fillRect(x + 18 * scale, y + 45 * scale, 8 * scale, 20 * scale);
    g.fillRect(x + 82 * scale, y + 18 * scale, 7 * scale, 18 * scale);
  }

  drawPineCluster(g, x, y, scale = 1) {
    g.fillStyle(0x090b0e, 0.9);
    for (let i = 0; i < 4; i += 1) {
      const tx = x + i * 42 * scale;
      const h = (140 - i * 17) * scale;
      g.fillRect(tx - 9 * scale, y - h + 58 * scale, 18 * scale, h * 0.62);
      g.fillTriangle(tx - 60 * scale, y - h + 64 * scale, tx, y - h, tx + 60 * scale, y - h + 64 * scale);
      g.fillTriangle(tx - 72 * scale, y - h + 115 * scale, tx, y - h + 38 * scale, tx + 72 * scale, y - h + 115 * scale);
    }
  }

  drawStoneGround(g) {
    const left = 82;
    const top = 598;
    g.fillStyle(0x2b1a15, 0.92);
    g.fillRoundedRect(left, top, 1000, 52, 8);
    g.lineStyle(2, 0x5f4330, 0.35);
    for (let i = 0; i < 18; i += 1) {
      const x = left + 26 + i * 55;
      g.lineBetween(x, top + 8 + (i % 3) * 7, x + 36, top + 15 + ((i + 1) % 3) * 9);
    }
    for (let i = 0; i < 44; i += 1) {
      const x = 78 + ((i * 67) % 980);
      const y = 620 + ((i * 23) % 160);
      g.fillStyle(i % 2 ? 0x6b4a31 : 0x463023, 0.28);
      g.fillEllipse(x, y, 7 + (i % 5), 3 + (i % 4));
    }
    for (let i = 0; i < 26; i += 1) {
      const x = 95 + ((i * 91) % 960);
      const y = 548 + ((i * 31) % 78);
      g.lineStyle(2, 0x6f6c41, 0.28);
      g.lineBetween(x, y, x + 9, y - 18);
      g.lineBetween(x + 6, y, x + 18, y - 12);
    }
  }

  drawVignette(g) {
    for (let i = 0; i < 8; i += 1) {
      const alpha = 0.035 + i * 0.018;
      g.fillStyle(0x030202, alpha);
      g.fillRect(i * 14, 0, 18, GAME_HEIGHT);
      g.fillRect(GAME_WIDTH - 18 - i * 14, 0, 18, GAME_HEIGHT);
      g.fillRect(0, i * 10, GAME_WIDTH, 13);
      g.fillRect(0, GAME_HEIGHT - 13 - i * 10, GAME_WIDTH, 13);
    }
  }

  createAutumnWind() {
    this.windLayer = this.add.container(0, 0).setDepth(12);
    for (let i = 0; i < 22; i += 1) {
      const leaf = this.add.container(0, 0);
      const g = this.add.graphics();
      const color = [0xb9823c, 0x8d5d2f, 0xc59a4d, 0x6f4c2b][i % 4];
      g.fillStyle(color, 0.72);
      g.fillEllipse(0, 0, 16 + (i % 4) * 2, 7 + (i % 3));
      g.lineStyle(1, 0xf2d28b, 0.42);
      g.lineBetween(-7, 0, 8, 0);
      g.lineBetween(0, 0, 5, -4);
      leaf.add(g);
      leaf.setScale(0.44 + (i % 5) * 0.08);
      leaf.setAlpha(0.3 + (i % 4) * 0.09);
      this.windLayer.add(leaf);
      this.startLeafDrift(leaf, i, true);
    }

    for (let i = 0; i < 5; i += 1) {
      const wisp = this.add.graphics();
      wisp.lineStyle(2, 0xd8b474, 0.13);
      wisp.beginPath();
      wisp.moveTo(0, 0);
      wisp.lineTo(44, -8);
      wisp.lineTo(112, 4);
      wisp.lineTo(174, -5);
      wisp.strokePath();
      wisp.setPosition(120 + i * 190, 602 + (i % 2) * 18);
      wisp.setDepth(13);
      this.tweens.add({
        targets: wisp,
        x: wisp.x - 70,
        alpha: 0.02,
        duration: 4200 + i * 360,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut'
      });
    }
  }

  startLeafDrift(leaf, index, stagger = false) {
    const startX = GAME_WIDTH + 40 + Phaser.Math.Between(0, 360);
    const startY = 150 + Phaser.Math.Between(0, 360);
    const endX = -90 - Phaser.Math.Between(0, 180);
    const endY = startY + Phaser.Math.Between(40, 160);
    leaf.setPosition(stagger ? Phaser.Math.Between(80, GAME_WIDTH + 120) : startX, stagger ? Phaser.Math.Between(136, 590) : startY);
    leaf.setAngle(Phaser.Math.Between(-35, 35));
    this.tweens.add({
      targets: leaf,
      x: endX,
      y: endY,
      angle: leaf.angle + (index % 2 ? -240 : 260),
      duration: 7600 + (index % 7) * 740,
      delay: stagger ? index * 110 : Phaser.Math.Between(600, 2400),
      ease: 'Sine.InOut',
      onComplete: () => this.startLeafDrift(leaf, index)
    });
  }

  drawStaticBattlefield() {
    const status = LAYOUT.status;
    new UIPanel(this, status.x + status.w / 2, status.y + status.h / 2, status.w, status.h, {
      fill: 0x151719,
      alpha: 0.82,
      stroke: 0x8a6a35,
      strokeAlpha: 0.76,
      lineWidth: 2,
      radius: 7
    });

    this.goldText = this.add.text(status.x + 52, status.y + 20, '', this.statusTextStyle(19)).setOrigin(0, 0.5);
    this.nodeText = this.add.text(status.x + 52, status.y + 43, '', this.statusTextStyle(15, TEXT.muted)).setOrigin(0, 0.5);
    this.turnText = this.add.text(768, status.y + 32, '', this.statusTextStyle(22)).setOrigin(0.5);
    this.relicText = this.add.text(status.x + status.w - 164, status.y + 32, '', this.statusTextStyle(19)).setOrigin(1, 0.5);
    this.settingsButton = new UIButton(this, status.x + status.w - 104, status.y + 32, 70, 36, '设置', () => {
      this.pauseMenu?.open();
      this.pauseMenu?.redraw('settings');
    }, { fontSize: 16, fill: 0x252a2d });

    const log = LAYOUT.log;
    new UIPanel(this, log.x + log.w / 2, log.y + log.h / 2, log.w, log.h, {
      fill: 0x1b1110,
      alpha: 0.88,
      stroke: 0x8a6a35,
      strokeAlpha: 0.78,
      lineWidth: 2,
      radius: 7
    });
    this.add.text(log.x + 24, log.y + 25, '战斗日志', this.panelTitleStyle()).setOrigin(0, 0.5);
    this.add.text(log.x + 24, log.y + 286, '操作提示', this.panelTitleStyle()).setOrigin(0, 0.5);
    const divider = this.add.graphics();
    divider.lineStyle(1, 0x8a6a35, 0.45);
    divider.lineBetween(log.x + 20, log.y + 260, log.x + log.w - 20, log.y + 260);
    divider.lineBetween(log.x + 20, log.y + 322, log.x + log.w - 20, log.y + 322);

    this.logLayer = this.add.container(0, 0);
    this.promptText = this.add
      .text(log.x + 24, log.y + 340, '', {
        fontFamily: FONT,
        fontSize: 18,
        color: TEXT.body,
        lineSpacing: 8,
        wordWrap: { width: log.w - 48 }
      })
      .setOrigin(0, 0);
    this.promptSubText = this.add
      .text(log.x + 24, log.y + 426, '看敌人头顶意图，再决定攻击或防御。', {
        fontFamily: FONT,
        fontSize: 15,
        color: TEXT.dim,
        lineSpacing: 5,
        wordWrap: { width: log.w - 48 }
      })
      .setOrigin(0, 0);

    const hand = LAYOUT.hand;
    new UIPanel(this, hand.x + hand.w / 2, hand.y + hand.h / 2, hand.w, hand.h, {
      fill: 0x160f0d,
      alpha: 0.88,
      stroke: 0x7b5d2d,
      strokeAlpha: 0.74,
      lineWidth: 2,
      radius: 7
    });
    this.add
      .text(hand.x + 20, hand.y + 18, '手牌', {
        fontFamily: FONT,
        fontSize: 17,
        color: TEXT.primary,
        stroke: '#120b08',
        strokeThickness: 3
      })
      .setOrigin(0, 0.5)
      .setVisible(false);
    this.handHintText = this.add
      .text(hand.x + 20, hand.y + 43, '', {
        fontFamily: FONT,
        fontSize: 15,
        color: TEXT.muted,
        lineSpacing: 4,
        wordWrap: { width: 160 }
      })
      .setOrigin(0, 0)
      .setVisible(false);

    const deck = LAYOUT.deck;
    new UIPanel(this, deck.x + deck.w / 2, deck.y + deck.h / 2, deck.w, deck.h, {
      fill: 0x160f0d,
      alpha: 0.88,
      stroke: 0x7b5d2d,
      strokeAlpha: 0.74,
      lineWidth: 2,
      radius: 7
    });
    this.add
      .text(deck.x + deck.w / 2, deck.y + 18, '牌组', {
        fontFamily: FONT,
        fontSize: 16,
        color: TEXT.primary,
        stroke: '#120b08',
        strokeThickness: 3
      })
      .setOrigin(0.5);

    const end = LAYOUT.endTurn;
    const connector = this.add.graphics();
    connector.fillStyle(0x1b1110, 0.55);
    connector.fillRoundedRect(end.x, end.y, end.w, end.h, 8);
    connector.lineStyle(1, 0x7b5d2d, 0.35);
    connector.strokeRoundedRect(end.x, end.y, end.w, end.h, 8);
    this.endTurnButton = new UIButton(
      this,
      end.x + end.w / 2,
      end.y + end.h / 2,
      end.buttonW ?? end.w,
      end.buttonH ?? end.h,
      '结束回合',
      () => this.endTurn(),
      {
        fontSize: 26,
        fill: 0x2c3434,
        tooltip: '结束你的回合，敌人将开始行动。'
      }
    );
  }

  statusTextStyle(size, color = TEXT.primary) {
    return {
      fontFamily: FONT,
      fontSize: size,
      color,
      stroke: '#120b08',
      strokeThickness: 3
    };
  }

  panelTitleStyle() {
    return {
      fontFamily: FONT,
      fontSize: 20,
      color: TEXT.primary,
      stroke: '#120b08',
      strokeThickness: 3
    };
  }

  renderBattle() {
    this.enemyHitZones?.forEach((zone) => zone.destroy());
    this.enemyHitZones = [];
    this.dynamicLayer?.removeAll(true);
    this.enemyViews = [];
    this.enemyViewsById = new Map();
    this.enemyViewsByUid = new Map();
    this.cardViews = [];

    this.goldText.setText(`金币 ${this.run.gold}`);
    this.nodeText.setText(`第 1 章 · 节点 ${Math.max(1, (this.run.floor ?? 0) + 1)}`);
    this.turnText.setText(`第 ${this.battle.turn} 回合 · 能量 ${this.battle.player.energy}/${this.run.baseEnergy}`);
    this.relicText.setText(`遗物 ${this.run.relics.length}`);

    this.renderLog();
    this.renderPlayer();
    this.renderEnemies();
    this.renderHand();
    this.updatePrompt();
    this.endTurnButton.setDisabled(this.inputLocked || this.battle.ended);
  }

  renderLog() {
    this.logLayer.removeAll(true);
    const log = LAYOUT.log;
    const entries = this.battle.log.length > 0 ? this.battle.log.slice(0, 5) : ['你的回合开始。'];
    entries.forEach((entry, index) => {
      const y = log.y + 58 + index * 38;
      const row = this.add.graphics();
      row.fillStyle(index === 0 ? 0x3a2118 : 0x201512, index === 0 ? 0.44 : 0.24);
      row.fillRoundedRect(log.x + 18, y - 7, log.w - 36, 31, 5);
      if (index === 0) {
        row.lineStyle(1, 0xb88935, 0.32);
        row.strokeRoundedRect(log.x + 18, y - 7, log.w - 36, 31, 5);
      }
      const text = this.add
        .text(log.x + 28, y, entry, {
          fontFamily: FONT,
          fontSize: index === 0 ? 16 : 15,
          color: index === 0 ? TEXT.body : TEXT.muted,
          lineSpacing: 3,
          wordWrap: { width: log.w - 58 }
        })
        .setOrigin(0, 0);
      text.setAlpha(Math.max(0.48, 1 - index * 0.13));
      this.logLayer.add(row);
      this.logLayer.add(text);
    });
  }

  renderPlayer() {
    const character = getCharacter(this.run.characterId);
    const holder = this.add.container(LAYOUT.player.x, LAYOUT.player.y);
    const art = this.drawPlayerArt(character);
    holder.artContainer = art;
    holder.add(art);
    const nameText = this.add
      .text(0, 124, character.name, {
        fontFamily: FONT,
        fontSize: 24,
        color: TEXT.primary,
        stroke: '#120b08',
        strokeThickness: 4
      })
      .setOrigin(0.5);
    holder.add(nameText);
    const bar = new UIHealthBar(this, 0, 156, 260, 24, '');
    bar.setValue(this.battle.player.hp, this.battle.player.maxHp, this.battle.player.block);
    holder.healthBar = bar;
    holder.nameText = nameText;
    holder.characterId = character.id;
    holder.add(bar);
    this.addHeroResource(holder, this.battle.player.resource);
    this.addStatusRow(holder, -92, 219, this.battle.player.status);
    this.playerNameText = nameText;
    this.playerArtKey = character.battleSpriteKey ?? character.id;
    this.playerView = holder;
    this.dynamicLayer.add(holder);
  }

  addHeroResource(holder, resource) {
    if (!resource) return;
    const width = 260;
    const height = 20;
    const x = -width / 2;
    const y = 181;
    const palette = {
      momentum: { fill: 0xc45631, ready: 0xf0b94b },
      prayerFire: { fill: 0xe0b83e, ready: 0xffe7a0 },
      ashblood: { fill: 0x63a899, ready: 0xb7dcc5 }
    }[resource.id] ?? { fill: 0xb88935, ready: 0xf4d89c };
    const ratio = resource.max > 0 ? Phaser.Math.Clamp(resource.value / resource.max, 0, 1) : 0;
    const track = this.add.graphics();
    track.fillStyle(0x120d0b, 0.92);
    track.fillRoundedRect(x, y, width, height, 4);
    track.lineStyle(1, resource.ready ? palette.ready : 0x80643d, resource.ready ? 0.92 : 0.72);
    track.strokeRoundedRect(x, y, width, height, 4);
    if (ratio > 0) {
      track.fillStyle(resource.ready ? palette.ready : palette.fill, 0.9);
      track.fillRoundedRect(x + 2, y + 2, Math.max(4, (width - 4) * ratio), height - 4, 3);
    }
    const label = this.add
      .text(0, y + height / 2, `${resource.label}  ${resource.value}/${resource.max}${resource.ready ? ' · 就绪' : ''}`, {
        fontFamily: FONT,
        fontSize: 13,
        color: resource.ready ? '#fff4c7' : '#f6edd0',
        stroke: '#120b08',
        strokeThickness: 2
      })
      .setOrigin(0.5);
    holder.resourceBar = track;
    holder.add([track, label]);
  }

  drawPlayerArt(character) {
    const scale = character.id === 'ashblood-alchemist' ? 0.96 : character.id === 'candle-nun' ? 1.02 : 1;
    return drawHeroArt(this, character.id, 0, 0, scale, { idle: false, battle: true, generatedHeight: 330 });
  }

  renderEnemies() {
    const enemyLayouts = computeEnemyLayout(this.battle.enemies, {
      enemySingle: LAYOUT.enemySingle,
      enemyPair: LAYOUT.enemyPair
    });
    enemyLayouts.forEach(({ enemy, originalIndex, x, y, metrics }) => {
      const holder = this.add.container(x, y);
      if (this.selectedUid && this.keyboardTargetIndex === originalIndex) holder.add(this.drawTargetFrame(enemy));
      const art = this.drawEnemySilhouette(enemy);
      holder.artContainer = art;
      holder.add(art);

      const intent = this.createIntentIcon(enemy);
      intent.setPosition(0, metrics.intentY);
      holder.add(intent);

      holder.add(
        this.add
          .text(0, metrics.nameY, enemy.name, {
            fontFamily: FONT,
            fontSize: metrics.nameSize,
            color: TEXT.primary,
            stroke: '#120b08',
            strokeThickness: 4,
            align: 'center'
          })
          .setOrigin(0.5)
      );
      const bar = new UIHealthBar(this, 0, metrics.barY, metrics.barWidth, 24, '');
      bar.setValue(enemy.hp, enemy.maxHp, enemy.block);
      holder.healthBar = bar;
      holder.add(bar);
      this.addStatusRow(holder, metrics.statusX, metrics.statusY, enemy.status);

      const hitZone = this.add
        .zone(x, y - 18, metrics.hitWidth, metrics.hitHeight)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      hitZone.setDepth(10000);
      hitZone.on('pointerover', () => {
        if (this.uiPaused) return;
        this.setPrompt(this.describeIntent(enemy));
        if (this.selectedUid) this.tweens.add({ targets: holder, scale: 1.045, duration: 90, ease: 'Sine.Out' });
      });
      hitZone.on('pointerout', () => {
        if (this.uiPaused) return;
        this.updatePrompt();
        this.tweens.add({ targets: holder, scale: 1, duration: 90, ease: 'Sine.Out' });
      });
      hitZone.on('pointerdown', () => this.tryUseSelectedOnEnemy(originalIndex));
      this.enemyHitZones.push(hitZone);
      this.enemyViews[originalIndex] = holder;
      this.enemyViewsById.set(enemy.id, holder);
      if (enemy.uid) this.enemyViewsByUid.set(enemy.uid, holder);
      this.dynamicLayer.add(holder);
    });
  }

  enemyPosition(enemy, livingIndex, livingEnemies) {
    const bossEntry = livingEnemies.find(({ enemy: item }) => item.type === 'boss');
    if (bossEntry) {
      if (enemy.type === 'boss') return { x: 804, y: 404 };
      const addIndex = livingEnemies.filter(({ enemy: item }) => item.type !== 'boss').findIndex(({ enemy: item }) => item === enemy);
      const addPositions = [
        { x: 1064, y: 466 },
        { x: 596, y: 466 },
        { x: 934, y: 500 }
      ];
      return addPositions[Math.max(0, addIndex)] ?? { x: 1040, y: 500 };
    }
    const livingCount = livingEnemies.length;
    if (livingCount <= 1) return LAYOUT.enemySingle;
    if (livingCount === 2) return LAYOUT.enemyPair[Math.min(livingIndex, 1)];
    const positions = [
      { x: 620, y: 448 },
      { x: 820, y: 430 },
      { x: 1020, y: 448 },
      { x: 700, y: 500 },
      { x: 960, y: 500 }
    ];
    return positions[livingIndex] ?? { x: 620 + livingIndex * 160, y: 448 };
  }

  drawTargetFrame(enemy) {
    const g = this.add.graphics();
    const metrics = getEnemyVisualMetrics(enemy);
    const w = metrics.frameWidth;
    const h = metrics.frameHeight;
    g.lineStyle(3, 0xf1c76a, 0.86);
    g.strokeEllipse(0, 4, w, h);
    g.lineStyle(10, 0xf1c76a, 0.12);
    g.strokeEllipse(0, 4, w + 18, h + 18);
    g.lineStyle(2, 0xffffff, 0.62);
    g.lineBetween(-w / 2 + 22, -h / 2 + 28, -w / 2 + 54, -h / 2 + 12);
    g.lineBetween(w / 2 - 22, -h / 2 + 28, w / 2 - 54, -h / 2 + 12);
    return g;
  }

  drawEnemySilhouette(enemy) {
    const metrics = getEnemyVisualMetrics(enemy);
    const scale = metrics.artScale;
    const phase = enemy.type === 'boss' ? this.lastBossPhase : 1;
    return drawEnemyArt(this, enemy.id, 0, 0, scale, {
      idle: false,
      battle: true,
      type: enemy.type,
      phase,
      generatedHeight: metrics.generatedHeight
    });
  }

  drawSkeleton(enemy) {
    const container = this.add.container(0, 0);
    const g = this.add.graphics();
    const [bone = 0xc6b58e, cloth = 0x6d6a68, rust = 0x9a723f] = enemy.palette ?? [];
    g.fillStyle(0x000000, 0.32);
    g.fillEllipse(0, 118, 134, 20);
    g.fillStyle(cloth, 0.78);
    g.fillTriangle(-48, -24, -72, 96, -10, 58);
    g.fillStyle(bone, 0.96);
    g.fillRoundedRect(-24, -96, 48, 44, 12);
    g.fillStyle(0x17120e, 1);
    g.fillCircle(-10, -80, 5);
    g.fillCircle(11, -80, 5);
    g.fillRect(-11, -64, 22, 4);
    g.fillStyle(bone, 0.92);
    g.fillRect(-13, -48, 26, 18);
    g.lineStyle(5, bone, 0.95);
    g.lineBetween(-35, -28, 35, -28);
    g.lineBetween(-30, -20, 30, -20);
    g.lineBetween(-24, -10, 24, -10);
    g.lineBetween(-12, -30, -18, 44);
    g.lineBetween(12, -30, 18, 44);
    g.lineBetween(-34, -26, -54, 36);
    g.lineBetween(35, -27, 62, 24);
    g.lineBetween(-17, 40, -34, 110);
    g.lineBetween(18, 40, 32, 110);
    g.lineStyle(7, 0x2b2520, 0.9);
    g.lineBetween(58, 22, 84, 94);
    g.lineStyle(5, rust, 0.9);
    g.lineBetween(-76, -42, 42, 58);
    g.lineStyle(2, 0xf1d28a, 0.62);
    g.lineBetween(-68, -40, 45, 52);
    g.fillStyle(0x38251a, 0.86);
    g.fillRect(-29, 34, 58, 12);
    g.fillStyle(0xb83b34, 0.65);
    g.fillRect(11, -18, 18, 6);
    container.add(g);
    this.tweens.add({ targets: container, angle: -2, yoyo: true, repeat: -1, duration: 1100, ease: 'Sine.InOut' });
    return container;
  }

  drawRottingVillager(enemy) {
    const container = this.add.container(0, 0);
    const g = this.add.graphics();
    const [base = 0x46503b, cloth = 0x5f4637] = enemy.palette ?? [];
    g.fillStyle(0x000000, 0.32);
    g.fillEllipse(0, 118, 148, 22);
    g.fillStyle(0x223128, 1);
    g.fillTriangle(-28, 46, -48, 116, -20, 118);
    g.fillTriangle(19, 44, 2, 116, 32, 118);
    g.fillStyle(0x18231e, 1);
    g.fillTriangle(-34, 74, -62, 110, -26, 110);
    g.fillTriangle(15, 76, 45, 110, 14, 110);
    g.fillStyle(cloth, 0.95);
    g.fillTriangle(-52, -42, 38, -30, 24, 58);
    g.fillTriangle(-44, -35, -14, 76, -66, 50);
    g.fillTriangle(4, -30, 62, 22, 12, 78);
    g.fillStyle(base, 1);
    g.fillRoundedRect(-42, -58, 78, 96, 12);
    g.fillStyle(0x394333, 0.92);
    g.fillTriangle(-38, -52, 34, -42, 12, 36);
    g.fillStyle(0x596850, 1);
    g.fillRoundedRect(-28, -100, 46, 40, 12);
    g.fillTriangle(18, -90, 44, -72, 18, -65);
    g.fillStyle(0x141616, 1);
    g.fillRect(-21, -86, 10, 4);
    g.fillStyle(0x7d2e2d, 0.9);
    g.fillCircle(6, -84, 4);
    g.fillStyle(0x2d3028, 1);
    g.fillTriangle(-52, -28, -73, 50, -55, 58);
    g.fillTriangle(40, -18, 64, 62, 46, 68);
    g.lineStyle(4, 0x3d2b21, 0.9);
    g.lineBetween(-65, 48, -78, 83);
    g.lineBetween(52, 58, 67, 94);
    g.fillStyle(0x7d2e2d, 0.78);
    g.fillCircle(-17, -14, 4);
    g.fillRect(8, 22, 20, 7);
    g.fillStyle(0x7a6b48, 0.58);
    g.fillRect(-32, -39, 30, 8);
    g.fillRect(-7, 42, 34, 6);
    g.lineStyle(2, 0x7d2e2d, 0.7);
    g.lineBetween(-10, -50, 24, -47);
    g.lineBetween(-2, -34, 30, -28);
    g.fillStyle(0xc2aa6b, 0.48);
    g.fillCircle(-27, 7, 3);
    g.fillCircle(22, 34, 3);
    container.add(g);
    this.tweens.add({ targets: container, angle: 2, yoyo: true, repeat: -1, duration: 1000, ease: 'Sine.InOut' });
    return container;
  }

  drawBlackHound(enemy) {
    const container = this.add.container(0, 0);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.34);
    g.fillEllipse(0, 118, 168, 22);
    g.fillStyle(0x070707, 1);
    g.fillRoundedRect(-76, -38, 122, 62, 30);
    g.fillStyle(0x111010, 1);
    g.fillTriangle(-64, -30, -112, -70, -78, 4);
    g.fillTriangle(-78, -18, -128, -4, -78, 10);
    g.fillRoundedRect(30, -72, 54, 56, 20);
    g.fillTriangle(42, -68, 55, -111, 67, -68);
    g.fillTriangle(65, -62, 92, -98, 88, -48);
    g.fillStyle(0x0b0a0a, 1);
    g.fillRect(-52, 10, 12, 94);
    g.fillRect(-17, 20, 11, 84);
    g.fillRect(22, 12, 12, 92);
    g.fillRect(57, -2, 11, 100);
    g.fillStyle(0x050505, 1);
    g.fillTriangle(-58, 99, -36, 99, -48, 112);
    g.fillTriangle(50, 98, 76, 98, 62, 112);
    g.lineStyle(3, 0x7d2e2d, 0.72);
    g.lineBetween(-44, -22, 18, -30);
    g.lineBetween(-36, -6, 28, -17);
    g.lineBetween(-24, 8, 14, 2);
    g.fillStyle(0xb84a34, 0.98);
    g.fillCircle(62, -51, 5);
    g.fillStyle(0xf3bd67, 0.72);
    g.fillCircle(63, -51, 2);
    g.fillStyle(0x4d2a2b, 0.9);
    g.fillTriangle(76, -41, 114, -35, 76, -23);
    g.lineStyle(4, 0x1a1717, 0.9);
    g.lineBetween(-66, -16, -116, -48);
    container.add(g);
    this.tweens.add({ targets: container, y: -3, yoyo: true, repeat: -1, duration: 820, ease: 'Sine.InOut' });
    return container;
  }

  drawPlagueDoctor(enemy) {
    const container = this.add.container(0, 0);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.34);
    g.fillEllipse(0, 116, 146, 22);
    g.fillStyle(0x161614, 1);
    g.fillTriangle(-46, -48, 44, -48, 65, 108);
    g.fillStyle(0x26221f, 1);
    g.fillRoundedRect(-34, -64, 68, 112, 10);
    g.fillStyle(0x201c1a, 1);
    g.fillRoundedRect(-30, -112, 58, 48, 18);
    g.fillTriangle(15, -96, 90, -83, 18, -72);
    g.fillStyle(0xd4caa2, 0.84);
    g.fillCircle(-12, -92, 5);
    g.fillStyle(0x477050, 0.9);
    g.fillRect(-55, -20, 18, 84);
    g.fillRect(42, -17, 17, 80);
    g.lineStyle(5, 0xc9c19a, 0.7);
    g.lineBetween(55, 0, 82, 58);
    container.add(g);
    this.tweens.add({ targets: container, y: -3, yoyo: true, repeat: -1, duration: 1200, ease: 'Sine.InOut' });
    return container;
  }

  drawRatSwarm(enemy) {
    const container = this.add.container(0, 0);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.32);
    g.fillEllipse(0, 118, 170, 24);
    const [dark = 0x24231d, sick = 0x6f7042, red = 0xa05238] = enemy.palette ?? [];
    for (let i = 0; i < 8; i += 1) {
      const x = -62 + (i % 4) * 42;
      const y = 68 + Math.floor(i / 4) * 24 + (i % 2) * 8;
      g.fillStyle(i % 2 ? sick : dark, 0.96);
      g.fillEllipse(x, y, 44, 24);
      g.fillTriangle(x + 18, y - 7, x + 42, y - 16, x + 24, y + 2);
      g.fillStyle(red, 0.9);
      g.fillCircle(x + 11, y - 4, 3);
      g.lineStyle(2, 0x8b6a42, 0.6);
      g.lineBetween(x - 20, y + 3, x - 42, y + 18);
    }
    container.add(g);
    this.tweens.add({ targets: container, x: 3, yoyo: true, repeat: -1, duration: 520, ease: 'Sine.InOut' });
    return container;
  }

  drawCrowMessenger(enemy) {
    const container = this.add.container(0, 0);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(0, 118, 150, 20);
    g.fillStyle(0x101016, 1);
    g.fillTriangle(-12, -30, -104, 28, -18, 40);
    g.fillTriangle(12, -30, 104, 22, 18, 40);
    g.fillRoundedRect(-28, -54, 56, 100, 26);
    g.fillStyle(0x1f2532, 1);
    g.fillRoundedRect(-20, -88, 40, 40, 16);
    g.fillStyle(0xc69a45, 0.95);
    g.fillTriangle(16, -72, 64, -66, 18, -58);
    g.fillStyle(0xf1c76a, 0.9);
    g.fillCircle(4, -75, 3);
    g.fillStyle(0x5b3720, 0.9);
    g.fillRect(22, 12, 38, 20);
    g.lineStyle(5, 0x111016, 1);
    g.lineBetween(-14, 38, -32, 104);
    g.lineBetween(12, 38, 27, 104);
    container.add(g);
    this.tweens.add({ targets: container, y: -8, yoyo: true, repeat: -1, duration: 720, ease: 'Sine.InOut' });
    return container;
  }

  drawMilitia(enemy) {
    const container = this.add.container(0, 0);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.32);
    g.fillEllipse(0, 118, 150, 22);
    g.fillStyle(0x2f2d2b, 1);
    g.fillRect(-18, 36, 14, 76);
    g.fillRect(18, 36, 14, 76);
    g.fillStyle(0x4a4238, 1);
    g.fillRoundedRect(-44, -62, 84, 106, 10);
    g.fillStyle(0x7f312c, 0.9);
    g.fillTriangle(-48, -36, -78, 70, -18, 34);
    g.fillStyle(0x9b6b37, 0.9);
    g.fillRoundedRect(-28, -102, 52, 38, 9);
    g.lineStyle(5, 0x8b724c, 0.95);
    g.lineBetween(54, -108, 66, 112);
    g.fillStyle(0x6b3b2a, 0.95);
    g.fillTriangle(48, -110, 74, -118, 64, -78);
    g.fillStyle(0x2e3540, 0.95);
    g.fillRoundedRect(-84, -18, 46, 78, 10);
    container.add(g);
    this.tweens.add({ targets: container, angle: 1.5, yoyo: true, repeat: -1, duration: 980, ease: 'Sine.InOut' });
    return container;
  }

  drawCandleMonk(enemy) {
    const container = this.add.container(0, 0);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.32);
    g.fillEllipse(0, 118, 140, 22);
    g.fillStyle(0x3f3327, 1);
    g.fillTriangle(-56, 104, 0, -110, 58, 104);
    g.fillStyle(0x241b16, 1);
    g.fillRoundedRect(-28, -96, 56, 48, 22);
    g.fillStyle(0x110d0b, 1);
    g.fillEllipse(0, -77, 32, 20);
    g.fillStyle(0xc9a45f, 0.88);
    g.fillCircle(-18, -28, 7);
    g.fillCircle(20, 34, 5);
    g.lineStyle(7, 0x825a38, 0.96);
    g.lineBetween(58, -76, 58, 100);
    g.fillStyle(0xf1c76a, 0.92);
    g.fillRect(48, -112, 20, 36);
    g.fillStyle(0xe5672d, 0.9);
    g.fillTriangle(48, -112, 58, -148, 68, -112);
    container.add(g);
    this.tweens.add({ targets: container, y: -4, yoyo: true, repeat: -1, duration: 1300, ease: 'Sine.InOut' });
    return container;
  }

  drawPointedWitch(enemy) {
    const container = this.add.container(0, 0);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.32);
    g.fillEllipse(0, 118, 150, 22);
    g.fillStyle(0x26162f, 1);
    g.fillTriangle(-52, 108, -10, -76, 54, 108);
    g.fillStyle(0x111016, 1);
    g.fillRoundedRect(-24, -94, 48, 42, 18);
    g.fillStyle(0x1a0d22, 1);
    g.fillTriangle(-76, -84, 4, -176, 68, -82);
    g.fillRoundedRect(-78, -88, 154, 18, 8);
    g.fillStyle(0x6f5185, 0.8);
    g.fillTriangle(-28, -112, 8, -166, 30, -100);
    g.lineStyle(5, 0x8b6a42, 0.95);
    g.lineBetween(54, -28, 88, 110);
    g.fillStyle(0xd08a49, 0.95);
    g.fillCircle(89, -8, 14);
    g.fillStyle(0x5d2a70, 0.5);
    g.fillCircle(89, -8, 26);
    container.add(g);
    this.tweens.add({ targets: container, angle: -2, yoyo: true, repeat: -1, duration: 1050, ease: 'Sine.InOut' });
    return container;
  }

  drawIronMaidenNun(enemy) {
    const container = this.add.container(0, 0);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.34);
    g.fillEllipse(0, 118, 170, 24);
    g.fillStyle(0x2b2c30, 1);
    g.fillRoundedRect(-48, -118, 96, 210, 18);
    g.fillStyle(0x111114, 0.96);
    g.fillRoundedRect(-32, -95, 64, 42, 14);
    g.fillStyle(0x7a2730, 0.9);
    g.fillTriangle(-58, -40, -92, 84, -28, 66);
    g.fillTriangle(58, -38, 96, 84, 28, 66);
    g.fillStyle(0xc6a15a, 0.9);
    for (let i = 0; i < 5; i += 1) {
      g.fillTriangle(-40 + i * 20, -88, -32 + i * 20, -120, -24 + i * 20, -88);
      g.fillTriangle(-40 + i * 20, 76, -32 + i * 20, 112, -24 + i * 20, 76);
    }
    container.add(g);
    this.tweens.add({ targets: container, y: -3, yoyo: true, repeat: -1, duration: 1150, ease: 'Sine.InOut' });
    return container;
  }

  drawFallenPaladin(enemy) {
    const container = this.add.container(0, 0);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.34);
    g.fillEllipse(0, 124, 176, 24);
    g.fillStyle(0x20272d, 1);
    g.fillRoundedRect(-50, -78, 100, 142, 10);
    g.fillRect(-38, 58, 30, 62);
    g.fillRect(14, 58, 30, 62);
    g.fillStyle(0x16191d, 1);
    g.fillRoundedRect(-36, -124, 72, 48, 10);
    g.fillStyle(0x9c743b, 0.95);
    g.fillRect(-44, -54, 88, 10);
    g.fillRect(-10, -76, 20, 134);
    g.fillStyle(0x5f1f2a, 0.92);
    g.fillTriangle(-58, -52, -108, 86, -22, 56);
    g.lineStyle(9, 0x2d3038, 1);
    g.lineBetween(70, -112, 112, 116);
    g.lineStyle(3, 0xd7a94d, 0.72);
    g.lineBetween(70, -112, 112, 116);
    container.add(g);
    this.tweens.add({ targets: container, angle: 1.6, yoyo: true, repeat: -1, duration: 1000, ease: 'Sine.InOut' });
    return container;
  }

  drawBossSilhouette(enemy) {
    const container = this.add.container(0, 0);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.38);
    g.fillEllipse(0, 135, 228, 28);
    g.fillStyle(0x22282c, 1);
    g.fillRoundedRect(-56, -78, 112, 148, 10);
    g.fillStyle(0x16191b, 1);
    g.fillRect(-78, -46, 26, 130);
    g.fillRect(55, -44, 26, 128);
    g.fillRect(-38, 62, 28, 70);
    g.fillRect(15, 62, 30, 72);
    g.fillStyle(0x6b2535, 0.92);
    g.fillTriangle(-70, -62, -150, 112, -35, 104);
    g.lineStyle(8, 0xb88c44, 0.85);
    g.lineBetween(74, -80, -98, 120);
    g.lineStyle(2, 0xf3d591, 0.64);
    g.lineBetween(80, -74, -92, 122);
    g.fillStyle(0x070604, 1);
    g.fillCircle(0, -105, 20);
    g.lineStyle(4, 0x8a6a35, 0.7);
    g.strokeCircle(0, -105, 26);
    g.fillStyle(0x84919b, 0.55);
    g.fillRect(-42, -52, 32, 10);
    g.fillRect(8, -49, 34, 10);
    container.add(g);
    this.tweens.add({ targets: container, y: -4, yoyo: true, repeat: -1, duration: 1500, ease: 'Sine.InOut' });
    return container;
  }

  createIntentIcon(enemy) {
    const action = enemy.currentAction;
    const container = this.add.container(0, 0);
    const kind = action?.intent ?? 'wait';
    const value = action?.damage ? action.damage * (action.times ?? 1) : action?.block ?? action?.heal ?? action?.statusValue ?? '';
    const label = this.intentShortLabel(action);
    if (hasTexture(this, HANDPAINTED_KEYS.ui)) {
      const iconKey = kind === 'attack' ? 'attackIcon' : kind === 'block' ? 'relic' : kind === 'heal' ? 'camp' : kind === 'buff' ? 'relic' : 'scroll';
      const icon = addUiAsset(this, iconKey, 0, 0, { displayWidth: 42, displayHeight: 42, alpha: 0.96 });
      const valueText = this.add
        .text(0, 29, value ? label : this.intentName(kind), {
          fontFamily: FONT,
          fontSize: 14,
          color: TEXT.body,
          stroke: '#120b08',
          strokeThickness: 3
        })
        .setOrigin(0.5);
      container.add([icon, valueText]);
      return container;
    }
    const icon = this.add.graphics();
    icon.fillStyle(0x120c0a, 0.86);
    icon.fillCircle(0, 0, 21);
    icon.lineStyle(2, 0xb98b3c, 0.9);
    icon.strokeCircle(0, 0, 21);
    if (kind === 'attack') {
      icon.lineStyle(4, 0xd94e42, 0.95);
      icon.lineBetween(-9, 10, 10, -10);
      icon.lineStyle(2, 0xf5d78d, 0.9);
      icon.lineBetween(-12, 13, 13, -8);
    } else if (kind === 'block') {
      icon.fillStyle(0x4f7894, 0.9);
      icon.fillTriangle(0, -13, 13, -3, 0, 14);
      icon.fillTriangle(0, -13, -13, -3, 0, 14);
    } else if (kind === 'buff') {
      icon.lineStyle(4, 0xf3bd67, 0.9);
      icon.lineBetween(0, 13, 0, -11);
      icon.lineBetween(0, -11, -9, -2);
      icon.lineBetween(0, -11, 9, -2);
    } else {
      icon.lineStyle(4, 0x8d6db5, 0.9);
      icon.lineBetween(-10, -8, 9, 9);
      icon.lineBetween(9, -8, -10, 9);
    }
    const valueText = this.add
      .text(0, 25, value ? label : this.intentName(kind), {
        fontFamily: FONT,
        fontSize: 14,
        color: TEXT.body,
        stroke: '#120b08',
        strokeThickness: 3
      })
      .setOrigin(0.5);
    container.add([icon, valueText]);
    return container;
  }

  intentShortLabel(action) {
    if (!action) return '等待';
    if (action.intent === 'attack') return `攻击 ${action.damage * (action.times ?? 1)}`;
    if (action.intent === 'block') return `防御 ${action.block}`;
    if (action.intent === 'heal') return `治疗 ${action.heal}`;
    if (action.intent === 'buff') return '强化';
    if (action.intent === 'debuff') return '弱化';
    return '特殊';
  }

  intentName(intent) {
    return {
      attack: '攻击',
      block: '防御',
      heal: '治疗',
      buff: '强化',
      debuff: '弱化',
      special: '特殊',
      wait: '等待'
    }[intent] ?? '行动';
  }

  describeIntent(enemy) {
    const action = enemy.currentAction;
    if (!action) return `${enemy.name} 正在观望。`;
    return `${enemy.name} 意图：${this.intentShortLabel(action)}。${action.text ?? '结束回合后会执行。'}`;
  }

  addStatusRow(holder, x, y, status) {
    const entries = Object.entries(status ?? {}).filter(([, value]) => value > 0);
    entries.slice(0, 5).forEach(([key, value], index) => {
      const label = {
        strength: '力',
        weak: '虚',
        vulnerable: '易',
        mark: '痕',
        candlemark: '烛'
      }[key] ?? '状';
      const icon = this.add
        .text(x + index * 43, y, `${label}${value}`, {
          fontFamily: FONT,
          fontSize: 15,
          color: TEXT.body,
          backgroundColor: '#211612',
          padding: { x: 6, y: 3 }
        })
        .setOrigin(0, 0.5);
      holder.add(icon);
    });
  }

  renderHand() {
    this.renderPileCounters();
    const count = this.battle.deck.hand.length;
    if (count === 0) return;
    const cardWidth = 132;
    const hand = LAYOUT.hand;
    const cardY = 738;
    const cardRail = hasTexture(this, HANDPAINTED_KEYS.ui)
      ? addUiAsset(this, 'widePanel', hand.x + hand.w / 2, hand.y + 75, { displayWidth: hand.w - 44, displayHeight: hand.h - 34, alpha: 0.38 })
      : this.add.graphics();
    if (!hasTexture(this, HANDPAINTED_KEYS.ui)) {
      cardRail.fillStyle(0x0b0807, 0.32);
      cardRail.fillRoundedRect(hand.x + 22, hand.y + 18, hand.w - 44, hand.h - 34, 7);
      cardRail.lineStyle(1, 0x8a6a35, 0.24);
      cardRail.strokeRoundedRect(hand.x + 22, hand.y + 18, hand.w - 44, hand.h - 34, 7);
    }
    this.dynamicLayer.add(cardRail);
    const spacing = count <= 1 ? 0 : count <= 7 ? Math.min(142, (hand.w - 160) / (count - 1)) : Math.min(118, (hand.w - 118) / (count - 1));
    const center = hand.x + hand.w / 2;
    const scale = count > 7 ? Math.max(0.84, 7 / count) : 1;
    const startX = center - ((count - 1) * spacing) / 2;

    this.battle.deck.hand.forEach((instance, index) => {
      const card = CardSystem.getDisplayCard(instance);
      const realCost = BattleSystem.cardCost(this.run, this.battle, card);
      const disabled =
        card.unplayable ||
        this.battle.player.energy < realCost ||
        (card.type === CARD_TYPES.ATTACK && (this.battle.player.status.noAttack ?? 0) > 0);
      const arcOffset = Math.abs(index - (count - 1) / 2) * 3;
      const view = new UICard(this, startX + index * spacing, cardY + arcOffset, card, {
        baseY: cardY + arcOffset,
        width: cardWidth,
        height: 184,
        disabled,
        scale,
        rotation: Phaser.Math.Clamp((index - (count - 1) / 2) * 0.025, -0.08, 0.08),
        onClick: () => this.selectCard(instance.uid),
        onHover: () => {
          if (card.unplayable) addToast(this, `${card.name}无法打出。`, 'error');
          else if (disabled) this.setPrompt('能量不足。');
        },
        onOut: () => this.updatePrompt()
      });
      view.uid = instance.uid;
      view.setSelected(this.selectedUid === instance.uid);
      if (index < 9) {
        const shortcut = this.add
          .text(49, -72, `${index + 1}`, {
            fontFamily: FONT,
            fontSize: 13,
            color: '#f6edd0',
            backgroundColor: '#4a2f20',
            padding: { x: 5, y: 2 },
            stroke: '#120b08',
            strokeThickness: 2
          })
          .setOrigin(0.5);
        view.add(shortcut);
      }
      this.cardViews.push(view);
      this.dynamicLayer.add(view);
    });
  }

  renderPileCounters() {
    const deck = LAYOUT.deck;
    const panel = this.add.container(deck.x + deck.w / 2, deck.y + deck.h / 2 + 8);
    const bg = hasTexture(this, HANDPAINTED_KEYS.ui)
      ? addUiAsset(this, 'widePanel', 0, 0, { displayWidth: deck.w - 18, displayHeight: deck.h - 48, alpha: 0.5 })
      : this.add.graphics();
    if (!hasTexture(this, HANDPAINTED_KEYS.ui)) {
      bg.fillStyle(0x0b0807, 0.44);
      bg.fillRoundedRect(-(deck.w - 18) / 2, -(deck.h - 48) / 2, deck.w - 18, deck.h - 48, 7);
      bg.lineStyle(1, 0x8a6a35, 0.32);
      bg.strokeRoundedRect(-(deck.w - 18) / 2, -(deck.h - 48) / 2, deck.w - 18, deck.h - 48, 7);
    }
    panel.add(bg);
    this.dynamicLayer.add(panel);
    const piles = [
      ['抽牌堆', this.battle.deck.drawPile.length, deck.x + 40, deck.y + 76],
      ['弃牌堆', this.battle.deck.discardPile.length, deck.x + 75, deck.y + 102],
      ['消耗堆', this.battle.deck.exhaustPile.length, deck.x + 110, deck.y + 76]
    ];
    piles.forEach(([label, value, x, y]) => {
      const pile = this.add.container(x, y);
      const g = hasTexture(this, HANDPAINTED_KEYS.ui)
        ? addUiAsset(this, label.includes('抽') ? 'cardSkill' : label.includes('弃') ? 'cardDefense' : 'cardAttack', 0, 0, {
            displayWidth: 44,
            displayHeight: 58,
            alpha: 0.82
          })
        : this.add.graphics();
      if (!hasTexture(this, HANDPAINTED_KEYS.ui)) {
        g.fillStyle(0x2a211c, 0.94);
        g.fillRoundedRect(-19, -26, 38, 54, 5);
        g.fillStyle(0x14100d, 0.9);
        g.fillRoundedRect(-13, -20, 26, 42, 4);
        g.lineStyle(2, 0x8a6a35, 0.75);
        g.strokeRoundedRect(-19, -26, 38, 54, 5);
        g.lineStyle(1, 0xd7a94d, 0.35);
        g.lineBetween(-7, -13, 9, 12);
      }
      const number = this.add
        .text(0, 0, `${value}`, {
          fontFamily: FONT,
          fontSize: 17,
          color: TEXT.primary,
          stroke: '#120b08',
          strokeThickness: 3
        })
        .setOrigin(0.5);
      const caption = this.add
        .text(0, 38, label, {
          fontFamily: FONT,
          fontSize: 11,
          color: TEXT.dim
        })
        .setOrigin(0.5);
      pile.add([g, number, caption]);
      this.dynamicLayer.add(pile);
    });
  }

  selectCard(uid) {
    if (this.uiPaused || this.inputLocked || this.battle.ended) return;
    const instance = this.battle.deck.hand.find((card) => card.uid === uid);
    if (!instance) {
      this.setPrompt('卡牌不存在。');
      addToast(this, '卡牌不存在。', 'error');
      return;
    }
    const card = CardSystem.getDisplayCard(instance);
    if (card.unplayable) {
      this.setPrompt(`${card.name}无法打出。`);
      addToast(this, `${card.name}无法打出。`, 'error');
      this.audio?.play('error');
      return;
    }
    if (card.type === CARD_TYPES.ATTACK && (this.battle.player.status.noAttack ?? 0) > 0) {
      this.setPrompt('本回合不能再打出攻击牌。');
      this.audio?.play('error');
      return;
    }
    const realCost = BattleSystem.cardCost(this.run, this.battle, card);
    if (this.battle.player.energy < realCost) {
      this.setPrompt('能量不足。');
      addToast(this, '能量不足。', 'error');
      this.audio?.play('error');
      return;
    }
    if (!card.requiresTarget) {
      this.setPrompt('防御牌立即生效。');
      this.playCard(uid, null);
      return;
    }
    this.selectedUid = this.selectedUid === uid ? null : uid;
    this.keyboardTargetIndex = this.selectedUid
      ? this.battle.enemies.findIndex((enemy) => enemy.hp > 0)
      : null;
    this.setPrompt(this.selectedUid ? '请选择一个敌人作为目标。' : '点击一张卡牌使用。');
    addToast(this, this.selectedUid ? '请选择一个敌人作为目标。' : '取消选牌。');
    this.renderBattle();
  }

  cancelCardSelection() {
    if (!this.selectedUid) return;
    this.selectedUid = null;
    this.keyboardTargetIndex = null;
    this.setPrompt('点击一张卡牌使用。');
    this.audio?.play('uiClick', { volume: 0.45 });
    this.renderBattle();
  }

  tryUseSelectedOnEnemy(index) {
    if (this.uiPaused || this.inputLocked || this.battle.ended) return;
    let targetIndex = index;
    let enemy = this.battle.enemies[targetIndex];
    if (enemy?.hp <= 0) {
      const livingIndices = this.battle.enemies
        .map((item, itemIndex) => (item?.hp > 0 ? itemIndex : null))
        .filter((itemIndex) => itemIndex !== null);
      if (livingIndices.length === 1) {
        targetIndex = livingIndices[0];
        enemy = this.battle.enemies[targetIndex];
      } else {
        this.setPrompt('目标已死亡。');
        addToast(this, '目标已死亡。', 'error');
        return;
      }
    }
    if (!this.selectedUid) {
      this.setPrompt('点击一张卡牌使用。');
      addToast(this, '点击一张卡牌使用。');
      return;
    }
    this.playCard(this.selectedUid, targetIndex);
  }

  playActorPose(holder, pose, options = {}) {
    this.animationDirector?.playActorPose(holder, pose, options);
  }

  playPlayerCardPose(card, targetView = null) {
    if (!this.playerView) return;
    if (card.type === CARD_TYPES.DEFENSE) {
      this.playActorPose(this.playerView, 'defend', { duration: 520 });
      return;
    }
    const lunge = targetView && targetView.x > this.playerView.x ? 22 : 0;
    this.playActorPose(this.playerView, 'attack', { duration: 520, lungeX: lunge });
  }

  playCard(uid, targetIndex) {
    if (this.uiPaused || this.inputLocked) return;
    const cardView = this.cardViews.find((view) => view.uid === uid);
    const targetView = targetIndex !== null ? this.enemyViews[targetIndex] : this.playerView;
    const result = BattleSystem.useCard(this.run, this.battle, uid, targetIndex);
    if (!result.ok) {
      this.setPrompt(result.reason);
      addToast(this, result.reason, 'error');
      this.audio?.play('error');
      return;
    }
    BattleSystem.syncRun(this.run, this.battle);
    this.saveCheckpoint();
    this.inputLocked = true;
    this.selectedUid = null;
    this.keyboardTargetIndex = null;
    this.audio?.play('cardPlay', { volume: 0.55, variance: 0.035 });
    this.playPlayerCardPose(result.card, targetView);
    this.animateCardPlay(cardView, targetView, result.card, () => {
      this.applyVisualEvents(result.events, targetIndex);
      this.checkBossPhaseFeedback();
      BattleSystem.syncRun(this.run, this.battle);
      this.finishIfNeeded();
      if (!this.battle.ended) {
        this.inputLocked = false;
        this.currentPrompt = '点击一张卡牌使用。';
        this.renderBattle();
      }
    });
  }

  animateCardPlay(cardView, targetView, card, done) {
    if (!cardView || !targetView) {
      done();
      return;
    }
    const ghost = new UICard(this, cardView.x, cardView.y, card, { width: 132, height: 184, disabled: false, interactive: false });
    ghost.setDepth(610);
    ghost.setScale(cardView.scaleX || 1);
    ghost.setAngle(-3);
    const animationEnabled = SaveManager.readSettings().animation !== false;
    if (!animationEnabled) {
      ghost.destroy();
      done();
      return;
    }
    const startX = cardView.x;
    const startY = cardView.y;
    const endX = targetView.x;
    const endY = targetView.y - 54;
    const midX = Phaser.Math.Linear(startX, endX, 0.52);
    const midY = Math.min(startY - 76, endY - 44);
    this.tweens.add({
      targets: ghost,
      y: startY - 30,
      scale: (cardView.scaleX || 1) * 1.08,
      angle: 0,
      duration: 82,
      ease: 'Sine.Out',
      onComplete: () => {
        this.tweens.add({
          targets: ghost,
          x: midX,
          y: midY,
          scale: 0.82,
          angle: 3,
          duration: 118,
          ease: 'Sine.InOut',
          onComplete: () => {
            this.tweens.add({
              targets: ghost,
              x: endX,
              y: endY,
              scale: 0.42,
              alpha: 0.12,
              angle: 7,
              duration: 132,
              ease: 'Cubic.In',
              onComplete: () => {
                ghost.destroy();
                const burstColor = card.type === CARD_TYPES.ATTACK ? 0xf0b46a : card.type === CARD_TYPES.SKILL ? 0x80b8d8 : 0xc7a8e6;
                impactBurst(this, endX, endY, 6, burstColor);
                done();
              }
            });
          }
        });
      }
    });
  }

  applyVisualEvents(events, targetIndex = null) {
    for (const event of events) {
      if (event.type === 'enemyDamage') {
        const view = this.enemyViews[event.targetIndex ?? targetIndex];
        const enemy = this.battle.enemies[event.targetIndex ?? targetIndex];
        if (view) {
          this.playActorPose(view, 'hit', { duration: 390, knockX: 18 });
          slashEffect(this, view.x, view.y - 36);
          hitFlash(this, view);
          impactBurst(this, view.x, view.y - 34, event.amount);
          hitStop(this, event.amount >= 18 ? 58 : 42, event.amount >= 18 ? 0.1 : 0.16);
          screenShake(this, event.amount >= 18 ? 0.006 : 0.0038, event.amount >= 18 ? 210 : 150);
          view.healthBar?.setValue(enemy?.hp ?? 0, enemy?.maxHp ?? 1, enemy?.block ?? 0, true);
          spawnDamageText(this, view.x, view.y - 142, event.amount, 'damage');
          this.audio?.play('swordHit', { volume: 0.72, variance: 0.045, cooldown: 20 });
          this.time.delayedCall(58, () => this.audio?.play('enemyHit', { volume: 0.55, variance: 0.035, cooldown: 20 }));
        }
      }
      if (event.type === 'playerDamage') {
        const attacker = this.getEnemyViewForEvent(event);
        if (attacker) {
          this.playActorPose(attacker, 'attack', { duration: 460, lungeX: -34, motionDuration: 110 });
        }
        this.playActorPose(this.playerView, 'hit', { duration: 430, knockX: -18 });
        slashEffect(this, this.playerView.x, this.playerView.y - 42);
        hitFlash(this, this.playerView);
        impactBurst(this, this.playerView.x, this.playerView.y - 40, event.amount, 0xe16a54);
        hitStop(this, event.amount >= 16 ? 56 : 42, 0.13);
        screenShake(this, event.amount >= 16 ? 0.007 : 0.0045, 190);
        this.playerView.healthBar?.setValue(this.battle.player.hp, this.battle.player.maxHp, this.battle.player.block, true);
        spawnDamageText(this, this.playerView.x, this.playerView.y - 150, event.amount, 'damage');
        this.audio?.play('playerHit', { volume: 0.66, variance: 0.04, cooldown: 20 });
      }
      if (event.type === 'block') {
        this.playActorPose(this.playerView, 'defend', { duration: 520 });
        shieldEffect(this, this.playerView.x, this.playerView.y - 34);
        this.playerView.healthBar?.setValue(this.battle.player.hp, this.battle.player.maxHp, this.battle.player.block, true);
        spawnDamageText(this, this.playerView.x, this.playerView.y - 150, event.amount, 'block');
        this.audio?.play('shieldBlock', { volume: 0.72, variance: 0.025, cooldown: 20 });
      }
      if (event.type === 'heal') {
        healEffect(this, this.playerView.x, this.playerView.y - 44);
        this.playerView.healthBar?.setValue(this.battle.player.hp, this.battle.player.maxHp, this.battle.player.block, true);
        spawnDamageText(this, this.playerView.x, this.playerView.y - 150, event.amount, 'heal');
        this.audio?.play('heal', { volume: 0.68, variance: 0.02, cooldown: 20 });
      }
      if (event.type === 'enemyBlock' || event.type === 'enemyHeal' || event.type === 'enemyBuff') {
        const view = this.getEnemyViewForEvent(event);
        if (view) {
          this.playActorPose(view, event.type === 'enemyBlock' ? 'hit' : 'attack', { duration: 430 });
          if (event.type === 'enemyBlock') {
            shieldEffect(this, view.x, view.y - 40);
            this.audio?.play('shieldBlock', { volume: 0.58, variance: 0.025, cooldown: 20 });
          }
          if (event.type === 'enemyHeal') {
            healEffect(this, view.x, view.y - 40);
            this.audio?.play('heal', { volume: 0.58, variance: 0.02, cooldown: 20 });
          }
          if (event.type === 'enemyBuff') this.audio?.play('buff', { volume: 0.55, variance: 0.02, cooldown: 20 });
          spawnDamageText(this, view.x, view.y - 130, event.amount, event.type === 'enemyHeal' ? 'heal' : 'block');
        }
      }
      if (event.type === 'statusEnemy') {
        const view = this.enemyViews[event.targetIndex ?? targetIndex];
        if (view) spawnDamageText(this, view.x, view.y - 130, event.amount, 'status');
      }
      if (event.type === 'statusPlayer') {
        spawnDamageText(this, this.playerView.x, this.playerView.y - 150, event.amount, 'status');
      }
      if (event.type === 'summon') {
        addToast(this, `${event.enemy.name}加入战斗。`);
      }
      if (event.type === 'enemyCharge') {
        const view = this.getEnemyViewForEvent(event);
        if (view) {
          this.playActorPose(view, 'defend', { duration: 620 });
          impactBurst(this, view.x, view.y - 42, 12, 0xe06a4d);
        }
        screenShake(this, 0.0055, 260);
        this.audio?.play('bossPhase', { volume: 0.82, cooldown: 80 });
        showTurnBanner(this, '危险：首领正在蓄力');
      }
      if (event.type === 'bossPhase') {
        this.lastBossPhase = Math.max(this.lastBossPhase, event.phase);
        const bossView = this.getEnemyViewForEvent(event);
        bossPhaseSurge(this, bossView, event.phase);
        hitStop(this, event.phase === 3 ? 110 : 82, 0.08);
        screenShake(this, event.phase === 3 ? 0.011 : 0.008, 360);
        this.audio?.play('bossPhase');
        showTurnBanner(this, `首领第 ${event.phase} 阶段`);
      }
    }
  }

  getEnemyViewForEvent(event) {
    if (event.enemyUid) return this.enemyViewsByUid.get(event.enemyUid) ?? null;
    if (event.enemyId) return this.enemyViewsById.get(event.enemyId) ?? null;
    return null;
  }

  endTurn() {
    if (this.uiPaused || this.inputLocked || this.battle.ended) return;
    this.inputLocked = true;
    this.selectedUid = null;
    this.keyboardTargetIndex = null;
    this.currentPrompt = '敌人行动中。';
    this.audio?.play('turn');
    showTurnBanner(this, '敌人回合');
    this.time.delayedCall(540, () => this.resolveEnemyTurn());
  }

  resolveEnemyTurn() {
    if (this.uiPaused) {
      this.time.delayedCall(120, () => this.resolveEnemyTurn());
      return;
    }
    const events = BattleSystem.endPlayerTurn(this.run, this.battle);
    BattleSystem.syncRun(this.run, this.battle);
    if (!this.battle.ended) this.saveCheckpoint();
    this.time.delayedCall(80, () => {
      this.applyVisualEvents(events);
      this.checkBossPhaseFeedback();
      BattleSystem.syncRun(this.run, this.battle);
      this.finishIfNeeded();
      if (!this.battle.ended) {
        showTurnBanner(this, '你的回合');
        this.inputLocked = false;
        this.currentPrompt = '点击一张卡牌使用。';
        this.renderBattle();
      }
    });
  }

  finishIfNeeded() {
    if (!this.battle.ended) return;
    this.inputLocked = true;
    BattleSystem.syncRun(this.run, this.battle);
    saveActiveRun(this, this.run);
    this.currentPrompt = this.battle.won ? '战斗胜利，正在结算奖励。' : '你倒下了，旅途结束。';
    this.renderBattle();
    if (this.battle.won) {
      this.audio?.play('victory');
      if (this.battleType === 'boss') {
        clearBattleCheckpoint(this.run, `battle-${this.run.map.activeNode}`);
        MapSystem.finishActiveNode(this.run);
        saveActiveRun(this, this.run);
        this.time.delayedCall(850, () => this.scene.start(SCENES.ActClear));
      } else {
        this.run.lastBattleType = this.battleType;
        this.run.pendingReward = RewardSystem.createReward(this.run, this.battleType);
        this.run.rewardClaimed = false;
        clearBattleCheckpoint(this.run, `battle-${this.run.map.activeNode}`);
        saveActiveRun(this, this.run);
        this.time.delayedCall(850, () => this.scene.start(SCENES.Reward));
      }
    } else {
      this.audio?.play('defeat');
      this.run.failureCount = (this.run.failureCount ?? 0) + 1;
      this.registry.set('result', { victory: false });
      SaveManager.clearRun();
      this.time.delayedCall(850, () => this.scene.start(SCENES.Result, { victory: false, run: this.run }));
    }
  }

  updatePrompt() {
    const instance = this.selectedUid ? this.battle.deck.hand.find((card) => card.uid === this.selectedUid) : null;
    if (instance) {
      const card = CardSystem.getDisplayCard(instance);
      if (card.requiresTarget) {
        this.setPrompt('请选择一个敌人作为目标。', '攻击牌需要先选牌，再点击敌人。');
        return;
      }
      this.setPrompt('再次点击确认，或直接打出防御牌。', '防御牌通常点击后立即生效。');
      return;
    }
    if (this.inputLocked) {
      this.setPrompt(this.currentPrompt || '行动结算中。', '等待动画和状态刷新。');
      return;
    }
    this.setPrompt(this.currentPrompt || '点击一张卡牌使用。', '能量不足的卡牌会变暗，结束回合后敌人行动。');
  }

  setPrompt(message, subMessage = null) {
    this.currentPrompt = message;
    this.promptText?.setText(message);
    this.promptSubText?.setText(subMessage ?? '看敌人头顶意图，再决定攻击或防御。');
    this.handHintText?.setText(this.shortHandPrompt(message));
  }

  shortHandPrompt(message) {
    if (message.includes('能量不足')) return '能量不足';
    if (message.includes('请选择')) return '请选择目标';
    if (message.includes('敌人行动')) return '敌人行动中';
    if (message.includes('结束')) return '回合结束';
    if (message.includes('无法')) return '无法打出';
    return '点击卡牌使用';
  }

  maybeShowTutorial() {
    const settings = SaveManager.readSettings();
    if (!settings.tutorialEnabled || settings.tutorialSeen) return;
    this.showTutorial(0);
  }

  checkBossPhaseFeedback() {
    const boss = this.battle.enemies.find((enemy) => enemy.type === 'boss' && enemy.hp > 0);
    if (!boss) return;
    const ratio = boss.hp / boss.maxHp;
    const phase = ratio <= 0.33 ? 3 : ratio <= 0.66 ? 2 : 1;
    if (phase > this.lastBossPhase) {
      this.lastBossPhase = phase;
      const bossView = this.enemyViewsByUid.get(boss.uid) ?? this.enemyViewsById.get(boss.id);
      bossPhaseSurge(this, bossView, phase);
      hitStop(this, phase === 3 ? 110 : 82, 0.08);
      screenShake(this, phase === 3 ? 0.011 : 0.008, 360);
      this.audio?.play('bossPhase');
      showTurnBanner(this, `首领第 ${phase} 阶段`);
    }
  }

  showTutorial(step) {
    const steps = [
      ['观察敌人意图', '敌人头顶的图标表示它下回合要做什么。看到攻击意图时，优先考虑防御。'],
      ['点击卡牌', '点击手牌选择卡牌。能量不足或无法打出的牌会变暗。'],
      ['选择目标', '攻击牌通常需要再点击一个敌人作为目标。意图文字会保持在敌人头顶。'],
      ['使用防御', '防御牌通常点击后直接生效，并在玩家周围显示护盾反馈。'],
      ['管理能量', `每回合你有 ${this.run.baseEnergy} 点能量。卡牌左上角数字是费用。`],
      ['结束回合', '不再行动时点击结束回合，敌人将按照意图行动，然后进入你的新回合。']
    ];
    this.tutorialStep = Phaser.Math.Clamp(step, 0, steps.length - 1);
    this.tutorialPanel?.destroy();
    const log = LAYOUT.log;
    const centerX = log.x + log.w / 2;
    const centerY = log.y + log.h / 2 + 22;
    this.tutorialPanel = this.add.container(centerX, centerY).setDepth(920);
    const panel = new UIPanel(this, 0, 0, log.w - 28, log.h - 70, { fill: 0x1a1110, alpha: 0.98, stroke: 0x9b7438, lineWidth: 2 });
    const title = this.add
      .text(0, -166, `战斗教学\n${steps[this.tutorialStep][0]}`, {
        fontFamily: FONT,
        fontSize: 20,
        color: TEXT.primary,
        align: 'center',
        stroke: '#120b08',
        strokeThickness: 4,
        lineSpacing: 6,
        wordWrap: { width: log.w - 74, useAdvancedWrap: true }
      })
      .setOrigin(0.5);
    const body = this.add
      .text(0, -42, wrapCjkText(steps[this.tutorialStep][1], 12), {
        fontFamily: FONT,
        fontSize: 16,
        color: TEXT.body,
        align: 'center',
        lineSpacing: 8,
        stroke: '#120b08',
        strokeThickness: 3,
        wordWrap: { width: log.w - 78, useAdvancedWrap: true }
      })
      .setOrigin(0.5);
    const pageText = this.add
      .text(0, 102, `${this.tutorialStep + 1} / ${steps.length}`, {
        fontFamily: FONT,
        fontSize: 15,
        color: TEXT.muted,
        stroke: '#120b08',
        strokeThickness: 2
      })
      .setOrigin(0.5);
    this.tutorialPanel.add([panel, title, body, pageText]);
    if (this.tutorialStep > 0) {
      this.tutorialPanel.add(new UIButton(this, -72, 154, 118, 38, '上一步', () => this.showTutorial(this.tutorialStep - 1), { fontSize: 16 }));
    }
    if (this.tutorialStep < steps.length - 1) {
      this.tutorialPanel.add(new UIButton(this, this.tutorialStep > 0 ? 72 : -72, 154, 118, 38, '下一步', () => this.showTutorial(this.tutorialStep + 1), { fontSize: 16 }));
    }
    this.tutorialPanel.add(new UIButton(this, -72, 204, 118, 38, '我知道了', () => this.closeTutorial(), { fontSize: 16 }));
    this.tutorialPanel.add(
      new UIButton(this, 72, 204, 118, 38, '不再提示', () => {
        const settings = SaveManager.readSettings();
        settings.tutorialSeen = true;
        settings.tutorialEnabled = false;
        SaveManager.saveSettings(settings);
        this.closeTutorial();
      }, { fontSize: 18 })
    );
  }

  closeTutorial() {
    SaveManager.markTutorialSeen();
    this.tutorialPanel?.destroy();
    this.tutorialPanel = null;
  }
}
