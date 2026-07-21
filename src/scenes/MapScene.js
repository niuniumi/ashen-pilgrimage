import Phaser from 'phaser';
import { getActDefinition } from '../data/acts.js';
import { getRelic } from '../data/relics.js';
import { NODE_TIPS, SCENES } from '../game/constants.js';
import { drawMapBackdrop } from '../art/BackgroundFactory.js';
import { SCENE_TITLES, THEME, textStyle, titleStyle } from '../game/Theme.js';
import { SaveManager } from '../game/SaveManager.js';
import { MapSystem } from '../systems/MapSystem.js';
import { UIButton } from '../ui/UIButton.js';
import { UITooltip } from '../ui/UITooltip.js';
import { UIFrame } from '../ui/UIFrame.js';
import { drawBackArrowButton, drawDivider } from '../ui/UIOrnament.js';
import { drawIcon, UIIcon } from '../ui/UIIcon.js';
import { installPauseMenu } from '../ui/PauseMenu.js';
import { addToast, attachSceneServices, getActiveRun, preloadSceneAssets, saveActiveRun } from './SceneHelpers.js';
import { HANDPAINTED_KEYS, hasTexture } from '../art/HandPaintedAssets.js';
import { FONT } from '../design/textStyles.js';
import { MapInputController } from '../input/MapInputController.js';

const MAP_BOUNDS = { xMin: 360, xMax: 1160, yTop: 142, yBottom: 704 };
const SOURCE_X_MIN = 300;
const SOURCE_X_MAX = 850;

export default class MapScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Map);
  }

  preload() {
    preloadSceneAssets(this, SCENES.Map, { title: '展开旅途地图' });
  }

  create() {
    this.mapInput?.destroy();
    this.mapInput = null;
    this.transitionLocked = false;
    attachSceneServices(this);
    this.run = getActiveRun(this);
    if (!this.run) return;
    this.chapter = getActDefinition(this.run.act ?? this.run.map?.act ?? 1);
    this.motionEnabled = SaveManager.readSettings().animation !== false;
    this.audio?.startAmbience?.(`map-act-${this.chapter.number}`);

    this.tooltip = new UITooltip(this);
    this.nodeViews = [];
    this.drawBackdrop();
    this.drawChapterMapDressing();
    this.drawHeader();
    this.drawPanels();
    this.drawMap();
    this.installMapInput();
    this.drawControls();
    installPauseMenu(this, { buttonX: 1466, buttonY: 54, allowMap: false });
  }

  drawBackdrop() {
    drawMapBackdrop(this);
  }

  drawChapterMapDressing() {
    const act = this.chapter?.number ?? 1;
    const g = this.add.graphics().setDepth(2);
    g.setBlendMode(Phaser.BlendModes.MULTIPLY);
    this.drawMapWash(g, act);
    const label = this.add
      .text(768, 724, this.chapter?.shortTitle ?? '', {
        fontFamily: FONT,
        fontSize: 30,
        color: '#6f5430',
        align: 'center'
      })
      .setOrigin(0.5)
      .setAlpha(0.24)
      .setDepth(2);
    label.setBlendMode(Phaser.BlendModes.MULTIPLY);
    const frame = this.add.graphics().setDepth(3);
    frame.lineStyle(3, 0xb88935, 0.24);
    frame.strokeRect(310, 128, 916, 608);
    frame.lineStyle(1, 0x7b6040, 0.22);
    frame.strokeRect(330, 148, 876, 568);
  }

  drawMapWash(g, act) {
    const tint = act === 2 ? 0xb78f58 : act === 3 ? 0x7f7163 : 0x8a6a3d;
    g.fillStyle(tint, 0.085);
    g.fillEllipse(770, 420, 620, 390);
    g.fillStyle(0xffffff, 0.06);
    g.fillEllipse(640, 282, 340, 110);
  }

  drawVillageGraveMapSketch(g) {
    const ink = 0x4f3a28;
    this.sketchMapLine(g, 474, 510, 628, 475, ink, 0.32, 7);
    this.sketchMapLine(g, 628, 475, 742, 524, ink, 0.32, 7);
    this.sketchMapLine(g, 742, 524, 896, 482, ink, 0.32, 7);
    for (let i = 0; i < 7; i += 1) {
      const x = 492 + i * 70;
      const y = 564 + (i % 2) * 24;
      g.lineStyle(2, ink, 0.32);
      g.lineBetween(x, y - 24, x, y + 28);
      g.lineBetween(x - 16, y - 4, x + 16, y - 4);
      g.lineStyle(1, ink, 0.2);
      g.strokeEllipse(x, y + 36, 42, 12);
    }
    for (let i = 0; i < 5; i += 1) {
      const x = 518 + i * 106;
      const y = 356 + (i % 2) * 22;
      g.lineStyle(2, ink, 0.28);
      g.strokeRoundedRect(x - 34, y - 18, 68, 44, 4);
      g.lineBetween(x - 42, y - 18, x, y - 52);
      g.lineBetween(x, y - 52, x + 42, y - 18);
      g.lineBetween(x - 16, y + 26, x - 16, y - 6);
      g.lineBetween(x + 14, y + 26, x + 14, y - 4);
    }
  }

  drawAbbeyMapSketch(g) {
    const ink = 0x574431;
    const wax = 0xb78943;
    for (let i = 0; i < 5; i += 1) {
      const x = 560 + i * 96;
      const y = 566 + (i % 2) * 14;
      g.lineStyle(2, wax, 0.3);
      g.lineBetween(x, y - 74, x, y + 28);
      g.fillStyle(0xf4e5bd, 0.18);
      g.fillRoundedRect(x - 9, y - 92, 18, 42, 5);
      this.sketchMapLine(g, x - 14, y - 50, x + 12, y - 50, ink, 0.28, 2);
      g.lineStyle(1, wax, 0.28);
      g.strokeEllipse(x, y + 34, 54, 14);
    }
    g.lineStyle(3, ink, 0.3);
    g.strokeRoundedRect(652, 270, 238, 212, 106);
    g.lineStyle(2, ink, 0.26);
    g.strokeRoundedRect(694, 320, 154, 164, 72);
    g.lineStyle(2, wax, 0.34);
    g.lineBetween(770, 320, 770, 466);
    g.lineBetween(728, 382, 812, 382);
    for (let i = 0; i < 6; i += 1) {
      this.sketchMapLine(g, 632 + i * 58, 492, 656 + i * 44, 528 + (i % 2) * 22, wax, 0.25, 3);
    }
  }

  drawOldCapitalMapSketch(g) {
    const ink = 0x4a4034;
    const crown = 0x9b7440;
    g.lineStyle(3, ink, 0.3);
    this.sketchMapLine(g, 484, 544, 1030, 544, ink, 0.32, 8);
    for (let i = 0; i < 7; i += 1) {
      const x = 526 + i * 78;
      g.strokeRoundedRect(x - 20, 478 - (i % 2) * 10, 40, 68 + (i % 2) * 10, 5);
      g.lineBetween(x - 24, 478 - (i % 2) * 10, x, 442 - (i % 2) * 12);
      g.lineBetween(x, 442 - (i % 2) * 12, x + 24, 478 - (i % 2) * 10);
    }
    g.lineStyle(2, crown, 0.34);
    g.lineBetween(690, 320, 724, 276);
    g.lineBetween(724, 276, 768, 328);
    g.lineBetween(768, 328, 814, 276);
    g.lineBetween(814, 276, 846, 320);
    g.lineBetween(690, 320, 846, 320);
    g.strokeEllipse(768, 344, 182, 42);
    for (let i = 0; i < 6; i += 1) {
      this.sketchMapLine(g, 574 + i * 72, 610, 612 + i * 64, 654, ink, 0.22, 4);
    }
  }

  sketchMapLine(g, x1, y1, x2, y2, color = 0x4f3a28, alpha = 0.2, jitter = 5) {
    g.lineStyle(1.5, color, alpha);
    let lastX = x1;
    let lastY = y1;
    for (let i = 1; i <= 5; i += 1) {
      const t = i / 5;
      const x = Phaser.Math.Linear(x1, x2, t) + (i < 5 ? ((i % 2 ? 1 : -1) * jitter) : 0);
      const y = Phaser.Math.Linear(y1, y2, t) + (i < 5 ? (((i + 1) % 3) - 1) * jitter : 0);
      g.lineBetween(lastX, lastY, x, y);
      lastX = x;
      lastY = y;
    }
  }

  drawHeader() {
    const [fallbackTitle, fallbackSubtitle] = SCENE_TITLES.map;
    const title = this.chapter?.title ?? fallbackTitle;
    const subtitle = this.chapter?.mapCaption ?? fallbackSubtitle;
    this.add.text(768, 48, title, titleStyle(39)).setOrigin(0.5);
    this.add.text(768, 92, subtitle, textStyle(18, THEME.css.muted, { align: 'center' })).setOrigin(0.5);
    drawDivider(this, 768, 118, 520);
  }

  drawPanels() {
    const relicIds = Array.isArray(this.run.relics) ? this.run.relics : [];
    new UIFrame(this, 204, 454, 250, 560, { fill: THEME.colors.panel, alpha: 0.9, stroke: THEME.colors.darkGold });
    new UIFrame(this, 1334, 454, 260, 560, { fill: THEME.colors.panel, alpha: 0.9, stroke: THEME.colors.darkGold });

    this.add.text(204, 205, '行者状态', titleStyle(26)).setOrigin(0.5);
    drawDivider(this, 204, 236, 178);
    this.add
      .text(95, 266, `角色：${this.run.characterName}\n生命：${this.run.hp}/${this.run.maxHp}\n金币：${this.run.gold}\n层数：${this.run.floor}\n牌组：${this.run.deck.length} 张\n遗物：${relicIds.length} 件`, {
        ...textStyle(19, THEME.css.body, { lineSpacing: 9 }),
        wordWrap: { width: 214 }
      })
      .setOrigin(0, 0);

    const relicNames = relicIds.map((id) => getRelic(id)).filter(Boolean).map((relic) => relic.name).slice(0, 5);
    this.add.text(95, 500, '携带遗物', textStyle(19, THEME.css.paleGold)).setOrigin(0, 0);
    this.add
      .text(95, 536, relicNames.length ? relicNames.join('\n') : '暂无遗物', {
        ...textStyle(16, THEME.css.muted, { lineSpacing: 7 }),
        wordWrap: { width: 208 }
      })
      .setOrigin(0, 0);

    this.add.text(1334, 205, '节点图例', titleStyle(26)).setOrigin(0.5);
    drawDivider(this, 1334, 236, 188);
    const entries = [
      ['battle', '普通战斗'],
      ['elite', '精英'],
      ['event', '事件'],
      ['shop', '商店'],
      ['rest', '休息'],
      ['chest', '宝箱'],
      ['boss', '首领']
    ];
    entries.forEach(([type, label], index) => {
      const y = 280 + index * 48;
      const icon = new UIIcon(this, 1246, y, type, { size: 34, alpha: 0.95 });
      this.add.text(1276, y, label, textStyle(17, THEME.css.body)).setOrigin(0, 0.5);
      icon.setDepth(10);
    });
    this.add
      .text(1224, 650, '只能点击发光节点。\n完成节点后路线会继续向上展开。', {
        ...textStyle(16, THEME.css.muted, { lineSpacing: 6 }),
        wordWrap: { width: 210 }
      })
      .setOrigin(0, 0);
  }

  drawMap() {
    this.mapMaxRow = Math.max(1, ...this.run.map.nodes.map((item) => item.row ?? 0));
    this.compactMap = this.mapMaxRow >= 11;
    const routeLayer = this.add.graphics().setDepth(10);
    routeLayer.setAlpha(1);
    for (const node of this.run.map.nodes) {
      for (const link of node.links) {
        const target = MapSystem.getNode(this.run, link);
        if (!target) continue;
        this.drawRoute(routeLayer, this.nodePosition(node), this.nodePosition(target), node, target);
      }
    }
    this.drawUnlockedPathFeedback();
    this.run.map.nodes.forEach((node) => this.createNode(node));
  }

  drawUnlockedPathFeedback() {
    const completed = new Set(this.run.map.completed ?? []);
    const available = new Set(this.run.map.available ?? []);
    const edges = [];
    for (const node of this.run.map.nodes) {
      if (!completed.has(node.id)) continue;
      for (const targetId of node.links ?? []) {
        if (!available.has(targetId)) continue;
        const target = MapSystem.getNode(this.run, targetId);
        if (target) edges.push([node, target]);
      }
    }
    if (edges.length === 0) return null;

    const path = this.add.container(0, 0).setDepth(15).setName('map-unlock-path');
    for (const [source, target] of edges) {
      const points = this.routePoints(this.nodePosition(source), this.nodePosition(target));
      for (let index = 0; index < points.length - 1; index += 1) {
        const from = points[index];
        const to = points[index + 1];
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const x = (from.x + to.x) / 2;
        const y = (from.y + to.y) / 2;
        const shadow = this.add.line(x, y, -dx / 2, -dy / 2, dx / 2, dy / 2, 0x2b170d, 0.72).setLineWidth(7);
        const ember = this.add.line(x, y, -dx / 2, -dy / 2, dx / 2, dy / 2, THEME.colors.candle, 0.98).setLineWidth(3);
        shadow.setName('map-unlock-segment-shadow');
        ember.setName('map-unlock-segment');
        path.add([shadow, ember]);
      }
    }

    if (!this.motionEnabled) return path;
    path.setAlpha(0);
    this.tweens.add({ targets: path, alpha: 1, duration: 220, ease: 'Sine.Out' });
    return path;
  }

  nodePosition(node) {
    const t = Phaser.Math.Clamp((Number(node.x) - SOURCE_X_MIN) / (SOURCE_X_MAX - SOURCE_X_MIN), 0, 1);
    const rowProgress = Phaser.Math.Clamp((Number(node.row) || 0) / (this.mapMaxRow ?? 1), 0, 1);
    return {
      x: Phaser.Math.Linear(MAP_BOUNDS.xMin, MAP_BOUNDS.xMax, t),
      y: Phaser.Math.Linear(MAP_BOUNDS.yBottom, MAP_BOUNDS.yTop, rowProgress)
    };
  }

  drawRoute(g, from, to, node, target) {
    const completed = this.run.map.completed.includes(node.id) || this.run.map.path.includes(target.id);
    const selectable = this.run.map.available.includes(target.id) || this.run.map.available.includes(node.id);
    const points = this.routePoints(from, to);
    if (!completed && !selectable) {
      g.lineStyle(1, 0x5f4a33, 0.12);
      g.strokePoints(points);
      return;
    }
    g.lineStyle(4, 0x2b170d, completed ? 0.55 : 0.42);
    g.strokePoints(points);
    g.lineStyle(2, completed ? 0xd0a24f : THEME.colors.candle, completed ? 0.9 : 0.78);
    g.strokePoints(points);
  }

  routePoints(from, to) {
    const points = [];
    for (let i = 0; i <= 5; i += 1) {
      const t = i / 5;
      const interior = i > 0 && i < 5;
      points.push(new Phaser.Geom.Point(
        Phaser.Math.Linear(from.x, to.x, t) + (interior ? (i % 2 ? 2 : -2) : 0),
        Phaser.Math.Linear(from.y, to.y, t) + (interior ? ((i % 3) - 1) * 2 : 0)
      ));
    }
    return points;
  }

  createNode(node) {
    const pos = this.nodePosition(node);
    const selectable = this.run.map.available.includes(node.id) && !this.run.map.activeNode;
    const completed = this.run.map.completed.includes(node.id);
    const compact = this.compactMap;
    const container = this.add.container(pos.x, pos.y);
    container.setAlpha(1);
    const restingScale = selectable ? 1.08 : 1;
    container.setScale(restingScale);
    container.setDepth(20);
    if (selectable) {
      const aura = this.add.graphics();
      const auraSize = compact ? 50 : 58;
      aura.lineStyle(2, THEME.colors.candle, 0.72);
      aura.strokeRect(-auraSize / 2, -auraSize / 2, auraSize, auraSize);
      aura.setAlpha(this.motionEnabled ? 0.28 : 0.58);
      container.add(aura);
      if (this.motionEnabled) {
        this.tweens.add({
          targets: aura,
          alpha: 0.82,
          duration: 980,
          ease: 'Sine.InOut',
          yoyo: true,
          repeat: -1
        });
      }
    }
    if (!hasTexture(this, HANDPAINTED_KEYS.ui)) {
      const seal = this.add.graphics();
      seal.fillStyle(completed ? 0x3a2d20 : 0x6a3d20, completed ? 0.42 : 0.82);
      const size = selectable ? (compact ? 54 : 64) : compact ? 46 : 54;
      seal.fillRect(-size / 2, -size / 2, size, size);
      seal.lineStyle(selectable ? 3 : 2, selectable ? THEME.colors.candle : THEME.colors.darkGold, selectable ? 1 : 0.6);
      seal.strokeRect(-size / 2, -size / 2, size, size);
      container.add(seal);
    }
    const icon = new UIIcon(this, 0, 0, node.type, {
      size: selectable ? (compact ? 42 : 48) : compact ? 36 : 42,
      alpha: completed ? 0.42 : 0.98,
      bg: node.type === 'boss' ? 0x4a1c25 : node.type === 'elite' ? 0x5b2925 : 0x231612
    });
    container.add(icon);
    const label = this.add
      .text(0, compact ? 28 : 36, MapSystem.getNodeLabel(node.type), textStyle(compact ? 10 : 12, completed ? '#6f5b42' : '#2b170d', { align: 'center', strokeThickness: 0 }))
      .setOrigin(0.5);
    container.add(label);

    let hit = null;
    if (selectable) {
      hit = this.add.zone(pos.x, pos.y, 100, 100).setDepth(60);
      hit.setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => {
        this.mapInput?.setSelected(node.id);
        this.audio?.play('uiHover');
        this.setNodeFocus(node.id, true);
        this.tooltip.show(pos.x + 42, pos.y - 82, `${MapSystem.getNodeLabel(node.type)}\n${NODE_TIPS[node.type]}`);
      });
      hit.on('pointerdown', () => {
        if (this.transitionLocked) return;
        this.tweens.killTweensOf(container);
        container.setScale(restingScale - 0.04).setY(pos.y + 2);
      });
      hit.on('pointerout', () => {
        this.tooltip.hide();
        this.setNodeFocus(node.id, this.mapInput?.selectedId === node.id);
      });
      hit.on('pointerup', () => {
        this.mapInput?.setSelected(node.id);
        this.selectNode(node);
      });
    }
    this.nodeViews.push({ id: node.id, type: node.type, x: pos.x, y: pos.y, depth: container.depth, selectable, completed, node, container, hit, restingScale });
  }

  installMapInput() {
    const selectable = this.nodeViews.filter((view) => view.selectable);
    if (selectable.length === 0) return;
    const controller = new MapInputController(selectable, {
      onSelect: (id) => this.setNodeFocus(id, true),
      onConfirm: (id) => {
        const view = this.nodeViews.find((candidate) => candidate.id === id);
        if (!view) return false;
        return this.selectNode(view.node);
      }
    });
    this.mapInput = controller;
    controller.install(this.input.keyboard);
    this.setNodeFocus(controller.selectedId, true);
    this.accessibility?.announce?.(`可选路线：${selectable.map((view) => MapSystem.getNodeLabel(view.type)).join('、')}。使用方向键选择，回车确认。`);
    const clearActions = this.accessibility?.setActions?.(SCENES.Map, selectable.map((view) => ({
      label: `进入${MapSystem.getNodeLabel(view.type)}`,
      onActivate: () => {
        controller.setSelected(view.id);
        controller.confirm();
      }
    })));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      controller.destroy();
      clearActions?.();
      if (this.mapInput === controller) this.mapInput = null;
    });
  }

  setNodeFocus(id, focused) {
    const view = this.nodeViews.find((candidate) => candidate.id === id);
    if (!view?.selectable || this.transitionLocked) return;
    for (const candidate of this.nodeViews) {
      if (!candidate.selectable) continue;
      const active = candidate.id === id && focused;
      const targetScale = candidate.restingScale + (active ? 0.1 : 0);
      const targetY = candidate.y - (active ? 4 : 0);
      this.tweens.killTweensOf(candidate.container);
      if (!this.motionEnabled) {
        candidate.container.setScale(targetScale).setY(targetY);
        continue;
      }
      this.tweens.add({
        targets: candidate.container,
        scaleX: targetScale,
        scaleY: targetScale,
        y: targetY,
        duration: 130,
        ease: active ? 'Back.Out' : 'Sine.Out'
      });
    }
    if (focused) {
      this.accessibility?.announce?.(`已选择${MapSystem.getNodeLabel(view.type)}。${NODE_TIPS[view.type]}`);
    }
  }

  drawControls() {
    drawBackArrowButton(this, 104, 806, '', () => {
      SaveManager.saveRun(this.run);
      this.scene.start(SCENES.MainMenu);
    }, { width: 148, height: 42, depth: 28 });
    const latestRelicId = this.run.relics?.[this.run.relics.length - 1];
    new UIIcon(this, 1095, 208, 'relic', { size: 76, alpha: 0.9, relicId: latestRelicId });
  }

  selectNode(node) {
    if (this.uiPaused || this.transitionLocked) return false;
    if (!MapSystem.canSelect(this.run, node.id)) {
      addToast(this, '只能选择当前路线连接的发光节点。', 'error');
      return false;
    }
    this.transitionLocked = true;
    this.mapInput?.lock();
    this.audio?.play('uiClick');
    MapSystem.startNode(this.run, node.id);
    this.run.pendingScene = node.type === 'boss' ? 'boss-intro' : node.type;
    this.run.pendingBattleType = node.type === 'elite' ? 'elite' : node.type === 'boss' ? 'boss' : 'battle';
    saveActiveRun(this, this.run);
    if (node.type === 'boss') {
      this.scene.start(SCENES.BossIntro);
      return true;
    }
    if (node.type === 'battle' || node.type === 'elite') {
      this.scene.start(SCENES.Battle, { battleType: node.type === 'elite' ? 'elite' : 'battle' });
      return true;
    }
    const sceneMap = {
      event: SCENES.Event,
      shop: SCENES.Shop,
      rest: SCENES.Rest,
      chest: SCENES.Chest
    };
    this.scene.start(sceneMap[node.type] ?? SCENES.Map);
    return true;
  }
}
