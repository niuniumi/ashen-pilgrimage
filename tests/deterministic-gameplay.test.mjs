import assert from 'node:assert/strict';
import test from 'node:test';

import { createNewRun } from '../src/game/GameState.js';
import { BattleSystem } from '../src/systems/BattleSystem.js';
import { RewardSystem } from '../src/systems/RewardSystem.js';

function cardIds(cards) {
  return cards.map((card) => `${card.cardId}:${card.upgraded ? 1 : 0}`);
}

test('same seed produces the same encounter and battle deck order', () => {
  const firstRun = createNewRun('exiled-knight', { seed: 78231 });
  const secondRun = createNewRun('exiled-knight', { seed: 78231 });
  const firstBattle = BattleSystem.createBattle(firstRun, 'battle');
  const secondBattle = BattleSystem.createBattle(secondRun, 'battle');

  assert.deepEqual(firstBattle.enemies.map((enemy) => enemy.id), secondBattle.enemies.map((enemy) => enemy.id));
  assert.deepEqual(cardIds(firstBattle.deck.hand), cardIds(secondBattle.deck.hand));
  assert.deepEqual(cardIds(firstBattle.deck.drawPile), cardIds(secondBattle.deck.drawPile));
  assert.deepEqual(firstRun.rngState, secondRun.rngState);
});

test('same seed produces the same reward offer and advances equally', () => {
  const firstRun = createNewRun('ashblood-alchemist', { seed: 99014 });
  const secondRun = createNewRun('ashblood-alchemist', { seed: 99014 });
  const first = RewardSystem.createReward(firstRun, 'elite');
  const second = RewardSystem.createReward(secondRun, 'elite');

  assert.deepEqual(first, second);
  assert.deepEqual(firstRun.rngState, secondRun.rngState);
});
