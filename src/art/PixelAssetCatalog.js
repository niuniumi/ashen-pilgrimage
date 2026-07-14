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

const playableActorNames = new Set(['exiled-knight', 'candle-nun', 'ashblood-alchemist']);

const versionedActorFiles = {
  'exiled-knight': 'exiled-knight-v3',
  'candle-nun': 'candle-nun-v3',
  'ashblood-alchemist': 'ashblood-alchemist-v3',
  'plague-rat-swarm': 'plague-rat-swarm-v2',
  'rotting-villager': 'rotting-villager-v3',
  'grave-skeleton': 'grave-skeleton-v3',
  'crow-messenger': 'crow-messenger-v3',
  'armor-broken-militia': 'armor-broken-militia-v3',
  'candle-monk': 'candle-monk-v3',
  'pointed-witch': 'pointed-witch-v3',
  'plague-doctor': 'plague-doctor-v3',
  'iron-maiden-nun': 'iron-maiden-nun-v3',
  'fallen-paladin': 'fallen-paladin-v3',
  'headless-grave-knight': 'headless-grave-knight-v3',
  'wax-novice': 'wax-novice-v3',
  'cinder-acolyte': 'cinder-acolyte-v3',
  'bell-tower-sentry': 'bell-tower-sentry-v3',
  'choir-exorcist': 'choir-exorcist-v3',
  'reliquary-jailer': 'reliquary-jailer-v3',
  'ash-veiled-prioress': 'ash-veiled-prioress-v3',
  'pale-wax-matron': 'pale-wax-matron-v3',
  'hollow-spearman': 'hollow-spearman-v3',
  'ashen-banneret': 'ashen-banneret-v3',
  'gutter-fire-archer': 'gutter-fire-archer-v3',
  'gate-iron-vicar': 'gate-iron-vicar-v3',
  'royal-pyre-knight': 'royal-pyre-knight-v3',
  'clockwork-confessor': 'clockwork-confessor-v3',
  'hollow-crown-regent': 'hollow-crown-regent-v3'
};

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
    url: `assets/pixel/actors/sprites/${versionedActorFiles[name] ?? name}.png`,
    facing: playableActorNames.has(name) ? 'right' : 'left',
    ...(name === 'crow-messenger' ? { displayScale: 0.5, offsetY: -48 } : {}),
    ...(name === 'plague-rat-swarm' ? { displayScale: 0.46, offsetY: -30 } : {}),
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
