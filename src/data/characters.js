export const characters = [
  {
    id: 'exiled-knight',
    name: '流亡骑士',
    englishName: 'Exiled Knight',
    nameEn: 'Exiled Knight',
    role: '攻击、连击、伤痕、爆发',
    mechanic: '伤痕',
    mechanicText: '部分攻击会施加伤痕，撕裂时每层造成 3 点额外伤害。',
    hp: 82,
    maxHp: 82,
    energy: 3,
    energyMax: 3,
    battleSpriteKey: 'knight-battle',
    portraitKey: 'knight-portrait',
    difficulty: '简单',
    recommendation: '用低费攻击堆叠伤痕，再用撕裂斩爆发。',
    visual: '黑甲、长剑、盾牌、披风、破旧红围巾',
    palette: [0x202427, 0x9e2f2b, 0xd8a446],
    startingDeck: [
      'knight-cleave',
      'knight-cleave',
      'knight-cleave',
      'knight-cleave',
      'knight-cleave',
      'knight-block',
      'knight-block',
      'knight-block',
      'knight-block',
      'knight-rend'
    ]
  },
  {
    id: 'candle-nun',
    name: '圣烛修女',
    englishName: 'Candle Nun',
    nameEn: 'Candle Nun',
    role: '防御、烛印、延迟伤害、削弱',
    mechanic: '烛印',
    mechanicText: '烛印会在敌人回合末燃烧，部分卡牌可立即触发。',
    hp: 72,
    maxHp: 72,
    energy: 3,
    energyMax: 3,
    battleSpriteKey: 'nun-battle',
    portraitKey: 'nun-portrait',
    difficulty: '中等',
    recommendation: '稳住护甲，用烛印慢慢烧穿敌人。',
    visual: '修女服、长烛、白色头巾、烛光、银色圣徽',
    palette: [0x5d5247, 0xf0d8a5, 0xffc870],
    startingDeck: [
      'nun-flame',
      'nun-flame',
      'nun-flame',
      'nun-flame',
      'nun-flame',
      'nun-prayer-shield',
      'nun-prayer-shield',
      'nun-prayer-shield',
      'nun-prayer-shield',
      'nun-confession-mark'
    ]
  },
  {
    id: 'ashblood-alchemist',
    name: '灰血炼金师',
    englishName: 'Ashblood Alchemist',
    nameEn: 'Ashblood Alchemist',
    role: '自伤、药剂、腐蚀、低血量爆发',
    mechanic: '灰血',
    mechanicText: '主动失去生命换取强力效果，生命低于一半后更危险。',
    hp: 76,
    maxHp: 76,
    energy: 3,
    energyMax: 3,
    battleSpriteKey: 'alchemist-battle',
    portraitKey: 'alchemist-portrait',
    difficulty: '困难',
    recommendation: '控制血量边界，用药剂换取短时间爆发。',
    visual: '鸟嘴面具、皮革大衣、药剂瓶、绿色炼金光',
    palette: [0x33271f, 0x5ca568, 0xc9b36b],
    startingDeck: [
      'alc-acid-vial',
      'alc-acid-vial',
      'alc-acid-vial',
      'alc-acid-vial',
      'alc-acid-vial',
      'alc-leather-guard',
      'alc-leather-guard',
      'alc-leather-guard',
      'alc-leather-guard',
      'alc-forbidden-test'
    ]
  }
];

export function getCharacter(characterId) {
  return findCharacter(characterId) ?? characters[0];
}

export function findCharacter(characterId) {
  return characters.find((character) => character.id === characterId) ?? null;
}

export function isValidCharacterId(characterId) {
  return Boolean(findCharacter(characterId));
}
