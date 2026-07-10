import assert from 'node:assert/strict';
import test from 'node:test';

import { getEnemy } from '../src/data/enemies.js';
import { EnemyAI } from '../src/systems/EnemyAI.js';

test('charged boss attacks expose a warning turn before releasing damage', () => {
  const source = getEnemy('headless-grave-knight');
  const enemy = {
    ...source,
    hp: 40,
    maxHp: source.hp,
    lastPhase: 3,
    turnsTaken: 2,
    status: {}
  };

  const windup = EnemyAI.nextAction(enemy);
  assert.equal(windup.intent, 'special');
  assert.equal(windup.damage, undefined);
  assert.equal(windup.chargeWindup, true);
  assert.equal(enemy.pendingCharge.damage, 38);

  const release = EnemyAI.nextAction(enemy);
  assert.equal(release.intent, 'attack');
  assert.equal(release.damage, 38);
  assert.equal(release.chargedRelease, true);
  assert.equal(enemy.pendingCharge, null);
});
