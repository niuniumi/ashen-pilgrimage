export const PIXEL_ASSETS = {
  menu: { key: 'pixel-bg-menu', url: 'assets/pixel/backgrounds/menu.png' },
  map: { key: 'pixel-bg-map', url: 'assets/pixel/backgrounds/map.png' },
  folio: { key: 'pixel-bg-folio', url: 'assets/pixel/backgrounds/folio.png' },
  battle1: { key: 'pixel-bg-battle-1', url: 'assets/pixel/backgrounds/battle-act-1.png' },
  battle2: { key: 'pixel-bg-battle-2', url: 'assets/pixel/backgrounds/battle-act-2.png' },
  battle3: { key: 'pixel-bg-battle-3', url: 'assets/pixel/backgrounds/battle-act-3.png' }
};

const actorNames = [
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

export const PIXEL_ACTORS = Object.fromEntries(
  actorNames.map((name) => [name, { key: `pixel-actor-${name}`, url: `assets/pixel/actors/sprites/${name}.png` }])
);
