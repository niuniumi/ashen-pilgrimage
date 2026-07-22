import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { CharacterSelectInputController } from '../src/input/CharacterSelectInputController.js';

const IDS = ['exiled-knight', 'candle-nun', 'ashblood-alchemist'];

function createController(options = {}) {
  const calls = [];
  const controller = new CharacterSelectInputController(IDS, {
    selectedId: IDS[0],
    onSelect: (id, index) => calls.push(['select', id, index]),
    onConfirm: (id) => calls.push(['confirm', id, controller.locked]),
    onBack: () => calls.push(['back', controller.locked]),
    ...options
  });
  return { calls, controller };
}

test('left/right and A/D cycle the current character with wraparound', () => {
  const { calls, controller } = createController();

  assert.equal(controller.handleKey('ArrowLeft'), true);
  assert.equal(controller.selectedId, IDS[2]);
  assert.equal(controller.handleKey('KeyD'), true);
  assert.equal(controller.selectedId, IDS[0]);
  assert.equal(controller.handleKey('d'), true);
  assert.equal(controller.selectedId, IDS[1]);
  assert.equal(controller.handleKey('A'), true);
  assert.equal(controller.selectedId, IDS[0]);
  assert.deepEqual(calls, [
    ['select', IDS[2], 2],
    ['select', IDS[0], 0],
    ['select', IDS[1], 1],
    ['select', IDS[0], 0]
  ]);
});

test('number keys 1-3 directly select the matching character', () => {
  const { calls, controller } = createController();

  assert.equal(controller.handleKey('Digit3'), true);
  assert.equal(controller.handleKey('Numpad2'), true);
  assert.equal(controller.handleKey('1'), true);
  assert.equal(controller.handleKey('Digit4'), false);
  assert.equal(controller.selectedId, IDS[0]);
  assert.deepEqual(calls, [
    ['select', IDS[2], 2],
    ['select', IDS[1], 1],
    ['select', IDS[0], 0]
  ]);
});

test('enter and space confirm once and lock before invoking the callback', () => {
  for (const code of ['Enter', 'NumpadEnter', 'Space', ' ']) {
    const { calls, controller } = createController();

    assert.equal(controller.handleKey(code), true);
    assert.equal(controller.locked, true);
    assert.equal(controller.handleKey('Enter'), false);
    assert.equal(controller.handleKey('ArrowRight'), false);
    assert.deepEqual(calls, [['confirm', IDS[0], true]]);
  }
});

test('escape returns once and shares the same transition lock', () => {
  const { calls, controller } = createController();

  assert.equal(controller.handleKey('Escape'), true);
  assert.equal(controller.locked, true);
  assert.equal(controller.handleKey('Escape'), false);
  assert.equal(controller.handleKey('Space'), false);
  assert.deepEqual(calls, [['back', true]]);
});

test('setSelected keeps pointer selection and keyboard navigation in sync', () => {
  const { calls, controller } = createController();

  assert.equal(controller.setSelected(IDS[2]), true);
  assert.equal(controller.setSelected('unknown'), false);
  assert.equal(controller.handleKey('ArrowRight'), true);
  assert.equal(controller.selectedId, IDS[0]);
  assert.deepEqual(calls, [
    ['select', IDS[2], 2],
    ['select', IDS[0], 0]
  ]);
});

test('install consumes handled keys and destroy removes the listener idempotently', () => {
  const keyboard = new EventEmitter();
  const { calls, controller } = createController();
  let prevented = 0;

  controller.install(keyboard).install(keyboard);
  assert.equal(keyboard.listenerCount('keydown'), 1);

  keyboard.emit('keydown', { code: 'Digit2', preventDefault: () => { prevented += 1; } });
  keyboard.emit('keydown', { code: 'Tab', preventDefault: () => { prevented += 1; } });
  assert.equal(prevented, 1);
  assert.deepEqual(calls, [['select', IDS[1], 1]]);

  assert.equal(controller.destroy(), true);
  assert.equal(controller.destroy(), false);
  assert.equal(keyboard.listenerCount('keydown'), 0);
  keyboard.emit('keydown', { code: 'Digit3', preventDefault: () => { prevented += 1; } });
  assert.equal(controller.handleKey('Digit3'), false);
  assert.equal(calls.length, 1);
});

test('Phaser queue replays cannot cycle characters twice for one DOM event object', () => {
  const keyboard = new EventEmitter();
  const { calls, controller } = createController();
  const event = { code: 'ArrowRight', preventDefault() {} };
  controller.install(keyboard);

  keyboard.emit('keydown', event);
  keyboard.emit('keydown', event);

  assert.equal(controller.selectedId, IDS[1]);
  assert.deepEqual(calls, [['select', IDS[1], 1]]);
  controller.destroy();
});

test('character select scene installs the controller and routes pointer and keyboard transitions through one lock', async () => {
  const source = await readFile(new URL('../src/scenes/CharacterSelectScene.js', import.meta.url), 'utf8');

  assert.match(source, /new CharacterSelectInputController/);
  assert.match(source, /controller\.install\(this\.input\.keyboard\)/);
  assert.match(source, /this\.characterInput\?\.destroy\(\)/);
  assert.match(source, /!this\.characterInput\.locked && !this\.characterInput\.lock\(\)/);
  assert.match(source, /this\.runStarting = false/);
  assert.match(source, /this\.characterInput = null/);
  assert.match(source, /container\.setY\(target\.y\)\.setAlpha\(1\)\.setScale\(1\)/);
  assert.match(source, /targets: container,[\s\S]*?y: target\.y,[\s\S]*?alpha: 1,/);
});
