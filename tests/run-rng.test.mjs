import test from 'node:test';
import assert from 'node:assert/strict';
import {
  choice,
  createRngState,
  nextFloat,
  pickMany,
  randomInt,
  shuffle
} from '../src/game/RunRng.js';
import { createNewRun } from '../src/game/GameState.js';

function sequence(seed, count = 8) {
  let state = createRngState(seed);
  const values = [];
  for (let index = 0; index < count; index += 1) {
    const next = nextFloat(state);
    values.push(next.value);
    state = next.state;
  }
  return { values, state };
}

test('same seed produces the same sequence and serializes cursor', () => {
  const first = sequence(20260710, 6);
  const second = sequence(20260710, 6);

  assert.deepEqual(first.values, second.values);
  assert.equal(first.state.cursor, 6);
  assert.deepEqual(first.state, second.state);
});

test('resuming from a serialized state continues the sequence', () => {
  const first = sequence(41, 3);
  const resumed = nextFloat(structuredClone(first.state));
  const uninterrupted = sequence(41, 4);

  assert.equal(resumed.value, uninterrupted.values[3]);
  assert.equal(resumed.state.cursor, 4);
});

test('helpers consume state without mutating the input state', () => {
  const initial = createRngState(99);
  const intResult = randomInt(initial, 3, 7);
  const choiceResult = choice(intResult.state, ['a', 'b', 'c']);
  const shuffleResult = shuffle(choiceResult.state, [1, 2, 3, 4]);
  const pickResult = pickMany(shuffleResult.state, ['x', 'y', 'z'], 2);

  assert.equal(initial.cursor, 0);
  assert.ok(intResult.value >= 3 && intResult.value <= 7);
  assert.ok(['a', 'b', 'c'].includes(choiceResult.value));
  assert.deepEqual([...shuffleResult.value].sort(), [1, 2, 3, 4]);
  assert.equal(pickResult.value.length, 2);
  assert.equal(pickResult.state.cursor, 7);
});

test('empty choices and invalid ranges are safe and deterministic', () => {
  const state = createRngState(5);
  const emptyChoice = choice(state, []);
  const emptyPick = pickMany(emptyChoice.state, [], 3);
  const fixedInt = randomInt(emptyPick.state, 9, 4);

  assert.equal(emptyChoice.value, null);
  assert.deepEqual(emptyPick.value, []);
  assert.equal(fixedInt.value, 9);
  assert.equal(fixedInt.state.cursor, 0);
});

test('new runs persist a versioned seed and random cursor', () => {
  const run = createNewRun('exiled-knight', { seed: 314159 });
  const replay = createNewRun('exiled-knight', { seed: 314159 });

  assert.equal(run.version, 3);
  assert.equal(run.seed, 314159);
  assert.ok(run.rngState.cursor > 0);
  assert.deepEqual(run.rngState, replay.rngState);
  assert.deepEqual(run.map.nodes, replay.map.nodes);
});
