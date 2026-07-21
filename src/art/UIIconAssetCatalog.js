export const UI_ICON_ATLAS = Object.freeze({
  key: 'pixel-ui-icon-atlas',
  url: 'assets/pixel/ui/ui-icon-atlas.webp',
  frameWidth: 64,
  frameHeight: 64,
  columns: 5
});

const entries = [
  ['battle', 'crossed-swords'],
  ['attack', 'sword-slice'],
  ['sword', 'broadsword'],
  ['defense', 'bordered-shield'],
  ['block', 'attached-shield'],
  ['shield', 'templar-shield'],
  ['elite', 'crowned-skull'],
  ['boss', 'crown-of-thorns'],
  ['event', 'scroll-unfurled'],
  ['shop', 'shop'],
  ['coin', 'coins'],
  ['rest', 'campfire'],
  ['flame', 'fire-bowl'],
  ['chest', 'open-treasure-chest'],
  ['relic', 'glowing-artifact'],
  ['pause', 'pause-button'],
  ['map', 'treasure-map'],
  ['settings', 'cog'],
  ['heart', 'heart'],
  ['moon', 'moon']
];

export const UI_ICON_ENTRIES = Object.freeze(entries.map(([type, icon], index) => Object.freeze({
  type,
  icon,
  frame: `ui-icon-${index}`,
  index
})));

export const UI_ICON_BY_TYPE = new Map(UI_ICON_ENTRIES.map((entry) => [entry.type, entry]));

export function ensureUIIconFrames(scene) {
  if (!scene?.textures?.exists(UI_ICON_ATLAS.key)) return false;
  const texture = scene.textures.get(UI_ICON_ATLAS.key);
  for (const entry of UI_ICON_ENTRIES) {
    if (texture.has(entry.frame)) continue;
    const x = (entry.index % UI_ICON_ATLAS.columns) * UI_ICON_ATLAS.frameWidth;
    const y = Math.floor(entry.index / UI_ICON_ATLAS.columns) * UI_ICON_ATLAS.frameHeight;
    texture.add(entry.frame, 0, x, y, UI_ICON_ATLAS.frameWidth, UI_ICON_ATLAS.frameHeight);
  }
  return true;
}

export function resolveUIIconFrame(scene, type) {
  const normalized = type === 'flame' ? 'flame' : type;
  const entry = UI_ICON_BY_TYPE.get(normalized) ?? UI_ICON_BY_TYPE.get('relic');
  if (!entry || !ensureUIIconFrames(scene)) return null;
  return entry.frame;
}
