import assert from 'node:assert/strict';
import test from 'node:test';

import { createRngState } from '../src/game/RunRng.js';
import { vows, VowSystem } from '../src/systems/VowSystem.js';

function run() {
  return { seed: 19, rngState: createRngState(19), vows: [], hp: 70, maxHp: 70, gold: 60 };
}

test('vow offers are deterministic, unique, and exclude sworn vows', () => {
  const first = run();
  const second = run();
  const offerA = VowSystem.createOffer(first, 1);
  const offerB = VowSystem.createOffer(second, 1);
  assert.deepEqual(offerA.map((vow) => vow.id), offerB.map((vow) => vow.id));
  assert.equal(new Set(offerA.map((vow) => vow.id)).size, 3);
  assert.equal(new Set(offerA.map((vow) => vow.icon)).size, 3);
  first.vows.push(offerA[0].id);
  assert.equal(VowSystem.createOffer(first, 2).some((vow) => vow.id === offerA[0].id), false);
});

test('each vow has a distinct semantic icon', () => {
  assert.equal(vows.every((vow) => typeof vow.icon === 'string' && vow.icon.length > 0), true);
  assert.equal(new Set(vows.map((vow) => vow.icon)).size, vows.length);
});

test('applying a vow records it once and applies immediate effects once', () => {
  const state = run();
  const applied = VowSystem.apply(state, 'iron-pilgrimage');
  assert.equal(applied.id, 'iron-pilgrimage');
  assert.equal(state.maxHp, 80);
  assert.equal(state.hp, 80);
  VowSystem.apply(state, 'iron-pilgrimage');
  assert.equal(state.maxHp, 80);
  assert.equal(state.vows.length, 1);
});

test('vow hooks compose into battle modifiers', () => {
  const state = run();
  state.vows = ['iron-pilgrimage', 'long-night'];
  assert.equal(VowSystem.value(state, 'enemyHpMultiplier'), 1.12);
  assert.equal(VowSystem.value(state, 'firstTurnDraw'), 1);
  assert.equal(VowSystem.value(state, 'enemyStrengthStart'), 1);
});
