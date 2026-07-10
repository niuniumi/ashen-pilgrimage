import { isValidCharacterId } from '../data/characters.js';
import { getCard, isKnownCardId } from '../data/cards.js';
import { createRngState, normalizeRngState } from './RunRng.js';

function seedFromRun(run) {
  if (Number.isFinite(run.seed)) return Number(run.seed) >>> 0;
  if (Number.isFinite(run.startTime)) return Number(run.startTime) >>> 0;
  let value = 2166136261;
  for (const character of String(run.id ?? run.characterId ?? 'ashen-pilgrimage')) {
    value ^= character.charCodeAt(0);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function isAllowedDeck(characterId, deck) {
  return (
    Array.isArray(deck) &&
    deck.length > 0 &&
    deck.every((instance) => {
      if (!instance || !isKnownCardId(instance.cardId)) return false;
      const card = getCard(instance.cardId);
      return card.character === characterId || card.character === 'common' || card.character === 'status';
    })
  );
}

function hasValidMap(map) {
  return Boolean(map && Array.isArray(map.nodes) && map.nodes.length > 0);
}

function hasRestorableCheckpoint(run) {
  const checkpoint = run.checkpoint;
  return Boolean(
    checkpoint &&
      checkpoint.sceneKey === 'BattleScene' &&
      checkpoint.activeNode &&
      checkpoint.activeNode === run.map.activeNode &&
      checkpoint.battle?.player &&
      checkpoint.battle?.deck &&
      Array.isArray(checkpoint.battle?.enemies)
  );
}

function rollbackOrphanedNode(run) {
  const activeNode = run.map.activeNode;
  if (!activeNode) return;
  run.map.available = Array.isArray(run.map.available) ? run.map.available : [];
  if (!run.map.available.includes(activeNode)) run.map.available.unshift(activeNode);
  run.map.path = Array.isArray(run.map.path) ? run.map.path : [];
  const pathIndex = run.map.path.lastIndexOf(activeNode);
  if (pathIndex >= 0) run.map.path.splice(pathIndex, 1);
  run.map.activeNode = null;
  const completed = new Set(Array.isArray(run.map.completed) ? run.map.completed : []);
  run.floor = run.map.nodes.reduce((highest, node) => {
    return completed.has(node.id) ? Math.max(highest, (node.row ?? -1) + 1) : highest;
  }, 0);
  delete run.pendingReward;
  run.rewardClaimed = false;
}

export function migrateRun(raw) {
  if (!raw || typeof raw !== 'object' || !isValidCharacterId(raw.characterId)) return null;
  if (!isAllowedDeck(raw.characterId, raw.deck) || !hasValidMap(raw.map)) return null;

  const run = structuredClone(raw);
  const seed = seedFromRun(run);
  run.version = 2;
  run.seed = seed;
  run.rngState = raw.rngState ? normalizeRngState(raw.rngState, seed) : createRngState(seed);
  run.checkpoint = raw.checkpoint ?? null;
  run.settlements = Array.isArray(raw.settlements) ? [...new Set(raw.settlements)] : [];
  run.act = Number.isFinite(run.act) ? run.act : run.map.act ?? 1;
  run.actPage = Number.isFinite(run.actPage) ? run.actPage : 0;
  run.map.completed = Array.isArray(run.map.completed) ? run.map.completed : [];
  run.map.available = Array.isArray(run.map.available) ? run.map.available : [];
  run.map.path = Array.isArray(run.map.path) ? run.map.path : [];
  run.vows = Array.isArray(run.vows) ? run.vows : [];
  run.storyFlags = Array.isArray(run.storyFlags) ? run.storyFlags : [];
  run.eventHistory = Array.isArray(run.eventHistory) ? run.eventHistory : [];

  if (run.map.activeNode && !hasRestorableCheckpoint(run)) rollbackOrphanedNode(run);
  return run;
}

export { rollbackOrphanedNode };
