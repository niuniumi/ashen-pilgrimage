export const CARD_ART_ATLAS = Object.freeze({
  key: 'pixel-card-art-atlas',
  url: 'assets/pixel/cards/card-art-atlas.webp',
  frameWidth: 96,
  frameHeight: 64,
  columns: 10
});

const entries = [
  ['knight-cleave', 'broadsword'],
  ['knight-block', 'shield'],
  ['knight-rend', 'sword-wound'],
  ['knight-double-slash', 'crossed-slashes'],
  ['knight-score', 'scar-wound'],
  ['knight-bloodline-cut', 'dripping-sword'],
  ['knight-quickstep', 'quick-slash'],
  ['knight-shield-wall', 'surrounded-shield'],
  ['knight-heavy-pressure', 'two-handed-sword'],
  ['knight-sharpen', 'sword-smithing'],
  ['knight-armor-break', 'armor-downgrade'],
  ['knight-pursuit', 'footsteps'],
  ['knight-blood-oath-stance', 'bloody-sword'],
  ['knight-counter-stance', 'shield-reflect'],
  ['knight-execution', 'executioner-hood'],
  ['nun-flame', 'candle-flame'],
  ['nun-prayer-shield', 'healing-shield'],
  ['nun-confession-mark', 'wax-seal'],
  ['nun-wax-seal', 'wax-tablet'],
  ['nun-ignite', 'lightning-flame'],
  ['nun-flying-candles', 'candles'],
  ['nun-guardian-prayer', 'prayer'],
  ['nun-silent-prayer', 'prayer-beads'],
  ['nun-candle-array', 'candle-holder'],
  ['nun-glimmer', 'candle-light'],
  ['nun-scapegoat-wax', 'candle-skull'],
  ['nun-pale-holy-fire', 'holy-water'],
  ['nun-quiet-mass', 'holy-symbol'],
  ['nun-candle-net', 'candlebright'],
  ['nun-thousand-candles', 'flame-spin'],
  ['alc-acid-vial', 'acid-tube'],
  ['alc-leather-guard', 'leather-armor'],
  ['alc-forbidden-test', 'potion-of-madness'],
  ['alc-corrosive-flask', 'bubbling-flask'],
  ['alc-bitter-draught', 'magic-potion'],
  ['alc-ashblood-boil', 'potion-ball'],
  ['alc-hardened-skin', 'heart-armor'],
  ['alc-regrowth-salve', 'regeneration'],
  ['alc-skullbreaker', '3d-hammer'],
  ['alc-berserk-injection', 'syringe'],
  ['alc-leadskin', 'layered-armor'],
  ['alc-smoke-step', 'smoking-orb'],
  ['alc-bloodrage-throw', 'round-potion'],
  ['alc-white-ash-lotus', 'lotus-flower'],
  ['alc-ashblood-rebirth', 'egyptian-bird'],
  ['common-bandage', 'bandage-roll'],
  ['common-crossbow', 'crossbow'],
  ['common-old-shield', 'broken-shield'],
  ['common-torch-swing', 'primitive-torch'],
  ['common-ash-dodge', 'wingfoot'],
  ['common-field-ration', 'opened-food-can'],
  ['common-smoke-bomb', 'smoke-bomb'],
  ['common-grave-salt', 'salt-shaker'],
  ['common-crow-call', 'crow-dive'],
  ['common-iron-prayer', 'templar-shield'],
  ['common-saint-fire-shard', 'fire-gem'],
  ['knight-guarded-lunge', 'piercing-sword'],
  ['knight-red-cape-stand', 'cape-armor'],
  ['knight-vowbreaker', 'shattered-sword'],
  ['knight-saintless-duel', 'duel'],
  ['nun-pilgrim-candle', 'lantern-flame'],
  ['nun-absolution', 'holy-grail'],
  ['nun-litany-of-dawn', 'inspiration'],
  ['nun-last-candle', 'fire-shrine'],
  ['alc-traveling-tonic', 'waterskin'],
  ['alc-mercury-knife', 'razor-blade'],
  ['alc-crimson-catalyst', 'fizzing-flask'],
  ['alc-phoenix-reagent', 'winged-emblem'],
  ['status-wound', 'open-wound'],
  ['curse-rot', 'poison-cloud']
];

export const CARD_ART_ENTRIES = Object.freeze(entries.map(([id, icon], index) => Object.freeze({
  id,
  icon,
  frame: `card-${index}`,
  index
})));

export const CARD_ART_BY_ID = new Map(CARD_ART_ENTRIES.map((entry) => [entry.id, entry]));

function installFrames(scene, atlas, framePrefix, count) {
  if (!scene?.textures?.exists(atlas.key)) return false;
  const texture = scene.textures.get(atlas.key);
  for (let index = 0; index < count; index += 1) {
    const frameName = `${framePrefix}-${index}`;
    if (texture.has(frameName)) continue;
    const x = (index % atlas.columns) * atlas.frameWidth;
    const y = Math.floor(index / atlas.columns) * atlas.frameHeight;
    texture.add(frameName, 0, x, y, atlas.frameWidth, atlas.frameHeight);
  }
  return true;
}

export function ensureCardArtFrames(scene) {
  return installFrames(scene, CARD_ART_ATLAS, 'card', CARD_ART_ENTRIES.length);
}

export function resolveCardArtFrame(scene, cardId) {
  const entry = CARD_ART_BY_ID.get(cardId);
  if (!entry || !ensureCardArtFrames(scene)) return null;
  return entry.frame;
}
