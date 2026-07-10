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

function queueBgm(scene, name) {
  const key = `bgm-${name}`;
  if (scene.cache.audio.exists(key)) return 0;
  scene.load.audio(key, [`assets/audio/v2/${key}.ogg`, `assets/audio/v2/${key}.mp3`]);
  return 1;
}

function queueSfxPool(scene, name, count) {
  let queued = 0;
  for (let variant = 1; variant <= count; variant += 1) {
    const key = `sfx-${name}-${variant}`;
    if (scene.cache.audio.exists(key)) continue;
    scene.load.audio(key, `assets/audio/v2/${key}.ogg`);
    queued += 1;
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
