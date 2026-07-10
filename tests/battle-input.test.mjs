import assert from 'node:assert/strict';
import test from 'node:test';

import { BattleInputController } from '../src/input/BattleInputController.js';

function fakeScene() {
  const calls = [];
  return {
    calls,
    uiPaused: false,
    inputLocked: false,
    selectedUid: null,
    keyboardTargetIndex: null,
    battle: {
      ended: false,
      deck: { hand: [{ uid: 'a' }, { uid: 'b' }, { uid: 'c' }] },
      enemies: [{ hp: 10 }, { hp: 0 }, { hp: 12 }]
    },
    selectCard(uid) {
      calls.push(['select', uid]);
      this.selectedUid = uid;
    },
    tryUseSelectedOnEnemy(index) {
      calls.push(['confirm', index]);
    },
    endTurn() {
      calls.push(['end']);
    },
    cancelCardSelection() {
      calls.push(['cancel']);
      this.selectedUid = null;
    },
    renderBattle() {},
    setPrompt() {}
  };
}

test('number keys select the matching hand card', () => {
  const scene = fakeScene();
  const input = new BattleInputController(scene);
  input.handleKey('Digit2');
  assert.deepEqual(scene.calls, [['select', 'b']]);
});

test('target cycling skips defeated enemies and enter confirms', () => {
  const scene = fakeScene();
  scene.selectedUid = 'a';
  scene.keyboardTargetIndex = 0;
  const input = new BattleInputController(scene);
  input.handleKey('ArrowRight');
  assert.equal(scene.keyboardTargetIndex, 2);
  input.handleKey('Enter');
  assert.deepEqual(scene.calls.at(-1), ['confirm', 2]);
});

test('end turn and cancel commands respect locked input', () => {
  const scene = fakeScene();
  scene.selectedUid = 'a';
  const input = new BattleInputController(scene);
  input.handleKey('Escape');
  input.handleKey('KeyE');
  assert.deepEqual(scene.calls, [['cancel'], ['end']]);
  scene.inputLocked = true;
  input.handleKey('KeyE');
  assert.equal(scene.calls.length, 2);
});
