import { addPixelBackground, PIXEL_PALETTE, snapPixel, stablePixelHash } from './PixelArtSystem.js';

// Compatibility names remain while scene modules migrate to the pixel API.
export const HANDPAINTED_KEYS = {
  menuJourneyBgV2: 'hp-bg-menu-journey-v2',
  menuJourneyBg: 'hp-bg-menu-journey',
  menuBg: 'hp-bg-menu',
  battleBg: 'hp-bg-battle',
  mapBg: 'hp-bg-map',
  folioBg: 'hp-bg-folio',
  heroes: 'hp-heroes',
  alchemistHero: 'hp-hero-alchemist',
  enemies: 'hp-enemies',
  ui: 'hp-ui',
  vfx: 'hp-vfx'
};

export const UI_FRAMES = {};
export const VFX_FRAMES = {};

export function hasTexture(scene, key) {
  return Boolean(scene?.textures?.exists?.(key));
}

export function addHandPaintedBackground(scene, key, options = {}) {
  const variant = key === HANDPAINTED_KEYS.mapBg
    ? 'map'
    : key === HANDPAINTED_KEYS.battleBg
      ? 'battle'
      : key === HANDPAINTED_KEYS.menuJourneyBgV2 || key === HANDPAINTED_KEYS.menuJourneyBg || key === HANDPAINTED_KEYS.menuBg
        ? 'menu'
        : 'folio';
  return addPixelBackground(scene, variant, options);
}

export function addUiAsset() {
  return null;
}

export function addVfxAsset(scene, frame, x, y, options = {}) {
  if (!scene?.add) return null;
  const container = scene.add.container(snapPixel(x), snapPixel(y));
  const g = scene.add.graphics();
  const seed = stablePixelHash(frame);
  const width = Math.max(80, options.displayWidth ?? 240);
  const height = Math.max(60, options.displayHeight ?? 180);
  const color = String(frame).includes('dust')
    ? PIXEL_PALETTE.ironLight
    : String(frame).includes('blessing')
      ? PIXEL_PALETTE.candle
      : PIXEL_PALETTE.ember;
  for (let index = 0; index < 24; index += 1) {
    const px = snapPixel(-width / 2 + ((index * 73 + seed) % Math.round(width)));
    const py = snapPixel(-height / 2 + ((index * 47 + seed * 3) % Math.round(height)));
    const size = index % 5 === 0 ? 8 : 4;
    g.fillStyle(index % 4 === 0 ? PIXEL_PALETTE.goldDark : color, 0.16 + (index % 4) * 0.08);
    g.fillRect(px, py, size, size);
  }
  g.fillStyle(color, 0.12);
  g.fillRect(-width * 0.22, -4, width * 0.44, 8);
  g.fillRect(-4, -height * 0.22, 8, height * 0.44);
  container.add(g);
  container.setAlpha(options.alpha ?? 1).setDepth(options.depth ?? 3);
  return container;
}

export function ensureFrame() {
  return null;
}

export function choosePanelFrame() {
  return 'largePanel';
}

export function chooseCardFrame(card) {
  if (card?.type === '防御') return 'cardDefense';
  if (card?.type === '技能') return 'cardSkill';
  return 'cardAttack';
}

export function chooseCardVfx(card) {
  if (card?.type === '防御') return 'shieldB';
  if (card?.type === '技能') return 'blessingC';
  return 'slashC';
}

export function playVfxSequence() {
  return [];
}
