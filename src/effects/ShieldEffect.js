import { COLORS } from '../game/constants.js';
import { playVfxSequence } from '../art/HandPaintedAssets.js';
import { PIXEL_PALETTE } from '../art/PixelArtSystem.js';

export function shieldEffect(scene, x, y) {
  const seq = playVfxSequence(scene, x, y, ['shieldA', 'shieldB', 'shieldC'], {
    displayWidth: 180,
    displayHeight: 148,
    alpha: 0.96,
    depth: 750,
    stepDelay: 46,
    frameDuration: 180,
    scalePulse: 1.04
  });
  if (seq.length) return;
  const g = scene.add.graphics().setDepth(750);
  g.fillStyle(PIXEL_PALETTE.blue, 0.24);
  g.fillRect(x - 64, y - 56, 128, 112);
  g.fillStyle(0xb9d9ef, 0.82);
  g.fillRect(x - 56, y - 56, 112, 8);
  g.fillRect(x - 64, y - 48, 8, 80);
  g.fillRect(x + 56, y - 48, 8, 80);
  g.fillRect(x - 48, y + 32, 96, 8);
  g.fillRect(x - 36, y + 40, 72, 8);
  g.fillRect(x - 20, y + 48, 40, 8);
  scene.tweens.add({
    targets: g,
    alpha: 0,
    scale: 1.22,
    duration: 620,
    ease: 'Sine.Out',
    onComplete: () => g.destroy()
  });
}
