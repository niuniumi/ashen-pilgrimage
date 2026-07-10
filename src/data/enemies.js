export const enemies = [
  {
    id: 'rotting-villager',
    name: '腐烂村民',
    type: 'normal',
    hp: 32,
    visual: '破衣、锈斧、灰皮肤',
    palette: [0x5f4637, 0x8a5b36, 0x46503b],
    actions: [
      { name: '挥击', intent: 'attack', damage: 8, text: '造成 8 点伤害。' },
      { name: '蹒跚', intent: 'block', block: 5, text: '获得 5 点护甲。' }
    ]
  },
  {
    id: 'graveyard-skeleton',
    name: '墓园骷髅',
    type: 'normal',
    hp: 34,
    visual: '骨剑、残破披风',
    palette: [0xc6b58e, 0x6d6a68, 0x9a723f],
    actions: [
      { name: '骨剑', intent: 'attack', damage: 7, text: '造成 7 点伤害。' },
      { name: '拼合骨架', intent: 'block', block: 9, text: '获得 9 点护甲。' }
    ]
  },
  {
    id: 'black-hound',
    name: '黑犬',
    type: 'normal',
    hp: 28,
    visual: '黑毛、低伏、灰焰眼',
    palette: [0x171515, 0x4d2a2b, 0xb24d35],
    actions: [
      { name: '撕咬', intent: 'attack', damage: 5, times: 2, text: '造成 5 点伤害 2 次。' },
      { name: '低吼', intent: 'buff', strength: 3, text: '下一次攻击 +3 伤害。' }
    ]
  },
  {
    id: 'plague-rat-swarm',
    name: '瘟疫鼠群',
    type: 'normal',
    hp: 26,
    visual: '成群鼠影、腐烂尾巴、黄绿色疫雾',
    palette: [0x24231d, 0x6f7042, 0xa05238],
    actions: [
      { name: '群咬', intent: 'attack', damage: 3, times: 3, text: '造成 3 点伤害 3 次。' },
      { name: '疫雾', intent: 'debuff', targetStatus: 'weak', statusValue: 1, text: '给予 1 层虚弱。' }
    ]
  },
  {
    id: 'crow-messenger',
    name: '乌鸦信使',
    type: 'normal',
    hp: 30,
    visual: '黑羽、信筒、尖喙',
    palette: [0x121216, 0x313746, 0xc69a45],
    actions: [
      { name: '俯冲啄击', intent: 'attack', damage: 9, text: '造成 9 点伤害。' },
      { name: '不祥信笺', intent: 'special', addCardToDraw: 'status-wound', text: '将 1 张伤口洗入抽牌堆。' }
    ]
  },
  {
    id: 'armor-broken-militia',
    name: '破甲民兵',
    type: 'normal',
    hp: 42,
    visual: '破盾、长矛、半截锁甲',
    palette: [0x4a4238, 0x9b6b37, 0x7f312c],
    actions: [
      { name: '刺击', intent: 'attack', damage: 10, text: '造成 10 点伤害。' },
      { name: '残盾防线', intent: 'block', block: 10, text: '获得 10 点护甲。' }
    ]
  },
  {
    id: 'candle-monk',
    name: '灰烛修士',
    type: 'normal',
    hp: 38,
    visual: '蜡泪兜帽、烛杖、低声祷告',
    palette: [0x3f3327, 0xc9a45f, 0x825a38],
    actions: [
      { name: '烛杖敲击', intent: 'attack', damage: 8, text: '造成 8 点伤害。' },
      { name: '浊光祝祷', intent: 'buff', strength: 2, block: 6, text: '获得 2 力量和 6 护甲。' },
      { name: '蜡泪诅咒', intent: 'debuff', targetStatus: 'vulnerable', statusValue: 1, text: '给予 1 层易伤。' }
    ]
  },
  {
    id: 'pointed-witch',
    name: '尖帽女巫',
    type: 'normal',
    hp: 36,
    visual: '尖帽、骨杖、紫黑火苗',
    palette: [0x26162f, 0x6f5185, 0xd08a49],
    actions: [
      { name: '骨杖火花', intent: 'attack', damage: 11, text: '造成 11 点伤害。' },
      { name: '咒语缠绕', intent: 'debuff', targetStatus: 'weak', statusValue: 1, targetStatus2: 'vulnerable', statusValue2: 1, text: '给予 1 层虚弱和易伤。' }
    ]
  },
  {
    id: 'plague-doctor',
    name: '瘟疫医生',
    type: 'elite',
    hp: 85,
    visual: '鸟嘴面具、手术刀、黑药瓶',
    palette: [0x26221f, 0x6c6a50, 0x477050],
    actions: [
      { name: '手术刀', intent: 'attack', damage: 12, text: '造成 12 点伤害。' },
      { name: '黑药', intent: 'debuff', targetStatus: 'weak', statusValue: 2, text: '给予 2 层虚弱。' },
      { name: '缝合', intent: 'heal', heal: 12, text: '回复 12 生命。' },
      { name: '投掷毒瓶', intent: 'attack', damage: 8, addCardToDraw: 'curse-rot', text: '造成 8 点伤害，并加入 1 张腐败。' }
    ]
  },
  {
    id: 'iron-maiden-nun',
    name: '铁誓修女',
    type: 'elite',
    hp: 92,
    visual: '铁面罩、刺棘圣袍、沉重链锤',
    palette: [0x2b2c30, 0x7a2730, 0xc6a15a],
    actions: [
      { name: '链锤忏悔', intent: 'attack', damage: 15, text: '造成 15 点伤害。' },
      { name: '铁棘合拢', intent: 'block', block: 18, targetStatus: 'vulnerable', statusValue: 1, text: '获得护甲并给予 1 层易伤。' },
      { name: '痛苦圣歌', intent: 'attack', damage: 7, times: 2, targetStatus: 'weak', statusValue: 1, text: '造成 7 点伤害 2 次并给予虚弱。' }
    ]
  },
  {
    id: 'fallen-paladin',
    name: '堕落圣骑士',
    type: 'elite',
    hp: 105,
    visual: '断裂圣旗、黑金重甲、残破大剑',
    palette: [0x20272d, 0x9c743b, 0x5f1f2a],
    actions: [
      { name: '圣旗压制', intent: 'attack', damage: 13, targetStatus: 'weak', statusValue: 1, text: '造成 13 点伤害并给予 1 层虚弱。' },
      { name: '黑金守誓', intent: 'block', block: 24, strength: 1, text: '获得 24 护甲和 1 力量。' },
      { name: '断誓重斩', intent: 'attack', damage: 22, text: '造成 22 点伤害。' }
    ]
  },
  {
    id: 'headless-grave-knight',
    name: '无首守墓骑士',
    englishName: 'Headless Grave Knight',
    type: 'boss',
    hp: 160,
    phaseRules: {
      2: { block: 10, log: '墓门开启，亡者应召。' },
      3: { strength: 2, log: '失首的躯壳彻底狂怒。' }
    },
    visual: '无首重甲、墓剑、残破旗帜',
    palette: [0x22282c, 0x6b2535, 0xb88c44],
    actions: [
      { name: '墓剑横扫', phase: 1, intent: 'attack', damage: 14, text: '造成 14 点伤害。' },
      { name: '举盾', phase: 1, intent: 'block', block: 18, text: '获得 18 护甲。' },
      { name: '守墓誓言', phase: 1, intent: 'debuff', targetStatus: 'weak', statusValue: 1, text: '给予 1 层虚弱。' },
      { name: '召唤骷髅', phase: 2, intent: 'special', summon: 'graveyard-skeleton', text: '召唤 1 个墓园骷髅。' },
      { name: '黑雾斩', phase: 2, intent: 'attack', damage: 12, targetStatus: 'vulnerable', statusValue: 1, text: '造成 12 伤害，给予 1 层易伤。' },
      { name: '护墓军势', phase: 2, intent: 'block', block: 22, text: '获得 22 护甲。' },
      { name: '无首狂怒', phase: 3, intent: 'attack', damage: 6, times: 4, text: '造成 6 伤害 4 次。' },
      { name: '恐惧低语', phase: 3, intent: 'debuff', targetStatus: 'weak', statusValue: 2, targetStatus2: 'vulnerable', statusValue2: 2, text: '给予 2 层虚弱和 2 层易伤。' },
      { name: '终墓一击', phase: 3, intent: 'attack', damage: 38, charge: true, text: '蓄力后造成 38 伤害。' }
    ]
  },
  {
    id: 'wax-novice',
    name: '白蜡见习修士',
    type: 'normal',
    hp: 44,
    visual: '蜡滴兜帽、短烛杖、灰白袍角',
    palette: [0xe6d5ad, 0x8b6d42, 0x4b4034],
    actions: [
      { name: '烛杖敲击', intent: 'attack', damage: 9, text: '造成 9 点伤害。' },
      { name: '封蜡祈祷', intent: 'block', block: 8, text: '获得 8 点护甲。' }
    ]
  },
  {
    id: 'cinder-acolyte',
    name: '余烬侍僧',
    type: 'normal',
    hp: 48,
    visual: '焦黑圣袍、火盆锁链、低垂面罩',
    palette: [0x3f3026, 0xc27a38, 0x201714],
    actions: [
      { name: '火盆横扫', intent: 'attack', damage: 6, times: 2, text: '造成 6 点伤害 2 次。' },
      { name: '炽热圣歌', intent: 'buff', strength: 2, text: '获得 2 点力量。' }
    ]
  },
  {
    id: 'bell-tower-sentry',
    name: '钟楼哨卫',
    type: 'normal',
    hp: 54,
    visual: '裂钟盔、长柄锤、旧铁链',
    palette: [0x3b4144, 0xa9824a, 0x6d2f2a],
    actions: [
      { name: '钟锤重击', intent: 'attack', damage: 13, text: '造成 13 点伤害。' },
      { name: '铁链守势', intent: 'block', block: 12, text: '获得 12 点护甲。' }
    ]
  },
  {
    id: 'scripture-moth-swarm',
    name: '经页蛾群',
    type: 'normal',
    hp: 36,
    visual: '碎纸翅、金粉、烛烟轨迹',
    palette: [0xd9c48a, 0x6b6048, 0x30271e],
    actions: [
      { name: '纸翼割裂', intent: 'attack', damage: 4, times: 3, text: '造成 4 点伤害 3 次。' },
      { name: '眩目粉尘', intent: 'debuff', targetStatus: 'weak', statusValue: 1, text: '给予 1 层虚弱。' }
    ]
  },
  {
    id: 'choir-exorcist',
    name: '唱诗驱魔人',
    type: 'elite',
    hp: 104,
    visual: '银白披肩、烛火经卷、双手圣铃',
    palette: [0xcbb98b, 0x2e3740, 0x8d5b38],
    actions: [
      { name: '圣铃冲击', intent: 'attack', damage: 16, text: '造成 16 点伤害。' },
      { name: '审判合唱', intent: 'debuff', targetStatus: 'vulnerable', statusValue: 2, text: '给予 2 层易伤。' },
      { name: '护烛礼', intent: 'block', block: 20, strength: 1, text: '获得 20 点护甲和 1 点力量。' }
    ]
  },
  {
    id: 'reliquary-jailer',
    name: '圣匣狱卒',
    type: 'elite',
    hp: 116,
    visual: '背负圣匣、锁链钩刃、蜡封面具',
    palette: [0x2b2c30, 0xb98a46, 0x5d3b28],
    actions: [
      { name: '锁钩拖拽', intent: 'attack', damage: 12, targetStatus: 'weak', statusValue: 1, text: '造成 12 点伤害并给予 1 层虚弱。' },
      { name: '圣匣闭锁', intent: 'block', block: 26, text: '获得 26 点护甲。' },
      { name: '腐蜡封印', intent: 'special', addCardToDraw: 'curse-rot', text: '将 1 张腐败洗入抽牌堆。' }
    ]
  },
  {
    id: 'ash-veiled-prioress',
    name: '灰纱副院长',
    type: 'elite',
    hp: 98,
    visual: '灰纱面幕、细剑、冷白烛冠',
    palette: [0x51493d, 0xe0c78e, 0x6e4cb0],
    actions: [
      { name: '纱幕后刺', intent: 'attack', damage: 8, times: 2, text: '造成 8 点伤害 2 次。' },
      { name: '默祷凝视', intent: 'debuff', targetStatus: 'weak', statusValue: 2, text: '给予 2 层虚弱。' },
      { name: '烛冠祝福', intent: 'heal', heal: 14, block: 12, text: '回复 14 生命并获得 12 护甲。' }
    ]
  },
  {
    id: 'pale-wax-matron',
    name: '白蜡圣母',
    englishName: 'Pale Wax Matron',
    type: 'boss',
    hp: 190,
    phaseRules: {
      2: { heal: 8, log: '祭坛白蜡重新塑成她的面容。' },
      3: { block: 14, strength: 1, log: '最后的烛环全部点燃。' }
    },
    visual: '高冠修女、白蜡披纱、祭坛烛环',
    palette: [0xf0dfbd, 0x39332d, 0xb88c44],
    actions: [
      { name: '蜡泪坠落', phase: 1, intent: 'attack', damage: 15, text: '造成 15 点伤害。' },
      { name: '温柔封印', phase: 1, intent: 'debuff', targetStatus: 'weak', statusValue: 1, text: '给予 1 层虚弱。' },
      { name: '圣蜡护幕', phase: 1, intent: 'block', block: 20, text: '获得 20 点护甲。' },
      { name: '召来经页蛾群', phase: 2, intent: 'special', summon: 'scripture-moth-swarm', text: '召唤 1 组经页蛾群。' },
      { name: '白蜡审判', phase: 2, intent: 'attack', damage: 13, targetStatus: 'vulnerable', statusValue: 1, text: '造成 13 伤害并给予 1 层易伤。' },
      { name: '祭坛合拢', phase: 2, intent: 'block', block: 28, text: '获得 28 点护甲。' },
      { name: '熔蜡圣歌', phase: 3, intent: 'attack', damage: 7, times: 4, text: '造成 7 伤害 4 次。' },
      { name: '无声赦免', phase: 3, intent: 'debuff', targetStatus: 'weak', statusValue: 2, targetStatus2: 'vulnerable', statusValue2: 1, text: '给予 2 层虚弱和 1 层易伤。' },
      { name: '圣母垂目', phase: 3, intent: 'heal', heal: 18, block: 18, text: '回复 18 生命并获得 18 护甲。' }
    ]
  },
  {
    id: 'hollow-spearman',
    name: '空心长矛兵',
    type: 'normal',
    hp: 56,
    visual: '空盔甲、长矛、破旗布',
    palette: [0x2d3335, 0x8f6a3c, 0x4d2630],
    actions: [
      { name: '城墙刺击', intent: 'attack', damage: 12, text: '造成 12 点伤害。' },
      { name: '矛阵架势', intent: 'block', block: 11, text: '获得 11 点护甲。' }
    ]
  },
  {
    id: 'ashen-banneret',
    name: '灰旗扈从',
    type: 'normal',
    hp: 62,
    visual: '灰旗、半身板甲、旧王徽记',
    palette: [0x383a40, 0x9b6b37, 0x5f1f2a],
    actions: [
      { name: '旗枪推进', intent: 'attack', damage: 14, text: '造成 14 点伤害。' },
      { name: '旧王旗令', intent: 'buff', strength: 2, block: 8, text: '获得 2 点力量和 8 点护甲。' }
    ]
  },
  {
    id: 'gutter-fire-archer',
    name: '沟火弩手',
    type: 'normal',
    hp: 46,
    visual: '火油弩、皮斗篷、暗巷灰烬',
    palette: [0x2a211b, 0xc36b34, 0x6a3d20],
    actions: [
      { name: '火油弩矢', intent: 'attack', damage: 10, targetStatus: 'vulnerable', statusValue: 1, text: '造成 10 点伤害并给予 1 层易伤。' },
      { name: '退入烟巷', intent: 'block', block: 10, text: '获得 10 点护甲。' }
    ]
  },
  {
    id: 'crownless-hound',
    name: '无冠猎犬',
    type: 'normal',
    hp: 42,
    visual: '骨质项圈、黑毛、王徽烙印',
    palette: [0x111111, 0x8a2f2a, 0xb88c44],
    actions: [
      { name: '撕喉扑咬', intent: 'attack', damage: 6, times: 3, text: '造成 6 点伤害 3 次。' },
      { name: '嗅血低吼', intent: 'buff', strength: 3, text: '获得 3 点力量。' }
    ]
  },
  {
    id: 'gate-iron-vicar',
    name: '城门铁牧',
    type: 'elite',
    hp: 128,
    visual: '铁冠、门闩大锤、破损经带',
    palette: [0x252c31, 0xb88935, 0x58222a],
    actions: [
      { name: '门闩重锤', intent: 'attack', damage: 24, text: '造成 24 点伤害。' },
      { name: '铁冠训诫', intent: 'debuff', targetStatus: 'weak', statusValue: 1, targetStatus2: 'vulnerable', statusValue2: 1, text: '给予 1 层虚弱和 1 层易伤。' },
      { name: '闭门守势', intent: 'block', block: 30, text: '获得 30 点护甲。' }
    ]
  },
  {
    id: 'royal-pyre-knight',
    name: '王火骑士',
    type: 'elite',
    hp: 136,
    visual: '火纹板甲、断刃长剑、白焰披风',
    palette: [0x20272d, 0xd5a24c, 0xc94f32],
    actions: [
      { name: '白焰斩', intent: 'attack', damage: 15, times: 2, text: '造成 15 点伤害 2 次。' },
      { name: '王火誓言', intent: 'buff', strength: 3, text: '获得 3 点力量。' },
      { name: '余烬护体', intent: 'block', block: 22, text: '获得 22 点护甲。' }
    ]
  },
  {
    id: 'clockwork-confessor',
    name: '钟械忏悔者',
    type: 'elite',
    hp: 112,
    visual: '钟表义肢、忏悔面罩、细链圣书',
    palette: [0x3a3630, 0xb58a52, 0x6e4cb0],
    actions: [
      { name: '齿轮裁断', intent: 'attack', damage: 11, times: 2, text: '造成 11 点伤害 2 次。' },
      { name: '倒数忏悔', intent: 'debuff', targetStatus: 'vulnerable', statusValue: 2, text: '给予 2 层易伤。' },
      { name: '钟械回正', intent: 'heal', heal: 16, block: 14, text: '回复 16 生命并获得 14 护甲。' }
    ]
  },
  {
    id: 'hollow-crown-regent',
    name: '空冠摄政',
    englishName: 'Hollow Crown Regent',
    type: 'boss',
    hp: 230,
    phaseRules: {
      2: { block: 12, strength: 1, log: '空冠降下第二道敕令。' },
      3: { strength: 2, log: '王火吞没了空心礼袍。' }
    },
    visual: '空心礼袍、悬浮王冠、灰白王火',
    palette: [0x171b20, 0xd0a24c, 0x7f2732],
    actions: [
      { name: '王令斩首', phase: 1, intent: 'attack', damage: 18, text: '造成 18 点伤害。' },
      { name: '空冠凝视', phase: 1, intent: 'debuff', targetStatus: 'weak', statusValue: 1, text: '给予 1 层虚弱。' },
      { name: '礼袍护焰', phase: 1, intent: 'block', block: 24, text: '获得 24 点护甲。' },
      { name: '召集旧王卫', phase: 2, intent: 'special', summon: 'hollow-spearman', text: '召唤 1 名空心长矛兵。' },
      { name: '城门崩落', phase: 2, intent: 'attack', damage: 16, targetStatus: 'vulnerable', statusValue: 1, text: '造成 16 点伤害并给予 1 层易伤。' },
      { name: '王都铁幕', phase: 2, intent: 'block', block: 34, text: '获得 34 点护甲。' },
      { name: '灰白敕令', phase: 3, intent: 'attack', damage: 9, times: 4, text: '造成 9 点伤害 4 次。' },
      { name: '献心回声', phase: 3, intent: 'debuff', targetStatus: 'weak', statusValue: 2, targetStatus2: 'vulnerable', statusValue2: 2, text: '给予 2 层虚弱和 2 层易伤。' },
      { name: '终王火', phase: 3, intent: 'attack', damage: 42, charge: true, text: '蓄力后造成 42 点伤害。' }
    ]
  }
];

export function getEnemy(enemyId) {
  return enemies.find((enemy) => enemy.id === enemyId) ?? enemies[0];
}

export function getEnemiesByType(type) {
  return enemies.filter((enemy) => enemy.type === type);
}
