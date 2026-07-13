import assert from 'node:assert/strict';
import test from 'node:test';

import { createCardInstance, createNewRun } from '../src/game/GameState.js';
import { BattleSystem } from '../src/systems/BattleSystem.js';

test('natural candlemark burn decays two delayed-damage stacks', () => {
  const run = createNewRun('candle-nun', { seed: 701 });
  const battle = BattleSystem.createBattle(run, 'battle');
  const enemy = battle.enemies[0];
  enemy.hp = 999;
  enemy.maxHp = 999;
  enemy.status.candlemark = 3;
  enemy.currentAction = { name: '等待', intent: 'block', block: 0, text: '等待。' };

  BattleSystem.endPlayerTurn(run, battle);

  assert.equal(enemy.hp, 993);
  assert.equal(enemy.status.candlemark, 1);
});

test('knight rend converts every wound mark into four bonus damage', () => {
  const run = createNewRun('exiled-knight', { seed: 702 });
  const battle = BattleSystem.createBattle(run, 'battle');
  const enemy = battle.enemies[0];
  enemy.hp = 100;
  enemy.maxHp = 100;
  enemy.block = 0;
  enemy.status.mark = 2;
  const rend = createCardInstance('knight-rend');
  battle.deck.hand = [rend];
  battle.player.energy = 3;

  const result = BattleSystem.useCard(run, battle, rend.uid, 0);

  assert.equal(result.ok, true);
  assert.equal(enemy.hp, 84);
  assert.equal(enemy.status.mark, 0);
});
