import assert from 'node:assert/strict';
import test from 'node:test';

import { isMotionEnabled, motionDuration } from '../src/game/MotionPolicy.js';

test('motion policy disables every optional animation when animation is false', () => {
  assert.equal(isMotionEnabled({ animation: false }), false);
  assert.equal(motionDuration({ animation: false }, 460), 0);
});

test('motion policy retains purposeful durations when animation is enabled', () => {
  assert.equal(isMotionEnabled({ animation: true }), true);
  assert.equal(motionDuration({ animation: true }, 460), 460);
});
