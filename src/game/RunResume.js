import { SCENES } from './constants.js';
import { restoreBattleCheckpoint } from './BattleCheckpoint.js';

export function hasPendingRewardCheckpoint(run) {
  return Boolean(
    run?.map?.activeNode &&
      run.pendingReward &&
      typeof run.pendingReward === 'object' &&
      run.rewardClaimed !== true
  );
}

export function getRunResumeTarget(run, options = {}) {
  const checkpoint = options.checkpoint ?? restoreBattleCheckpoint(run);
  if (checkpoint) {
    const activeNode = run?.map?.nodes?.find((node) => node.id === run?.map?.activeNode);
    const inferredBattleType = checkpoint.battle?.battleType ?? run?.pendingBattleType ?? activeNode?.type ?? 'battle';
    const data = { restoredBattle: checkpoint.battle };
    if (!checkpoint.battle?.battleType && inferredBattleType !== 'battle') data.battleType = inferredBattleType;
    return { sceneKey: SCENES.Battle, data };
  }
  const stageTargets = {
    vow: { sceneKey: SCENES.Vow, data: {} },
    battle: { sceneKey: SCENES.Battle, data: { battleType: run?.pendingBattleType ?? 'battle' } },
    'boss-intro': { sceneKey: SCENES.BossIntro, data: {} },
    reward: { sceneKey: SCENES.Reward, data: {} },
    event: { sceneKey: SCENES.Event, data: {} },
    shop: { sceneKey: SCENES.Shop, data: {} },
    rest: { sceneKey: SCENES.Rest, data: {} },
    chest: { sceneKey: SCENES.Chest, data: {} },
    'act-clear': { sceneKey: SCENES.ActClear, data: {} },
    result: { sceneKey: SCENES.Result, data: { victory: run?.resultVictory !== false } }
  };
  if (stageTargets[run?.pendingScene]) return stageTargets[run.pendingScene];
  if (hasPendingRewardCheckpoint(run)) return { sceneKey: SCENES.Reward, data: {} };
  return { sceneKey: SCENES.Map, data: {} };
}
