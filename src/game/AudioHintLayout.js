const DEFAULT_LAYOUT = Object.freeze({
  x: 768,
  y: 824,
  origin: Object.freeze([0.5, 0.5])
});

const BATTLE_LAYOUT = Object.freeze({
  x: 24,
  y: 82,
  origin: Object.freeze([0, 0])
});

export function resolveAudioHintLayout(sceneKey = '') {
  return sceneKey === 'BattleScene' ? BATTLE_LAYOUT : DEFAULT_LAYOUT;
}
