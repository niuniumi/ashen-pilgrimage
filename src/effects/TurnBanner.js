import { COLORS } from '../game/constants.js';
import { addUiAsset, HANDPAINTED_KEYS, hasTexture } from '../art/HandPaintedAssets.js';

const FONT = 'Georgia, "Microsoft YaHei", serif';

export function showTurnBanner(scene, message) {
  const g = hasTexture(scene, HANDPAINTED_KEYS.ui)
    ? addUiAsset(scene, 'widePanel', 768, 385, { displayWidth: 640, displayHeight: 118, alpha: 0.96, depth: 850 })
    : scene.add.graphics().setDepth(850);
  if (!hasTexture(scene, HANDPAINTED_KEYS.ui)) {
    g.fillStyle(0x070604, 0.52);
    g.fillRoundedRect(438, 330, 660, 108, 10);
    g.fillStyle(0x1a1110, 0.9);
    g.fillRoundedRect(468, 344, 600, 80, 8);
    g.lineStyle(2, COLORS.gold, 0.82);
    g.strokeRoundedRect(468, 344, 600, 80, 8);
    g.lineStyle(1, COLORS.paleGold, 0.32);
    g.lineBetween(508, 360, 1028, 360);
    g.lineBetween(508, 408, 1028, 408);
  }
  const text = scene.add
    .text(768, 385, message, {
      fontFamily: FONT,
      fontSize: 40,
      color: '#f4d89c',
      stroke: '#120b08',
      strokeThickness: 5
    })
    .setOrigin(0.5)
    .setDepth(851);
  scene.tweens.add({
    targets: [g, text],
    alpha: 0,
    delay: 560,
    duration: 420,
    ease: 'Sine.Out',
    onComplete: () => {
      g.destroy();
      text.destroy();
    }
  });
}
