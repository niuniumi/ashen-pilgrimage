import assert from 'node:assert/strict';
import test from 'node:test';

import { QABridge } from '../src/game/QABridge.js';

function fakeGame() {
  const values = new Map();
  const starts = [];
  return {
    starts,
    registry: {
      get: (key) => values.get(key),
      set: (key, value) => values.set(key, value)
    },
    scene: {
      getScenes: () => [{ scene: { key: 'MainMenuScene' } }],
      stop: () => {},
      start: (key, data) => starts.push({ key, data })
    }
  };
}

test('QA bridge can create a deterministic run and skip directly to the map', () => {
  const game = fakeGame();
  const bridge = new QABridge(game, { saveRun: () => {} });
  const summary = bridge.startRun('candle-nun', { seed: 55, skipVow: true });
  assert.equal(summary.characterId, 'candle-nun');
  assert.equal(summary.vows.length, 1);
  assert.equal(game.starts.at(-1).key, 'MapScene');
});

test('QA bridge enters the first route node without canvas coordinates', () => {
  const game = fakeGame();
  const bridge = new QABridge(game, { saveRun: () => {} });
  bridge.startRun('exiled-knight', { seed: 2, skipVow: true });
  const result = bridge.enterNode();
  assert.equal(result.nodeType, 'battle');
  assert.equal(game.starts.at(-1).key, 'BattleScene');
});

test('snapshot exposes stable scene and run diagnostics', () => {
  const game = fakeGame();
  const bridge = new QABridge(game, { saveRun: () => {} });
  bridge.startRun('ashblood-alchemist', { seed: 12, skipVow: false });
  const snapshot = bridge.snapshot();
  assert.equal(snapshot.scene, 'MainMenuScene');
  assert.equal(snapshot.run.characterId, 'ashblood-alchemist');
  assert.equal(snapshot.run.seed, 12);
});
