import { findCharacter } from '../data/characters.js';
import { MapSystem } from '../systems/MapSystem.js';
import { CURRENT_RUN_VERSION } from './RunMigration.js';
import { createRngState } from './RunRng.js';

let nextUid = 1;

export function createCardInstance(cardId, upgraded = false) {
  nextUid += 1;
  return {
    uid: `card-${Date.now()}-${nextUid}`,
    cardId,
    upgraded
  };
}

export function cloneCardInstance(instance) {
  return createCardInstance(instance.cardId, Boolean(instance.upgraded));
}

export function createNewRun(characterId, options = {}) {
  const character = findCharacter(characterId);
  if (!character) throw new Error(`Invalid characterId: ${characterId}`);
  const deck = character.startingDeck.map((cardId) => createCardInstance(cardId));
  const maxHp = character.maxHp ?? character.hp;
  const energyMax = character.energyMax ?? character.energy;
  const seed = Number.isFinite(options.seed) ? Number(options.seed) >>> 0 : Date.now() >>> 0;
  const generatedMap = MapSystem.createSeededMap(1, createRngState(seed));
  return {
    version: CURRENT_RUN_VERSION,
    id: `run-${Date.now()}`,
    seed,
    rngState: generatedMap.state,
    characterId: character.id,
    characterName: character.name,
    characterNameEn: character.nameEn ?? character.englishName,
    battleSpriteKey: character.battleSpriteKey,
    portraitKey: character.portraitKey,
    maxHp,
    hp: maxHp,
    baseEnergy: energyMax,
    startingDeckIds: [...character.startingDeck],
    gold: 60,
    deck,
    relics: [],
    vows: [],
    runStrength: 0,
    act: 1,
    actPage: 0,
    map: generatedMap.map,
    floor: 0,
    kills: 0,
    elitesKilled: 0,
    battlesWon: 0,
    startTime: Date.now(),
    lastBattleType: null,
    rewardClaimed: false,
    victoryCount: 0,
    failureCount: 0,
    highestFloor: 0,
    log: []
  };
}

export function sanitizeRunNumbers(run) {
  const numericFields = ['hp', 'maxHp', 'baseEnergy', 'gold', 'floor', 'kills', 'elitesKilled', 'battlesWon', 'runStrength'];
  for (const field of numericFields) {
    if (!Number.isFinite(run[field])) run[field] = 0;
  }
  run.hp = Math.max(0, Math.min(run.hp, run.maxHp || 1));
  run.gold = Math.max(0, run.gold);
  return run;
}
