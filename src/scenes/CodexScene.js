import Phaser from 'phaser';
import { cards } from '../data/cards.js';
import { enemies } from '../data/enemies.js';
import { keywords } from '../data/keywords.js';
import { relics } from '../data/relics.js';
import { CARD_TYPES, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../game/constants.js';
import { SCENE_TITLES, THEME, textStyle, titleStyle } from '../game/Theme.js';
import { addAmbientAsh } from '../effects/AmbientParticles.js';
import { UIButton } from '../ui/UIButton.js';
import { UICard } from '../ui/UICard.js';
import { UIFrame } from '../ui/UIFrame.js';
import { UIIcon } from '../ui/UIIcon.js';
import { drawBackArrowButton, drawDivider, drawVignette } from '../ui/UIOrnament.js';
import { drawEnemyArt } from '../ui/UICharacterArt.js';
import { attachSceneServices, preloadSceneAssets } from './SceneHelpers.js';
import { addHandPaintedBackground, HANDPAINTED_KEYS } from '../art/HandPaintedAssets.js';

const TABS = [
  ['cards', '卡牌', 'sword'],
  ['relics', '遗物', 'relic'],
  ['enemies', '敌人', 'boss'],
  ['keywords', '关键词', 'event']
];

export default class CodexScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Codex);
  }

  preload() {
    preloadSceneAssets(this, SCENES.Codex, { title: '整理灰烬图鉴' });
  }

  create() {
    attachSceneServices(this);
    this.audio?.startAmbience?.('story');
    this.tab = 'cards';
    this.selectedId = null;
    this.page = 0;
    this.detailPage = 0;
    this.render();
  }

  render() {
    this.children.removeAll(true);
    this.drawBackdrop();
    this.drawHeader();
    this.drawShell();
    this.renderTabs();
    this.renderList();
    this.renderDetail();
  }

  drawBackdrop() {
    if (addHandPaintedBackground(this, HANDPAINTED_KEYS.folioBg, { depth: 0 })) {
      addAmbientAsh(this, { count: 18, depth: 4 });
      return;
    }
    const g = this.add.graphics();
    g.fillGradientStyle(0x16111d, 0x16111d, 0x3c241d, 0x0d0807, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    g.fillStyle(0x0b0908, 0.88);
    g.fillRect(0, 608, GAME_WIDTH, 256);
    g.fillStyle(0x261712, 0.92);
    g.fillRect(0, 608, GAME_WIDTH, 52);
    for (let i = 0; i < 9; i += 1) {
      const x = 140 + i * 150;
      g.fillStyle(0x101016, 0.9);
      g.fillRect(x, 315 - (i % 2) * 28, 34, 292 + (i % 3) * 22);
      g.fillTriangle(x - 12, 315 - (i % 2) * 28, x + 17, 270 - (i % 2) * 34, x + 46, 315 - (i % 2) * 28);
      g.fillStyle(0xf1c76a, 0.08);
      g.fillRect(x + 11, 396 + (i % 4) * 22, 6, 18);
    }
    drawVignette(this, 3);
    addAmbientAsh(this, { count: 34, depth: 4 });
  }

  drawHeader() {
    const [title, subtitle] = SCENE_TITLES.codex;
    this.add.text(768, 48, title, titleStyle(42)).setOrigin(0.5);
    this.add.text(768, 92, subtitle, textStyle(18, THEME.css.muted, { align: 'center' })).setOrigin(0.5);
    drawDivider(this, 768, 118, 520);
    drawBackArrowButton(this, 112, 58, '', () => this.scene.start(SCENES.MainMenu), {
      width: 148,
      height: 42,
      depth: 100
    });
  }

  drawShell() {
    new UIFrame(this, 214, 470, 230, 560, { fill: THEME.colors.panel, alpha: 0.92, stroke: THEME.colors.darkGold });
    new UIFrame(this, 562, 470, 420, 560, { fill: THEME.colors.panel, alpha: 0.9, stroke: THEME.colors.darkGold });
    new UIFrame(this, 1050, 470, 500, 560, { fill: THEME.colors.panel, alpha: 0.9, stroke: THEME.colors.darkGold });
    this.add.text(214, 224, '分类', titleStyle(27)).setOrigin(0.5);
    this.add.text(562, 224, '条目', titleStyle(27)).setOrigin(0.5);
    this.add.text(1050, 224, '详情', titleStyle(27)).setOrigin(0.5);
    drawDivider(this, 214, 254, 150);
    drawDivider(this, 562, 254, 310);
    drawDivider(this, 1050, 254, 385);
  }

  renderTabs() {
    TABS.forEach(([id, label, icon], index) => {
      const selected = this.tab === id;
      new UIIcon(this, 132, 304 + index * 76, icon, { size: 36, alpha: selected ? 1 : 0.58 });
      new UIButton(this, 230, 304 + index * 76, 150, 44, label, () => this.switchTab(id), {
        fontSize: 20,
        fill: selected ? 0x4a3421 : THEME.colors.iron
      });
    });
    this.add
      .text(112, 586, '图鉴只记录当前版本\n已有内容。\n卡牌效果、遗物说明\n和敌人行动均来自\n实际数据。', {
        ...textStyle(14, THEME.css.muted, { lineSpacing: 6, align: 'left' }),
        wordWrap: { width: 168, useAdvancedWrap: true }
      })
      .setOrigin(0, 0);
  }

  switchTab(tab) {
    this.tab = tab;
    this.selectedId = null;
    this.page = 0;
    this.detailPage = 0;
    this.render();
  }

  getItems() {
    if (this.tab === 'cards') return cards.filter((card) => !card.unplayable || card.type === CARD_TYPES.CURSE || card.type === CARD_TYPES.STATUS);
    if (this.tab === 'relics') return relics.filter((relic) => relic.rarity !== '旧版');
    if (this.tab === 'enemies') return enemies;
    return keywords;
  }

  itemKey(item) {
    return item.id ?? item.name;
  }

  renderList() {
    const items = this.getItems();
    const pageSize = 18;
    const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
    this.page = Phaser.Math.Clamp(this.page, 0, pageCount - 1);
    const pageItems = items.slice(this.page * pageSize, this.page * pageSize + pageSize);
    pageItems.forEach((item, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      const x = 468 + col * 190;
      const y = 302 + row * 48;
      const selected = this.itemKey(item) === (this.selectedId ?? this.itemKey(items[0]));
      new UIButton(this, x, y, 170, 38, item.name, () => {
        this.selectedId = this.itemKey(item);
        this.detailPage = 0;
        this.render();
      }, {
        fontSize: item.name.length > 5 ? 15 : 17,
        fill: selected ? 0x5c3b22 : THEME.colors.iron
      });
    });
    if (pageCount > 1) {
      new UIButton(this, 468, 748, 150, 38, '上一页', () => {
        this.page = Math.max(0, this.page - 1);
        this.selectedId = null;
        this.render();
      }, { fontSize: 17, disabled: this.page <= 0 });
      this.add.text(562, 748, `${this.page + 1}/${pageCount}`, textStyle(17, THEME.css.paleGold)).setOrigin(0.5);
      new UIButton(this, 656, 748, 150, 38, '下一页', () => {
        this.page = Math.min(pageCount - 1, this.page + 1);
        this.selectedId = null;
        this.render();
      }, { fontSize: 17, disabled: this.page >= pageCount - 1 });
    }
  }

  selectedItem() {
    const items = this.getItems();
    return items.find((item) => this.itemKey(item) === this.selectedId) ?? items[0];
  }

  renderDetail() {
    const item = this.selectedItem();
    if (!item) return;
    this.add.text(1050, 292, item.name, titleStyle(item.name.length > 7 ? 25 : 30)).setOrigin(0.5);

    if (this.tab === 'cards') {
      new UICard(this, 930, 430, { ...item, activeText: item.text, upgraded: false }, { width: 132, height: 184 });
      const body = `类型：${item.type}\n稀有度：${item.rarity}\n费用：${item.cost === null ? '-' : item.cost}\n\n${item.text}${item.upgradedText ? `\n强化：${item.upgradedText}` : ''}`;
      this.add
        .text(1025, 350, body, {
          ...textStyle(19, THEME.css.body, { lineSpacing: 8 }),
          wordWrap: { width: 250 }
        })
        .setOrigin(0, 0);
      return;
    }

    if (this.tab === 'relics') {
      new UIIcon(this, 1050, 390, 'relic', { size: 96, bg: 0x20130f, relicId: item.id });
      this.add
        .text(850, 485, `遗物效果：\n${item.text}`, {
          ...textStyle(23, THEME.css.body, { align: 'center', lineSpacing: 12 }),
          wordWrap: { width: 400 }
        })
        .setOrigin(0, 0);
      return;
    }

    if (this.tab === 'keywords') {
      new UIIcon(this, 1050, 386, 'event', { size: 92, bg: 0x20130f });
      this.add
        .text(850, 486, item.text, {
          ...textStyle(24, THEME.css.body, { align: 'center', lineSpacing: 12 }),
          wordWrap: { width: 400 }
        })
        .setOrigin(0, 0);
      return;
    }

    drawEnemyArt(this, item.id, 935, 455, item.type === 'boss' ? 0.72 : 0.86, {
      idle: false,
      battle: true,
      type: item.type,
      generatedHeight: item.type === 'boss' ? 300 : item.id === 'black-hound' || item.id === 'crownless-hound' ? 220 : 250
    });
    const type = item.type === 'boss' ? '首领' : item.type === 'elite' ? '精英' : '普通敌人';
    const actionPageSize = 4;
    const actionPageCount = Math.max(1, Math.ceil(item.actions.length / actionPageSize));
    this.detailPage = Phaser.Math.Clamp(this.detailPage ?? 0, 0, actionPageCount - 1);
    const visibleActions = item.actions.slice(this.detailPage * actionPageSize, this.detailPage * actionPageSize + actionPageSize);
    const actions = visibleActions.map((action) => `${action.name}：${action.text}`).join('\n');
    this.add
      .text(1048, 356, `类型：${type}\n生命：${item.hp}\n\n行动 ${this.detailPage + 1}/${actionPageCount}：\n${actions}`, {
        ...textStyle(17, THEME.css.body, { lineSpacing: 6 }),
        wordWrap: { width: 260 }
      })
      .setOrigin(0, 0);
    if (actionPageCount > 1) {
      new UIButton(this, 1058, 708, 126, 38, '上一组', () => {
        this.detailPage = Math.max(0, this.detailPage - 1);
        this.render();
      }, { fontSize: 16, disabled: this.detailPage <= 0 });
      new UIButton(this, 1192, 708, 126, 38, '下一组', () => {
        this.detailPage = Math.min(actionPageCount - 1, this.detailPage + 1);
        this.render();
      }, { fontSize: 16, disabled: this.detailPage >= actionPageCount - 1 });
    }
  }
}
