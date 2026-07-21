import assert from 'node:assert/strict';
import test from 'node:test';

import { SceneTransition } from '../src/ui/SceneTransition.js';

function installSettings(animation) {
  globalThis.window = {
    matchMedia: () => ({ matches: false }),
    localStorage: {
      getItem: () => JSON.stringify({ animation }),
      setItem() {},
      removeItem() {}
    }
  };
}

function createScene() {
  const calls = { fades: [], delays: [], starts: [] };
  const scene = {
    transitioning: false,
    input: { enabled: true },
    cameras: {
      main: {
        fadeOut(...args) {
          calls.fades.push(args);
        }
      }
    },
    time: {
      delayedCall(delay, callback) {
        calls.delays.push(delay);
        callback();
      }
    },
    scene: {
      start(...args) {
        calls.starts.push(args);
      }
    }
  };
  return { scene, calls };
}

test('SceneTransition completes immediately without a camera fade when motion is reduced', () => {
  installSettings(false);
  const { scene, calls } = createScene();
  const data = { battleType: 'boss' };

  SceneTransition.fadeTo(scene, 'BattleScene', data, 520);

  assert.deepEqual(calls.fades, []);
  assert.deepEqual(calls.delays, []);
  assert.deepEqual(calls.starts, [['BattleScene', data]]);
  assert.equal(scene.transitioning, false);
  assert.equal(scene.input.enabled, true);
});

test('SceneTransition preserves explicit duration and payload when motion is enabled', () => {
  installSettings(true);
  const { scene, calls } = createScene();
  const data = { victory: true };

  SceneTransition.fadeTo(scene, 'ResultScene', data, 460);

  assert.deepEqual(calls.fades, [[460, 0, 0, 0]]);
  assert.deepEqual(calls.delays, [480]);
  assert.deepEqual(calls.starts, [['ResultScene', data]]);
});
