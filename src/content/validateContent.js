import {
  CARD_RARITY_ALLOWED,
  CARD_TYPES_ALLOWED,
  ENEMY_INTENTS_ALLOWED,
  ENEMY_TYPES_ALLOWED,
  hasNumber,
  hasText,
  isArray,
  isPlainObject
} from './schema.js';

function issue(scope, id, message) {
  return { scope, id: id ?? 'unknown', message };
}

function duplicates(items, scope) {
  const seen = new Set();
  const issues = [];

  for (const item of items) {
    if (!item?.id) {
      continue;
    }
    if (seen.has(item.id)) {
      issues.push(issue(scope, item.id, 'duplicate id'));
    }
    seen.add(item.id);
  }

  return issues;
}

function validateCard(card) {
  const issues = [];

  if (!hasText(card.id)) issues.push(issue('card', card.id, 'missing id'));
  if (!hasText(card.name)) issues.push(issue('card', card.id, 'missing name'));
  if (!CARD_TYPES_ALLOWED.has(card.type)) issues.push(issue('card', card.id, `invalid type ${card.type}`));
  if (!CARD_RARITY_ALLOWED.has(card.rarity)) issues.push(issue('card', card.id, `invalid rarity ${card.rarity}`));
  if (!hasNumber(card.cost) && card.cost !== null) issues.push(issue('card', card.id, 'invalid cost'));
  if (!hasText(card.text)) issues.push(issue('card', card.id, 'missing text'));
  if (!isArray(card.effects)) issues.push(issue('card', card.id, 'effects must be array'));
  if (card.upgradedEffects !== undefined && !isArray(card.upgradedEffects)) {
    issues.push(issue('card', card.id, 'upgradedEffects must be array when present'));
  }
  if (card.requiresTarget !== undefined && typeof card.requiresTarget !== 'boolean') {
    issues.push(issue('card', card.id, 'requiresTarget must be boolean'));
  }
  if (card.unplayable && card.cost !== null) {
    issues.push(issue('card', card.id, 'unplayable cards must use null cost'));
  }

  return issues;
}

function validateRelic(relic) {
  const issues = [];

  if (!hasText(relic.id)) issues.push(issue('relic', relic.id, 'missing id'));
  if (!hasText(relic.name)) issues.push(issue('relic', relic.id, 'missing name'));
  if (!hasText(relic.text)) issues.push(issue('relic', relic.id, 'missing text'));
  if (!hasText(relic.rarity)) issues.push(issue('relic', relic.id, 'missing rarity'));
  if (!hasText(relic.hook) && !isPlainObject(relic.hooks)) {
    issues.push(issue('relic', relic.id, 'missing hook or hooks'));
  }

  return issues;
}

function validateEnemyAction(enemy, action, index) {
  const id = `${enemy.id}.actions[${index}]`;
  const issues = [];

  if (!hasText(action.name)) issues.push(issue('enemyAction', id, 'missing name'));
  if (!ENEMY_INTENTS_ALLOWED.has(action.intent)) {
    issues.push(issue('enemyAction', id, `invalid intent ${action.intent}`));
  }
  if (!hasText(action.text)) issues.push(issue('enemyAction', id, 'missing text'));

  return issues;
}

function validateEnemy(enemy) {
  const issues = [];

  if (!hasText(enemy.id)) issues.push(issue('enemy', enemy.id, 'missing id'));
  if (!hasText(enemy.name)) issues.push(issue('enemy', enemy.id, 'missing name'));
  if (!ENEMY_TYPES_ALLOWED.has(enemy.type)) issues.push(issue('enemy', enemy.id, `invalid type ${enemy.type}`));
  if (!hasNumber(enemy.hp) || enemy.hp <= 0) issues.push(issue('enemy', enemy.id, 'invalid hp'));
  if (!isArray(enemy.actions) || enemy.actions.length === 0) {
    issues.push(issue('enemy', enemy.id, 'missing actions'));
  } else {
    issues.push(...enemy.actions.flatMap((action, index) => validateEnemyAction(enemy, action, index)));
  }
  if (enemy.palette !== undefined && (!isArray(enemy.palette) || enemy.palette.length < 2)) {
    issues.push(issue('enemy', enemy.id, 'palette should contain at least two colors'));
  }

  return issues;
}

function validateEventOption(event, option, index) {
  const id = `${event.id}.options[${index}]`;
  const issues = [];

  if (!hasText(option.label)) issues.push(issue('eventOption', id, 'missing label'));
  if (!hasText(option.cost)) issues.push(issue('eventOption', id, 'missing cost'));
  if (!hasText(option.result)) issues.push(issue('eventOption', id, 'missing result'));
  if (!isArray(option.effects)) issues.push(issue('eventOption', id, 'effects must be array'));

  return issues;
}

function validateEvent(event) {
  const issues = [];

  if (!hasText(event.id)) issues.push(issue('event', event.id, 'missing id'));
  if (!hasText(event.title)) issues.push(issue('event', event.id, 'missing title'));
  if (!hasText(event.description)) issues.push(issue('event', event.id, 'missing description'));
  if (!isArray(event.options) || event.options.length === 0) {
    issues.push(issue('event', event.id, 'missing options'));
  } else {
    issues.push(...event.options.flatMap((option, index) => validateEventOption(event, option, index)));
  }

  return issues;
}

function validateAct(act, enemyIds) {
  const issues = [];
  if (!hasNumber(act.number)) issues.push(issue('act', act.id, 'missing number'));
  if (!hasText(act.id)) issues.push(issue('act', act.id, 'missing id'));
  if (!hasText(act.title)) issues.push(issue('act', act.id, 'missing title'));
  if (!hasText(act.bossId)) issues.push(issue('act', act.id, 'missing bossId'));
  if (hasText(act.bossId) && !enemyIds.has(act.bossId)) issues.push(issue('act', act.id, `unknown bossId ${act.bossId}`));
  if (!isArray(act.bossIntro) || act.bossIntro.length < 2) issues.push(issue('act', act.id, 'bossIntro needs at least two lines'));
  if (!isArray(act.clearStory) || act.clearStory.length < 2) issues.push(issue('act', act.id, 'clearStory needs at least two lines'));
  return issues;
}

function validateEncounterPools(encounters, enemyIds) {
  const issues = [];
  if (!isPlainObject(encounters)) return [issue('encounters', 'encounters', 'encounters must be an object')];
  for (const [act, pools] of Object.entries(encounters)) {
    for (const type of ['battle', 'elite', 'boss']) {
      const pool = pools?.[type];
      if (!isArray(pool) || pool.length === 0) {
        issues.push(issue('encounters', `${act}.${type}`, 'pool must not be empty'));
        continue;
      }
      pool.forEach((encounter, encounterIndex) => {
        if (!isArray(encounter) || encounter.length === 0) {
          issues.push(issue('encounters', `${act}.${type}[${encounterIndex}]`, 'encounter must contain enemy ids'));
          return;
        }
        encounter.forEach((enemyId) => {
          if (!enemyIds.has(enemyId)) issues.push(issue('encounters', `${act}.${type}[${encounterIndex}]`, `unknown enemy ${enemyId}`));
        });
      });
    }
  }
  return issues;
}

function validateCollection(name, value) {
  if (!isArray(value)) {
    return [issue(name, name, 'collection must be an array')];
  }
  if (value.length === 0) {
    return [issue(name, name, 'collection must not be empty')];
  }
  return [];
}

export function validateAllContent({ cards, relics, enemies, events, acts = [], encounters = {} }) {
  const legacyRelicCount = isArray(relics)
    ? relics.filter((relic) => relic?.legacy || relic?.rarity === '旧版').length
    : 0;
  const collectionIssues = [
    ...validateCollection('cards', cards),
    ...validateCollection('relics', relics),
    ...validateCollection('enemies', enemies),
    ...validateCollection('events', events),
    ...validateCollection('acts', acts)
  ];

  if (collectionIssues.length > 0) {
    return {
      ok: false,
      counts: {
        cards: cards?.length ?? 0,
        relics: relics?.length ?? 0,
        productionRelics: Math.max(0, (relics?.length ?? 0) - legacyRelicCount),
        legacyRelics: legacyRelicCount,
        enemies: enemies?.length ?? 0,
        events: events?.length ?? 0,
        acts: acts?.length ?? 0
      },
      issues: collectionIssues
    };
  }

  const enemyIds = new Set(enemies.map((enemy) => enemy.id));
  const issues = [
    ...duplicates(cards, 'card'),
    ...duplicates(relics, 'relic'),
    ...duplicates(enemies, 'enemy'),
    ...duplicates(events, 'event'),
    ...duplicates(acts, 'act'),
    ...cards.flatMap(validateCard),
    ...relics.flatMap(validateRelic),
    ...enemies.flatMap(validateEnemy),
    ...events.flatMap(validateEvent),
    ...acts.flatMap((act) => validateAct(act, enemyIds)),
    ...validateEncounterPools(encounters, enemyIds)
  ];

  return {
    ok: issues.length === 0,
    counts: {
      cards: cards.length,
      relics: relics.length,
      productionRelics: relics.length - legacyRelicCount,
      legacyRelics: legacyRelicCount,
      enemies: enemies.length,
      events: events.length,
      acts: acts.length
    },
    issues
  };
}
