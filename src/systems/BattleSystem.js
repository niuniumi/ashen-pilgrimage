import { getCard } from '../data/cards.js';
import { getEnemy } from '../data/enemies.js';
import { CARD_TYPES } from '../game/constants.js';
import { clamp } from '../game/random.js';
import { runChoice } from '../game/RunRandom.js';
import { CardSystem } from './CardSystem.js';
import { BossPhaseSystem } from './BossPhaseSystem.js';
import { EncounterDirector } from './EncounterDirector.js';
import { EnemyAI } from './EnemyAI.js';
import { HeroResourceSystem } from './HeroResourceSystem.js';
import { RelicSystem } from './RelicSystem.js';
import { VowSystem } from './VowSystem.js';

let nextEnemyUid = 1;

function cloneEnemy(enemyData, run, battleType) {
  const hpMultiplier =
    VowSystem.value(run, 'enemyHpMultiplier') *
    (battleType === 'elite' ? VowSystem.value(run, 'eliteHpMultiplier') : 1);
  const maxHp = Math.max(1, Math.ceil(enemyData.hp * hpMultiplier));
  const enemy = {
    ...enemyData,
    uid: `${enemyData.id}-${nextEnemyUid++}`,
    maxHp,
    hp: maxHp,
    block: 0,
    status: {},
    turnsTaken: 0,
    currentAction: null,
    lastPhase: 1,
    countedDead: false
  };
  enemy.role = enemyData.role ?? EncounterDirector.roleFor(enemyData);
  const openingStrength = VowSystem.value(run, 'enemyStrengthStart');
  if (openingStrength > 0) enemy.status.strength = openingStrength;
  enemy.currentAction = EnemyAI.nextAction(enemy);
  return enemy;
}

function addStatus(holder, status, value) {
  if (!status || !value) return 0;
  const before = holder.status[status] ?? 0;
  holder.status[status] = Math.max(0, before + value);
  return holder.status[status] - before;
}

function reduceStatus(holder, status, value = 1) {
  holder.status[status] = Math.max(0, (holder.status[status] ?? 0) - value);
}

function hasStatus(holder, status) {
  return (holder?.status?.[status] ?? 0) > 0;
}

export class BattleSystem {
  static createBattle(run, battleType = 'battle') {
    const enemies = this.pickEnemies(run, battleType);
    const battle = {
      battleType,
      turn: 0,
      ended: false,
      won: false,
      firstTurn: true,
      firstBlockUsed: false,
      firstAttackPlayed: false,
      immuneWeakUsed: false,
      firstDamageReducedThisTurn: false,
      deck: CardSystem.createBattleDeck(run),
      player: {
        hp: run.hp,
        maxHp: run.maxHp,
        block: 0,
        energy: run.baseEnergy,
        resource: HeroResourceSystem.create(run.characterId),
        status: {
          strength:
            (run.runStrength ?? 0) +
            RelicSystem.value(run, 'battleStartStrength') +
            (battleType === 'boss' ? RelicSystem.value(run, 'bossStartStrength') : 0)
        }
      },
      enemies: enemies.map((enemy) => cloneEnemy(enemy, run, battleType)),
      log: []
    };

    const weak = RelicSystem.value(run, 'battleStartRandomWeak');
    if (weak > 0) {
      const target = runChoice(run, battle.enemies);
      if (target) addStatus(target, 'weak', weak);
    }

    const openingBlock =
      RelicSystem.value(run, 'battleStartBlock') +
      VowSystem.value(run, 'battleStartBlock') +
      (battleType === 'boss' ? RelicSystem.value(run, 'bossStartBlock') : 0);
    const events = this.startPlayerTurn(run, battle);
    if (openingBlock > 0) {
      battle.player.block += openingBlock;
      events.push({ type: 'block', amount: openingBlock });
      battle.log.unshift(`遗物给予 ${openingBlock} 点护甲。`);
    }
    battle.openingEvents = events;
    return battle;
  }

  static pickEnemies(run, battleType) {
    const encounter = EncounterDirector.chooseEnemyIds(run, battleType);
    if (encounter.length) return encounter.map((enemyId) => getEnemy(enemyId));
    return [getEnemy(run?.map?.bossId ?? 'headless-grave-knight')];
  }

  static startPlayerTurn(run, battle) {
    if (battle.ended) return [];
    battle.turn += 1;
    battle.player.block = 0;
    battle.firstBlockUsed = false;
    battle.firstDamageReducedThisTurn = false;
    battle.player.status.noAttack = 0;
    battle.player.status.attackMarkBonus = 0;
    battle.player.status.counterMark = 0;
    battle.player.energy = Math.max(0, run.baseEnergy);
    if (battle.turn % 3 === 0) {
      battle.player.energy += RelicSystem.value(run, 'every3TurnEnergy');
    }

    const drawCount =
      5 + (battle.firstTurn ? RelicSystem.value(run, 'firstTurnDraw') + VowSystem.value(run, 'firstTurnDraw') : 0);
    const drawn = CardSystem.drawCards(battle.deck, drawCount, run);
    const events = this.handleDrawnCards(battle, drawn);
    battle.firstTurn = false;
    events.push(...this.refreshIntents(battle));
    battle.log.unshift(`你的回合开始。能量 ${battle.player.energy}/${run.baseEnergy}`);
    return events;
  }

  static handleDrawnCards(battle, drawn) {
    const events = [];
    for (const instance of drawn) {
      const card = getCard(instance.cardId);
      for (const effect of card.onDraw ?? []) {
        if (effect.kind === 'selfLoseHp') {
          const amount = Math.min(effect.value, Math.max(0, battle.player.hp - 1));
          battle.player.hp -= amount;
          battle.log.unshift(`抽到${card.name}，失去 ${amount} 生命。`);
          events.push({ type: 'playerDamage', amount });
        }
      }
    }
    return events;
  }

  static refreshIntents(battle) {
    const events = [];
    for (const enemy of battle.enemies) {
      if (enemy.hp <= 0) continue;
      const phase = EnemyAI.phaseFor(enemy);
      if (enemy.type === 'boss') events.push(...BossPhaseSystem.applyTransition(battle, enemy, phase));
      enemy.currentAction = EnemyAI.nextAction(enemy);
    }
    return events;
  }

  static cardCost(run, battle, card) {
    if (card.cost === null || card.cost === undefined) return 999;
    let cost = card.cost;
    if (card.type === CARD_TYPES.ATTACK && !battle.firstAttackPlayed) {
      cost -= RelicSystem.value(run, 'firstAttackCostDiscount');
    }
    return Math.max(0, cost);
  }

  static canPlayCard(run, battle, instance, targetIndex = null) {
    const card = CardSystem.getDisplayCard(instance);
    if (!card || card.unplayable) return { ok: false, reason: `${card?.name ?? '这张牌'}无法打出。` };
    if (battle.ended || battle.player.hp <= 0) return { ok: false, reason: '战斗已经结束。' };
    if (card.type === CARD_TYPES.ATTACK && (battle.player.status.noAttack ?? 0) > 0) {
      return { ok: false, reason: '本回合不能再打出攻击牌。' };
    }
    const cost = this.cardCost(run, battle, card);
    if (battle.player.energy < cost) return { ok: false, reason: '能量不足。' };
    if (card.requiresTarget) {
      const target = battle.enemies[targetIndex];
      if (!target) return { ok: false, reason: '请选择一个敌人作为目标。' };
      if (target.hp <= 0) return { ok: false, reason: '目标已死亡。' };
    }
    return { ok: true, card, cost };
  }

  static useCard(run, battle, uid, targetIndex = null) {
    const instance = battle.deck.hand.find((card) => card.uid === uid);
    if (!instance) return { ok: false, reason: '卡牌不存在。', events: [] };
    const check = this.canPlayCard(run, battle, instance, targetIndex);
    if (!check.ok) return { ...check, events: [] };

    const card = check.card;
    const played = CardSystem.removeFromHand(battle.deck, uid);
    battle.player.energy -= check.cost;
    const events = [];
    const context = {
      card,
      targetIndex,
      damageDealt: 0,
      killedTarget: false,
      firstAttackDamageApplied: false,
      nextAttackDamageApplied: false
    };
    let exhaust = false;

    battle.log.unshift(`打出 ${card.name}。`);
    events.push(...HeroResourceSystem.beforeCard(battle, card, context));
    for (const effect of card.activeEffects ?? []) {
      const effectEvents = this.applyCardEffect(run, battle, effect, targetIndex, card, context);
      if (effect.kind === 'exhaust') exhaust = true;
      events.push(...effectEvents);
    }

    const target = battle.enemies[targetIndex];
    if (card.type === CARD_TYPES.ATTACK && target && target.hp > 0 && (battle.player.status.attackMarkBonus ?? 0) > 0) {
      events.push(...this.applyEnemyStatus(run, battle, target, targetIndex, 'mark', battle.player.status.attackMarkBonus, card));
    }
    if (card.type === CARD_TYPES.ATTACK) battle.firstAttackPlayed = true;
    events.push(...HeroResourceSystem.afterCard(battle, card, context));

    if (exhaust) battle.deck.exhaustPile.push(played);
    else battle.deck.discardPile.push(played);

    events.push(...this.cleanupDeadEnemies(run, battle));
    events.push(...this.refreshIntents(battle));
    this.checkBattleEnd(run, battle);
    return { ok: true, card, events };
  }

  static applyCardEffect(run, battle, effect, targetIndex, card, context) {
    const events = [];
    const target = battle.enemies[targetIndex];

    if (effect.kind === 'damage') {
      for (let i = 0; i < (effect.times ?? 1); i += 1) {
        if (!target || target.hp <= 0) break;
        events.push(...this.dealCardDamage(run, battle, target, targetIndex, effect.value, card, context));
      }
    }

    if (effect.kind === 'lostHpDamage' && target && target.hp > 0) {
      const missing = Math.max(0, battle.player.maxHp - battle.player.hp);
      const base = Math.min(effect.cap ?? 99, Math.floor(missing * (effect.factor ?? 1)));
      events.push(...this.dealCardDamage(run, battle, target, targetIndex, base, card, context));
    }

    if (effect.kind === 'repeatPreviousDamageIfLowHp' && this.isLowHp(battle) && target && target.hp > 0) {
      events.push(...this.dealCardDamage(run, battle, target, targetIndex, effect.value, card, context));
    }

    if (effect.kind === 'damagePerStatus' && target && target.hp > 0) {
      const stacks = target.status[effect.status] ?? 0;
      if (stacks > 0) {
        events.push(...this.dealCardDamage(run, battle, target, targetIndex, stacks * effect.value, card, context));
      }
    }

    if (effect.kind === 'block') {
      events.push(this.gainBlock(run, battle, effect.value));
    }

    if (effect.kind === 'blockIfLowHp' && this.isLowHp(battle)) {
      events.push(this.gainBlock(run, battle, effect.value));
    }

    if (effect.kind === 'blockPerEnemyStatus') {
      const count = battle.enemies.filter((enemy) => enemy.hp > 0 && hasStatus(enemy, effect.status)).length;
      if (count > 0) events.push(this.gainBlock(run, battle, count * effect.value, false));
    }

    if (effect.kind === 'conditionalBlockMarkedEnemy') {
      if (battle.enemies.some((enemy) => enemy.hp > 0 && hasStatus(enemy, 'mark'))) {
        events.push(this.gainBlock(run, battle, effect.value, false));
      }
    }

    if (effect.kind === 'statusEnemy' && target && target.hp > 0) {
      events.push(...this.applyEnemyStatus(run, battle, target, targetIndex, effect.status, effect.value, card));
    }

    if (effect.kind === 'conditionalStatusEnemy' && target && target.hp > 0 && hasStatus(target, effect.hasStatus)) {
      events.push(...this.applyEnemyStatus(run, battle, target, targetIndex, effect.status, effect.value, card));
    }

    if (effect.kind === 'statusAllEnemies') {
      battle.enemies.forEach((enemy, index) => {
        if (enemy.hp > 0) events.push(...this.applyEnemyStatus(run, battle, enemy, index, effect.status, effect.value, card));
      });
    }

    if (effect.kind === 'statusPlayer') {
      addStatus(battle.player, effect.status, effect.value);
      battle.log.unshift(`获得 ${effect.value} 层${this.statusName(effect.status)}。`);
      events.push({ type: 'statusPlayer', status: effect.status, amount: effect.value });
    }

    if (effect.kind === 'rendMarks' && target && target.hp > 0) {
      const marks = target.status.mark ?? 0;
      if (marks > 0) {
        const dealt = this.damageEnemy(target, marks * 3);
        target.status.mark = 0;
        context.damageDealt += dealt;
        context.killedTarget = target.hp <= 0;
        battle.log.unshift(`撕裂伤痕，额外造成 ${dealt} 伤害。`);
        events.push({ type: 'enemyDamage', targetIndex, amount: dealt });
      }
    }

    if (effect.kind === 'igniteCandlemark' && target && target.hp > 0) {
      const stacks = target.status.candlemark ?? 0;
      if (stacks > 0) {
        const damage = stacks * (2 + RelicSystem.value(run, 'candleDamageBonus')) * (effect.times ?? 1);
        const dealt = this.damageEnemy(target, damage);
        context.damageDealt += dealt;
        context.killedTarget = target.hp <= 0;
        battle.log.unshift(`烛印燃烧，造成 ${dealt} 伤害。`);
        events.push({ type: 'enemyDamage', targetIndex, amount: dealt });
      }
    }

    if (effect.kind === 'draw') {
      const drawn = CardSystem.drawCards(battle.deck, effect.value, run);
      events.push(...this.handleDrawnCards(battle, drawn), { type: 'draw', amount: drawn.length });
      battle.log.unshift(`抽 ${drawn.length} 张牌。`);
    }

    if (effect.kind === 'drawIfEnemyStatus') {
      if (battle.enemies.some((enemy) => enemy.hp > 0 && hasStatus(enemy, effect.status))) {
        const drawn = CardSystem.drawCards(battle.deck, effect.value, run);
        events.push(...this.handleDrawnCards(battle, drawn), { type: 'draw', amount: drawn.length });
        battle.log.unshift(`因敌人带有${this.statusName(effect.status)}，抽 ${drawn.length} 张牌。`);
      }
    }

    if (effect.kind === 'heal') {
      events.push(this.healPlayer(battle, effect.value));
    }

    if (effect.kind === 'healIfLowHp' && this.isLowHp(battle)) {
      events.push(this.healPlayer(battle, effect.value));
    }

    if (effect.kind === 'selfLoseHp') {
      events.push(...this.activeSelfLoseHp(run, battle, effect.value));
    }

    if (effect.kind === 'gainEnergy') {
      battle.player.energy += effect.value;
      battle.log.unshift(`获得 ${effect.value} 点能量。`);
      events.push({ type: 'statusPlayer', status: 'energy', amount: effect.value });
    }

    if (effect.kind === 'killBonus' && context.killedTarget) {
      if (effect.energy) {
        battle.player.energy += effect.energy;
        battle.log.unshift(`击杀奖励：获得 ${effect.energy} 点能量。`);
        events.push({ type: 'statusPlayer', status: 'energy', amount: effect.energy });
      }
      if (effect.draw) {
        const drawn = CardSystem.drawCards(battle.deck, effect.draw, run);
        events.push(...this.handleDrawnCards(battle, drawn), { type: 'draw', amount: drawn.length });
        battle.log.unshift(`击杀奖励：抽 ${drawn.length} 张牌。`);
      }
    }

    return events.filter(Boolean);
  }

  static dealCardDamage(run, battle, target, targetIndex, base, card, context) {
    const amount = this.calculatePlayerDamage(run, battle, base, card, context);
    const dealt = this.damageEnemy(target, amount);
    context.damageDealt += dealt;
    context.killedTarget = target.hp <= 0;
    battle.log.unshift(`${card.name} 对 ${target.name} 造成 ${dealt} 伤害。`);
    return [{ type: 'enemyDamage', targetIndex, amount: dealt }];
  }

  static calculatePlayerDamage(run, battle, base, card, context) {
    let value = base + (battle.player.status.strength ?? 0) + (context.resourceFlatDamage ?? 0);
    if (card.type === CARD_TYPES.ATTACK) {
      value += RelicSystem.value(run, 'attackDamage');
      value += VowSystem.value(run, 'attackDamage');
      if (this.isLowHp(battle)) value += RelicSystem.value(run, 'lowHpAttackDamage');
      if (!battle.firstAttackPlayed && !context.firstAttackDamageApplied) {
        value += RelicSystem.value(run, 'firstAttackDamage');
        context.firstAttackDamageApplied = true;
      }
      if ((battle.player.status.attackDamageNext ?? 0) > 0 && !context.nextAttackDamageApplied) {
        value += battle.player.status.attackDamageNext;
        battle.player.status.attackDamageNext = 0;
        context.nextAttackDamageApplied = true;
      }
    }
    if ((battle.player.status.weak ?? 0) > 0) value *= 0.75;
    value *= context.resourceDamageMultiplier ?? 1;
    return Math.max(0, Math.floor(value));
  }

  static damageEnemy(enemy, amount) {
    let value = Math.max(0, Math.floor(amount));
    if ((enemy.status.vulnerable ?? 0) > 0) value = Math.floor(value * 1.5);
    const blocked = Math.min(enemy.block, value);
    enemy.block -= blocked;
    value -= blocked;
    enemy.hp = Math.max(0, enemy.hp - value);
    return value + blocked;
  }

  static damagePlayer(run, battle, amount) {
    let value = Math.max(0, Math.floor(amount));
    if ((battle.player.status.vulnerable ?? 0) > 0) value = Math.floor(value * 1.5);

    const nextReduction = battle.player.status.nextDamageReduction ?? 0;
    if (nextReduction > 0) {
      value = Math.max(0, value - nextReduction);
      battle.player.status.nextDamageReduction = 0;
    }

    const firstReduction = RelicSystem.value(run, 'firstDamageReduction');
    if (!battle.firstDamageReducedThisTurn && firstReduction > 0) {
      value = Math.max(0, value - firstReduction);
      battle.firstDamageReducedThisTurn = true;
    }

    const blocked = Math.min(battle.player.block, value);
    battle.player.block -= blocked;
    value -= blocked;
    battle.player.hp = Math.max(0, battle.player.hp - value);
    return value + blocked;
  }

  static gainBlock(run, battle, value, allowFirstBlock = true) {
    let amount = value;
    if (allowFirstBlock && !battle.firstBlockUsed) amount += RelicSystem.value(run, 'firstBlock');
    if (allowFirstBlock) battle.firstBlockUsed = true;
    battle.player.block += amount;
    battle.log.unshift(`获得 ${amount} 护甲。`);
    return { type: 'block', amount };
  }

  static healPlayer(battle, value) {
    const before = battle.player.hp;
    battle.player.hp = clamp(battle.player.hp + value, 0, battle.player.maxHp);
    const healed = battle.player.hp - before;
    battle.log.unshift(`回复 ${healed} 生命。`);
    return { type: 'heal', amount: healed };
  }

  static activeSelfLoseHp(run, battle, value) {
    const events = [];
    const amount = Math.min(value, Math.max(0, battle.player.hp - 1));
    battle.player.hp -= amount;
    battle.log.unshift(`失去 ${amount} 生命。`);
    events.push({ type: 'playerDamage', amount });
    events.push(...HeroResourceSystem.onSelfLoseHp(battle, amount));

    const flaskHeal = RelicSystem.value(run, 'selfLoseHpHeal');
    if (flaskHeal > 0) events.push(this.healPlayer(battle, flaskHeal));

    const attackNext = RelicSystem.value(run, 'selfLoseHpAttackNext');
    if (attackNext > 0) {
      addStatus(battle.player, 'attackDamageNext', attackNext);
      events.push({ type: 'statusPlayer', status: 'attackDamageNext', amount: attackNext });
    }
    return events;
  }

  static applyEnemyStatus(run, battle, enemy, targetIndex, status, value, card) {
    const events = [];
    const extra =
      RelicSystem.value(run, 'statusEnemy') +
      (status === 'mark' ? RelicSystem.value(run, 'markBonus') : 0);
    const amount = value + extra;
    addStatus(enemy, status, amount);
    battle.log.unshift(`${enemy.name} 获得 ${amount} 层${this.statusName(status)}。`);
    events.push({ type: 'statusEnemy', targetIndex, status, amount });

    if (status === 'weak') {
      const bonusDamage = RelicSystem.value(run, 'weakDamage');
      if (bonusDamage > 0 && enemy.hp > 0) {
        const dealt = this.damageEnemy(enemy, bonusDamage);
        battle.log.unshift(`猎巫火钳灼伤 ${enemy.name}，造成 ${dealt} 伤害。`);
        events.push({ type: 'enemyDamage', targetIndex, amount: dealt });
      }
    }
    return events;
  }

  static endPlayerTurn(run, battle) {
    if (battle.ended) return [];
    const events = [];

    if ((battle.player.status.endTurnLoseHp ?? 0) > 0) {
      events.push(...this.activeSelfLoseHp(run, battle, battle.player.status.endTurnLoseHp));
      battle.player.status.endTurnLoseHp = 0;
    }

    CardSystem.discardHand(battle.deck);
    battle.log.unshift('敌人回合开始。');

    for (const enemy of battle.enemies) {
      if (enemy.hp <= 0) continue;
      enemy.block = 0;
      const action = enemy.currentAction;
      events.push(...this.resolveEnemyAction(run, battle, enemy, action));
      enemy.turnsTaken += 1;
      if (battle.player.hp <= 0) break;
    }

    for (let i = 0; i < battle.enemies.length; i += 1) {
      const enemy = battle.enemies[i];
      if (enemy.hp <= 0) continue;
      const stacks = enemy.status.candlemark ?? 0;
      if (stacks > 0) {
        const dealt = this.damageEnemy(enemy, stacks * (2 + RelicSystem.value(run, 'candleDamageBonus')));
        battle.log.unshift(`${enemy.name} 的烛印燃烧，受到 ${dealt} 伤害。`);
        events.push({ type: 'enemyDamage', targetIndex: i, amount: dealt });
      }
      reduceStatus(enemy, 'weak');
      reduceStatus(enemy, 'vulnerable');
    }

    reduceStatus(battle.player, 'weak');
    reduceStatus(battle.player, 'vulnerable');
    events.push(...this.cleanupDeadEnemies(run, battle));
    this.checkBattleEnd(run, battle);
    if (!battle.ended) events.push(...this.startPlayerTurn(run, battle));
    return events;
  }

  static resolveEnemyAction(run, battle, enemy, action) {
    const events = [];
    if (!action) return events;
    const enemyIndex = battle.enemies.indexOf(enemy);
    battle.log.unshift(`${enemy.name} 使用 ${action.name}。`);

    if (action.chargeWindup) {
      events.push({ type: 'enemyCharge', enemyId: enemy.id, enemyUid: enemy.uid, name: action.name });
    }

    if (action.damage) {
      for (let i = 0; i < (action.times ?? 1); i += 1) {
        let damage = action.damage + (enemy.status.strength ?? 0);
        if ((enemy.status.weak ?? 0) > 0) damage = Math.floor(damage * 0.75);
        const dealt = this.damagePlayer(run, battle, damage);
        events.push({ type: 'playerDamage', amount: dealt, enemyId: enemy.id, enemyUid: enemy.uid });

        const counter = battle.player.status.counterMark ?? 0;
        if (counter > 0 && enemy.hp > 0) {
          addStatus(enemy, 'mark', counter + RelicSystem.value(run, 'markBonus'));
          events.push({ type: 'statusEnemy', targetIndex: enemyIndex, status: 'mark', amount: counter });
        }
      }
    }

    if (action.block) {
      enemy.block += action.block;
      events.push({ type: 'enemyBlock', enemyId: enemy.id, enemyUid: enemy.uid, amount: action.block });
    }
    if (action.heal) {
      const before = enemy.hp;
      enemy.hp = clamp(enemy.hp + action.heal, 0, enemy.maxHp);
      events.push({ type: 'enemyHeal', enemyId: enemy.id, enemyUid: enemy.uid, amount: enemy.hp - before });
    }
    if (action.strength) {
      addStatus(enemy, 'strength', action.strength);
      events.push({ type: 'enemyBuff', enemyId: enemy.id, enemyUid: enemy.uid, status: 'strength', amount: action.strength });
    }
    if (action.targetStatus) {
      events.push(...this.applyPlayerStatusFromEnemy(run, battle, action.targetStatus, action.statusValue ?? 1));
    }
    if (action.targetStatus2) {
      events.push(...this.applyPlayerStatusFromEnemy(run, battle, action.targetStatus2, action.statusValue2 ?? 1));
    }
    if (action.addCardToDraw) {
      battle.deck.drawPile.push({ uid: `enemy-card-${Date.now()}-${battle.deck.drawPile.length}`, cardId: action.addCardToDraw, upgraded: false });
      events.push({ type: 'addCard', cardId: action.addCardToDraw });
      battle.log.unshift(`${action.addCardToDraw === 'curse-rot' ? '腐败' : '伤口'}被洗入抽牌堆。`);
    }
    if (action.summon && battle.enemies.filter((target) => target.hp > 0).length < 3) {
      const summoned = cloneEnemy(getEnemy(action.summon), run, battle.battleType);
      summoned.hp = 24;
      summoned.maxHp = 24;
      summoned.summoned = true;
      summoned.summonerId = enemy.id;
      battle.enemies.push(summoned);
      events.push({ type: 'summon', enemy: summoned });
      battle.log.unshift(`${enemy.name} 召唤了 ${summoned.name}。`);
    }
    return events;
  }

  static applyPlayerStatusFromEnemy(run, battle, status, amount) {
    if (status === 'weak' && RelicSystem.value(run, 'immuneWeakOnce') > 0 && !battle.immuneWeakUsed) {
      battle.immuneWeakUsed = true;
      battle.log.unshift('黑铁面具抵消了第一次虚弱。');
      return [{ type: 'statusPlayer', status: 'immuneWeakOnce', amount: 0 }];
    }
    addStatus(battle.player, status, amount);
    battle.log.unshift(`你获得 ${amount} 层${this.statusName(status)}。`);
    return [{ type: 'statusPlayer', status, amount }];
  }

  static cleanupDeadEnemies(run, battle) {
    const events = [];
    for (const enemy of battle.enemies) {
      if (enemy.hp <= 0 && !enemy.countedDead) {
        enemy.countedDead = true;
        run.kills += 1;
        if (enemy.type === 'elite') run.elitesKilled += 1;
        battle.log.unshift(`${enemy.name} 被击败。`);
        const block = RelicSystem.value(run, 'enemyDeathBlock');
        if (block > 0) {
          battle.player.block += block;
          battle.log.unshift(`修道院铃响起，获得 ${block} 护甲。`);
          events.push({ type: 'block', amount: block });
        }
      }
    }
    return events;
  }

  static checkBattleEnd(run, battle) {
    if (battle.player.hp <= 0) {
      battle.ended = true;
      battle.won = false;
      return;
    }
    if (battle.enemies.every((enemy) => enemy.hp <= 0)) {
      battle.ended = true;
      battle.won = true;
      run.battlesWon += 1;
    }
  }

  static syncRun(run, battle) {
    run.hp = clamp(battle.player.hp, 0, run.maxHp);
  }

  static isLowHp(battle) {
    return battle.player.hp / Math.max(1, battle.player.maxHp) < 0.5;
  }

  static statusName(status) {
    return (
      {
        mark: '伤痕',
        candlemark: '烛印',
        weak: '虚弱',
        vulnerable: '易伤',
        strength: '力量',
        attackMarkBonus: '血誓',
        counterMark: '反击',
        nextDamageReduction: '蜡像',
        endTurnLoseHp: '灰血灼烧',
        noAttack: '铅皮',
        attackDamageNext: '药瓶',
        energy: '能量',
        immuneWeakOnce: '免疫虚弱'
      }[status] ?? status
    );
  }
}
