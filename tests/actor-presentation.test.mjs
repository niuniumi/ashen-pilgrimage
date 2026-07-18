import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  CHARACTER_SELECT_PORTRAIT,
  fitActorDisplaySize
} from '../src/art/ActorPresentation.js';

const heroSources = {
  'exiled-knight': { width: 614, height: 660 },
  'candle-nun': { width: 369, height: 660 },
  'ashblood-alchemist': { width: 431, height: 660 }
};

test('character-select portraits share one foot baseline and near-identical visual height', () => {
  const sizes = Object.values(heroSources).map(({ width, height }) =>
    fitActorDisplaySize(width, height, CHARACTER_SELECT_PORTRAIT.targetHeight, CHARACTER_SELECT_PORTRAIT.maxWidth)
  );

  assert.equal(CHARACTER_SELECT_PORTRAIT.baselineY, 112);
  assert.ok(CHARACTER_SELECT_PORTRAIT.maxWidth <= CHARACTER_SELECT_PORTRAIT.frameWidth);
  assert.equal(Math.max(...sizes.map((size) => size.height)) - Math.min(...sizes.map((size) => size.height)), 0);
  assert.ok(sizes.every((size) => size.width <= CHARACTER_SELECT_PORTRAIT.maxWidth));
});

test('character selection keeps one portrait instance and never changes its visual scale for hover state', async () => {
  const source = await readFile(new URL('../src/scenes/CharacterSelectScene.js', import.meta.url), 'utf8');

  assert.match(source, /generatedHeight:\s*CHARACTER_SELECT_PORTRAIT\.targetHeight/);
  assert.match(source, /maxWidth:\s*CHARACTER_SELECT_PORTRAIT\.maxWidth/);
  assert.doesNotMatch(source, /frontArt|backArt|scaleX:\s*0\.94/);
});

test('actor fitting preserves source aspect ratio without enlarging past either constraint', () => {
  assert.deepEqual(fitActorDisplaySize(614, 660, 300, 280), { width: 279, height: 300 });
  assert.deepEqual(fitActorDisplaySize(369, 660, 300, 272), { width: 168, height: 300 });
  assert.deepEqual(fitActorDisplaySize(431, 660, 300, 272), { width: 196, height: 300 });
  assert.deepEqual(fitActorDisplaySize(0, 660, 300, 272), { width: 0, height: 0 });
});
