const BGM_PROFILES = {
  menu: { key: 'bgm-menu', gain: 0.68, rate: 1 },
  map: { key: 'bgm-map-act-1', gain: 0.62, rate: 1 },
  battle: { key: 'bgm-battle-act-1', gain: 0.72, rate: 1 },
  boss: { key: 'bgm-boss', gain: 0.82, rate: 1 },
  story: { key: 'bgm-map-act-2', gain: 0.48, rate: 1 },
  rest: { key: 'bgm-map-act-1', gain: 0.44, rate: 1 },
  defeat: { key: 'bgm-map-act-3', gain: 0.5, rate: 1 },
  'map-act-1': { key: 'bgm-map-act-1', gain: 0.58, rate: 1 },
  'map-act-2': { key: 'bgm-map-act-2', gain: 0.6, rate: 1 },
  'map-act-3': { key: 'bgm-map-act-3', gain: 0.62, rate: 1 },
  'battle-act-1': { key: 'bgm-battle-act-1', gain: 0.68, rate: 1 },
  'battle-act-2': { key: 'bgm-battle-act-2', gain: 0.7, rate: 1 },
  'battle-act-3': { key: 'bgm-battle-act-3', gain: 0.72, rate: 1 }
};

const DIRECT_KEYS = new Set([
  'bgm-menu',
  'bgm-map-act-1',
  'bgm-map-act-2',
  'bgm-map-act-3',
  'bgm-battle-act-1',
  'bgm-battle-act-2',
  'bgm-battle-act-3',
  'bgm-boss'
]);

export function resolveBgmProfile(kind = 'menu') {
  if (BGM_PROFILES[kind]) return { ...BGM_PROFILES[kind], id: kind };
  if (DIRECT_KEYS.has(kind)) {
    return { key: kind, gain: 1, rate: 1, id: kind };
  }
  return { ...BGM_PROFILES.menu, id: 'menu' };
}
