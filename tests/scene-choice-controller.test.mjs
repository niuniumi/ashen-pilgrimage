import assert from 'node:assert/strict';
import test from 'node:test';

import { SceneChoiceController } from '../src/ui/SceneChoiceController.js';

test('choice confirmation locks duplicate input before settlement feedback', () => {
  const controller = new SceneChoiceController(['rest', 'upgrade']);
  controller.select('rest');

  let settlements = 0;
  const settle = () => {
    const selected = controller.confirm();
    if (selected === null) return;
    assert.equal(controller.locked, true, 'the scene must be locked before settlement starts');
    settlements += 1;
  };

  settle();
  settle();

  assert.equal(settlements, 1);
  assert.equal(controller.confirmedId, 'rest');
});

test('an explicit command shares the same exactly-once lock', () => {
  const controller = new SceneChoiceController(['reward-a']);
  let skips = 0;
  const skip = () => {
    if (!controller.lock()) return;
    skips += 1;
  };

  skip();
  skip();

  assert.equal(skips, 1);
  assert.equal(controller.locked, true);
});

test('selection only accepts enabled ids and notifies stable state subscribers', () => {
  const controller = new SceneChoiceController(['a', 'b', 'c'], { enabledIds: ['a', 'c'] });
  const states = [];
  const unsubscribe = controller.subscribe((state) => states.push(state));

  assert.equal(controller.select('b'), false);
  assert.equal(controller.selectedId, null);
  assert.equal(controller.select('c'), true);
  assert.equal(controller.selectedId, 'c');
  assert.deepEqual(states.at(-1), {
    enabledIds: ['a', 'c'],
    selectedId: 'c',
    confirmedId: null,
    locked: false,
    destroyed: false
  });

  unsubscribe();
  controller.clear();
  assert.equal(states.length, 1);
});

test('next and previous navigation wraps deterministically across enabled ids', () => {
  const controller = new SceneChoiceController(['a', 'b', 'c', 'd'], { enabledIds: ['a', 'c'] });

  assert.equal(controller.next(), 'a');
  assert.equal(controller.next(), 'c');
  assert.equal(controller.next(), 'a');
  assert.equal(controller.previous(), 'c');
});

test('keyboard navigation confirms with enter and clears with escape while unlocked', () => {
  const controller = new SceneChoiceController(['a', 'b']);

  assert.equal(controller.handleKey('ArrowRight'), true);
  assert.equal(controller.selectedId, 'a');
  assert.equal(controller.handleKey('Escape'), true);
  assert.equal(controller.selectedId, null);
  controller.handleKey('ArrowLeft');
  assert.equal(controller.selectedId, 'b');
  assert.equal(controller.handleKey('Enter'), true);
  assert.equal(controller.confirmedId, 'b');
  assert.equal(controller.handleKey('Escape'), false);
  assert.equal(controller.selectedId, 'b');
});

test('destroy is idempotent and prevents later selection or notifications', () => {
  const controller = new SceneChoiceController(['a']);
  let notifications = 0;
  controller.subscribe(() => { notifications += 1; });

  assert.equal(controller.destroy(), true);
  assert.equal(controller.destroy(), false);
  assert.equal(controller.select('a'), false);
  assert.equal(controller.next(), null);
  assert.equal(controller.confirm(), null);
  assert.equal(notifications, 0);
  assert.equal(controller.destroyed, true);
});
