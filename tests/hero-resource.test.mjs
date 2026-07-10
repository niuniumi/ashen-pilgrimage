import assert from 'node:assert/strict';
import test from 'node:test';

import { HeroResourceSystem } from '../src/systems/HeroResourceSystem.js';

function battleFor(characterId) {
  return {
    player: {
      hp: 40,
      maxHp: 50,
      energy: 3,
      block: 0,
      status: {},
      resource: HeroResourceSystem.create(characterId)
    },
    deck: { drawPile: [], discardPile: [], hand: [], exhaustPile: [] },
    log: []
  };
}

test('knight builds momentum and spends it on a finisher', () => {
  const battle = battleFor('exiled-knight');
  const attack = { type: '攻击', tags: [] };
  const finisher = { type: '攻击', tags: ['finisher'] };

  for (let i = 0; i < 3; i += 1) {
    HeroResourceSystem.afterCard(battle, attack, { damageDealt: 5 });
  }
  assert.equal(battle.player.resource.value, 3);
  assert.equal(battle.player.resource.ready, true);

  const context = {};
  const events = HeroResourceSystem.beforeCard(battle, finisher, context);
  assert.equal(context.resourceDamageMultiplier, 1.5);
  assert.equal(battle.player.resource.value, 0);
  assert.equal(events[0].action, 'spend');
});

test('nun prayer fuels ignite and miracle effects', () => {
  const battle = battleFor('candle-nun');
  for (let i = 0; i < 4; i += 1) {
    HeroResourceSystem.afterCard(battle, { type: '技能', tags: ['prayer'] }, {});
  }

  const igniteContext = {};
  HeroResourceSystem.beforeCard(battle, { type: '攻击', tags: ['ignite'] }, igniteContext);
  assert.equal(igniteContext.resourceFlatDamage, 6);
  assert.equal(battle.player.resource.value, 1);

  battle.player.resource.value = 6;
  const miracleContext = {};
  HeroResourceSystem.beforeCard(battle, { type: '技能', tags: ['miracle'] }, miracleContext);
  assert.equal(miracleContext.resourceBonusBlock, 12);
  assert.equal(battle.player.resource.value, 0);
});

test('alchemist active life loss distills ashblood and overloads at ten', () => {
  const battle = battleFor('ashblood-alchemist');
  const distilled = HeroResourceSystem.onSelfLoseHp(battle, 6);
  assert.equal(battle.player.resource.value, 6);
  assert.equal(battle.player.resource.ready, true);
  assert.equal(distilled.some((event) => event.action === 'ready'), true);

  const attackContext = {};
  HeroResourceSystem.beforeCard(battle, { type: '攻击', tags: [] }, attackContext);
  assert.equal(attackContext.resourceFlatDamage, 3);
  assert.equal(battle.player.resource.value, 3);

  battle.player.resource.value = 9;
  const overload = HeroResourceSystem.onSelfLoseHp(battle, 2);
  assert.equal(battle.player.resource.value, 5);
  assert.equal(battle.player.energy, 5);
  assert.equal(overload.some((event) => event.action === 'overload'), true);
});

test('resource hooks are inert for common cards and unknown characters', () => {
  const battle = battleFor('unknown');
  assert.equal(battle.player.resource, null);
  assert.deepEqual(HeroResourceSystem.beforeCard(battle, { type: '技能' }, {}), []);
  assert.deepEqual(HeroResourceSystem.afterCard(battle, { type: '攻击' }, { damageDealt: 10 }), []);
});
