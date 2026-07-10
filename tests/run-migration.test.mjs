import test from 'node:test';
import assert from 'node:assert/strict';
import { createRngState } from '../src/game/RunRng.js';
import { migrateRun } from '../src/game/RunMigration.js';

function legacyRun(overrides = {}) {
  return {
    version: 1,
    id: 'legacy-run',
    characterId: 'exiled-knight',
    characterName: '流亡骑士',
    maxHp: 82,
    hp: 65,
    baseEnergy: 3,
    gold: 60,
    deck: [{ uid: 'legacy-card', cardId: 'knight-cleave', upgraded: false }],
    relics: [],
    runStrength: 0,
    act: 1,
    floor: 1,
    startTime: 123456,
    map: {
      act: 1,
      nodes: [
        { id: 'n0', row: 0, type: 'battle', links: ['n1'] },
        { id: 'n1', row: 1, type: 'event', links: [] }
      ],
      completed: [],
      available: ['n0'],
      activeNode: 'n0',
      path: ['n0']
    },
    ...overrides
  };
}

test('migrates v1 run and rolls back an orphaned active node', () => {
  const migrated = migrateRun(legacyRun());

  assert.equal(migrated.version, 2);
  assert.equal(migrated.map.activeNode, null);
  assert.deepEqual(migrated.map.available, ['n0']);
  assert.deepEqual(migrated.map.path, []);
  assert.equal(migrated.floor, 0);
  assert.deepEqual(migrated.rngState, createRngState(migrated.seed));
});

test('keeps a valid v2 checkpoint active for scene resume', () => {
  const checkpoint = {
    id: 'checkpoint-v2',
    sceneKey: 'BattleScene',
    activeNode: 'n0',
    rngState: createRngState(7),
    battle: {
      turn: 2,
      player: { hp: 61, energy: 2 },
      enemies: [{ id: 'rotting-villager', hp: 10 }],
      deck: { hand: [], drawPile: [], discardPile: [], exhaustPile: [] }
    },
    savedAt: 9
  };
  const migrated = migrateRun(
    legacyRun({ version: 2, seed: 7, rngState: createRngState(7), checkpoint })
  );

  assert.equal(migrated.map.activeNode, 'n0');
  assert.equal(migrated.checkpoint.id, 'checkpoint-v2');
});

test('rejects values that cannot represent a playable run', () => {
  assert.equal(migrateRun(null), null);
  assert.equal(migrateRun({ characterId: 'missing', deck: [] }), null);
});
