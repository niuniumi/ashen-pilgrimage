import assert from 'node:assert/strict';
import test from 'node:test';

import { buildResultSummary, recordResultStats } from '../src/game/ResultSummary.js';

const runFixture = {
  id: 'result-summary-fixture',
  characterId: 'exiled-knight',
  act: 3,
  floor: 12,
  highestFloor: 312,
  kills: 27,
  startTime: 1_000,
  endTime: 91_000,
  relics: ['iron-rosary', 'pilgrim-bell'],
  vows: ['vow-embers'],
  gold: 143,
  deck: [
    { cardId: 'legacy-rust-cleave', name: '锈剑劈砍', upgraded: false },
    { cardId: 'legacy-rust-cleave', name: '锈剑劈砍', upgraded: false },
    { cardId: 'legacy-rust-cleave', name: '锈剑劈砍', upgraded: true },
    { cardId: 'knight-block', upgraded: false },
    { cardId: 'knight-rend', upgraded: false },
    { cardId: 'common-bandage', upgraded: false },
    { cardId: 'common-crossbow', upgraded: false },
    { cardId: 'common-old-shield', upgraded: false },
    { cardId: 'common-torch-swing', upgraded: false },
    { cardId: 'common-ash-dodge', upgraded: false },
    { cardId: 'common-field-ration', upgraded: false },
    { cardId: 'common-smoke-bomb', upgraded: false },
    { cardId: 'common-grave-salt', upgraded: false }
  ]
};

test('result summary groups upgraded cards without long unbounded lines', () => {
  const summary = buildResultSummary(runFixture);

  assert.deepEqual(summary.deckGroups[0], { name: '锈剑劈砍', upgraded: false, count: 2 });
  assert.deepEqual(summary.deckGroups[1], { name: '锈剑劈砍', upgraded: true, count: 1 });
  assert.ok(summary.deckGroups.length <= 10);
  assert.deepEqual(summary.deckGroups.at(-1), { name: '其余卡牌', upgraded: false, count: 3, overflow: true });
});

test('result summary is deterministic and derives bounded run facts', () => {
  const first = buildResultSummary(runFixture);
  const second = buildResultSummary({ ...runFixture, deck: runFixture.deck.map((card) => ({ ...card })) });

  assert.deepEqual(first, second);
  assert.deepEqual(first, {
    progress: '第 3 章 · 第 12 层',
    kills: 27,
    elapsed: 90,
    relics: 2,
    vows: 1,
    gold: 143,
    deckGroups: first.deckGroups
  });
});

test('result summary tolerates missing and legacy run fields', () => {
  assert.doesNotThrow(() => buildResultSummary());
  assert.deepEqual(buildResultSummary({ deck: [null, 'knight-cleave', { name: '旧卡' }], relics: 3, vows: null }), {
    progress: '第 1 章 · 第 1 层',
    kills: 0,
    elapsed: 0,
    relics: 3,
    vows: 0,
    gold: 0,
    deckGroups: [
      { name: '劈砍', upgraded: false, count: 1 },
      { name: '旧卡', upgraded: false, count: 1 }
    ]
  });
});

test('result statistics record each run identity once across scene re-entry', () => {
  const initial = { stats: { victories: 2, failures: 4, highestFloor: 207 } };
  const first = recordResultStats(initial, runFixture, true);
  const second = recordResultStats(first.settings, runFixture, true);

  assert.equal(first.recorded, true);
  assert.equal(second.recorded, false);
  assert.deepEqual(second.settings.stats, { victories: 3, failures: 4, highestFloor: 312 });
  assert.equal(second.settings.lastResultRecorded, runFixture.id);
});

test('legacy results without ids still receive a stable recording identity', () => {
  const run = { characterId: 'candle-nun', startTime: 1234, act: 2, floor: 5, highestFloor: 205 };
  const first = recordResultStats({}, run, false);
  const second = recordResultStats(first.settings, { ...run }, false);

  assert.equal(second.recorded, false);
  assert.equal(second.settings.stats.failures, 1);
  assert.match(second.settings.lastResultRecorded, /^legacy-result-/);
});
