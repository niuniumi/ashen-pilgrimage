import assert from 'node:assert/strict';
import test from 'node:test';

import { waitForBootFonts } from '../src/game/BootReadiness.js';

test('boot continues when browser fonts never become ready', async () => {
  const result = await waitForBootFonts({ ready: new Promise(() => {}) }, 5);
  assert.equal(result, 'timeout');
});

test('boot recognizes fonts that are already ready', async () => {
  const result = await waitForBootFonts({ ready: Promise.resolve() }, 50);
  assert.equal(result, 'ready');
});
