import { getPlayableRewardCards } from '../data/cards.js';
import { getProductionRelics } from '../data/relics.js';
import { createCardInstance } from '../game/GameState.js';
import { runChance, runChoice, runPickMany, runRandomInt } from '../game/RunRandom.js';
import { RelicSystem } from './RelicSystem.js';
import { VowSystem } from './VowSystem.js';

export class RewardSystem {
  static createReward(run, battleType = 'battle') {
    const cards = runPickMany(run, getPlayableRewardCards(run.characterId), 3 + RelicSystem.value(run, 'rewardCardBonus'));
    const baseGold = battleType === 'elite' ? runRandomInt(run, 35, 48) : runRandomInt(run, 18, 32);
    const relic = battleType === 'elite' ? this.randomRelicCandidate(run) : runChance(run, 0.22) ? this.randomRelicCandidate(run) : null;
    return {
      gold: Math.floor(RelicSystem.goldWithBonus(run, baseGold) * VowSystem.value(run, 'goldMultiplier')),
      cards,
      relic,
      relicPending: Boolean(relic)
    };
  }

  static addCardReward(run, cardId) {
    run.deck.push(createCardInstance(cardId));
  }

  static createShop(run) {
    const cardPool = getPlayableRewardCards(run.characterId);
    const cards = runPickMany(run, cardPool, 3).map((card) => ({
      kind: 'card',
      card,
      price: this.shopPrice(run, card.rarity === '普通' ? 45 : 72),
      sold: false
    }));
    const first = this.randomRelicCandidate(run);
    const second = this.randomRelicCandidate(run, [first?.id].filter(Boolean));
    const shopRelics = [first, second]
      .filter(Boolean)
      .map((relic) => ({ kind: 'relic', relic, price: this.shopPrice(run, 80), sold: false }));
    return { cards, relics: shopRelics };
  }

  static randomCardForCharacter(run) {
    return runChoice(run, getPlayableRewardCards(run.characterId));
  }

  static randomRelicCandidate(run, excluded = []) {
    return runChoice(run, getProductionRelics().filter((relic) => !(run.relics ?? []).includes(relic.id) && !excluded.includes(relic.id)));
  }

  static shopPrice(run, price) {
    const vowDiscount = Math.min(0.8, VowSystem.value(run, 'shopDiscountPercent'));
    return Math.max(1, Math.ceil(RelicSystem.shopPrice(run, price) * (1 - vowDiscount)));
  }
}
