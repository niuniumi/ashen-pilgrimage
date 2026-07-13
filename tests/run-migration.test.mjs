import test from 'node:test';
import assert from 'node:assert/strict';
import { createRngState } from '../src/game/RunRng.js';
import { migrateRun } from '../src/game/RunMigration.js';
import { MapSystem } from '../src/systems/MapSystem.js';

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

  assert.equal(migrated.version, 4);
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

test('rebuilds an incompatible legacy map without losing run progress', () => {
  const nodes = Array.from({ length: 7 }, (_, row) => ({
    id: `old-${row}`,
    row,
    column: 0,
    x: 1080 + row * 12,
    type: row === 6 ? 'boss' : 'battle',
    links: row < 6 ? [`old-${row + 1}`] : []
  }));
  const completed = nodes.slice(0, 6).map((node) => node.id);
  const run = legacyRun({
    version: 2,
    characterId: 'ashblood-alchemist',
    characterName: '灰血炼金师',
    maxHp: 76,
    hp: 42,
    gold: 202,
    floor: 6,
    relics: ['black-iron-mask', 'rusty-nail'],
    deck: [{ uid: 'legacy-alchemist-card', cardId: 'alc-acid-vial', upgraded: true }],
    map: {
      act: 1,
      nodes,
      completed,
      available: ['old-6'],
      activeNode: null,
      path: completed
    }
  });

  const migrated = migrateRun(run);
  const maxRow = Math.max(...migrated.map.nodes.map((node) => node.row));
  const completedRows = migrated.map.completed.map((id) => migrated.map.nodes.find((node) => node.id === id)?.row);
  const availableRows = migrated.map.available.map((id) => migrated.map.nodes.find((node) => node.id === id)?.row);

  assert.equal(migrated.version, 4);
  assert.equal(maxRow, 11);
  assert.ok(migrated.map.nodes.every((node) => node.x >= 300 && node.x <= 850));
  assert.deepEqual(completedRows, [0, 1, 2, 3, 4, 5]);
  assert.ok(availableRows.length > 0);
  assert.ok(availableRows.every((row) => row === 6));
  assert.equal(migrated.floor, 6);
  assert.equal(migrated.characterId, 'ashblood-alchemist');
  assert.equal(migrated.hp, 42);
  assert.equal(migrated.gold, 202);
  assert.deepEqual(migrated.relics, ['black-iron-mask', 'rusty-nail']);
  assert.deepEqual(migrated.deck, run.deck);
});

test('repairs current-shaped maps whose progress points at missing nodes', () => {
  const map = MapSystem.createSeededMap(1, createRngState(88)).map;
  map.available = ['missing-node'];
  const migrated = migrateRun(legacyRun({
    version: 3,
    seed: 88,
    rngState: createRngState(88),
    floor: 3,
    map
  }));
  const ids = new Set(migrated.map.nodes.map((node) => node.id));

  assert.ok(migrated.map.available.length > 0);
  assert.ok(migrated.map.available.every((id) => ids.has(id)));
  assert.ok(migrated.map.available.every((id) => migrated.map.nodes.find((node) => node.id === id).row === 3));
});

test('rebuilds a missing map instead of deleting an otherwise playable run', () => {
  const migrated = migrateRun(legacyRun({
    version: 2,
    floor: 4,
    gold: 144,
    map: null
  }));

  assert.ok(migrated);
  assert.equal(migrated.version, 4);
  assert.equal(migrated.gold, 144);
  assert.equal(migrated.floor, 4);
  assert.equal(Math.max(...migrated.map.nodes.map((node) => node.row)), 11);
  assert.ok(migrated.map.available.every((id) => migrated.map.nodes.find((node) => node.id === id).row === 4));
});

test('preserves a pending reward checkpoint instead of rolling back its active node', () => {
  const map = MapSystem.createSeededMap(1, createRngState(91)).map;
  map.activeNode = 'n0';
  map.path = ['n0'];
  const pendingReward = { gold: 27, cards: [], relic: null, relicPending: false };
  const migrated = migrateRun(legacyRun({
    version: 3,
    seed: 91,
    rngState: createRngState(91),
    floor: 1,
    map,
    checkpoint: null,
    pendingReward,
    rewardClaimed: false
  }));

  assert.equal(migrated.map.activeNode, 'n0');
  assert.deepEqual(migrated.pendingReward, pendingReward);
  assert.equal(migrated.rewardClaimed, false);
});

test('preserves explicit non-battle stages instead of rolling back the active node', () => {
  const map = MapSystem.createSeededMap(1, createRngState(94)).map;
  map.activeNode = 'n0';
  map.path = ['n0'];
  const migrated = migrateRun(legacyRun({
    version: 4,
    seed: 94,
    rngState: createRngState(94),
    map,
    pendingScene: 'shop'
  }));

  assert.equal(migrated.pendingScene, 'shop');
  assert.equal(migrated.map.activeNode, 'n0');
  assert.deepEqual(migrated.map.path, ['n0']);
});

test('infers act clear for a legacy save with a completed boss and no available nodes', () => {
  const map = MapSystem.createSeededMap(1, createRngState(95)).map;
  const boss = map.nodes.find((node) => node.type === 'boss');
  map.completed = [boss.id];
  map.path = [boss.id];
  map.available = [];
  map.activeNode = null;
  const migrated = migrateRun(legacyRun({ version: 3, seed: 95, rngState: createRngState(95), map }));

  assert.equal(migrated.pendingScene, 'act-clear');
});
