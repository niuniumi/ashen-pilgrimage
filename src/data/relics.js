export const relics = [
  {
    id: 'rusted-holy-emblem',
    name: '生锈圣徽',
    text: '每场战斗开始时获得 1 点力量。',
    hook: 'battleStartStrength',
    value: 1,
    rarity: '普通'
  },
  {
    id: 'broken-knight-sword',
    name: '断裂骑士剑',
    text: '攻击牌伤害 +1。',
    hook: 'attackDamage',
    value: 1,
    rarity: '普通'
  },
  {
    id: 'crow-feather',
    name: '乌鸦羽毛',
    text: '每场战斗第一回合多抽 1 张牌。',
    hook: 'firstTurnDraw',
    value: 1,
    rarity: '普通'
  },
  {
    id: 'old-silver-coin',
    name: '旧银币',
    text: '获得金币时额外 +10%。',
    hook: 'goldBonusPercent',
    value: 0.1,
    rarity: '普通'
  },
  {
    id: 'church-candle',
    name: '教会蜡烛',
    text: '每场战斗开始时给予随机敌人 1 层虚弱。',
    hook: 'battleStartRandomWeak',
    value: 1,
    rarity: '普通'
  },
  {
    id: 'graveyard-key',
    name: '墓园钥匙',
    text: '宝箱金币奖励 +30%。',
    hook: 'chestGoldPercent',
    value: 0.3,
    rarity: '普通'
  },
  {
    id: 'black-iron-mask',
    name: '黑铁面具',
    text: '每场战斗免疫第一次虚弱。',
    hook: 'immuneWeakOnce',
    value: 1,
    rarity: '稀有'
  },
  {
    id: 'broken-shield',
    name: '破碎盾牌',
    text: '每场战斗开始时获得 6 点护甲。',
    hook: 'battleStartBlock',
    value: 6,
    rarity: '普通'
  },
  {
    id: 'alchemy-flask',
    name: '炼金烧瓶',
    text: '每次主动失去生命时回复 1 点生命。',
    hook: 'selfLoseHpHeal',
    value: 1,
    rarity: '稀有'
  },
  {
    id: 'saint-bone-casket',
    name: '圣骨匣',
    text: '休息点额外回复 5 点生命。',
    hook: 'restHealBonus',
    value: 5,
    rarity: '普通'
  },
  {
    id: 'ebony-crossbow',
    name: '乌木十字弓',
    text: '每场战斗第一次攻击额外造成 6 点伤害。',
    hook: 'firstAttackDamage',
    value: 6,
    rarity: '稀有'
  },
  {
    id: 'monastery-bell',
    name: '修道院铃',
    text: '敌人死亡时获得 3 点护甲。',
    hook: 'enemyDeathBlock',
    value: 3,
    rarity: '稀有'
  },
  {
    id: 'witch-hunter-tongs',
    name: '猎巫火钳',
    text: '每次给予虚弱时，额外造成 3 点伤害。',
    hook: 'weakDamage',
    value: 3,
    rarity: '稀有'
  },
  {
    id: 'worn-cloak',
    name: '破旧斗篷',
    text: '每回合第一次受到伤害减少 2 点。',
    hook: 'firstDamageReduction',
    value: 2,
    rarity: '普通'
  },
  {
    id: 'royal-signet',
    name: '王室印戒',
    text: '商店价格降低 15%。',
    hook: 'shopDiscountPercent',
    value: 0.15,
    rarity: '稀有'
  },
  {
    id: 'blood-ruby',
    name: '血红宝石',
    text: '生命低于 50% 时，攻击伤害 +2。',
    hook: 'lowHpAttackDamage',
    value: 2,
    rarity: '史诗'
  },
  {
    id: 'silver-chalice',
    name: '银质圣杯',
    text: '获得时回复 20 点生命。',
    hook: 'onAcquireHeal',
    value: 20,
    rarity: '稀有'
  },
  {
    id: 'knight-spurs',
    name: '骑士马刺',
    text: '每场战斗第一张攻击牌费用 -1。',
    hook: 'firstAttackCostDiscount',
    value: 1,
    rarity: '稀有'
  },
  {
    id: 'ash-crown',
    name: '灰烬王冠',
    text: '首领战开始时获得 2 点力量和 10 点护甲。',
    hooks: { bossStartStrength: 2, bossStartBlock: 10 },
    rarity: '传奇'
  },
  {
    id: 'bone-dice',
    name: '骨骰',
    text: '每次卡牌奖励多出现 1 张候选牌。',
    hook: 'rewardCardBonus',
    value: 1,
    rarity: '稀有'
  },
  {
    id: 'rusty-nail',
    name: '铁锈钉',
    text: '每次施加伤痕时，额外施加 1 层。',
    hook: 'markBonus',
    value: 1,
    rarity: '普通'
  },
  {
    id: 'white-wax-stub',
    name: '白蜡残芯',
    text: '烛印触发伤害 +1。',
    hook: 'candleDamageBonus',
    value: 1,
    rarity: '稀有'
  },
  {
    id: 'cracked-vial',
    name: '裂纹药瓶',
    text: '主动失去生命后，下一张攻击牌伤害 +3。',
    hook: 'selfLoseHpAttackNext',
    value: 3,
    rarity: '稀有'
  },
  {
    id: 'broken-watch',
    name: '破损怀表',
    text: '每 3 回合，回合开始时额外获得 1 点能量。',
    hook: 'every3TurnEnergy',
    value: 1,
    rarity: '史诗'
  },

  // Legacy ids are kept so older local saves stay loadable after this release.
  {
    id: 'rusted-crown',
    name: '锈蚀王冠',
    text: '战斗开始时获得 1 点力量。',
    hook: 'battleStartStrength',
    value: 1,
    rarity: '旧版'
  },
  {
    id: 'pilgrim-ember',
    name: '行者余烬',
    text: '每场战斗开始时获得 4 点护甲。',
    hook: 'battleStartBlock',
    value: 4,
    rarity: '旧版'
  },
  {
    id: 'old-tithe-box',
    name: '旧奉献匣',
    text: '战斗奖励金币增加 8。',
    hook: 'rewardGold',
    value: 8,
    rarity: '旧版'
  },
  {
    id: 'grave-bell',
    name: '墓铃',
    text: '每次进入休息点额外回复 4 点生命。',
    hook: 'restHealBonus',
    value: 4,
    rarity: '旧版'
  },
  {
    id: 'black-iron-nail',
    name: '黑铁钉',
    text: '攻击伤害 +1。',
    hook: 'attackDamage',
    value: 1,
    rarity: '旧版'
  },
  {
    id: 'candle-snuffer',
    name: '灭烛器',
    text: '敌人首次受到状态时额外获得 1 层。',
    hook: 'statusEnemy',
    value: 1,
    rarity: '旧版'
  },
  {
    id: 'stitched-satchel',
    name: '缝线行囊',
    text: '进入商店时获得 12 金币。',
    hook: 'shopGold',
    value: 12,
    rarity: '旧版'
  },
  {
    id: 'saint-coin',
    name: '圣徒银币',
    text: '宝箱金币奖励 +15。',
    hook: 'chestGold',
    value: 15,
    rarity: '旧版'
  },
  {
    id: 'ash-splinter',
    name: '灰烬木刺',
    text: '每场战斗第一次防御额外获得 3 护甲。',
    hook: 'firstBlock',
    value: 3,
    rarity: '旧版'
  }
];

export function getRelic(relicId) {
  return relics.find((relic) => relic.id === relicId);
}

export function isLegacyRelic(relic) {
  return Boolean(relic?.legacy || relic?.rarity === '旧版');
}

export function getProductionRelics() {
  return relics.filter((relic) => !isLegacyRelic(relic));
}
