export const events = [
  {
    id: 'weeping-well',
    title: '古井哭声',
    description: '枯井深处传来细弱哭声，井沿布满灰白手印。',
    options: [
      { label: '探井', cost: '失去 8 生命', result: '你在湿冷石缝里摸到一件遗物。', effects: [{ kind: 'loseHp', value: 8 }, { kind: 'randomRelic' }] },
      { label: '投下银币', cost: '失去 20 金币，回复 10 生命', result: '银币沉入黑水，哭声变成温暖低语。', condition: { gold: 20 }, effects: [{ kind: 'gold', value: -20 }, { kind: 'heal', value: 10 }] },
      { label: '离开', cost: '无', result: '你离开井边，身后的哭声渐渐远去。', effects: [] }
    ]
  },
  {
    id: 'broken-chapel',
    title: '破败礼拜堂',
    description: '礼拜堂半塌，圣火坛只剩一团灰白余辉。',
    options: [
      { label: '祈祷', cost: '回复 30% 生命', result: '微弱烛光沿着伤口缝合。', effects: [{ kind: 'healPercent', value: 0.3 }] },
      { label: '偷取圣器', cost: '获得 80 金币，加入 1 张腐败', result: '圣器很重，某种恶意也跟了上来。', effects: [{ kind: 'gold', value: 80 }, { kind: 'addDeckCard', cardId: 'curse-rot' }] },
      { label: '离开', cost: '无', result: '你没有惊动废墟里的圣像。', effects: [] }
    ]
  },
  {
    id: 'black-market-caravan',
    title: '黑市商旅',
    description: '三辆罩着黑布的马车停在泥路旁，商人只露出一只眼。',
    options: [
      { label: '购买遗物', cost: '花费 50 金币', result: '商人递出一个冷得刺骨的小盒。', condition: { gold: 50 }, effects: [{ kind: 'gold', value: -50 }, { kind: 'randomRelic' }] },
      { label: '卖出一张牌', cost: '移除一张牌，获得 40 金币', result: '旧牌被投入火盆，你的行囊轻了一点。', effects: [{ kind: 'removeBasicCard' }, { kind: 'gold', value: 40 }] },
      { label: '离开', cost: '无', result: '你没有碰那份来路不明的货物。', effects: [] }
    ]
  },
  {
    id: 'whispering-stone',
    title: '残碑低语',
    description: '碑文像活物一样游动，念出你的名字。',
    options: [
      { label: '阅读碑文', cost: '升级一张牌，失去 6 生命', result: '字句刻进掌心，一张牌变得更加锋利。', effects: [{ kind: 'upgradeRandomCard' }, { kind: 'loseHp', value: 6 }] },
      { label: '打碎墓碑', cost: '获得遗物，加入 1 张腐败', result: '石屑中露出古旧遗物，也释放出污秽气息。', effects: [{ kind: 'randomRelic' }, { kind: 'addDeckCard', cardId: 'curse-rot' }] },
      { label: '离开', cost: '无', result: '你把低语留给寒风。', effects: [] }
    ]
  },
  {
    id: 'iron-forge',
    title: '铁匠遗炉',
    description: '熄灭多年的炉膛里还有一粒赤红火星。',
    options: [
      { label: '锤炼攻击牌', cost: '升级一张攻击牌', result: '铁锤落下，刃口映出暗金火光。', effects: [{ kind: 'upgradeByType', type: '攻击' }] },
      { label: '加固防御牌', cost: '升级一张防御牌', result: '旧盾边缘重新压上黑铁钉。', effects: [{ kind: 'upgradeByType', type: '防御' }] },
      { label: '离开', cost: '无', result: '你没有惊扰这座孤独炉膛。', effects: [] }
    ]
  },
  {
    id: 'holy-fire-vision',
    title: '圣火幻象',
    description: '灰白圣火在空中展开，像一颗仍在跳动的心脏。',
    options: [
      { label: '触碰幻象', cost: '获得 2 力量，加入 1 张腐败', result: '力量涌入手臂，灰烬也爬进血里。', effects: [{ kind: 'runStrength', value: 2 }, { kind: 'addDeckCard', cardId: 'curse-rot' }] },
      { label: '斩断幻象', cost: '移除一张牌，失去 6 生命', result: '幻象碎裂，火舌在你的影子上留下缺口。', effects: [{ kind: 'removeBasicCard' }, { kind: 'loseHp', value: 6 }] },
      { label: '离开', cost: '无', result: '你把圣火留在路旁，不再回头。', effects: [] }
    ]
  },
  {
    id: 'crow-letter',
    title: '乌鸦送信',
    description: '一只乌鸦落在歪斜路标上，脚环里塞着被血浸湿的短笺。',
    options: [
      { label: '拆开短笺', cost: '获得 35 金币，加入 1 张伤口', result: '短笺里夹着小银片，也夹着诅咒般的警告。', effects: [{ kind: 'gold', value: 35 }, { kind: 'addDeckCard', cardId: 'status-wound' }] },
      { label: '烧掉短笺', cost: '失去 4 生命，升级一张牌', result: '纸灰钻进伤口，一张牌在痛觉里变得清晰。', effects: [{ kind: 'loseHp', value: 4 }, { kind: 'upgradeRandomCard' }] },
      { label: '喂食放走', cost: '无', result: '乌鸦低头啄食，随后飞向墓园深处。', effects: [] }
    ]
  },
  {
    id: 'knight-corpse',
    title: '骑士尸体',
    description: '泥地里半跪着一具无名骑士尸体，手仍握着断剑。',
    options: [
      { label: '取走断剑', cost: '获得遗物，失去 7 生命', result: '铁锈割开掌心，断剑却重新发出冷光。', effects: [{ kind: 'randomRelic' }, { kind: 'loseHp', value: 7 }] },
      { label: '安葬尸体', cost: '回复 12 生命', result: '你把尸体拖到路旁，破碎圣徽在土中微微发亮。', effects: [{ kind: 'heal', value: 12 }] }
    ]
  },
  {
    id: 'witch-ruin',
    title: '女巫坍塌',
    description: '倒塌棚屋里吊着干草符，锅底还残留紫黑油光。',
    options: [
      { label: '饮下残药', cost: '获得 2 力量，失去 10 生命', result: '药液烧穿喉咙，力量从骨缝里钻出。', effects: [{ kind: 'runStrength', value: 2 }, { kind: 'loseHp', value: 10 }] },
      { label: '搜刮药柜', cost: '获得一张通用牌', result: '你找到一张写在羊皮纸上的急救配方。', effects: [{ kind: 'addRandomCard' }] },
      { label: '不碰咒物', cost: '无', result: '你离开时，屋梁终于彻底坍下。', effects: [] }
    ]
  },
  {
    id: 'broken-bridge',
    title: '断桥',
    description: '木桥断成两截，桥下黑水缓慢倒流。',
    options: [
      { label: '强行跃过', cost: '失去 9 生命，获得 45 金币', result: '你摔在对岸碎石上，却抓住了一只沉旧钱袋。', effects: [{ kind: 'loseHp', value: 9 }, { kind: 'gold', value: 45 }] },
      { label: '绕远路', cost: '回复 6 生命', result: '绕路耽误了时间，但让你避开了黑水。', effects: [{ kind: 'heal', value: 6 }] }
    ]
  },
  {
    id: 'confession-room',
    title: '忏悔室',
    description: '木格后的黑暗里有人等待你开口，声音像旧钟摆。',
    options: [
      { label: '承认罪责', cost: '移除一张基础牌，失去 6 生命', result: '每一句忏悔都像从牌组里剥下一层旧皮。', effects: [{ kind: 'removeBasicCard' }, { kind: 'loseHp', value: 6 }] },
      { label: '倾听告解', cost: '升级一张牌', result: '陌生人的罪行给了你新的战斗方式。', effects: [{ kind: 'upgradeRandomCard' }] },
      { label: '离开', cost: '无', result: '木格后传来一声轻笑。', effects: [] }
    ]
  },
  {
    id: 'plague-bed',
    title: '瘟疫病床',
    description: '路边草棚摆着三张病床，病人眼中倒映灰白火焰。',
    options: [
      { label: '照看病人', cost: '失去 5 生命，获得遗物', result: '病人把一件被布包着的旧物塞进你手里。', effects: [{ kind: 'loseHp', value: 5 }, { kind: 'randomRelic' }] },
      { label: '拿走药剂', cost: '回复 15 生命，加入 1 张腐败', result: '药剂很有效，但瓶底漂着不该存在的眼睛。', effects: [{ kind: 'heal', value: 15 }, { kind: 'addDeckCard', cardId: 'curse-rot' }] }
    ]
  },
  {
    id: 'sealed-cellar',
    title: '封闭地窖',
    description: '地窖门被三道铁链锁住，里面传来刮挠声和金币碰撞声。',
    options: [
      { label: '砸开铁链', cost: '获得 70 金币，加入 1 张伤口', result: '金币滚出门缝，某种东西也在你手背上留下抓痕。', effects: [{ kind: 'gold', value: 70 }, { kind: 'addDeckCard', cardId: 'status-wound' }] },
      { label: '用圣火封门', cost: '升级一张牌，失去 5 生命', result: '铁链烧红又冷却，地窖安静下来。', effects: [{ kind: 'upgradeRandomCard' }, { kind: 'loseHp', value: 5 }] },
      { label: '离开', cost: '无', result: '刮挠声跟随你走了很久。', effects: [] }
    ]
  },
  {
    id: 'black-hound-howl',
    title: '黑犬嚎叫',
    description: '雾中有黑犬围着一堆熄灭篝火打转，它们没有立刻扑上来。',
    options: [
      { label: '投喂干粮', cost: '失去 18 金币，回复 10 生命', result: '黑犬吃完后低下头，让出一条安全的小路。', condition: { gold: 18 }, effects: [{ kind: 'gold', value: -18 }, { kind: 'heal', value: 10 }] },
      { label: '驱赶黑犬', cost: '获得 1 力量，失去 8 生命', result: '你用火把赶走它们，手臂却被咬出深痕。', effects: [{ kind: 'runStrength', value: 1 }, { kind: 'loseHp', value: 8 }] }
    ]
  },
  {
    id: 'dead-merchant',
    title: '死去的商人',
    description: '商人倒在翻覆货车旁，账本仍被他死死压在胸口。',
    options: [
      { label: '翻找货车', cost: '获得 55 金币', result: '你找到一袋潮湿银币，车轮下却没有活人的脚印。', effects: [{ kind: 'gold', value: 55 }] },
      { label: '翻开账本', cost: '获得一张牌，失去 4 生命', result: '账本里夹着一张战斗手稿，纸边割破了手指。', effects: [{ kind: 'addRandomCard' }, { kind: 'loseHp', value: 4 }] },
      { label: '合上眼睛', cost: '回复 8 生命', result: '你替他合上眼，灰风短暂地停了下来。', effects: [{ kind: 'heal', value: 8 }] }
    ]
  },
  {
    id: 'knight-broken-banner',
    title: '折断的王旗',
    description: '旧王旗压着一名仍有呼吸的逃兵。他认出了你的流放烙印。',
    acts: [1, 2],
    character: 'exiled-knight',
    options: [
      { label: '割断王旗', cost: '失去 5 生命，最大生命 +4', result: '你用旧旗包住他的伤口，也割断了最后一缕王命。', effects: [{ kind: 'loseHp', value: 5 }, { kind: 'maxHp', value: 4 }, { kind: 'storyFlag', value: 'knight-mercy' }] },
      { label: '执行逃兵', cost: '获得 2 力量', result: '断剑落下。旧誓重新变得沉重而熟悉。', effects: [{ kind: 'runStrength', value: 2 }, { kind: 'storyFlag', value: 'knight-crown' }] },
      { label: '沉默离开', cost: '无', result: '王旗继续在泥水中腐烂。', effects: [] }
    ]
  },
  {
    id: 'nun-wax-sister',
    title: '蜡封姐妹',
    description: '一名修女被白蜡封在祷告姿势里，眼睛仍在蜡层后缓慢转动。',
    acts: [2],
    character: 'candle-nun',
    options: [
      { label: '熄灭她的烛芯', cost: '失去 6 生命，移除一张基础牌', result: '她终于呼出最后一口气，蜡像裂成温暖碎片。', effects: [{ kind: 'loseHp', value: 6 }, { kind: 'removeBasicCard' }, { kind: 'storyFlag', value: 'nun-release' }] },
      { label: '收走她的圣火', cost: '永久力量 +2，加入腐败', result: '她的火进入你的烛盏，祷告却从此多了第二个声音。', effects: [{ kind: 'runStrength', value: 2 }, { kind: 'addDeckCard', cardId: 'curse-rot' }, { kind: 'storyFlag', value: 'nun-crown' }] },
      { label: '继续祈祷', cost: '回复 10 生命', result: '你们隔着蜡层完成了最后一段祷词。', effects: [{ kind: 'heal', value: 10 }] }
    ]
  },
  {
    id: 'alchemist-sealed-lab',
    title: '封死的实验室',
    description: '门上刻着你的旧署名。桌面仍摆着那份被王室禁止的瘟疫配方。',
    acts: [2, 3],
    character: 'ashblood-alchemist',
    options: [
      { label: '改写解药', cost: '失去 8 生命，升级两次', result: '你删去永生剂量，把配方改回救人的药。', effects: [{ kind: 'loseHp', value: 8 }, { kind: 'upgradeRandomCard' }, { kind: 'upgradeRandomCard' }, { kind: 'storyFlag', value: 'alc-cure' }] },
      { label: '完成灰血实验', cost: '最大生命 -6，力量 +3', result: '试剂在血管中点燃，你终于成为自己最危险的样本。', effects: [{ kind: 'maxHp', value: -6 }, { kind: 'runStrength', value: 3 }, { kind: 'storyFlag', value: 'alc-phoenix' }] },
      { label: '烧毁实验室', cost: '获得 35 金币', result: '王室封印与旧日笔记一起化成灰。', effects: [{ kind: 'gold', value: 35 }] }
    ]
  },
  {
    id: 'voiceless-choir',
    title: '无声唱诗班',
    description: '第二礼拜堂里坐满没有面孔的信徒。每张长椅都在替他们低声歌唱。',
    acts: [2],
    options: [
      { label: '加入合唱', cost: '加入 1 张腐败，获得遗物', result: '你的声音被长椅记住，圣匣吐出一件遗物。', effects: [{ kind: 'addDeckCard', cardId: 'curse-rot' }, { kind: 'randomRelic' }] },
      { label: '敲碎长椅', cost: '失去 7 生命，获得 60 金币', result: '歌声戛然而止，木屑下滚出积年的奉献银币。', effects: [{ kind: 'loseHp', value: 7 }, { kind: 'gold', value: 60 }] },
      { label: '保持沉默', cost: '回复 8 生命', result: '无声者为你让出中央过道。', effects: [{ kind: 'heal', value: 8 }] }
    ]
  },
  {
    id: 'empty-throne-procession',
    title: '空王巡游',
    description: '一支没有国王的仪仗队沿废街前进，士兵仍向空轿行礼。',
    acts: [3],
    options: [
      { label: '坐入空轿', cost: '获得 90 金币，加入 1 张腐败', result: '整条街向你跪下，空冠的重量提前落在肩上。', effects: [{ kind: 'gold', value: 90 }, { kind: 'addDeckCard', cardId: 'curse-rot' }, { kind: 'storyFlag', value: 'touched-empty-throne' }] },
      { label: '解散仪仗', cost: '失去 8 生命，最大生命 +5', result: '第一名士兵放下武器时，你替他挡住了督战长矛。', effects: [{ kind: 'loseHp', value: 8 }, { kind: 'maxHp', value: 5 }] },
      { label: '避入暗巷', cost: '无', result: '空轿从街口经过，帘后似乎有人注视你。', effects: [] }
    ]
  },
  {
    id: 'king-heart-fragment',
    title: '王心碎片',
    description: '灰白火盆里悬着一小块仍会跳动的心肉，每次搏动都让王城后退一寸。',
    acts: [3],
    options: [
      { label: '带走碎片', cost: '失去 10 生命，力量 +2', result: '碎片贴近胸口，两个心跳逐渐重合。', effects: [{ kind: 'loseHp', value: 10 }, { kind: 'runStrength', value: 2 }, { kind: 'storyFlag', value: 'carried-heart-fragment' }] },
      { label: '让它安息', cost: '回复 25% 生命', result: '你熄灭火盆，王城第一次安静得像一座普通废墟。', effects: [{ kind: 'healPercent', value: 0.25 }] },
      { label: '封回火盆', cost: '升级一张牌', result: '封蜡合拢，心跳暂时沉入地下。', effects: [{ kind: 'upgradeRandomCard' }] }
    ]
  }
];

export function getEvent(eventId) {
  return events.find((event) => event.id === eventId) ?? events[0];
}
