import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isSettlementStage,
  isNodeStageCompatible,
  normalizeRunStage,
  prepareMainMenuExit,
  prepareMapExit
} from '../src/game/RunStagePolicy.js';

function activeRun(type = 'battle', stage = type) {
  return {
    pendingScene: stage,
    pendingBattleType: type,
    checkpoint: { sceneKey: 'BattleScene' },
    pendingReward: { gold: 20 },
    rewardClaimed: false,
    map: {
      activeNode: 'n1',
      nodes: [{ id: 'n1', type, row: 1 }],
      available: [],
      completed: [],
      path: ['n1']
    }
  };
}

test('settlement stages cannot be abandoned for the map', () => {
  for (const stage of ['reward', 'act-clear', 'result']) {
    assert.equal(isSettlementStage(stage), true);
    assert.equal(prepareMapExit({ pendingScene: stage }).ok, false);
  }
});

test('main-menu exit preserves the complete resumable checkpoint', () => {
  const run = activeRun('elite', 'battle');
  assert.deepEqual(prepareMainMenuExit(run), { ok: true, run });
});

test('normalization rolls incompatible node stages back to the map', () => {
  const run = activeRun('chest', 'shop');
  const normalized = normalizeRunStage(run);
  assert.equal(isNodeStageCompatible(run), false);
  assert.equal(normalized.pendingScene, null);
  assert.equal(normalized.pendingBattleType, undefined);
  assert.equal(normalized.checkpoint, null);
  assert.equal(normalized.pendingReward, undefined);
  assert.equal(normalized.map.activeNode, null);
  assert.deepEqual(normalized.map.available, ['n1']);
});
