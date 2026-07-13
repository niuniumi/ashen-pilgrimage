import { addPixelBackground } from './PixelArtSystem.js';
import { drawPixelEnemy, drawPixelHero } from './PixelActorFactory.js';

export function drawRebuiltMenuBackdrop(scene, options = {}) {
  return addPixelBackground(scene, 'menu', options);
}

export function drawRebuiltCharacterSelectBackdrop(scene, options = {}) {
  return addPixelBackground(scene, 'folio', options);
}

export function drawRebuiltBattleBackdrop(scene, options = {}) {
  return addPixelBackground(scene, 'battle', options);
}

export function drawRebuiltHero(scene, characterId, x = 0, y = 0, scale = 1, options = {}) {
  return drawPixelHero(scene, characterId, x, y, scale, options);
}

export function drawRebuiltEnemy(scene, enemyId, x = 0, y = 0, scale = 1, options = {}) {
  return drawPixelEnemy(scene, enemyId, x, y, scale, options);
}
