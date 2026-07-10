import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, SCENES } from '../game/constants.js';
import { UIButton } from '../ui/UIButton.js';
import { UIPanel } from '../ui/UIPanel.js';
import { addBackButton, addSceneTitle, attachSceneServices, drawGameBackdrop } from './SceneHelpers.js';

const pages = [
  {
    title: '游戏目标',
    body: '选择一名行者，沿地图前进，穿过暮鸦村，击败最终首领无首守墓骑士。每一次选择都会改变你的牌组、生命和遗物。'
  },
  {
    title: '基础战斗',
    body: '每回合抽 5 张牌，每回合获得 3 点能量。打出卡牌消耗能量，点击结束回合后敌人会按头顶意图行动。'
  },
  {
    title: '卡牌使用',
    body: '点击手牌选择卡牌。攻击牌通常需要再点击敌人作为目标，防御牌和部分技能牌会直接生效。能量不足时无法打出。'
  },
  {
    title: '敌人意图',
    body: '剑表示攻击，盾表示防御，暗紫符号表示削弱或特殊行动，金色火印表示强化或蓄力。看到攻击意图时优先考虑防御。'
  },
  {
    title: '地图节点',
    body: '交叉剑是普通战斗，红色头骨是精英，问号是事件，钱袋是商店，篝火是休息，宝箱是奖励，王冠骷髅是首领。'
  },
  {
    title: '角色机制',
    body: '伤痕：流亡骑士的爆发机制。\n烛印：圣烛修女的延迟伤害机制。\n灰血：灰血炼金师的自伤换收益机制。'
  }
];

function wrapCjk(text, maxChars = 28) {
  return String(text ?? '')
    .split('\n')
    .map((line) => {
      const chunks = [];
      let current = '';
      for (const char of line) {
        current += char;
        const shouldBreak = current.length >= maxChars || (current.length >= maxChars - 7 && /[。；，、]/.test(char));
        if (shouldBreak) {
          chunks.push(current.trim());
          current = '';
        }
      }
      if (current.trim()) chunks.push(current.trim());
      return chunks.join('\n');
    })
    .join('\n');
}

export default class GuideScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Guide);
  }

  create() {
    attachSceneServices(this);
    this.audio?.startAmbience?.('menu');
    this.page = 0;
    drawGameBackdrop(this, 'parchment');
    addSceneTitle(this, '旅途指南', '羊皮纸冒险手册');
    addBackButton(this);
    this.panel = new UIPanel(this, 768, 450, 1120, 590, { fill: 0xb99155, alpha: 0.62, stroke: COLORS.deep });
    this.heading = this.add
      .text(768, 236, '', {
        fontFamily: 'Georgia, "Microsoft YaHei", serif',
        fontSize: 38,
        color: '#2b170d',
        align: 'center'
      })
      .setOrigin(0.5);
    this.body = this.add
      .text(348, 324, '', {
        fontFamily: 'Georgia, "Microsoft YaHei", serif',
        fontSize: 23,
        color: '#2b170d',
        align: 'left',
        lineSpacing: 13,
        wordWrap: { width: 840, useAdvancedWrap: true }
      })
      .setOrigin(0, 0);
    this.pageText = this.add
      .text(768, 684, '', {
        fontFamily: 'Georgia, "Microsoft YaHei", serif',
        fontSize: 20,
        color: '#4e321d'
      })
      .setOrigin(0.5);
    new UIButton(this, 610, 748, 170, 52, '上一步', () => this.changePage(-1), { fontSize: 22 });
    new UIButton(this, 926, 748, 170, 52, '下一步', () => this.changePage(1), { fontSize: 22 });
    this.renderPage();
  }

  changePage(direction) {
    this.page = Phaser.Math.Clamp(this.page + direction, 0, pages.length - 1);
    this.renderPage();
  }

  renderPage() {
    const page = pages[this.page];
    this.heading.setText(page.title);
    this.body.setText(wrapCjk(page.body));
    this.pageText.setText(`${this.page + 1} / ${pages.length}`);
  }
}
