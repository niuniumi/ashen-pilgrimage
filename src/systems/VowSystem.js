import { pickMany } from '../game/RunRng.js';

export const vows = [
  {
    id: 'iron-pilgrimage',
    icon: 'shield',
    name: '铁身圣途',
    motto: '让盔甲先记住苦难。',
    boon: '最大生命 +10。',
    burden: '敌人最大生命 +12%。',
    immediate: { maxHp: 10 },
    hooks: { enemyHpMultiplier: 1.12 }
  },
  {
    id: 'blood-price',
    icon: 'attack',
    name: '血价誓约',
    motto: '每一道伤口都应当留下回声。',
    boon: '所有攻击伤害 +1。',
    burden: '最大生命 -8。',
    immediate: { maxHp: -8 },
    hooks: { attackDamage: 1 }
  },
  {
    id: 'candle-tithe',
    icon: 'flame',
    name: '烛税誓约',
    motto: '先献出所得，再索取庇护。',
    boon: '每场战斗开始获得 8 护甲。',
    burden: '战斗金币收益 -20%。',
    hooks: { battleStartBlock: 8, goldMultiplier: 0.8 }
  },
  {
    id: 'open-hand',
    icon: 'coin',
    name: '空手戒律',
    motto: '不占有，才能穿过王城。',
    boon: '商店价格降低 15%。',
    burden: '立誓时失去 15 金币。',
    immediate: { gold: -15 },
    hooks: { shopDiscountPercent: 0.15 }
  },
  {
    id: 'long-night',
    icon: 'moon',
    name: '长夜守望',
    motto: '比敌人更早看见黎明。',
    boon: '首回合额外抽 1 张牌。',
    burden: '敌人战斗开始获得 1 力量。',
    hooks: { firstTurnDraw: 1, enemyStrengthStart: 1 }
  },
  {
    id: 'ashen-mercy',
    icon: 'heart',
    name: '灰烬慈悲',
    motto: '在火堆旁原谅一次软弱。',
    boon: '休息额外回复 6 生命。',
    burden: '精英敌人最大生命 +8%。',
    hooks: { restHealBonus: 6, eliteHpMultiplier: 1.08 }
  }
];

export class VowSystem {
  static createOffer(run, act = 1) {
    const sworn = new Set(run.vows ?? []);
    const pool = vows.filter((vow) => !sworn.has(vow.id));
    const picked = pickMany(run.rngState, pool, Math.min(3, pool.length));
    run.rngState = picked.state;
    run.pendingVowOffer = { act, ids: picked.value.map((vow) => vow.id) };
    return picked.value;
  }

  static getOffer(run, act = 1) {
    if (run.pendingVowOffer?.act === act) {
      return run.pendingVowOffer.ids.map((id) => vows.find((vow) => vow.id === id)).filter(Boolean);
    }
    return this.createOffer(run, act);
  }

  static apply(run, vowId) {
    const vow = vows.find((item) => item.id === vowId);
    if (!vow || (run.vows ?? []).includes(vowId)) return vow ?? null;
    run.vows ??= [];
    run.vows.push(vowId);
    if (vow.immediate?.maxHp) {
      run.maxHp = Math.max(1, run.maxHp + vow.immediate.maxHp);
      run.hp = Math.max(1, Math.min(run.maxHp, run.hp + vow.immediate.maxHp));
    }
    if (vow.immediate?.gold) run.gold = Math.max(0, run.gold + vow.immediate.gold);
    delete run.pendingVowOffer;
    return vow;
  }

  static value(run, hook) {
    const selected = vows.filter((vow) => (run.vows ?? []).includes(vow.id) && vow.hooks?.[hook] !== undefined);
    if (hook.endsWith('Multiplier')) {
      return selected.reduce((value, vow) => value * vow.hooks[hook], 1);
    }
    return selected.reduce((value, vow) => value + vow.hooks[hook], 0);
  }
}
