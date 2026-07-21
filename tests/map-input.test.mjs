import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { MapInputController } from '../src/input/MapInputController.js';

const NODES = [
  { id: 'n1', x: 640, y: 652 },
  { id: 'n2', x: 914, y: 652 },
  { id: 'n3', x: 770, y: 550 },
  { id: 'n4', x: 770, y: 754 }
];

test('moves to the nearest node in the requested geometric direction', () => {
  const controller = new MapInputController(NODES, { selectedId: 'n1' });

  assert.equal(controller.move('right'), 'n2');
  assert.equal(controller.move('left'), 'n1');
  assert.equal(controller.move('up'), 'n3');
  assert.equal(controller.move('down'), 'n4');
});

test('confirm returns the selected node once and locks every later transition', () => {
  const confirmed = [];
  const controller = new MapInputController(NODES, {
    selectedId: 'n1',
    onConfirm: (id) => confirmed.push(id)
  });

  assert.equal(controller.move('right'), 'n2');
  assert.equal(controller.confirm(), 'n2');
  assert.equal(controller.confirm(), null);
  assert.equal(controller.move('left'), null);
  assert.deepEqual(confirmed, ['n2']);
});

test('a rejected confirmation releases the lock so a later transition can succeed once', () => {
  let attempts = 0;
  const confirmed = [];
  const controller = new MapInputController(NODES, {
    selectedId: 'n2',
    onConfirm: (id) => {
      attempts += 1;
      if (attempts === 1) return false;
      confirmed.push(id);
      return true;
    }
  });

  assert.equal(controller.confirm(), null);
  assert.equal(controller.locked, false);
  assert.equal(controller.confirm(), 'n2');
  assert.equal(controller.locked, true);
  assert.equal(controller.confirm(), null);
  assert.deepEqual(confirmed, ['n2']);
});

test('arrow and WASD keys navigate while enter and space share the transition lock', () => {
  const keyboard = new EventEmitter();
  const selected = [];
  const confirmed = [];
  const controller = new MapInputController(NODES, {
    selectedId: 'n1',
    onSelect: (id) => selected.push(id),
    onConfirm: (id) => confirmed.push(id)
  });
  let prevented = 0;

  controller.install(keyboard).install(keyboard);
  assert.equal(keyboard.listenerCount('keydown'), 1);
  keyboard.emit('keydown', { code: 'KeyD', preventDefault: () => { prevented += 1; } });
  keyboard.emit('keydown', { code: 'Space', preventDefault: () => { prevented += 1; } });
  keyboard.emit('keydown', { code: 'Enter', preventDefault: () => { prevented += 1; } });

  assert.deepEqual(selected, ['n2']);
  assert.deepEqual(confirmed, ['n2']);
  assert.equal(prevented, 2);
  controller.destroy();
  assert.equal(keyboard.listenerCount('keydown'), 0);
});

test('map scene creates a 100 by 100 pointer target only for selectable nodes', async () => {
  const source = await readFile(new URL('../src/scenes/MapScene.js', import.meta.url), 'utf8');

  assert.match(source, /if \(selectable\) \{[\s\S]*add\.zone\(pos\.x, pos\.y, 100, 100\)/);
  assert.doesNotMatch(source, /const hit = this\.add\.zone\(pos\.x, pos\.y, compact \? 68 : 88/);
  assert.match(source, /this\.transitionLocked/);
  assert.match(source, /new MapInputController/);
  assert.match(source, /return this\.selectNode\(view\.node\)/);
  assert.match(source, /this\.mapInput\?\.destroy\(\)/);
});

test('progression QA resets the run before all five n2 edge probes', async () => {
  const source = await readFile(new URL('../scripts/qa-progression-regression.mjs', import.meta.url), 'utf8');

  assert.match(source, /const NODE_HIT_PROBES = \[/);
  assert.match(source, /x: 0, y: -22/);
  assert.match(source, /x: 0, y: 22/);
  assert.match(source, /x: -22, y: 0/);
  assert.match(source, /x: 22, y: 0/);
  assert.match(source, /prepareN2Probe/);
  assert.match(source, /for \(const probe of NODE_HIT_PROBES\)/);
});
