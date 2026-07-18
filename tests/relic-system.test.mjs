import test from 'node:test';
import assert from 'node:assert/strict';
import { RelicSystem } from '../src/systems/RelicSystem.js';

test('addById rejects an unknown relic before it can enter live run state', () => {
  const run = { hp: 40, maxHp: 80, relics: [] };

  assert.equal(RelicSystem.addById(run, 'unknown-relic'), null);
  assert.deepEqual(run.relics, []);
});

test('relic value ignores an unknown in-memory relic id', () => {
  const run = { relics: ['unknown-relic'] };

  assert.doesNotThrow(() => RelicSystem.value(run, 'rewardGold'));
  assert.equal(RelicSystem.value(run, 'rewardGold'), 0);
});
