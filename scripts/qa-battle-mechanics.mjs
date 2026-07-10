import { getCard } from '../src/data/cards.js';
import { createCardInstance, createNewRun } from '../src/game/GameState.js';
import { BattleSystem } from '../src/systems/BattleSystem.js';

function assert(value, message) {
  if (!value) {
    throw new Error(message);
  }
}

function cardInstance(cardId) {
  return createCardInstance(cardId);
}

function newKnightBattle() {
  const run = createNewRun('exiled-knight');
  const battle = BattleSystem.createBattle(run, 'battle');
  return { run, battle };
}

function forceHand(battle, cardId) {
  const instance = cardInstance(cardId);
  battle.deck.hand = [instance];
  battle.deck.drawPile = battle.deck.drawPile.filter((card) => card.uid !== instance.uid);
  battle.deck.discardPile = [];
  battle.deck.exhaustPile = [];
  battle.player.energy = 3;
  return instance;
}

function firstLivingEnemy(battle) {
  const index = battle.enemies.findIndex((enemy) => enemy.hp > 0);
  return { index, enemy: battle.enemies[index] };
}

function verifyAttackCardDamagesEnemy() {
  const { run, battle } = newKnightBattle();
  const instance = forceHand(battle, 'knight-cleave');
  const { index, enemy } = firstLivingEnemy(battle);
  const hpBefore = enemy.hp;
  const energyBefore = battle.player.energy;
  const result = BattleSystem.useCard(run, battle, instance.uid, index);
  const card = getCard('knight-cleave');

  assert(result.ok, `attack card should play: ${result.reason ?? 'unknown'}`);
  assert(enemy.hp < hpBefore, 'attack card should reduce enemy hp');
  assert(battle.player.energy === energyBefore - card.cost, 'attack card should spend energy');
  assert(battle.deck.hand.length === 0, 'played card should leave hand');
  assert(battle.deck.discardPile.length === 1, 'played non-exhaust card should enter discard pile');
  assert(result.events.some((event) => event.type === 'enemyDamage'), 'attack card should emit enemyDamage event');
}

function verifyDefenseCardAddsBlock() {
  const { run, battle } = newKnightBattle();
  const instance = forceHand(battle, 'knight-block');
  const blockBefore = battle.player.block;
  const result = BattleSystem.useCard(run, battle, instance.uid);

  assert(result.ok, `defense card should play: ${result.reason ?? 'unknown'}`);
  assert(battle.player.block > blockBefore, 'defense card should increase player block');
  assert(result.events.some((event) => event.type === 'block'), 'defense card should emit block event');
}

function verifyEnergyGateBlocksUnaffordableCard() {
  const { run, battle } = newKnightBattle();
  const instance = forceHand(battle, 'knight-execution');
  battle.player.energy = 0;
  const { index } = firstLivingEnemy(battle);
  const result = BattleSystem.useCard(run, battle, instance.uid, index);

  assert(!result.ok, 'card should not play without enough energy');
  assert(battle.deck.hand.length === 1, 'unplayed card must remain in hand');
}

function verifyEnemyTurnAdvancesBackToPlayer() {
  const { run, battle } = newKnightBattle();
  battle.deck.hand = [cardInstance('knight-block')];
  battle.enemies.forEach((enemy) => {
    enemy.currentAction = { name: 'QA attack', intent: 'attack', damage: 1, text: 'QA attack' };
  });
  const turnBefore = battle.turn;
  const events = BattleSystem.endPlayerTurn(run, battle);

  assert(battle.turn === turnBefore + 1 || battle.ended, 'enemy turn should advance to next player turn unless battle ends');
  assert(battle.deck.hand.length > 0 || battle.ended, 'next player turn should draw cards unless battle ends');
  assert(events.some((event) => event.type === 'playerDamage') || battle.player.block > 0 || battle.ended, 'enemy turn should resolve enemy actions');
}

verifyAttackCardDamagesEnemy();
verifyDefenseCardAddsBlock();
verifyEnergyGateBlocksUnaffordableCard();
verifyEnemyTurnAdvancesBackToPlayer();

console.log(JSON.stringify({ ok: true }, null, 2));
