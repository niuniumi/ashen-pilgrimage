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
  'rotting-villager',
  'broken-militia',
  'grave-skeleton',
  'black-hound',
  'plague-rat-swarm',
  'crow-messenger',
  'armor-broken-militia',
  'candle-monk',
  'pointed-witch',
  'plague-doctor',
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
  'clockwork-confessor',
  'gutter-fire-archer',
  'reliquary-jailer',
  'iron-maiden-nun',
  'headless-grave-knight',
  'pale-wax-matron',
  'hollow-crown-regent',
  'scripture-moth-swarm'
];

const leftFacingActors = new Set([
  'plague-rat-swarm',
  'crownless-hound'
]);

export const PIXEL_ATLASES = {};

export const PIXEL_DECORATIONS = {
  defeatTombstone: {
    key: 'pixel-ui-defeat-tombstone',
    url: 'assets/pixel/ui/defeat-tombstone.png'
  }
};

const directActors = Object.fromEntries(
  directActorNames.map((name) => [name, {
    key: `pixel-actor-${name}`,
    url: `assets/pixel/actors/sprites/${name === 'candle-nun' ? 'candle-nun-v2' : name}.png`,
    facing: leftFacingActors.has(name) ? 'left' : 'right',
    ...(name === 'crow-messenger' ? { displayScale: 0.5, offsetY: -48 } : {}),
    ...(name === 'plague-rat-swarm' ? { displayScale: 0.7 } : {}),
    ...(name === 'crownless-hound' ? { displayScale: 0.9 } : {})
  }])
);

export const PIXEL_ACTORS = { ...directActors };

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
  ...Object.values(PIXEL_DECORATIONS)
];
