import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';

import { bindPauseMenuEscape } from '../src/input/PauseMenuInputBinding.js';

function createScene() {
  return {
    input: { keyboard: new EventEmitter() },
    events: new EventEmitter()
  };
}

test('cleanup removes the Escape and shutdown listeners and is idempotent', () => {
  const scene = createScene();
  let toggles = 0;
  const cleanup = bindPauseMenuEscape(scene, { toggle: () => { toggles += 1; } });
  const event = { code: 'Escape' };

  assert.equal(scene.input.keyboard.listenerCount('keydown-ESC'), 1);
  assert.equal(scene.events.listenerCount('shutdown'), 1);
  scene.input.keyboard.emit('keydown-ESC', event);
  scene.input.keyboard.emit('keydown-ESC', event);
  assert.equal(toggles, 1);

  cleanup();
  assert.equal(scene.input.keyboard.listenerCount('keydown-ESC'), 0);
  assert.equal(scene.events.listenerCount('shutdown'), 0);
  assert.doesNotThrow(() => cleanup());
  assert.equal(scene.input.keyboard.listenerCount('keydown-ESC'), 0);
});

test('reinstalling replaces the previous binding without stacking listeners', () => {
  const scene = createScene();
  let firstToggles = 0;
  let secondToggles = 0;
  const firstCleanup = bindPauseMenuEscape(scene, { toggle: () => { firstToggles += 1; } });
  const secondCleanup = bindPauseMenuEscape(scene, { toggle: () => { secondToggles += 1; } });

  assert.equal(scene.input.keyboard.listenerCount('keydown-ESC'), 1);
  assert.equal(scene.events.listenerCount('shutdown'), 1);
  scene.input.keyboard.emit('keydown-ESC', { code: 'Escape' });
  assert.equal(firstToggles, 0);
  assert.equal(secondToggles, 1);

  assert.doesNotThrow(() => firstCleanup());
  assert.equal(scene.input.keyboard.listenerCount('keydown-ESC'), 1);
  scene.events.emit('shutdown');
  assert.equal(scene.input.keyboard.listenerCount('keydown-ESC'), 0);
  assert.equal(scene.events.listenerCount('shutdown'), 0);
  assert.doesNotThrow(() => secondCleanup());
});
