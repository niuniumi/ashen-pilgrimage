import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/constants.js';
import { PIXEL_ACTORS, PIXEL_ASSETS } from './PixelAssetCatalog.js';

export { PIXEL_ACTORS, PIXEL_ASSETS } from './PixelAssetCatalog.js';

export const PIXEL_GRID = 4;

export const PIXEL_PALETTE = {
  void: 0x08090d,
  black: 0x11131a,
  coal: 0x1b1d24,
  iron: 0x2c3540,
  ironLight: 0x566675,
  bone: 0xd6c7a5,
  paper: 0xb99862,
  paperDark: 0x725033,
  goldDark: 0x8f612f,
  gold: 0xd0a24f,
  candle: 0xffd36a,
  bloodDark: 0x531c28,
  blood: 0x91303a,
  ember: 0xd75a32,
  moss: 0x596b45,
  teal: 0x35706b,
  blue: 0x3f6682,
  violet: 0x66538c,
  white: 0xf4e7c5
};

export function snapPixel(value, grid = PIXEL_GRID) {
  return Math.round(value / grid) * grid;
}

export function queuePixelAssets(scene) {
  [...Object.values(PIXEL_ASSETS), ...Object.values(PIXEL_ACTORS)].forEach((asset) => scene.load.image(asset.key, asset.url));
}

export function applyPixelFilters(scene) {
  [...Object.values(PIXEL_ASSETS), ...Object.values(PIXEL_ACTORS)].forEach((asset) => {
    if (scene.textures.exists(asset.key)) {
      scene.textures.get(asset.key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
  });
}

export function pixelBackgroundKey(variant, act = 1) {
  if (variant === 'menu') return PIXEL_ASSETS.menu.key;
  if (variant === 'map') return PIXEL_ASSETS.map.key;
  if (variant === 'battle') return PIXEL_ASSETS[`battle${Math.max(1, Math.min(3, act))}`].key;
  return PIXEL_ASSETS.folio.key;
}

export function addPixelBackground(scene, variant = 'folio', options = {}) {
  const key = pixelBackgroundKey(variant, options.act ?? 1);
  if (!scene.textures.exists(key)) return null;
  const image = scene.add
    .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, key)
    .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
    .setDepth(options.depth ?? 0)
    .setAlpha(options.alpha ?? 1);
  image.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  image.setName(`pixel-background-${variant}`);
  return image;
}

export function drawPixelPanel(g, x, y, width, height, options = {}) {
  const left = snapPixel(x - width / 2);
  const top = snapPixel(y - height / 2);
  const w = snapPixel(width);
  const h = snapPixel(height);
  const border = options.stroke ?? PIXEL_PALETTE.goldDark;
  const fill = options.fill ?? PIXEL_PALETTE.coal;
  const inner = options.inner ?? PIXEL_PALETTE.black;
  const alpha = options.alpha ?? 0.96;

  g.fillStyle(PIXEL_PALETTE.void, 0.72);
  g.fillRect(left + 8, top + 8, w, h);
  g.fillStyle(border, options.strokeAlpha ?? 1);
  g.fillRect(left, top, w, h);
  g.fillStyle(PIXEL_PALETTE.void, 1);
  g.fillRect(left + 4, top + 4, w - 8, h - 8);
  g.fillStyle(fill, alpha);
  g.fillRect(left + 8, top + 8, w - 16, h - 16);
  g.fillStyle(inner, 0.7);
  g.fillRect(left + 12, top + 12, w - 24, 4);
  g.fillRect(left + 12, top + h - 16, w - 24, 4);

  const corner = options.corner ?? PIXEL_PALETTE.gold;
  const marks = [
    [left, top],
    [left + w - 12, top],
    [left, top + h - 12],
    [left + w - 12, top + h - 12]
  ];
  g.fillStyle(corner, 0.92);
  marks.forEach(([cx, cy]) => {
    g.fillRect(cx, cy, 12, 4);
    g.fillRect(cx, cy, 4, 12);
  });

  if (options.dither !== false) drawPixelDither(g, left + 16, top + 20, w - 32, h - 40, options.seed ?? 17, fill);
}

export function drawPixelDither(g, left, top, width, height, seed = 17, color = PIXEL_PALETTE.ironLight) {
  const count = Math.max(6, Math.floor((width * height) / 6800));
  for (let index = 0; index < count; index += 1) {
    const x = snapPixel(left + ((index * 73 + seed * 29) % Math.max(4, width)));
    const y = snapPixel(top + ((index * 47 + seed * 41) % Math.max(4, height)));
    g.fillStyle(index % 3 === 0 ? PIXEL_PALETTE.void : color, index % 3 === 0 ? 0.18 : 0.08);
    g.fillRect(x, y, index % 4 === 0 ? 8 : 4, 4);
  }
}

export function drawPixelDivider(g, x, y, width, color = PIXEL_PALETTE.goldDark, alpha = 1) {
  const left = snapPixel(x - width / 2);
  const w = snapPixel(width);
  const py = snapPixel(y);
  g.fillStyle(PIXEL_PALETTE.void, 0.9 * alpha);
  g.fillRect(left, py, w, 8);
  g.fillStyle(color, alpha);
  g.fillRect(left + 8, py + 2, w - 16, 4);
  g.fillStyle(PIXEL_PALETTE.gold, alpha);
  g.fillRect(snapPixel(x - 8), py - 4, 16, 16);
  g.fillStyle(PIXEL_PALETTE.void, alpha);
  g.fillRect(snapPixel(x - 4), py, 8, 8);
}

export function stablePixelHash(value) {
  let hash = 2166136261;
  for (const character of String(value ?? 'pixel')) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
