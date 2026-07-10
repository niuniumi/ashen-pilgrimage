import assert from 'node:assert/strict';
import test from 'node:test';

import { formatRunProgress } from '../src/game/RunProgress.js';

test('encoded highest floor is formatted as chapter and floor', () => {
  assert.equal(formatRunProgress({ highestFloor: 101 }), '第 1 章 · 第 1 层');
  assert.equal(formatRunProgress({ highestFloor: 312 }), '第 3 章 · 第 12 层');
  assert.equal(formatRunProgress({ act: 2, floor: 7 }), '第 2 章 · 第 7 层');
});
