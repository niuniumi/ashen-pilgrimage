export const BGM_TRACKS = [
  'menu',
  'map-act-1',
  'map-act-2',
  'map-act-3',
  'battle-act-1',
  'battle-act-2',
  'battle-act-3',
  'boss'
];

export const SFX_POOLS = {
  'ui-click': 3,
  'ui-hover': 3,
  'card-select': 3,
  'card-play': 3,
  attack: 3,
  block: 3,
  hit: 3,
  coin: 3,
  page: 3,
  'dialog-open': 2,
  'dialog-close': 2,
  turn: 2,
  boss: 3,
  success: 2,
  fail: 2,
  error: 2,
  heal: 2,
  buff: 2,
  debuff: 2,
  relic: 2
};

export function createBgmAsset(name) {
  const key = `bgm-${name}`;
  return {
    key,
    urls: [`assets/audio/v2/${key}.ogg`, `assets/audio/v2/${key}.mp3`]
  };
}

export function createSfxPoolAssets(name, count = SFX_POOLS[name] ?? 0) {
  return Array.from({ length: count }, (_, index) => {
    const key = `sfx-${name}-${index + 1}`;
    return { key, urls: [`assets/audio/v2/${key}.ogg`] };
  });
}

function queueAudioAsset(scene, asset) {
  if (scene.cache.audio.exists(asset.key)) return 0;
  scene.load.audio(asset.key, asset.urls);
  return 1;
}

function queueBgm(scene, name) {
  return queueAudioAsset(scene, createBgmAsset(name));
}

function queueSfxPool(scene, name, count) {
  let queued = 0;
  for (const asset of createSfxPoolAssets(name, count)) {
    queued += queueAudioAsset(scene, asset);
  }
  return queued;
}

export function queueCoreAudio(scene) {
  let queued = queueBgm(scene, 'menu');
  queued += queueSfxPool(scene, 'ui-click', SFX_POOLS['ui-click']);
  queued += queueSfxPool(scene, 'ui-hover', SFX_POOLS['ui-hover']);
  return queued;
}

export function queueDeferredAudio(scene) {
  let queued = 0;
  for (const name of BGM_TRACKS) {
    if (name !== 'menu') queued += queueBgm(scene, name);
  }
  for (const [name, count] of Object.entries(SFX_POOLS)) {
    if (name !== 'ui-click' && name !== 'ui-hover') queued += queueSfxPool(scene, name, count);
  }
  return queued;
}
