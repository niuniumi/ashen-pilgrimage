import assert from 'node:assert/strict';
import test from 'node:test';

import { createNewRun } from '../src/game/GameState.js';
import { BattleSystem } from '../src/systems/BattleSystem.js';

test('boss summons inherit battle context without crashing vow modifiers', () => {
  const run = createNewRun('exiled-knight', { seed: 81 });
  run.vows = ['iron-pilgrimage'];
  const battle = BattleSystem.createBattle(run, 'boss');
  const boss = battle.enemies[0];
  const action = { name: '召唤', intent: 'special', summon: 'graveyard-skeleton', text: '召唤。' };
  const events = BattleSystem.resolveEnemyAction(run, battle, boss, action);
  assert.equal(events.some((event) => event.type === 'summon'), true);
  assert.equal(battle.enemies.length, 2);
  assert.equal(battle.enemies[1].maxHp, 24);
});
