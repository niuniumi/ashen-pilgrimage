import { TOKENS } from '../design/tokens.js';
import { FONT } from '../design/textStyles.js';

export const THEME = {
  colors: {
    night: TOKENS.colors.night,
    deepPurple: TOKENS.colors.deepPurple,
    dusk: TOKENS.colors.dusk,
    panel: TOKENS.colors.panel,
    panelLight: TOKENS.colors.panelLight,
    parchment: TOKENS.colors.parchment,
    parchmentShadow: TOKENS.colors.parchmentShadow,
    darkGold: TOKENS.colors.darkGold,
    candle: TOKENS.colors.candle,
    blood: TOKENS.colors.blood,
    shield: TOKENS.colors.shield,
    poison: TOKENS.colors.poison,
    arcane: TOKENS.colors.arcane,
    iron: TOKENS.colors.iron,
    ironEdge: TOKENS.colors.ironEdge,
    ink: TOKENS.colors.ink,
    bone: TOKENS.colors.bone,
    ash: TOKENS.colors.ash
  },
  css: TOKENS.css,
  font: FONT
};

export function textStyle(size, color = THEME.css.body, extra = {}) {
  return {
    fontFamily: FONT,
    fontSize: size,
    color,
    stroke: extra.stroke ?? '#120b08',
    strokeThickness: extra.strokeThickness ?? 3,
    align: extra.align ?? 'left',
    lineSpacing: extra.lineSpacing ?? 0,
    wordWrap: extra.wordWrap
  };
}

export function titleStyle(size = 42) {
  return textStyle(size, THEME.css.paleGold, { strokeThickness: 6, align: 'center' });
}

export const SCENE_TITLES = {
  menu: ['灰烬圣途', 'Ashen Pilgrimage'],
  character: ['选择你的行者', '三名行者，三条通往灰白圣火的道路'],
  map: ['暮鸦村路线图', '在羊皮纸上选择下一处发光节点'],
  codex: ['图鉴', '卡牌、遗物与敌人的灰烬手册'],
  reward: ['战斗奖励', '选择一张卡加入牌组，或跳过保持精简'],
  shop: ['黑铁商铺', '购买卡牌、遗物，或删除一张基础牌'],
  event: ['旅途事件', '一页中世纪冒险书在你面前翻开'],
  rest: ['篝火休息', '火光短暂驱散灰烬'],
  chest: ['遗落宝箱', '黑铁箱锁上仍残留圣火灰烬'],
  guide: ['旅途指南', '羊皮纸冒险手册'],
  settings: ['设置', '调整声音、动画、教程和本地存档']
};
