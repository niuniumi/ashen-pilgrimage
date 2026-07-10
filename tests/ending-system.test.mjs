import assert from 'node:assert/strict';
import test from 'node:test';

import { EndingSystem } from '../src/systems/EndingSystem.js';

test('each hero resolves to a character-specific victory ending', () => {
  const knight = EndingSystem.resolve({ characterId: 'exiled-knight', storyFlags: ['knight-mercy'], vows: [] }, true);
  const nun = EndingSystem.resolve({ characterId: 'candle-nun', storyFlags: ['nun-release'], vows: [] }, true);
  const alchemist = EndingSystem.resolve({ characterId: 'ashblood-alchemist', storyFlags: ['alc-cure'], vows: [] }, true);
  assert.equal(knight.id, 'knight-free-blade');
  assert.equal(nun.id, 'nun-last-candle');
  assert.equal(alchemist.id, 'alchemist-remedy');
});

test('unresolved choices lead to the darker character endings', () => {
  assert.equal(EndingSystem.resolve({ characterId: 'exiled-knight' }, true).id, 'knight-iron-throne');
  assert.equal(EndingSystem.resolve({ characterId: 'candle-nun' }, true).id, 'nun-white-abbess');
  assert.equal(EndingSystem.resolve({ characterId: 'ashblood-alchemist' }, true).id, 'alchemist-phoenix');
});

test('defeat ending remains character aware', () => {
  const ending = EndingSystem.resolve({ characterId: 'candle-nun', act: 3 }, false);
  assert.equal(ending.victory, false);
  assert.match(ending.body, /烛/);
});
