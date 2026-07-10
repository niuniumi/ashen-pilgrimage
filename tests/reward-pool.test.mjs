import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getProductionRelics,
  getRelic,
  isLegacyRelic,
  relics
} from '../src/data/relics.js';
import { RewardSystem } from '../src/systems/RewardSystem.js';

test('legacy relics remain readable but are excluded from production content', () => {
  const legacy = getRelic('ash-splinter');
  const production = getProductionRelics();

  assert.equal(isLegacyRelic(legacy), true);
  assert.equal(production.length, 24);
  assert.equal(production.some(isLegacyRelic), false);
  assert.equal(relics.length, 33);
});

test('reward candidates never return a legacy relic', () => {
  const originalRandom = Math.random;
  Math.random = () => 0.999999;
  try {
    const candidate = RewardSystem.randomRelicCandidate({ relics: [] });
    assert.ok(candidate);
    assert.equal(isLegacyRelic(candidate), false);
  } finally {
    Math.random = originalRandom;
  }
});

test('event random relic acquisition uses the production pool', () => {
  const originalRandom = Math.random;
  Math.random = () => 0.999999;
  try {
    const run = { hp: 40, maxHp: 80, relics: [] };
    const relic = RewardSystem.randomRelicCandidate(run);
    assert.equal(getProductionRelics().some((entry) => entry.id === relic.id), true);
  } finally {
    Math.random = originalRandom;
  }
});
