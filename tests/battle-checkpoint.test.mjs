import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clearBattleCheckpoint,
  createBattleCheckpoint,
  restoreBattleCheckpoint
} from '../src/game/BattleCheckpoint.js';
import { createRngState } from '../src/game/RunRng.js';

function fixture() {
  const run = {
    id: 'run-test',
    rngState: createRngState(77),
    map: { activeNode: 'n3' },
    settlements: []
  };
  const battle = {
    turn: 4,
    battleType: 'elite',
    player: { hp: 31, energy: 1, block: 7, status: {} },
    enemies: [
      { uid: 'enemy-1', id: 'plague-doctor', hp: 44, currentAction: { name: '黑药', intent: 'debuff' } }
    ],
    deck: {
      hand: [{ uid: 'card-1', cardId: 'knight-rend', upgraded: true }],
      drawPile: [],
      discardPile: [],
      exhaustPile: []
    }
  };
  return { run, battle };
}

test('battle checkpoint round-trips hand, energy, hp and intent', () => {
  const { run, battle } = fixture();
  const checkpoint = createBattleCheckpoint(run, battle, 'BattleScene');
  run.checkpoint = checkpoint;

  battle.deck.hand[0].cardId = 'mutated';
  const restored = restoreBattleCheckpoint(run);

  assert.equal(restored.sceneKey, 'BattleScene');
  assert.equal(restored.battle.deck.hand[0].cardId, 'knight-rend');
  assert.equal(restored.battle.player.energy, 1);
  assert.equal(restored.battle.enemies[0].currentAction.name, '黑药');
  assert.deepEqual(restored.rngState, createRngState(77));
});

test('invalid or mismatched checkpoints do not restore', () => {
  const { run } = fixture();
  run.checkpoint = { sceneKey: 'BattleScene', activeNode: 'other', battle: { turn: 1 } };

  assert.equal(restoreBattleCheckpoint(run), null);
});

test('clearing a checkpoint records settlement exactly once', () => {
  const { run, battle } = fixture();
  run.checkpoint = createBattleCheckpoint(run, battle, 'BattleScene');

  assert.equal(clearBattleCheckpoint(run, 'reward-n3'), true);
  assert.equal(clearBattleCheckpoint(run, 'reward-n3'), false);
  assert.equal(run.checkpoint, null);
  assert.deepEqual(run.settlements, ['reward-n3']);
});
