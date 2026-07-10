import { getProductionRelics, getRelic } from '../data/relics.js';
import { runChoice } from '../game/RunRandom.js';

export class RelicSystem {
  static value(run, hook) {
    return (run.relics ?? []).reduce((total, relicId) => {
      const relic = getRelic(relicId);
      if (relic.hooks && Object.prototype.hasOwnProperty.call(relic.hooks, hook)) {
        return total + relic.hooks[hook];
      }
      return total + (relic.hook === hook ? relic.value : 0);
    }, 0);
  }

  static has(run, hook) {
    return this.value(run, hook) > 0;
  }

  static goldWithBonus(run, amount, { bonusHook = 'goldBonusPercent', includeRewardFlat = true } = {}) {
    const base = Math.max(0, amount);
    const percent = this.value(run, bonusHook);
    const flat = includeRewardFlat ? this.value(run, 'rewardGold') : 0;
    return Math.max(0, Math.floor((base + flat) * (1 + percent)));
  }

  static shopPrice(run, price) {
    const discount = Math.min(0.8, Math.max(0, this.value(run, 'shopDiscountPercent')));
    return Math.max(1, Math.ceil(price * (1 - discount)));
  }

  static triggerOnAcquire(run, relic) {
    if (!relic || !run) return [];
    const events = [];
    const heal = relic.hook === 'onAcquireHeal' ? relic.value : relic.hooks?.onAcquireHeal;
    if (heal) {
      const before = run.hp;
      run.hp = Math.min(run.maxHp, run.hp + heal);
      events.push({ type: 'heal', amount: run.hp - before, relicId: relic.id });
    }
    return events;
  }

  static addRandom(run) {
    const pool = getProductionRelics().filter((relic) => !(run.relics ?? []).includes(relic.id));
    const relic = runChoice(run, pool);
    if (!relic) return null;
    run.relics.push(relic.id);
    this.triggerOnAcquire(run, relic);
    return relic;
  }

  static addById(run, relicId) {
    const relic = getRelic(relicId);
    if (!run.relics.includes(relicId)) {
      run.relics.push(relicId);
      this.triggerOnAcquire(run, relic);
    }
    return relic;
  }
}
