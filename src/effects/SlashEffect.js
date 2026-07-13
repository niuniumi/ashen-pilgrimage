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
  for (let i = -72; i <= 72; i += 8) {
    g.fillStyle(i % 16 === 0 ? COLORS.paleGold : 0xffffff, 0.94);
    g.fillRect(x + i, y - i * 0.55, 12, 6);
  }
  g.fillStyle(0xb83b34, 0.86);
  g.fillRect(x - 68, y - 28, 92, 6);
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
