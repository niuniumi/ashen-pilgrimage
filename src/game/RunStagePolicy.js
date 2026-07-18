const SETTLEMENT_STAGES = new Set(['reward', 'act-clear', 'result']);
const NODE_STAGE_TYPES = {
  battle: new Set(['battle', 'elite', 'boss']),
  'boss-intro': new Set(['boss']),
  reward: new Set(['battle', 'elite']),
  event: new Set(['event']),
  shop: new Set(['shop']),
  rest: new Set(['rest']),
  chest: new Set(['chest'])
};

export function isSettlementStage(stage) {
  return SETTLEMENT_STAGES.has(stage);
}

export function isNodeStage(stage) {
  return Object.hasOwn(NODE_STAGE_TYPES, stage);
}

export function isNodeStageCompatible(run) {
  const node = run?.map?.nodes?.find((item) => item.id === run?.map?.activeNode);
  return Boolean(node && NODE_STAGE_TYPES[run?.pendingScene]?.has(node.type));
}

export function rollbackOrphanedNode(run) {
  const activeNode = run?.map?.activeNode;
  if (!activeNode) return run;
  run.map.available = Array.isArray(run.map.available) ? run.map.available : [];
  if (!run.map.available.includes(activeNode)) run.map.available.unshift(activeNode);
  run.map.path = Array.isArray(run.map.path) ? run.map.path : [];
  const pathIndex = run.map.path.lastIndexOf(activeNode);
  if (pathIndex >= 0) run.map.path.splice(pathIndex, 1);
  run.map.activeNode = null;
  const completed = new Set(Array.isArray(run.map.completed) ? run.map.completed : []);
  run.floor = (run.map.nodes ?? []).reduce((highest, node) => {
    return completed.has(node.id) ? Math.max(highest, (node.row ?? -1) + 1) : highest;
  }, 0);
  delete run.pendingReward;
  run.rewardClaimed = false;
  return run;
}

export function normalizeRunStage(run) {
  if (!run || !isNodeStage(run.pendingScene) || isNodeStageCompatible(run)) return run;
  run.pendingScene = null;
  delete run.pendingBattleType;
  run.checkpoint = null;
  delete run.pendingReward;
  run.rewardClaimed = false;
  return rollbackOrphanedNode(run);
}

export function prepareMainMenuExit(run) {
  return { ok: Boolean(run), run };
}

export function prepareMapExit(run) {
  if (!run || isSettlementStage(run.pendingScene)) return { ok: false, run };
  return { ok: true, run };
}
