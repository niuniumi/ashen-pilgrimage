import { drawRebuiltEnemy, drawRebuiltHero } from '../art/RebuiltVisualFactory.js';

export function drawHeroArt(scene, characterId, x = 0, y = 0, scale = 1, options = {}) {
  return drawRebuiltHero(scene, characterId, x, y, scale, options);
}

export function drawEnemyArt(scene, enemyId, x = 0, y = 0, scale = 1, options = {}) {
  return drawRebuiltEnemy(scene, enemyId, x, y, scale, options);
}
