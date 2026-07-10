import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveBgmProfile } from '../src/game/AudioProfiles.js';

test('menu, map, battle, and boss route to distinct authored tracks', () => {
  const keys = ['menu', 'map', 'battle', 'boss'].map((kind) => resolveBgmProfile(kind).key);
  assert.deepEqual(keys, ['bgm-menu', 'bgm-map-act-1', 'bgm-battle-act-1', 'bgm-boss']);
  assert.equal(new Set(keys).size, 4);
});

test('story and rest use quieter scene-specific mixes', () => {
  const story = resolveBgmProfile('story');
  const rest = resolveBgmProfile('rest');
  assert.equal(story.key, 'bgm-menu');
  assert.ok(story.gain < 1);
  assert.equal(rest.key, 'bgm-menu');
  assert.ok(rest.gain < story.gain);
});

test('chapter variants route to genuinely different authored tracks', () => {
  assert.equal(resolveBgmProfile('map-act-3').key, 'bgm-map-act-3');
  assert.notEqual(resolveBgmProfile('map-act-1').key, resolveBgmProfile('map-act-3').key);
  assert.notEqual(resolveBgmProfile('battle-act-1').key, resolveBgmProfile('battle-act-3').key);
  assert.equal(resolveBgmProfile('missing').key, 'bgm-menu');
});
