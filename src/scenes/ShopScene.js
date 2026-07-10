import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENES } from '../game/constants.js';
import { createCardInstance } from '../game/GameState.js';
import { getCard } from '../data/cards.js';
import { RewardSystem } from '../systems/RewardSystem.js';
import { RelicSystem } from '../systems/RelicSystem.js';
import { CardSystem } from '../systems/CardSystem.js';
import { MapSystem } from '../systems/MapSystem.js';
import { SCENE_TITLES, THEME, textStyle, titleStyle } from '../game/Theme.js';
import { addAmbientAsh } from '../effects/AmbientParticles.js';
import { UIButton } from '../ui/UIButton.js';
import { UICard } from '../ui/UICard.js';
import { UIFrame } from '../ui/UIFrame.js';
import { UIIcon } from '../ui/UIIcon.js';
import { drawDivider, drawVignette } from '../ui/UIOrnament.js';
import { installPauseMenu } from '../ui/PauseMenu.js';
import { addToast, attachSceneServices, getActiveRun, saveActiveRun } from './SceneHelpers.js';
import { addHandPaintedBackground, HANDPAINTED_KEYS } from '../art/HandPaintedAssets.js';

export default class ShopScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Shop);
  }

  create() {
    attachSceneServices(this);
    this.audio?.startAmbience?.('rest');
    this.run = getActiveRun(this);
    if (!this.run) return;
    if (!this.run.shopState) {
      this.run.gold += RelicSystem.value(this.run, 'shopGold');
      this.run.shopState = RewardSystem.createShop(this.run);
    }
    this.renderShop();
  }

  drawBackdrop() {
    if (addHandPaintedBackground(this, HANDPAINTED_KEYS.folioBg, { depth: 0 })) {
      addAmbientAsh(this, { count: 14, depth: 4 });
      return;
    }
    const g = this.add.graphics();
    g.fillGradientStyle(0xf6ead4, 0xf0d9b5, 0xc99a68, 0x7d4d31, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    g.fillStyle(0xffffff, 0.12);
    g.fillEllipse(768, 230, 1180, 260);
    g.lineStyle(1, 0x7f6340, 0.22);
    g.strokeRoundedRect(34, 30, GAME_WIDTH - 68, GAME_HEIGHT - 60, 8);
    g.strokeRoundedRect(47, 43, GAME_WIDTH - 94, GAME_HEIGHT - 86, 6);
    g.fillStyle(0x6c3f25, 0.28);
    g.fillRect(0, 606, GAME_WIDTH, 258);
    g.fillStyle(0x9f7043, 0.44);
    g.fillRect(210, 570, 1116, 86);
    g.lineStyle(3, THEME.colors.darkGold, 0.34);
    g.lineBetween(210, 570, 1326, 570);
    for (let i = 0; i < 10; i += 1) {
      const x = 160 + i * 126;
      g.fillStyle(0x755038, 0.3);
      g.fillRect(x, 284, 54, 322);
      g.fillStyle(0xf1c76a, 0.12);
      g.fillRect(x + 19, 340 + (i % 3) * 50, 8, 30);
    }
    drawVignette(this, 3);
    addAmbientAsh(this, { count: 16, depth: 4 });
  }

  drawHeader() {
    const [title, subtitle] = SCENE_TITLES.shop;
    this.add.text(768, 52, title, titleStyle(42)).setOrigin(0.5);
    this.add.text(768, 96, subtitle, textStyle(18, THEME.css.muted, { align: 'center' })).setOrigin(0.5);
    drawDivider(this, 768, 124, 520);
  }

  renderShop() {
    this.children.removeAll(true);
    this.drawBackdrop();
    this.drawHeader();
    this.drawGoldBar();
    this.drawCardShelf();
    this.drawRelicShelf();
    this.drawServicePanel();
    installPauseMenu(this, { allowMap: false });
  }

  drawGoldBar() {
    new UIFrame(this, 768, 166, 320, 58, { fill: 0x21140f, alpha: 0.94, stroke: THEME.colors.darkGold });
    new UIIcon(this, 642, 166, 'coin', { size: 34 });
    this.add.text(768, 166, `当前金币：${this.run.gold}`, textStyle(24, THEME.css.paleGold, { align: 'center' })).setOrigin(0.5);
  }

  drawCardShelf() {
    new UIFrame(this, 560, 480, 660, 520, { fill: THEME.colors.panel, alpha: 0.91, stroke: THEME.colors.darkGold });
    this.add.text(560, 252, '卡牌货架', titleStyle(27)).setOrigin(0.5);
    drawDivider(this, 560, 282, 420);
    this.run.shopState.cards.forEach((item, index) => {
      const x = 350 + index * 210;
      new UICard(this, x, 430, { ...item.card, activeText: item.card.text, upgraded: false }, {
        baseY: 430,
        disabled: item.sold,
        onClick: () => this.buyCard(index)
      });
      new UIButton(this, x, 578, 142, 42, item.sold ? '已购买' : `${item.price} 金币`, () => this.buyCard(index), {
        fontSize: 18,
        disabled: item.sold || this.run.gold < item.price,
        fill: item.sold ? 0x282420 : 0x4a3421
      });
    });
  }

  drawRelicShelf() {
    new UIFrame(this, 1110, 410, 350, 380, { fill: THEME.colors.panel, alpha: 0.91, stroke: THEME.colors.darkGold });
    this.add.text(1110, 252, '遗物柜台', titleStyle(27)).setOrigin(0.5);
    drawDivider(this, 1110, 282, 250);
    this.run.shopState.relics.forEach((item, index) => {
      const y = 350 + index * 148;
      new UIIcon(this, 976, y, 'relic', { size: 42, alpha: item.sold ? 0.4 : 1, relicId: item.relic.id });
      this.add.text(1114, y - 24, item.relic.name, titleStyle(item.relic.name.length > 6 ? 21 : 24)).setOrigin(0.5);
      this.add
        .text(1114, y + 6, item.relic.text, {
          ...textStyle(15, THEME.css.body, { align: 'center' }),
          wordWrap: { width: 240 }
        })
        .setOrigin(0.5);
      new UIButton(this, 1114, y + 56, 138, 38, item.sold ? '已购买' : `${item.price} 金币`, () => this.buyRelic(index), {
        fontSize: 17,
        disabled: item.sold || this.run.gold < item.price,
        fill: item.sold ? 0x282420 : 0x4a3421
      });
    });
  }

  drawServicePanel() {
    new UIFrame(this, 1110, 678, 350, 126, { fill: 0x21140f, alpha: 0.92, stroke: THEME.colors.darkGold });
    this.add.text(1110, 642, '黑铁改造', titleStyle(24)).setOrigin(0.5);
    this.add
      .text(1110, 674, '删除基础牌可以提高抽到核心卡的概率。', {
        ...textStyle(15, THEME.css.muted, { align: 'center' }),
        wordWrap: { width: 260 }
      })
      .setOrigin(0.5);
    new UIButton(this, 1110, 718, 230, 40, '删除基础牌 60 金币', () => this.removeCard(), {
      fontSize: 18,
      disabled: this.run.gold < 60,
      fill: 0x4a2522
    });
    new UIButton(this, 768, 780, 200, 54, '离开商店', () => this.leave(), { fontSize: 23 });
  }

  buyCard(index) {
    const item = this.run.shopState.cards[index];
    if (!item || item.sold) return;
    if (this.run.gold < item.price) {
      addToast(this, '金币不足。', 'error');
      return;
    }
    this.run.gold -= item.price;
    item.sold = true;
    this.run.deck.push(createCardInstance(item.card.id));
    saveActiveRun(this, this.run);
    addToast(this, `购买卡牌：${item.card.name}`);
    this.audio?.play('coin');
    this.renderShop();
  }

  buyRelic(index) {
    const item = this.run.shopState.relics[index];
    if (!item || item.sold) return;
    if (this.run.gold < item.price) {
      addToast(this, '金币不足。', 'error');
      return;
    }
    this.run.gold -= item.price;
    item.sold = true;
    RelicSystem.addById(this.run, item.relic.id);
    saveActiveRun(this, this.run);
    addToast(this, `购买遗物：${item.relic.name}`);
    this.audio?.play('relic');
    this.renderShop();
  }

  removeCard() {
    if (this.run.gold < 60) {
      addToast(this, '金币不足。', 'error');
      return;
    }
    const removed = CardSystem.removeFirstBasic(this.run);
    if (!removed) {
      addToast(this, '没有可删除的基础牌。', 'error');
      return;
    }
    this.run.gold -= 60;
    saveActiveRun(this, this.run);
    addToast(this, `删除卡牌：${getCard(removed.cardId).name}`);
    this.audio?.play('uiClick');
    this.renderShop();
  }

  leave() {
    this.run.shopState = null;
    MapSystem.finishActiveNode(this.run);
    saveActiveRun(this, this.run);
    this.scene.start(SCENES.Map);
  }
}
