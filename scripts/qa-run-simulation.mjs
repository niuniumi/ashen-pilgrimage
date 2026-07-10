import fs from 'node:fs';
import path from 'node:path';

import { getPlayableRewardCards } from '../src/data/cards.js';
import { characters } from '../src/data/characters.js';
import { getProductionRelics } from '../src/data/relics.js';
import { CARD_TYPES } from '../src/game/constants.js';
import { createCardInstance, createNewRun } from '../src/game/GameState.js';
import { BattleSystem } from '../src/systems/BattleSystem.js';
import { CardSystem } from '../src/systems/CardSystem.js';
import { VowSystem } from '../src/systems/VowSystem.js';

const root = process.cwd();
const report = { generatedAt: new Date().toISOString(), simulations: 0, outcomes: {}, errors: [] };

function assertFiniteBattle(battle, label) {
  const values = [battle.player.hp, battle.player.maxHp, battle.player.energy, battle.player.block];
  for (const enemy of battle.enemies) values.push(enemy.hp, enemy.maxHp, enemy.block);
  if (!values.every(Number.isFinite)) throw new Error(`${label}: non-finite battle value`);
}

function targetIndex(battle) {
  const index = battle.enemies.findIndex((enemy) => enemy.hp > 0);
  return index >= 0 ? index : null;
}

function expectedIncomingDamage(battle) {
  return battle.enemies.reduce((total, enemy) => {
    if (enemy.hp <= 0) return total;
    const action = enemy.currentAction ?? {};
    const perHit = Math.max(0, Number(action.damage ?? 0) + Number(enemy.status?.strength ?? 0));
    return total + perHit * Math.max(1, Number(action.times ?? 1));
  }, 0);
}

function cardPriority(instance, battle) {
  const card = CardSystem.getDisplayCard(instance);
  const effects = card.activeEffects ?? [];
  const incoming = expectedIncomingDamage(battle);
  const needsDefense = incoming > battle.player.block + 4;
  const providesBlock = effects.some((effect) => String(effect.kind).toLowerCase().includes('block'));
  const providesHeal = effects.some((effect) => String(effect.kind).toLowerCase().includes('heal'));
  if (needsDefense && providesBlock) return 0;
  if (battle.player.hp / battle.player.maxHp < 0.46 && providesHeal) return 0;
  if (card.type === CARD_TYPES.ATTACK || card.type === CARD_TYPES.SPELL) return 1;
  if (card.type === CARD_TYPES.SKILL) return 2;
  if (card.type === CARD_TYPES.DEFENSE) return 3;
  return 4;
}

function autoplay(run, battle, label) {
  for (let turn = 0; turn < 45 && !battle.ended; turn += 1) {
    let actions = 0;
    while (!battle.ended && actions < 24) {
      const target = targetIndex(battle);
      const candidates = [...battle.deck.hand].sort((a, b) => cardPriority(a, battle) - cardPriority(b, battle));
      const playable = candidates.find((instance) => {
        const card = CardSystem.getDisplayCard(instance);
        const selectedTarget = card.requiresTarget ? target : null;
        return BattleSystem.canPlayCard(run, battle, instance, selectedTarget).ok;
      });
      if (!playable) break;
      const card = CardSystem.getDisplayCard(playable);
      const result = BattleSystem.useCard(run, battle, playable.uid, card.requiresTarget ? target : null);
      if (!result.ok) throw new Error(`${label}: playable card rejected (${result.reason})`);
      actions += 1;
      assertFiniteBattle(battle, label);
    }
    if (!battle.ended) BattleSystem.endPlayerTurn(run, battle);
    assertFiniteBattle(battle, label);
  }
  return battle.won ? 'won' : battle.player.hp <= 0 ? 'lost' : 'timeout';
}

function prepareJourneyState(run, characterId, battleType, sample) {
  const rewardCount = battleType === 'boss' ? 4 : battleType === 'elite' ? 1 : 0;
  const upgradeCount = battleType === 'boss' ? 4 : battleType === 'elite' ? 1 : 0;
  const relicCount = battleType === 'boss' ? 2 : battleType === 'elite' ? 1 : 0;
  const cardPool = getPlayableRewardCards(characterId).sort((a, b) => a.id.localeCompare(b.id));
  for (let i = 0; i < rewardCount; i += 1) {
    const card = cardPool[(sample * 3 + i * 7) % cardPool.length];
    run.deck.push(createCardInstance(card.id));
  }
  for (let i = 0; i < upgradeCount; i += 1) {
    const candidates = run.deck.filter((card) => !card.upgraded);
    if (candidates.length === 0) break;
    candidates[(sample + i * 3) % candidates.length].upgraded = true;
  }
  const relicPool = getProductionRelics().sort((a, b) => a.id.localeCompare(b.id));
  run.relics = Array.from({ length: relicCount }, (_, index) => relicPool[(sample + index * 5) % relicPool.length].id);
  run.floor = battleType === 'boss' ? 11 : battleType === 'elite' ? 6 : 1;
  run.hp = run.maxHp;
}

for (const character of characters) {
  report.outcomes[character.id] = {};
  for (const battleType of ['battle', 'elite', 'boss']) {
    const outcomes = { won: 0, lost: 0, timeout: 0 };
    for (let sample = 0; sample < 20; sample += 1) {
      const seed = 1000 + sample * 97 + character.id.length * 13 + battleType.length;
      const run = createNewRun(character.id, { seed });
      prepareJourneyState(run, character.id, battleType, sample);
      const vow = VowSystem.getOffer(run, 1)[sample % 3];
      if (vow) VowSystem.apply(run, vow.id);
      const battle = BattleSystem.createBattle(run, battleType);
      const outcome = autoplay(run, battle, `${character.id}/${battleType}/${seed}`);
      outcomes[outcome] += 1;
      report.simulations += 1;
    }
    report.outcomes[character.id][battleType] = outcomes;
  }
}

for (const [characterId, groups] of Object.entries(report.outcomes)) {
  if (groups.battle.won === 0) report.errors.push(`${characterId}: autoplay never won a normal battle`);
  if (groups.battle.timeout > 2) report.errors.push(`${characterId}: too many normal battle timeouts`);
  if (groups.boss.won < 4) report.errors.push(`${characterId}: boss-ready decks won fewer than 4 of 20 samples`);
}

fs.writeFileSync(path.join(root, 'qa', 'run-simulation-report.json'), JSON.stringify(report, null, 2), 'utf8');
if (report.errors.length > 0) {
  console.error(JSON.stringify(report, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ ok: true, simulations: report.simulations, outcomes: report.outcomes }, null, 2));
}
