import { events } from '../data/events.js';
import { getCard, getPlayableRewardCards } from '../data/cards.js';
import { createCardInstance } from '../game/GameState.js';
import { choice as seededChoice, normalizeRngState } from '../game/RunRng.js';
import { choice, clamp } from '../game/random.js';
import { runChoice } from '../game/RunRandom.js';
import { CardSystem } from './CardSystem.js';
import { RelicSystem } from './RelicSystem.js';

export class EventSystem {
  static randomEvent(run = null) {
    if (!run) return choice(events);
    const act = run.act ?? run.map?.act ?? 1;
    const eligible = events.filter((event) => {
      const actMatches = !event.acts || event.acts.includes(act);
      const characterMatches = !event.character || event.character === run.characterId;
      return actMatches && characterMatches;
    });
    const history = Array.isArray(run.eventHistory) ? run.eventHistory : [];
    const recent = new Set(history.slice(-2));
    const fresh = eligible.filter((event) => !recent.has(event.id));
    const pool = fresh.length > 0 ? fresh : eligible;
    const picked = seededChoice(normalizeRngState(run.rngState, run.seed), pool);
    run.rngState = picked.state;
    if (picked.value) run.eventHistory = [...history, picked.value.id].slice(-6);
    return picked.value ?? events[0];
  }

  static canChoose(run, option) {
    if (!option.condition) return true;
    if (option.condition.gold && run.gold < option.condition.gold) return false;
    return true;
  }

  static apply(run, option) {
    const notes = [];
    for (const effect of option.effects ?? []) {
      if (effect.kind === 'loseHp') {
        run.hp = clamp(run.hp - effect.value, 1, run.maxHp);
        notes.push(`失去 ${effect.value} 生命`);
      }
      if (effect.kind === 'heal') {
        run.hp = clamp(run.hp + effect.value, 0, run.maxHp);
        notes.push(`回复 ${effect.value} 生命`);
      }
      if (effect.kind === 'healPercent') {
        const amount = Math.ceil(run.maxHp * effect.value);
        run.hp = clamp(run.hp + amount, 0, run.maxHp);
        notes.push(`回复 ${amount} 生命`);
      }
      if (effect.kind === 'gold') {
        const value = effect.value > 0 ? RelicSystem.goldWithBonus(run, effect.value, { includeRewardFlat: false }) : effect.value;
        run.gold = Math.max(0, run.gold + value);
        notes.push(value >= 0 ? `获得 ${value} 金币` : `失去 ${Math.abs(value)} 金币`);
      }
      if (effect.kind === 'randomRelic') {
        const relic = RelicSystem.addRandom(run);
        if (relic) notes.push(`获得遗物：${relic.name}`);
      }
      if (effect.kind === 'addDeckCard') {
        const card = getCard(effect.cardId);
        run.deck.push(createCardInstance(effect.cardId));
        notes.push(`加入卡牌：${card.name}`);
      }
      if (effect.kind === 'addRandomCard') {
        const card = runChoice(run, getPlayableRewardCards(run.characterId));
        if (card) {
          run.deck.push(createCardInstance(card.id));
          notes.push(`加入卡牌：${card.name}`);
        }
      }
      if (effect.kind === 'removeBasicCard') {
        const removed = CardSystem.removeFirstBasic(run);
        notes.push(removed ? `移除卡牌：${getCard(removed.cardId).name}` : '没有可移除的基础牌');
      }
      if (effect.kind === 'upgradeRandomCard') {
        const upgraded = CardSystem.upgradeRandom(run);
        notes.push(upgraded ? `升级卡牌：${getCard(upgraded.cardId).name}` : '没有可升级的卡牌');
      }
      if (effect.kind === 'upgradeByType') {
        const upgraded = CardSystem.upgradeRandom(run, (card) => card.type === effect.type);
        notes.push(upgraded ? `升级卡牌：${getCard(upgraded.cardId).name}` : `没有可升级的${effect.type}牌`);
      }
      if (effect.kind === 'runStrength') {
        run.runStrength = (run.runStrength ?? 0) + effect.value;
        notes.push(`永久力量 +${effect.value}`);
      }
      if (effect.kind === 'storyFlag') {
        run.storyFlags ??= [];
        if (!run.storyFlags.includes(effect.value)) {
          run.storyFlags.push(effect.value);
          notes.push('旅途记忆发生改变');
        }
      }
      if (effect.kind === 'maxHp') {
        run.maxHp = Math.max(1, run.maxHp + effect.value);
        run.hp = Math.max(1, Math.min(run.maxHp, run.hp + effect.value));
        notes.push(`最大生命 ${effect.value >= 0 ? '+' : ''}${effect.value}`);
      }
    }
    return notes;
  }
}
