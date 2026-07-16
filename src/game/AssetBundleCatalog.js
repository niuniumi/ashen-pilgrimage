import { PIXEL_ACTORS, PIXEL_ASSETS, PIXEL_DECORATIONS, resolvePixelActorAsset } from '../art/PixelAssetCatalog.js';
import { characters } from '../data/characters.js';
import { ENCOUNTER_POOLS } from '../data/encounters.js';
import { enemies } from '../data/enemies.js';
import { createBgmAsset, createSfxPoolAssets } from './AudioCatalog.js';
import { SCENES } from './constants.js';

const DEFAULT_ACT = 1;
const DEFAULT_CHARACTER_ID = characters[0].id;
const CHARACTER_IDS = new Set(characters.map((character) => character.id));
const ENEMIES_BY_ID = new Map(enemies.map((enemy) => [enemy.id, enemy]));
const SHARED_SFX = ['ui-click', 'ui-hover', 'dialog-open', 'dialog-close', 'error'];
const COMBAT_SFX = ['card-play', 'attack', 'block', 'hit', 'turn', 'heal', 'buff', 'debuff', 'success', 'fail'];
const STORY_SFX = ['page'];

function audioPools(names) {
  return names.flatMap((name) => createSfxPoolAssets(name));
}

const STATIC_BUNDLES = {
  boot: {
    images: [],
    audio: [createBgmAsset('menu'), ...audioPools(SHARED_SFX)]
  },
  menu: {
    images: [PIXEL_ASSETS.menu],
    audio: [createBgmAsset('menu')]
  },
  'character-select': {
    images: [PIXEL_ASSETS.folio, ...characters.map((character) => PIXEL_ACTORS[character.id])],
    audio: [createBgmAsset('menu'), ...audioPools(['card-select'])]
  },
  folio: {
    images: [PIXEL_ASSETS.folio],
    audio: []
  },
  'story-audio': {
    images: [],
    audio: [createBgmAsset('map-act-2'), ...audioPools(STORY_SFX)]
  },
  'story-sfx': {
    images: [],
    audio: audioPools(STORY_SFX)
  },
  'rest-audio': {
    images: [],
    audio: [createBgmAsset('map-act-1'), ...audioPools(['heal', 'relic'])]
  },
  'reward-audio': {
    images: [],
    audio: [...audioPools(['coin', 'card-select', 'relic', 'success'])]
  },
  'coin-sfx': {
    images: [],
    audio: audioPools(['coin'])
  },
  'relic-sfx': {
    images: [],
    audio: audioPools(['relic'])
  },
  'success-sfx': {
    images: [],
    audio: audioPools(['success'])
  },
  'result-victory': {
    images: [],
    audio: [createBgmAsset('map-act-2'), ...audioPools(['success'])]
  },
  'result-defeat': {
    images: [PIXEL_DECORATIONS.defeatTombstone],
    audio: [createBgmAsset('map-act-3'), ...audioPools(['fail'])]
  },
  codex: {
    images: Object.values(PIXEL_ACTORS),
    audio: []
  }
};

function normalizeAct(value) {
  const act = Math.trunc(Number(value));
  return ENCOUNTER_POOLS[act] ? act : DEFAULT_ACT;
}

function normalizeCharacterId(value) {
  return CHARACTER_IDS.has(value) ? value : DEFAULT_CHARACTER_ID;
}

function uniqueByKey(assets) {
  const seen = new Set();
  return assets.filter((asset) => {
    if (!asset || seen.has(asset.key)) return false;
    seen.add(asset.key);
    return true;
  });
}

function enemyAssetsForAct(act, battleType) {
  const pools = ENCOUNTER_POOLS[act];
  const encounterGroups = battleType === 'boss'
    ? pools.boss
    : [...pools.battle, ...pools.elite];
  const pendingEnemyIds = encounterGroups.flat();
  const enemyIds = new Set();

  while (pendingEnemyIds.length > 0) {
    const enemyId = pendingEnemyIds.shift();
    if (!enemyId || enemyIds.has(enemyId)) continue;
    enemyIds.add(enemyId);

    const enemy = ENEMIES_BY_ID.get(enemyId);
    for (const action of enemy?.actions ?? []) {
      if (action.summon && !enemyIds.has(action.summon)) pendingEnemyIds.push(action.summon);
    }
  }

  return uniqueByKey(
    [...enemyIds]
      .map((enemyId) => resolvePixelActorAsset(enemyId)?.asset)
  );
}

function createActBundle(name) {
  const match = /^(map|battle|boss)-act-([1-3])$/.exec(name);
  if (!match) return null;
  const [, kind, actText] = match;
  const act = Number(actText);

  if (kind === 'map') {
    return {
      images: [PIXEL_ASSETS.map],
      audio: [createBgmAsset(`map-act-${act}`)]
    };
  }

  const boss = kind === 'boss';
  return {
    images: [PIXEL_ASSETS[`battle${act}`], ...enemyAssetsForAct(act, boss ? 'boss' : 'battle')],
    audio: [
      createBgmAsset(boss ? 'boss' : `battle-act-${act}`),
      ...audioPools([...COMBAT_SFX, ...(boss ? ['boss'] : [])])
    ]
  };
}

function createHeroBundle(name) {
  if (!name.startsWith('hero-')) return null;
  const characterId = name.slice('hero-'.length);
  if (!CHARACTER_IDS.has(characterId)) return null;
  return { images: [PIXEL_ACTORS[characterId]], audio: [] };
}

function resolveBundle(name) {
  return STATIC_BUNDLES[name] ?? createActBundle(name) ?? createHeroBundle(name);
}

export function getSceneBundleNames(sceneKey, context = {}) {
  const act = normalizeAct(context.act);
  const heroBundle = `hero-${normalizeCharacterId(context.characterId)}`;

  switch (sceneKey) {
    case SCENES.Preload:
      return ['boot'];
    case SCENES.MainMenu:
      return ['menu'];
    case SCENES.Guide:
    case SCENES.Settings:
      return ['menu', 'folio'];
    case SCENES.CharacterSelect:
      return ['character-select'];
    case SCENES.Map:
      return [`map-act-${act}`];
    case SCENES.Battle:
      return [context.battleType === 'boss' ? `boss-act-${act}` : `battle-act-${act}`, heroBundle];
    case SCENES.BossIntro:
      return [`boss-act-${act}`, 'story-sfx'];
    case SCENES.Result:
      return context.victory === false ? ['result-defeat'] : ['result-victory', heroBundle];
    case SCENES.Rest:
      return ['folio', 'rest-audio'];
    case SCENES.Shop:
      return ['folio', 'rest-audio', 'coin-sfx'];
    case SCENES.Chest:
      return ['folio', 'rest-audio'];
    case SCENES.Reward:
      return ['folio', 'story-audio', 'reward-audio'];
    case SCENES.Codex:
      return ['folio', 'story-audio', 'codex'];
    case SCENES.Vow:
      return ['folio', 'story-audio', 'relic-sfx'];
    case SCENES.ActClear:
      return ['folio', 'story-audio', 'success-sfx'];
    case SCENES.Prologue:
    case SCENES.Event:
      return ['folio', 'story-audio'];
    default:
      return ['folio'];
  }
}

export function resolveAssetBundles(bundleNames = []) {
  const images = [];
  const audio = [];

  for (const name of bundleNames) {
    const bundle = resolveBundle(name);
    if (!bundle) throw new Error(`Unknown asset bundle: ${name}`);
    images.push(...bundle.images);
    audio.push(...bundle.audio);
  }

  return {
    images: uniqueByKey(images),
    audio: uniqueByKey(audio)
  };
}
