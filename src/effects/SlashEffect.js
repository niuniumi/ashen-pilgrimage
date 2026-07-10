import { COLORS } from '../game/constants.js';
import { playVfxSequence } from '../art/HandPaintedAssets.js';

export function slashEffect(scene, x, y) {
  const seq = playVfxSequence(scene, x, y, ['slashA', 'slashB', 'slashC'], {
    displayWidth: 210,
    displayHeight: 150,
    alpha: 1,
    depth: 760,
    stepDelay: 38,
    frameDuration: 145,
    scalePulse: 1.08,
    angle: -4
  });
  if (seq.length) return;
  const g = scene.add.graphics().setDepth(760);
  g.lineStyle(12, 0x6b1d1d, 0.32);
  g.lineBetween(x - 78, y + 44, x + 86, y - 48);
  g.lineStyle(7, COLORS.paleGold, 0.94);
  g.lineBetween(x - 72, y + 36, x + 78, y - 42);
  g.lineStyle(3, 0xffffff, 0.88);
  g.lineBetween(x - 40, y + 42, x + 92, y - 16);
  g.lineStyle(3, 0xb83b34, 0.88);
  g.lineBetween(x - 70, y - 26, x + 30, y + 24);
  scene.tweens.add({
    targets: g,
    alpha: 0,
    scaleX: 1.28,
    scaleY: 1.28,
    duration: 310,
    ease: 'Cubic.Out',
    onComplete: () => g.destroy()
  });
}
