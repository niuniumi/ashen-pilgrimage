import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveAudioHintLayout } from '../src/game/AudioHintLayout.js';

test('battle audio unlock hint stays above the combat field and card rail', () => {
  const layout = resolveAudioHintLayout('BattleScene');
  assert.equal(layout.x, 24);
  assert.ok(layout.y <= 96);
  assert.deepEqual(layout.origin, [0, 0]);
});

test('non-battle audio unlock hint remains centered near the footer', () => {
  const layout = resolveAudioHintLayout('MainMenuScene');
  assert.equal(layout.x, 768);
  assert.equal(layout.y, 824);
  assert.deepEqual(layout.origin, [0.5, 0.5]);
});
