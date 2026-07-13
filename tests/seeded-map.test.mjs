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

test('abandoning an active node clears resumable state and restores map selection', () => {
  const map = MapSystem.createSeededMap(1, createRngState(712)).map;
  const nodeId = map.available[0];
  const run = {
    act: 1,
    floor: 0,
    highestFloor: 0,
    map,
    pendingScene: 'battle',
    pendingBattleType: 'elite',
    pendingReward: { cards: ['ash-strike'] },
    checkpoint: { sceneKey: 'BattleScene', activeNode: nodeId },
    rewardClaimed: true
  };

  assert.ok(MapSystem.startNode(run, nodeId));
  assert.equal(MapSystem.canSelect(run, nodeId), false);

  const abandoned = MapSystem.abandonActiveNode(run);

  assert.equal(abandoned?.id, nodeId);
  assert.equal(run.map.activeNode, null);
  assert.equal(run.map.path.includes(nodeId), false);
  assert.equal(run.map.available.includes(nodeId), true);
  assert.equal(MapSystem.canSelect(run, nodeId), true);
  assert.equal(run.floor, 0);
  assert.equal(run.checkpoint, null);
  assert.equal(run.pendingScene, undefined);
  assert.equal(run.pendingBattleType, undefined);
  assert.equal(run.pendingReward, undefined);
  assert.equal(run.rewardClaimed, false);
});
