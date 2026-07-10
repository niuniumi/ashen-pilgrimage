import assert from 'node:assert/strict';
import test from 'node:test';

import { BossPhaseSystem } from '../src/systems/BossPhaseSystem.js';

function boss(overrides = {}) {
  return {
    id: 'test-boss',
    uid: 'boss-1',
    name: '试炼首领',
    type: 'boss',
    hp: 60,
    maxHp: 100,
    block: 0,
    status: {},
    lastPhase: 1,
    phaseRules: {
      2: { block: 12, strength: 1, log: '铁幕展开。' },
      3: { heal: 10, strength: 2, log: '王火复燃。' }
    },
    ...overrides
  };
}

test('boss phase thresholds use 66 and 33 percent health', () => {
  assert.equal(BossPhaseSystem.phaseFor(boss({ hp: 100 })), 1);
  assert.equal(BossPhaseSystem.phaseFor(boss({ hp: 66 })), 2);
  assert.equal(BossPhaseSystem.phaseFor(boss({ hp: 33 })), 3);
});

test('phase transition uses the actual boss name and applies its rule once', () => {
  const enemy = boss();
  const battle = { log: [] };
  const events = BossPhaseSystem.applyTransition(battle, enemy, 2);

  assert.equal(enemy.lastPhase, 2);
  assert.equal(enemy.block, 12);
  assert.equal(enemy.status.strength, 1);
  assert.match(battle.log[0], /试炼首领/);
  assert.equal(events.some((event) => event.type === 'bossPhase'), true);
  assert.deepEqual(BossPhaseSystem.applyTransition(battle, enemy, 2), []);
});

test('phase healing cannot exceed maximum health', () => {
  const enemy = boss({ hp: 30, lastPhase: 2 });
  BossPhaseSystem.applyTransition({ log: [] }, enemy, 3);
  assert.equal(enemy.hp, 40);
  assert.equal(enemy.status.strength, 2);
});

test('a healing phase rule cannot move a boss back to an earlier action set', () => {
  const enemy = boss({ hp: 65, lastPhase: 2 });
  enemy.hp = 90;
  assert.equal(BossPhaseSystem.phaseFor(enemy), 2);
});
