import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';

import { bindMenuInput } from '../src/input/MenuInputController.js';

function makeItems() {
  return [
    { label: '继续', disabled: true, button: { selected: false, setSelected(value) { this.selected = value; } } },
    { label: '开始', disabled: false, button: { selected: false, setSelected(value) { this.selected = value; } } },
    { label: '指南', disabled: false, button: { selected: false, setSelected(value) { this.selected = value; } } },
    { label: '离开', disabled: false, button: { selected: false, setSelected(value) { this.selected = value; } } }
  ];
}

test('navigation derives its index from the rendered selection before every key', () => {
  const keyboard = new EventEmitter();
  const items = makeItems();
  const binding = bindMenuInput(keyboard, items);

  binding.controller.selectedIndex = 1;
  items[1].button.selected = false;
  items[2].button.selected = true;
  keyboard.emit('keydown', { code: 'ArrowUp', preventDefault() {} });

  assert.equal(items.find((item) => item.button.selected)?.label, '开始');
  binding.cleanup();
});

test('cleanup is idempotent and rebinding leaves exactly one active handler', () => {
  const keyboard = new EventEmitter();
  const items = makeItems();
  const first = bindMenuInput(keyboard, items);
  first.cleanup();
  first.cleanup();
  const second = bindMenuInput(keyboard, items);

  assert.equal(keyboard.listenerCount('keydown'), 1);
  keyboard.emit('keydown', { code: 'ArrowDown', preventDefault() {} });
  assert.equal(items.find((item) => item.button.selected)?.label, '指南');
  second.cleanup();
  assert.equal(keyboard.listenerCount('keydown'), 0);
});
