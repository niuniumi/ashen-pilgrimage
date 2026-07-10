export const LOW_NOISE_BASE = 'assets/generated/battle-low-noise';

export const LOW_NOISE_HERO_ASSETS = {
  'exiled-knight': {
    idle: { key: 'ln-hero-exiled-knight-idle', url: `${LOW_NOISE_BASE}/heroes/exiled-knight-idle.png`, width: 360, height: 420 },
    attack: { key: 'ln-hero-exiled-knight-attack', url: `${LOW_NOISE_BASE}/heroes/exiled-knight-attack.png`, width: 360, height: 420 },
    defend: { key: 'ln-hero-exiled-knight-defend', url: `${LOW_NOISE_BASE}/heroes/exiled-knight-defend.png`, width: 360, height: 420 },
    hit: { key: 'ln-hero-exiled-knight-hit', url: `${LOW_NOISE_BASE}/heroes/exiled-knight-hit.png`, width: 360, height: 420 }
  },
  'candle-nun': {
    idle: { key: 'ln-hero-candle-nun-idle', url: `${LOW_NOISE_BASE}/heroes/candle-nun-idle.png`, width: 360, height: 420 },
    attack: { key: 'ln-hero-candle-nun-attack', url: `${LOW_NOISE_BASE}/heroes/candle-nun-attack.png`, width: 360, height: 420 },
    defend: { key: 'ln-hero-candle-nun-defend', url: `${LOW_NOISE_BASE}/heroes/candle-nun-defend.png`, width: 360, height: 420 },
    hit: { key: 'ln-hero-candle-nun-hit', url: `${LOW_NOISE_BASE}/heroes/candle-nun-hit.png`, width: 360, height: 420 }
  },
  'ashblood-alchemist': {
    idle: { key: 'ln-hero-ashblood-alchemist-idle', url: `${LOW_NOISE_BASE}/heroes/ashblood-alchemist-idle.png`, width: 360, height: 420 },
    attack: { key: 'ln-hero-ashblood-alchemist-attack', url: `${LOW_NOISE_BASE}/heroes/ashblood-alchemist-attack.png`, width: 360, height: 420 },
    defend: { key: 'ln-hero-ashblood-alchemist-defend', url: `${LOW_NOISE_BASE}/heroes/ashblood-alchemist-defend.png`, width: 360, height: 420 },
    hit: { key: 'ln-hero-ashblood-alchemist-hit', url: `${LOW_NOISE_BASE}/heroes/ashblood-alchemist-hit.png`, width: 360, height: 420 }
  }
};

const ENEMY_IDS = [
  'rotting-villager',
  'graveyard-skeleton',
  'black-hound',
  'plague-rat-swarm',
  'crow-messenger',
  'armor-broken-militia',
  'candle-monk',
  'pointed-witch',
  'plague-doctor',
  'iron-maiden-nun',
  'fallen-paladin',
  'headless-grave-knight',
  'wax-novice',
  'cinder-acolyte',
  'bell-tower-sentry',
  'scripture-moth-swarm',
  'choir-exorcist',
  'reliquary-jailer',
  'ash-veiled-prioress',
  'pale-wax-matron',
  'hollow-spearman',
  'ashen-banneret',
  'gutter-fire-archer',
  'crownless-hound',
  'gate-iron-vicar',
  'royal-pyre-knight',
  'clockwork-confessor',
  'hollow-crown-regent'
];

const BOSS_IDS = new Set(['headless-grave-knight', 'pale-wax-matron', 'hollow-crown-regent']);

function enemyAsset(id, pose) {
  const isBoss = BOSS_IDS.has(id);
  return {
    key: `ln-enemy-${id}-${pose}`,
    url: `${LOW_NOISE_BASE}/enemies/${id}-${pose}.png`,
    width: isBoss ? 390 : 320,
    height: isBoss ? 430 : 360
  };
}

export const LOW_NOISE_ENEMY_ASSETS = Object.fromEntries(
  ENEMY_IDS.map((id) => [
    id,
    {
      idle: enemyAsset(id, 'idle'),
      attack: enemyAsset(id, 'attack'),
      hit: enemyAsset(id, 'hit')
    }
  ])
);

export function flattenLowNoiseBattleAssets() {
  const assets = [];
  Object.values(LOW_NOISE_HERO_ASSETS).forEach((poses) => assets.push(...Object.values(poses)));
  Object.values(LOW_NOISE_ENEMY_ASSETS).forEach((poses) => assets.push(...Object.values(poses)));
  return assets;
}

export function queueLowNoiseBattleAssets(scene, characterId, enemyIds = []) {
  const assets = [
    ...Object.values(LOW_NOISE_HERO_ASSETS[characterId] ?? LOW_NOISE_HERO_ASSETS['exiled-knight']),
    ...[...new Set(enemyIds)].flatMap((enemyId) => Object.values(LOW_NOISE_ENEMY_ASSETS[enemyId] ?? {}))
  ];
  let queued = 0;
  for (const asset of assets) {
    if (scene.textures.exists(asset.key)) continue;
    scene.load.image(asset.key, asset.url);
    queued += 1;
  }
  return queued;
}
