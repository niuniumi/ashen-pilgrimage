import test from 'node:test';
import assert from 'node:assert/strict';
import { getRunResumeTarget } from '../src/game/RunResume.js';

test('resumes a settled battle at the pending reward instead of a locked map', () => {
  const run = {
    map: { activeNode: 'n4' },
    checkpoint: null,
    pendingReward: { gold: 24, cards: [], relic: null },
    rewardClaimed: false
  };

  assert.deepEqual(getRunResumeTarget(run), { sceneKey: 'RewardScene', data: {} });
});

test('battle checkpoints take priority over other resume state', () => {
  const battle = { turn: 3, player: {}, deck: { hand: [] }, enemies: [] };
  const run = {
    map: { activeNode: 'n4' },
    checkpoint: { sceneKey: 'BattleScene', activeNode: 'n4', battle },
    pendingReward: { gold: 24, cards: [], relic: null },
    rewardClaimed: false
  };

  assert.deepEqual(getRunResumeTarget(run), { sceneKey: 'BattleScene', data: { restoredBattle: battle } });
});

test('ordinary runs resume at the map', () => {
  assert.deepEqual(getRunResumeTarget({ map: { activeNode: null } }), { sceneKey: 'MapScene', data: {} });
});

test('explicit run stages survive refresh and resume at their owning scene', () => {
  assert.deepEqual(getRunResumeTarget({ pendingScene: 'vow' }), { sceneKey: 'VowScene', data: {} });
  assert.deepEqual(getRunResumeTarget({ pendingScene: 'act-clear' }), { sceneKey: 'ActClearScene', data: {} });
  assert.deepEqual(getRunResumeTarget({ pendingScene: 'result', resultVictory: true }), {
    sceneKey: 'ResultScene',
    data: { victory: true }
  });
  assert.deepEqual(getRunResumeTarget({ pendingScene: 'shop', map: { activeNode: 'n3' } }), { sceneKey: 'ShopScene', data: {} });
});

test('battle checkpoint remains authoritative while a battle stage is pending', () => {
  const battle = { turn: 2, player: {}, deck: { hand: [] }, enemies: [] };
  const run = {
    pendingScene: 'battle',
    pendingBattleType: 'elite',
    map: { activeNode: 'n7' },
    checkpoint: { sceneKey: 'BattleScene', activeNode: 'n7', battle }
  };
  assert.deepEqual(getRunResumeTarget(run), {
    sceneKey: 'BattleScene',
    data: { restoredBattle: battle, battleType: 'elite' }
  });
});

test('legacy boss checkpoints without battleType resume as boss battles', () => {
  const battle = { turn: 4, player: {}, deck: { hand: [] }, enemies: [] };
  const run = {
    pendingScene: 'battle',
    pendingBattleType: 'boss',
    map: {
      activeNode: 'n11',
      nodes: [{ id: 'n11', type: 'boss' }]
    },
    checkpoint: { sceneKey: 'BattleScene', activeNode: 'n11', battle }
  };

  assert.deepEqual(getRunResumeTarget(run), {
    sceneKey: 'BattleScene',
    data: { restoredBattle: battle, battleType: 'boss' }
  });
});

test('boss node identity recovers the battle type when legacy stage metadata is missing', () => {
  const battle = { turn: 4, player: {}, deck: { hand: [] }, enemies: [] };
  const run = {
    map: {
      activeNode: 'n11',
      nodes: [{ id: 'n11', type: 'boss' }]
    },
    checkpoint: { sceneKey: 'BattleScene', activeNode: 'n11', battle }
  };

  assert.deepEqual(getRunResumeTarget(run), {
    sceneKey: 'BattleScene',
    data: { restoredBattle: battle, battleType: 'boss' }
  });
});
