import { COLORS } from '../game/constants.js';
import { playVfxSequence } from '../art/HandPaintedAssets.js';

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
  g.fillStyle(COLORS.green, 0.28);
  g.fillCircle(x, y, 62);
  g.lineStyle(3, 0xb8ef9e, 0.8);
  g.lineBetween(x - 22, y, x + 22, y);
  g.lineBetween(x, y - 22, x, y + 22);
  scene.tweens.add({
    targets: g,
    alpha: 0,
    scale: 1.5,
    duration: 560,
    ease: 'Sine.Out',
    onComplete: () => g.destroy()
  });
}
