const VICTORY_ENDINGS = {
  'exiled-knight': {
    light: {
      id: 'knight-free-blade',
      title: '无主之剑',
      subtitle: '旧誓已断，黎明无需王座。',
      body: '你把王冠留在冷却的灰里。此后，剑只为仍活着的人出鞘。'
    },
    dark: {
      id: 'knight-iron-throne',
      title: '铁王新誓',
      subtitle: '王座空了太久，终究等来另一副盔甲。',
      body: '你握住空冠，以新的誓言命令圣火。王城得救，却再次拥有了主人。'
    }
  },
  'candle-nun': {
    light: {
      id: 'nun-last-candle',
      title: '最后一烛',
      subtitle: '被允许熄灭的火，才真正照亮长夜。',
      body: '你放走圣火里的亡魂，只留一支平凡的蜡烛，为归来者指路。'
    },
    dark: {
      id: 'nun-white-abbess',
      title: '白焰院母',
      subtitle: '万烛俯首，只有你的影子不再移动。',
      body: '你接过白蜡圣母的烛冠。祈祷重新响起，却没有人敢再问火焰是否仁慈。'
    }
  },
  'ashblood-alchemist': {
    light: {
      id: 'alchemist-remedy',
      title: '凡人的解药',
      subtitle: '不必永生，也能让瘟疫止步。',
      body: '你将王心炼成第一剂解药，然后烧毁配方中关于永生的最后一页。'
    },
    dark: {
      id: 'alchemist-phoenix',
      title: '灰血不死鸟',
      subtitle: '实验成功了，只是人已经不在其中。',
      body: '你饮下王心与灰血的混合物。王都看见一只不会死亡的火焰走出废墟。'
    }
  }
};

const LIGHT_FLAGS = {
  'exiled-knight': 'knight-mercy',
  'candle-nun': 'nun-release',
  'ashblood-alchemist': 'alc-cure'
};

const DEFEAT_BODIES = {
  'exiled-knight': '断剑埋进灰土，最后一道誓言无人听见。',
  'candle-nun': '烛火在掌心熄灭，长夜重新合拢。',
  'ashblood-alchemist': '灰血冷却成黑色结晶，解药停在最后一次实验。'
};

export class EndingSystem {
  static resolve(run = {}, victory = false) {
    const characterId = run.characterId ?? 'exiled-knight';
    if (!victory) {
      return {
        id: `${characterId}-defeat`,
        title: '圣途断绝',
        subtitle: `旅途止于第 ${run.act ?? 1} 章。`,
        body: DEFEAT_BODIES[characterId] ?? '余火沉入灰烬，脚步没有抵达王城。',
        victory: false
      };
    }
    const endings = VICTORY_ENDINGS[characterId] ?? VICTORY_ENDINGS['exiled-knight'];
    const light = (run.storyFlags ?? []).includes(LIGHT_FLAGS[characterId]);
    return { ...(light ? endings.light : endings.dark), victory: true };
  }
}
