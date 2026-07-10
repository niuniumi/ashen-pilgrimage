function addStatus(enemy, status, amount) {
  if (!amount) return;
  enemy.status ??= {};
  enemy.status[status] = Math.max(0, (enemy.status[status] ?? 0) + amount);
}

export class BossPhaseSystem {
  static phaseFor(enemy) {
    if (enemy?.type !== 'boss') return 1;
    const ratio = enemy.maxHp > 0 ? enemy.hp / enemy.maxHp : 0;
    const calculated = ratio <= 0.33 ? 3 : ratio <= 0.66 ? 2 : 1;
    return Math.max(calculated, enemy.lastPhase ?? 1);
  }

  static applyTransition(battle, enemy, phase = this.phaseFor(enemy)) {
    if (!enemy || enemy.type !== 'boss' || phase <= (enemy.lastPhase ?? 1)) return [];
    const rule = enemy.phaseRules?.[phase] ?? {};
    const events = [];
    enemy.lastPhase = phase;

    if (rule.block) {
      enemy.block += rule.block;
      events.push({ type: 'enemyBlock', enemyId: enemy.id, enemyUid: enemy.uid, amount: rule.block });
    }
    if (rule.heal) {
      const before = enemy.hp;
      enemy.hp = Math.min(enemy.maxHp, enemy.hp + rule.heal);
      events.push({ type: 'enemyHeal', enemyId: enemy.id, enemyUid: enemy.uid, amount: enemy.hp - before });
    }
    if (rule.strength) {
      addStatus(enemy, 'strength', rule.strength);
      events.push({ type: 'enemyBuff', enemyId: enemy.id, enemyUid: enemy.uid, status: 'strength', amount: rule.strength });
    }

    battle?.log?.unshift(`${enemy.name}进入第 ${phase} 阶段。${rule.log ?? ''}`);
    events.unshift({ type: 'bossPhase', enemyId: enemy.id, enemyUid: enemy.uid, phase });
    return events;
  }
}
