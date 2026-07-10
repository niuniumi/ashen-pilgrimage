import assert from 'node:assert/strict';
import test from 'node:test';

import { createRngState } from '../src/game/RunRng.js';
import { EventSystem } from '../src/systems/EventSystem.js';

function run(characterId = 'exiled-knight', seed = 7) {
  return { act: 2, characterId, seed, rngState: createRngState(seed), eventHistory: [] };
}

test('story event selection is deterministic and respects act and character gates', () => {
  const first = run('candle-nun', 91);
  const second = run('candle-nun', 91);
  const eventA = EventSystem.randomEvent(first);
  const eventB = EventSystem.randomEvent(second);
  assert.equal(eventA.id, eventB.id);
  assert.equal(eventA.acts?.includes(2) ?? true, true);
  assert.equal(eventA.character ? eventA.character === 'candle-nun' : true, true);
});

test('story event history prevents an immediate repeat', () => {
  const state = run('ashblood-alchemist', 13);
  const first = EventSystem.randomEvent(state);
  const second = EventSystem.randomEvent(state);
  assert.notEqual(first.id, second.id);
});

test('story flag effects are recorded without duplicates', () => {
  const state = { storyFlags: [] };
  const notes = EventSystem.apply(state, { effects: [{ kind: 'storyFlag', value: 'kept-the-flame' }, { kind: 'storyFlag', value: 'kept-the-flame' }] });
  assert.deepEqual(state.storyFlags, ['kept-the-flame']);
  assert.equal(notes.length, 1);
});

