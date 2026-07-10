import { VERSION } from './Version.js';

export const GAME_WIDTH = 1536;
export const GAME_HEIGHT = 864;

export const BUILD_VERSION = VERSION.version;
export const BUILD_TIME = VERSION.buildTime;

export const COLORS = {
  ink: 0x120d18,
  deep: 0x241610,
  dusk: 0x1b1424,
  ember: 0xcf6a32,
  candle: 0xf2c86d,
  gold: 0xb88935,
  paleGold: 0xf2c86d,
  parchment: 0xd8bd8a,
  parchmentDark: 0x8a6133,
  iron: 0x20282a,
  blueSteel: 0x2f6484,
  red: 0x9e302b,
  green: 0x5f9f62,
  purple: 0x6e4cb0,
  black: 0x070604,
  white: 0xe8d6b0
};

export const SCENES = {
  Boot: 'BootScene',
  Preload: 'PreloadScene',
  MainMenu: 'MainMenuScene',
  Guide: 'GuideScene',
  CharacterSelect: 'CharacterSelectScene',
  Vow: 'VowScene',
  Prologue: 'PrologueScene',
  BossIntro: 'BossIntroScene',
  ActClear: 'ActClearScene',
  Map: 'MapScene',
  Battle: 'BattleScene',
  Reward: 'RewardScene',
  Shop: 'ShopScene',
  Event: 'EventScene',
  Rest: 'RestScene',
  Chest: 'ChestScene',
  Codex: 'CodexScene',
  Settings: 'SettingsScene',
  Result: 'ResultScene'
};

export const CARD_TYPES = {
  ATTACK: '攻击',
  DEFENSE: '防御',
  SKILL: '技能',
  SPELL: '法术',
  STATUS: '状态',
  CURSE: '诅咒'
};

export const RARITIES = {
  COMMON: '普通',
  RARE: '稀有',
  EPIC: '史诗',
  LEGENDARY: '传奇',
  ABSOLUTE: '绝世'
};

export const NODE_LABELS = {
  battle: '普通战斗',
  elite: '精英',
  event: '事件',
  shop: '商店',
  rest: '休息',
  chest: '宝箱',
  boss: '首领'
};

export const NODE_TIPS = {
  battle: '与敌人战斗，胜利后获得金币和卡牌。',
  elite: '更危险，但必定获得遗物。',
  event: '遭遇随机事件。',
  shop: '购买卡牌、遗物或删除卡牌。',
  rest: '恢复生命或升级卡牌。',
  chest: '获得金币和遗物。',
  boss: '挑战本章最终敌人。'
};

export const SAVE_KEY = 'ashen-pilgrimage-save-v1';
export const SETTINGS_KEY = 'ashen-pilgrimage-settings-v1';
