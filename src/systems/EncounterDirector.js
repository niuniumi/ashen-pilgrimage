import { getEncounterPool } from '../data/encounters.js';
import { choice as seededChoice, normalizeRngState } from '../game/RunRng.js';

function signature(enemyIds) {
  return enemyIds.join('+');
}

export class EncounterDirector {
  static chooseEnemyIds(run, battleType = 'battle') {
    const act = run?.act ?? run?.map?.act ?? 1;
    const poolType = battleType === 'boss' ? 'boss' : battleType === 'elite' ? 'elite' : 'battle';
    const fullPool = getEncounterPool(act, poolType);
    const history = Array.isArray(run.encounterHistory) ? run.encounterHistory : [];
    const previous = history.at(-1) ?? null;
    const floorInAct = Math.max(0, Number(run.floor ?? 0) % 12);
    let candidates = fullPool;

    if (poolType === 'battle') {
      const desiredSize = floorInAct < 3 ? 1 : floorInAct >= 5 ? 2 : null;
      const paced = desiredSize ? fullPool.filter((entry) => entry.length === desiredSize) : fullPool;
      if (paced.length > 0) candidates = paced;
    }

    const fresh = candidates.filter((entry) => signature(entry) !== previous);
    if (fresh.length > 0) candidates = fresh;

    const picked = seededChoice(normalizeRngState(run.rngState, run.seed), candidates);
    run.rngState = picked.state;
    const enemyIds = picked.value ? [...picked.value] : [];
    run.encounterHistory = [...history, signature(enemyIds)].slice(-4);
    return enemyIds;
  }

  static roleFor(enemy) {
    if (enemy?.type === 'boss') return 'boss';
    const actions = enemy?.actions ?? [];
    if (actions.some((action) => action.summon)) return 'summoner';
    if (actions.some((action) => action.heal)) return 'sustain';
    if (actions.some((action) => action.targetStatus || action.targetStatus2 || action.addCardToDraw)) return 'controller';
    if (actions.some((action) => (action.times ?? 1) >= 2)) return 'skirmisher';
    if (actions.some((action) => action.strength)) return 'escalator';
    if (actions.some((action) => action.block)) return 'sentinel';
    return 'striker';
  }
}
