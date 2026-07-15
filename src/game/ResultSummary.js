import { findCard } from '../data/cards.js';
import { formatRunProgress } from './RunProgress.js';

const MAX_DECK_GROUPS = 10;

function nonNegativeInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0;
}

function collectionCount(value) {
  return Array.isArray(value) ? value.length : nonNegativeInteger(value);
}

function elapsedSeconds(run) {
  const explicit = run.elapsedSeconds ?? run.elapsed;
  if (Number.isFinite(Number(explicit))) return nonNegativeInteger(explicit);
  const start = Number(run.startTime);
  if (!Number.isFinite(start) || start <= 0) return 0;
  const end = Number(run.endTime ?? run.completedAt ?? run.endedAt ?? Date.now());
  if (!Number.isFinite(end) || end <= start) return 0;
  return Math.max(1, Math.round((end - start) / 1000));
}

function cardSummary(instance) {
  if (typeof instance === 'string') {
    const card = findCard(instance);
    return card ? { name: card.name, upgraded: false } : null;
  }
  if (!instance || typeof instance !== 'object') return null;
  const suppliedName = typeof instance.name === 'string' ? instance.name.trim() : '';
  const catalogCard = typeof instance.cardId === 'string' ? findCard(instance.cardId) : null;
  const name = suppliedName || catalogCard?.name || (instance.cardId ? '未知卡牌' : '');
  return name ? { name, upgraded: Boolean(instance.upgraded) } : null;
}

function groupDeck(deck) {
  const groups = [];
  const byKey = new Map();
  for (const instance of deck) {
    const card = cardSummary(instance);
    if (!card) continue;
    const key = `${card.name}\u0000${card.upgraded ? 1 : 0}`;
    const existing = byKey.get(key);
    if (existing) {
      existing.count += 1;
      continue;
    }
    const group = { ...card, count: 1 };
    byKey.set(key, group);
    groups.push(group);
  }
  if (groups.length <= MAX_DECK_GROUPS) return groups;
  const visible = groups.slice(0, MAX_DECK_GROUPS - 1);
  const hiddenCards = groups.slice(MAX_DECK_GROUPS - 1).reduce((total, group) => total + group.count, 0);
  visible.push({ name: '其余卡牌', upgraded: false, count: hiddenCards, overflow: true });
  return visible;
}

export function buildResultSummary(run = {}) {
  const value = run && typeof run === 'object' ? run : {};
  const deck = Array.isArray(value.deck) ? value.deck : Array.isArray(value.cards) ? value.cards : [];
  return {
    progress: formatRunProgress(value),
    kills: nonNegativeInteger(value.kills),
    elapsed: elapsedSeconds(value),
    relics: collectionCount(value.relics),
    vows: collectionCount(value.vows),
    gold: nonNegativeInteger(value.gold),
    deckGroups: groupDeck(deck)
  };
}

function resultIdentity(run, victory) {
  const explicit = typeof run?.id === 'string' ? run.id.trim() : '';
  if (explicit) return explicit;
  return [
    'legacy-result',
    run?.characterId ?? 'unknown',
    nonNegativeInteger(run?.startTime),
    nonNegativeInteger(run?.highestFloor ?? run?.floor),
    victory ? 'victory' : 'defeat'
  ].join('-');
}

export function recordResultStats(settings = {}, run = {}, victory = false) {
  const current = settings && typeof settings === 'object' ? settings : {};
  const identity = resultIdentity(run, victory);
  const stats = {
    victories: nonNegativeInteger(current.stats?.victories),
    failures: nonNegativeInteger(current.stats?.failures),
    highestFloor: nonNegativeInteger(current.stats?.highestFloor)
  };
  if (current.lastResultRecorded === identity) {
    return { settings: { ...current, stats }, recorded: false };
  }
  if (victory) stats.victories += 1;
  else stats.failures += 1;
  stats.highestFloor = Math.max(stats.highestFloor, nonNegativeInteger(run?.highestFloor ?? run?.floor));
  return {
    settings: { ...current, stats, lastResultRecorded: identity },
    recorded: true
  };
}
