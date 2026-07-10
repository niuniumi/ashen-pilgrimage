import { getCard } from '../data/cards.js';
import { runShuffle } from '../game/RunRandom.js';

export class CardSystem {
  static createBattleDeck(run) {
    return {
      drawPile: runShuffle(run, run.deck.map((card) => ({ ...card }))),
      hand: [],
      discardPile: [],
      exhaustPile: []
    };
  }

  static drawCards(battle, count, run) {
    const drawn = [];
    for (let i = 0; i < count; i += 1) {
      if (battle.drawPile.length === 0 && battle.discardPile.length > 0) {
        battle.drawPile = runShuffle(run, battle.discardPile.splice(0));
      }
      const card = battle.drawPile.pop();
      if (!card) break;
      battle.hand.push(card);
      drawn.push(card);
    }
    return drawn;
  }

  static discardHand(battle) {
    battle.discardPile.push(...battle.hand.splice(0));
  }

  static removeFromHand(battle, uid) {
    const index = battle.hand.findIndex((card) => card.uid === uid);
    if (index === -1) return null;
    return battle.hand.splice(index, 1)[0];
  }

  static getDisplayCard(instance) {
    const data = getCard(instance.cardId);
    const upgraded = Boolean(instance.upgraded);
    return {
      ...data,
      upgraded,
      cost: upgraded && data.upgradedCost !== undefined ? data.upgradedCost : data.cost,
      activeText: upgraded ? data.upgradedText ?? data.text : data.text,
      activeEffects: upgraded ? data.upgradedEffects ?? data.effects : data.effects
    };
  }

  static upgradeRandom(run, predicate = () => true) {
    const target = run.deck.find((card) => !card.upgraded && predicate(getCard(card.cardId)));
    if (!target) return null;
    target.upgraded = true;
    return target;
  }

  static removeFirstBasic(run) {
    const index = run.deck.findIndex((card) => ['knight-cleave', 'knight-block', 'nun-flame', 'nun-prayer-shield', 'alc-acid-vial', 'alc-leather-guard'].includes(card.cardId));
    if (index === -1) return null;
    return run.deck.splice(index, 1)[0];
  }
}
