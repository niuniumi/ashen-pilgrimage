import { isValidCharacterId } from '../data/characters.js';
import { getCard, isKnownCardId } from '../data/cards.js';
import { MapSystem } from '../systems/MapSystem.js';
import { createRngState, normalizeRngState } from './RunRng.js';

export const CURRENT_RUN_VERSION = 3;

const CURRENT_MAP_MAX_ROW = 11;
const MAP_X_MIN = 300;
const MAP_X_MAX = 850;
const MAP_NODE_TYPES = new Set(['battle', 'elite', 'event', 'shop', 'rest', 'chest', 'boss']);

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

function hasCurrentMapSchema(map) {
  if (!hasValidMap(map)) return false;
  const ids = new Set(map.nodes.map((node) => node?.id));
  const rows = new Set(map.nodes.map((node) => node?.row));
  if (!rows.has(0) || !rows.has(CURRENT_MAP_MAX_ROW)) return false;
  const nodesValid = map.nodes.every((node) => {
    return Boolean(
      node &&
        typeof node.id === 'string' &&
        Number.isInteger(node.row) &&
        node.row >= 0 &&
        node.row <= CURRENT_MAP_MAX_ROW &&
        Number.isInteger(node.column) &&
        Number.isFinite(node.x) &&
        node.x >= MAP_X_MIN &&
        node.x <= MAP_X_MAX &&
        MAP_NODE_TYPES.has(node.type) &&
        Array.isArray(node.links) &&
        node.links.every((id) => ids.has(id))
    );
  });
  if (!nodesValid) return false;
  const progressLists = [map.completed, map.available, map.path];
  if (progressLists.some((list) => !Array.isArray(list) || list.some((id) => !ids.has(id)))) return false;
  return map.activeNode == null || ids.has(map.activeNode);
}

function completedFloor(map) {
  const completed = new Set(Array.isArray(map?.completed) ? map.completed : []);
  return (map?.nodes ?? []).reduce((highest, node) => {
    return completed.has(node.id) ? Math.max(highest, (Number(node.row) || 0) + 1) : highest;
  }, 0);
}

function rebuildIncompatibleMap(run, seed) {
  const oldMap = run.map;
  const checkpointActive = hasRestorableCheckpoint(run);
  const orphanedActive = Boolean(oldMap.activeNode && !checkpointActive);
  const finishedFloor = completedFloor(oldMap);
  const progressBase = checkpointActive || orphanedActive ? finishedFloor : Math.max(finishedFloor, Number(run.floor) || 0);
  const progress = Math.min(CURRENT_MAP_MAX_ROW, Math.max(0, progressBase));
  const mapSeed = createRngState((seed ^ Math.imul((run.act ?? 1) + 17, 0x9e3779b1)) >>> 0);
  const regenerated = MapSystem.createSeededMap(run.act ?? 1, mapSeed).map;
  const completed = [];
  const path = [];
  let current = MapSystem.getNode({ map: regenerated }, regenerated.available[0]);
  let lastCompleted = null;

  for (let row = 0; row < progress && current; row += 1) {
    completed.push(current.id);
    path.push(current.id);
    lastCompleted = current;
    current = MapSystem.getNode({ map: regenerated }, current.links[0]);
  }

  regenerated.completed = completed;
  regenerated.path = path;
  regenerated.available = lastCompleted ? [...lastCompleted.links] : [...regenerated.available];
  regenerated.activeNode = null;
  run.floor = progress;

  const resumeNode = MapSystem.getNode({ map: regenerated }, regenerated.available[0]);
  if (checkpointActive && resumeNode) {
    regenerated.activeNode = resumeNode.id;
    regenerated.path.push(resumeNode.id);
    run.floor = Math.max(run.floor, resumeNode.row + 1);
    run.checkpoint.activeNode = resumeNode.id;
  } else {
    run.checkpoint = null;
    delete run.pendingReward;
    run.rewardClaimed = false;
  }

  run.map = regenerated;
}

function hasRestorableCheckpoint(run) {
  const checkpoint = run.checkpoint;
  return Boolean(
    checkpoint &&
      checkpoint.sceneKey === 'BattleScene' &&
      checkpoint.activeNode &&
      checkpoint.activeNode === run.map?.activeNode &&
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
  if (!isAllowedDeck(raw.characterId, raw.deck)) return null;

  const run = structuredClone(raw);
  const seed = seedFromRun(run);
  run.version = CURRENT_RUN_VERSION;
  run.seed = seed;
  run.rngState = raw.rngState ? normalizeRngState(raw.rngState, seed) : createRngState(seed);
  run.checkpoint = raw.checkpoint ?? null;
  run.settlements = Array.isArray(raw.settlements) ? [...new Set(raw.settlements)] : [];
  run.act = Number.isFinite(run.act) ? run.act : run.map?.act ?? 1;
  run.actPage = Number.isFinite(run.actPage) ? run.actPage : 0;
  if (!run.map || typeof run.map !== 'object') {
    run.map = { act: run.act, nodes: [], completed: [], available: [], activeNode: null, path: [] };
  }
  run.map.completed = Array.isArray(run.map.completed) ? run.map.completed : [];
  run.map.available = Array.isArray(run.map.available) ? run.map.available : [];
  run.map.path = Array.isArray(run.map.path) ? run.map.path : [];
  run.vows = Array.isArray(run.vows) ? run.vows : [];
  run.storyFlags = Array.isArray(run.storyFlags) ? run.storyFlags : [];
  run.eventHistory = Array.isArray(run.eventHistory) ? run.eventHistory : [];

  if (!hasCurrentMapSchema(run.map)) rebuildIncompatibleMap(run, seed);
  else if (run.map.activeNode && !hasRestorableCheckpoint(run)) rollbackOrphanedNode(run);
  return run;
}

export { rollbackOrphanedNode };
