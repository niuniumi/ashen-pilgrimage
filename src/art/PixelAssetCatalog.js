export const PIXEL_ASSETS = {
  menu: { key: 'pixel-bg-menu', url: 'assets/pixel/backgrounds/menu.png' },
  map: { key: 'pixel-bg-map', url: 'assets/pixel/backgrounds/map.png' },
  folio: { key: 'pixel-bg-folio', url: 'assets/pixel/backgrounds/folio.png' },
  battle1: { key: 'pixel-bg-battle-1', url: 'assets/pixel/backgrounds/battle-act-1.png' },
  battle2: { key: 'pixel-bg-battle-2', url: 'assets/pixel/backgrounds/battle-act-2.png' },
  battle3: { key: 'pixel-bg-battle-3', url: 'assets/pixel/backgrounds/battle-act-3.png' }
};

const directActorNames = [
  'exiled-knight',
  'candle-nun',
  'ashblood-alchemist',
  'broken-militia',
  'grave-skeleton',
  'black-hound',
  'candle-monk',
  'pointed-witch',
  'plague-doctor',
  'gutter-fire-archer',
  'reliquary-jailer',
  'iron-maiden-nun',
  'headless-grave-knight',
  'pale-wax-matron',
  'hollow-crown-regent',
  'scripture-moth-swarm'
];

const enemyAtlasNames = [
  'rotting-villager',
  'plague-rat-swarm',
  'crow-messenger',
  'armor-broken-militia',
  'fallen-paladin',
  'wax-novice',
  'cinder-acolyte',
  'bell-tower-sentry',
  'choir-exorcist',
  'ash-veiled-prioress',
  'hollow-spearman',
  'ashen-banneret',
  'crownless-hound',
  'gate-iron-vicar',
  'royal-pyre-knight',
  'clockwork-confessor'
];

export const PIXEL_ATLASES = {
  enemiesV2: {
    key: 'pixel-enemies-atlas-v2',
    url: 'assets/pixel/actors/gothic-enemies-atlas-v2.png',
    columns: 4,
    rows: 4,
    framePrefix: 'enemy-v2'
  }
};

const directActors = Object.fromEntries(
  directActorNames.map((name) => [name, {
    key: `pixel-actor-${name}`,
    url: `assets/pixel/actors/sprites/${name}.png`,
    facing: 'right'
  }])
);

const enemyAtlasActors = Object.fromEntries(
  enemyAtlasNames.map((name, frameIndex) => [name, {
    key: PIXEL_ATLASES.enemiesV2.key,
    url: PIXEL_ATLASES.enemiesV2.url,
    frame: `${PIXEL_ATLASES.enemiesV2.framePrefix}-${frameIndex}`,
    frameIndex,
    facing: 'left'
  }])
);

export const PIXEL_ACTORS = { ...directActors, ...enemyAtlasActors };

export const PIXEL_ENEMY_ALIASES = {
  'graveyard-skeleton': 'grave-skeleton'
};

export function resolvePixelActorAsset(actorId) {
  const assetId = PIXEL_ACTORS[actorId] ? actorId : PIXEL_ENEMY_ALIASES[actorId];
  if (!assetId) return null;
  return { assetId, asset: PIXEL_ACTORS[assetId] };
}

export const PIXEL_TEXTURE_ASSETS = [
  ...Object.values(PIXEL_ASSETS),
  ...Object.values(directActors),
  ...Object.values(PIXEL_ATLASES)
];
