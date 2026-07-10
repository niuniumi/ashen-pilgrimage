import assert from 'node:assert/strict';
import test from 'node:test';

import { createRngState } from '../src/game/RunRng.js';
import { MapSystem } from '../src/systems/MapSystem.js';

test('seeded maps are reproducible twelve-row chapters', () => {
  const first = MapSystem.createSeededMap(1, createRngState(444));
  const second = MapSystem.createSeededMap(1, createRngState(444));

  assert.deepEqual(first, second);
  assert.equal(Math.max(...first.map.nodes.map((node) => node.row)), 11);
  assert.equal(first.map.nodes.filter((node) => node.row === 11)[0].type, 'boss');
  assert.ok(first.state.cursor > 0);
});

test('map links stay readable and every later node is reachable', () => {
  const { map } = MapSystem.createSeededMap(2, createRngState(915));
  const incoming = new Map(map.nodes.map((node) => [node.id, 0]));
  for (const node of map.nodes) {
    assert.ok(node.links.length <= 2);
    for (const target of node.links) incoming.set(target, incoming.get(target) + 1);
  }
  for (const node of map.nodes.filter((item) => item.row > 0)) {
    assert.ok(incoming.get(node.id) > 0, `${node.id} should be reachable`);
  }
});

test('different seeds vary node placement without breaking required pacing', () => {
  const first = MapSystem.createSeededMap(3, createRngState(1)).map;
  const second = MapSystem.createSeededMap(3, createRngState(2)).map;
  assert.notDeepEqual(first.nodes.map((node) => node.type), second.nodes.map((node) => node.type));
  for (const map of [first, second]) {
    const types = new Set(map.nodes.map((node) => node.type));
    assert.equal(types.has('shop'), true);
    assert.equal(types.has('rest'), true);
    assert.equal(types.has('elite'), true);
  }
});
