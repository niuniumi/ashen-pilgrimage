import assert from 'node:assert/strict';
import { computeEnemyLayout } from '../src/systems/BattleLayout.js';

function rect(entry) {
  const cx = entry.x;
  const cy = entry.y - 18;
  const w = entry.metrics.hitWidth;
  const h = entry.metrics.hitHeight;
  return {
    left: cx - w / 2,
    right: cx + w / 2,
    top: cy - h / 2,
    bottom: cy + h / 2
  };
}

function overlaps(a, b) {
  return !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
}

function assertNoOverlap(label, entries) {
  for (let i = 0; i < entries.length; i += 1) {
    for (let j = i + 1; j < entries.length; j += 1) {
      assert.equal(
        overlaps(rect(entries[i]), rect(entries[j])),
        false,
        `${label}: ${entries[i].enemy.id} overlaps ${entries[j].enemy.id}`
      );
    }
  }
}

const bossLayout = computeEnemyLayout([
  { id: 'headless-grave-knight', name: '无首守墓骑士', type: 'boss', hp: 136, maxHp: 160 },
  { id: 'graveyard-skeleton', name: '墓园骷髅', hp: 24, maxHp: 24, summoned: true },
  { id: 'graveyard-skeleton-2', name: '墓园骷髅', hp: 24, maxHp: 24, summoned: true },
  { id: 'graveyard-skeleton-3', name: '墓园骷髅', hp: 24, maxHp: 24, summoned: true },
  { id: 'graveyard-skeleton-4', name: '墓园骷髅', hp: 24, maxHp: 24, summoned: true }
]);

assert.equal(bossLayout.length, 5);
assertNoOverlap('boss summons', bossLayout);

const afterDeathLayout = computeEnemyLayout([
  { id: 'rotting-villager', name: '腐烂村民', hp: 0, maxHp: 32 },
  { id: 'black-hound', name: '黑犬', hp: 22, maxHp: 22 }
]);

assert.equal(afterDeathLayout.length, 1);
assert.equal(afterDeathLayout[0].originalIndex, 1);
assert.equal(afterDeathLayout[0].enemy.id, 'black-hound');

const tripleLayout = computeEnemyLayout([
  { id: 'rotting-villager', name: '腐烂村民', hp: 32, maxHp: 32 },
  { id: 'candle-monk', name: '烛誓修士', hp: 34, maxHp: 34 },
  { id: 'black-hound', name: '黑犬', hp: 22, maxHp: 22 }
]);

assertNoOverlap('three normal enemies', tripleLayout);
console.log('battle layout regression passed');
