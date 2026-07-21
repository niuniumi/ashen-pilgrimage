import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { createKeyboardEventGuard } from '../src/input/KeyboardEventGuard.js';

test('a consumer accepts each keyboard event object only once', () => {
  const acceptEvent = createKeyboardEventGuard();
  const event = { code: 'ArrowDown', timeStamp: 42 };

  assert.equal(acceptEvent(event), true);
  for (let replay = 0; replay < 100; replay += 1) {
    assert.equal(acceptEvent(event), false);
  }
});

test('distinct event objects remain independent even when their data matches', () => {
  const acceptEvent = createKeyboardEventGuard();
  const first = { code: 'ArrowDown', timeStamp: 42 };
  const second = { code: 'ArrowDown', timeStamp: 42 };

  assert.equal(acceptEvent(first), true);
  assert.equal(acceptEvent(second), true);
});

test('different consumers may independently accept the same event object', () => {
  const firstConsumer = createKeyboardEventGuard();
  const secondConsumer = createKeyboardEventGuard();
  const event = { code: 'Escape' };

  assert.equal(firstConsumer(event), true);
  assert.equal(secondConsumer(event), true);
});

test('every application-owned Phaser keyboard consumer installs an identity guard', async () => {
  const files = [
    '../src/input/MenuInputController.js',
    '../src/input/MapInputController.js',
    '../src/input/CharacterSelectInputController.js',
    '../src/input/BattleInputController.js',
    '../src/scenes/PrologueScene.js',
    '../src/scenes/RewardScene.js',
    '../src/scenes/EventScene.js',
    '../src/scenes/RestScene.js',
    '../src/ui/PauseMenu.js'
  ];

  for (const file of files) {
    const source = await readFile(new URL(file, import.meta.url), 'utf8');
    assert.match(source, /createKeyboardEventGuard/, file);
  }
});
