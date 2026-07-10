import { COLORS } from '../game/constants.js';
import { playVfxSequence } from '../art/HandPaintedAssets.js';

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
  g.lineStyle(7, COLORS.blueSteel, 0.88);
  g.beginPath();
  g.arc(x, y, 64, Math.PI * 1.05, Math.PI * 1.92, false);
  g.strokePath();
  g.lineStyle(4, 0xb9d9ef, 0.7);
  g.beginPath();
  g.arc(x, y, 48, Math.PI * 0.05, Math.PI * 0.95, false);
  g.strokePath();
  g.lineStyle(2, COLORS.paleGold, 0.65);
  g.strokeCircle(x, y, 76);
  g.fillStyle(0x4f7894, 0.1);
  g.fillCircle(x, y, 70);
  scene.tweens.add({
    targets: g,
    alpha: 0,
    scale: 1.22,
    duration: 620,
    ease: 'Sine.Out',
    onComplete: () => g.destroy()
  });
}
