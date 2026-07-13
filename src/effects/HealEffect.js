import { COLORS } from '../game/constants.js';
import { playVfxSequence } from '../art/HandPaintedAssets.js';
import { PIXEL_PALETTE } from '../art/PixelArtSystem.js';

export function healEffect(scene, x, y) {
  const seq = playVfxSequence(scene, x, y, ['blessingA', 'blessingB', 'blessingC'], {
    displayWidth: 168,
    displayHeight: 132,
    alpha: 0.96,
    depth: 750,
    stepDelay: 50,
    frameDuration: 190,
    scalePulse: 1.06
  });
  if (seq.length) return;
  const g = scene.add.graphics().setDepth(700);
  g.fillStyle(PIXEL_PALETTE.moss, 0.3);
  g.fillRect(x - 52, y - 52, 104, 104);
  g.fillStyle(0xb8ef9e, 0.9);
  g.fillRect(x - 28, y - 6, 56, 12);
  g.fillRect(x - 6, y - 28, 12, 56);
  scene.tweens.add({
    targets: g,
    alpha: 0,
    scale: 1.5,
    duration: 560,
    ease: 'Sine.Out',
    onComplete: () => g.destroy()
  });
}
