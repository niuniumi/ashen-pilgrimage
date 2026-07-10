import { normalizeRngState } from './RunRng.js';

function clone(value) {
  return structuredClone(value);
}

function isBattleSnapshot(value) {
  return Boolean(
    value &&
      typeof value === 'object' &&
      Number.isFinite(value.turn) &&
      value.player &&
      Array.isArray(value.enemies) &&
      value.deck &&
      Array.isArray(value.deck.hand)
  );
}

export function createBattleCheckpoint(run, battle, sceneKey = 'BattleScene') {
  if (!run?.id || !run?.map?.activeNode || !isBattleSnapshot(battle)) {
    throw new Error('Cannot create a battle checkpoint from incomplete state.');
  }
  const activeNode = run.map.activeNode;
  return {
    id: `checkpoint-${run.id}-${activeNode}-${battle.turn}`,
    sceneKey,
    activeNode,
    rngState: normalizeRngState(run.rngState, run.seed),
    battle: clone(battle),
    savedAt: Date.now()
  };
}

export function restoreBattleCheckpoint(run) {
  const checkpoint = run?.checkpoint;
  if (
    !checkpoint ||
    checkpoint.sceneKey !== 'BattleScene' ||
    checkpoint.activeNode !== run?.map?.activeNode ||
    !isBattleSnapshot(checkpoint.battle)
  ) {
    return null;
  }
  return {
    id: checkpoint.id,
    sceneKey: checkpoint.sceneKey,
    activeNode: checkpoint.activeNode,
    rngState: normalizeRngState(checkpoint.rngState, run.seed),
    battle: clone(checkpoint.battle)
  };
}

export function clearBattleCheckpoint(run, settlementId = null) {
  if (!run || !settlementId) return false;
  run.settlements = Array.isArray(run.settlements) ? run.settlements : [];
  if (run.settlements.includes(settlementId)) return false;
  run.settlements.push(settlementId);
  run.checkpoint = null;
  return true;
}

export function hasSettlement(run, settlementId) {
  return Boolean(settlementId && run?.settlements?.includes(settlementId));
}
