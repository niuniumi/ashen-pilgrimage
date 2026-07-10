export const ACTS = [
  {
    number: 1,
    id: 'duskcrow-village',
    title: '第一章：暮鸦村与墓园',
    subtitle: '腐败从村口的井水里醒来。',
    shortTitle: '暮鸦村',
    mapCaption: '墓园钟声仍在远处回荡。',
    bossId: 'headless-grave-knight',
    bossName: '无首守墓骑士',
    bossPlace: '墓园尽头',
    clearTitle: '第一章完成',
    clearSubtitle: '墓园的灰风终于停下。',
    bossIntro: [
      '墓园尽头，铁门缓缓开启。',
      '无头的骑士仍守着早已无人祭拜的坟墓。',
      '它举起墓剑，仿佛还记得旧王最后的命令。',
      '无首守墓骑士挡住了你的去路。'
    ],
    clearStory: [
      '墓剑落地，灰白火焰在盔甲缝隙中熄灭。',
      '暮鸦村的风第一次吹散了墓园上方的灰。',
      '但远处修道院仍亮着不合时宜的烛光。',
      '你的圣途，才刚刚开始。'
    ]
  },
  {
    number: 2,
    id: 'ember-abbey',
    title: '第二章：灰烬修道院',
    subtitle: '温柔的烛光也会投下漫长的影子。',
    shortTitle: '修道院',
    mapCaption: '白蜡滴落，像一场无声的雪。',
    bossId: 'pale-wax-matron',
    bossName: '白蜡圣母',
    bossPlace: '圣蜡礼拜堂',
    clearTitle: '第二章完成',
    clearSubtitle: '修道院的祈祷声沉入灰尘。',
    bossIntro: [
      '礼拜堂里没有风，蜡烛却一齐弯向你。',
      '白蜡圣母从祭坛后的阴影中抬起双手。',
      '她的祝福像温水，也像封喉的蜡。',
      '若要继续前往王都，你必须穿过这片洁白的沉默。'
    ],
    clearStory: [
      '白蜡碎裂，祭坛下露出一条被火烫黑的古路。',
      '修道院的钟没有响，只有你的脚步在长廊里回声。',
      '王都在山脊后发出灰白的光，像尚未愈合的伤口。',
      '旅途不再只是求生，而是在追问圣火为何背叛。'
    ]
  },
  {
    number: 3,
    id: 'old-king-road',
    title: '第三章：旧王都外墙',
    subtitle: '所有道路最终都通向一颗空掉的王心。',
    shortTitle: '旧王都',
    mapCaption: '城墙高处，圣火像冷月一样燃烧。',
    bossId: 'hollow-crown-regent',
    bossName: '空冠摄政',
    bossPlace: '旧王都城门',
    clearTitle: '圣途完成',
    clearSubtitle: '灰白圣火终于低下了头。',
    bossIntro: [
      '旧王都的城门没有守军，只有灰烬在门缝里呼吸。',
      '空冠摄政披着旧王的礼袍，从火光中转身。',
      '它没有心，却替那颗被献祭的王心继续下令。',
      '最后的道路，只剩这一次抉择。'
    ],
    clearStory: [
      '空冠坠落，城门后的圣火收成一粒苍白的星。',
      '你终于看清：火从未审判人，它只是映出人心的欲望。',
      '晨光越过旧王都外墙，照到三名行者留下的脚印。',
      '灰烬仍会落下，但旅途已经不再黑暗。'
    ]
  }
];

export function getActDefinition(act = 1) {
  const number = Number.isFinite(act) ? act : 1;
  return ACTS.find((entry) => entry.number === number) ?? ACTS[0];
}

export function getNextActDefinition(act = 1) {
  return ACTS.find((entry) => entry.number === act + 1) ?? null;
}

export function isFinalAct(act = 1) {
  return !getNextActDefinition(act);
}
