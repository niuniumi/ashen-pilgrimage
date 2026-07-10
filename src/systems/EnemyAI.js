import { BossPhaseSystem } from './BossPhaseSystem.js';

export class EnemyAI {
  static phaseFor(enemy) {
    return BossPhaseSystem.phaseFor(enemy);
  }

  static nextAction(enemy) {
    if (enemy.pendingCharge) {
      const release = { ...enemy.pendingCharge, charge: false, chargedRelease: true };
      enemy.pendingCharge = null;
      return release;
    }
    const actions = enemy.actions.filter((action) => !action.phase || action.phase === this.phaseFor(enemy));
    const index = enemy.turnsTaken % actions.length;
    const action = actions[index] ?? actions[0] ?? null;
    if (!action?.charge) return action;
    enemy.pendingCharge = { ...action };
    return {
      name: `${action.name}·蓄力`,
      intent: 'special',
      chargeWindup: true,
      text: `正在蓄力；下一回合${action.text.replace(/^蓄力后/, '')}`
    };
  }
}
