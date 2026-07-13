import { addPixelBackground, PIXEL_PALETTE } from './PixelArtSystem.js';

export function drawMenuBackdrop(scene, options = {}) {
  return addPixelBackground(scene, 'menu', options);
}

export function drawCharacterSelectBackdrop(scene, options = {}) {
  return addPixelBackground(scene, 'folio', options);
}

export function drawBattleBackdrop(scene, options = {}) {
  return addPixelBackground(scene, 'battle', options);
}

export function drawMapBackdrop(scene, options = {}) {
  return addPixelBackground(scene, 'map', options);
}

export function drawParchmentMap(g, x, y, width, height) {
  g.fillStyle(PIXEL_PALETTE.paperDark, 1);
  g.fillRect(x, y, width, height);
  g.fillStyle(PIXEL_PALETTE.paper, 1);
  g.fillRect(x + 8, y + 8, width - 16, height - 16);
  g.fillStyle(PIXEL_PALETTE.goldDark, 0.55);
  g.fillRect(x + 16, y + 16, width - 32, 4);
  g.fillRect(x + 16, y + height - 20, width - 32, 4);
}
