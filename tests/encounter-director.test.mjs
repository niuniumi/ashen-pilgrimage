import assert from 'node:assert/strict';
import test from 'node:test';

import { createRngState } from '../src/game/RunRng.js';
import { EncounterDirector } from '../src/systems/EncounterDirector.js';

function run(seed = 77) {
  return { act: 1, floor: 4, rngState: createRngState(seed), encounterHistory: [] };
}

test('encounter selection is reproducible and advances the run cursor', () => {
  const first = run(90210);
  const second = run(90210);
  const firstIds = EncounterDirector.chooseEnemyIds(first, 'battle');
  const secondIds = EncounterDirector.chooseEnemyIds(second, 'battle');

  assert.deepEqual(firstIds, secondIds);
  assert.equal(first.rngState.cursor, 1);
  assert.deepEqual(first.encounterHistory, second.encounterHistory);
});

test('director avoids immediately repeating a normal encounter when alternatives exist', () => {
  const state = run(42);
  const first = EncounterDirector.chooseEnemyIds(state, 'battle');
  const second = EncounterDirector.chooseEnemyIds(state, 'battle');
  assert.notDeepEqual(second, first);
});

test('enemy roles are derived from their combat behavior', () => {
  assert.equal(EncounterDirector.roleFor({ type: 'boss', actions: [] }), 'boss');
  assert.equal(EncounterDirector.roleFor({ type: 'normal', actions: [{ summon: 'x' }] }), 'summoner');
  assert.equal(EncounterDirector.roleFor({ type: 'normal', actions: [{ heal: 5 }] }), 'sustain');
  assert.equal(EncounterDirector.roleFor({ type: 'normal', actions: [{ targetStatus: 'weak' }] }), 'controller');
  assert.equal(EncounterDirector.roleFor({ type: 'normal', actions: [{ damage: 3, times: 3 }] }), 'skirmisher');
});

