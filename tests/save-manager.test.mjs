import test from 'node:test';
import assert from 'node:assert/strict';
import { SAVE_KEY } from '../src/game/constants.js';
import { SaveManager } from '../src/game/SaveManager.js';

function installStorage() {
  const values = new Map();
  globalThis.window = {
    localStorage: {
      getItem(key) {
        return values.has(key) ? values.get(key) : null;
      },
      setItem(key, value) {
        values.set(key, String(value));
      },
      removeItem(key) {
        values.delete(key);
      }
    }
  };
  return values;
}

function v1Run() {
  return {
    version: 1,
    id: 'saved-v1',
    characterId: 'exiled-knight',
    maxHp: 82,
    hp: 80,
    baseEnergy: 3,
    deck: [{ uid: 'saved-card', cardId: 'knight-cleave', upgraded: false }],
    relics: [],
    startTime: 200,
    map: {
      act: 1,
      nodes: [{ id: 'n0', row: 0, type: 'battle', links: [] }],
      completed: [],
      available: ['n0'],
      activeNode: 'n0',
      path: ['n0']
    }
  };
}

test('loadRun migrates valid old saves and persists the repaired v2 value', () => {
  const storage = installStorage();
  storage.set(SAVE_KEY, JSON.stringify(v1Run()));

  const loaded = SaveManager.loadRun();
  const persisted = JSON.parse(storage.get(SAVE_KEY));

  assert.equal(loaded.version, 2);
  assert.equal(loaded.map.activeNode, null);
  assert.equal(persisted.version, 2);
  assert.ok(persisted.rngState);
});
