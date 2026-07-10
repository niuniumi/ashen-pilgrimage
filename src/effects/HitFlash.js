import { playVfxSequence } from '../art/HandPaintedAssets.js';

export function hitFlash(scene, target, color = 0xff2f2f) {
  if (!target) return;
  const originalAlpha = target.alpha;
  const seq = playVfxSequence(scene, target.x, target.y - 12, ['impactA', 'impactB', 'impactC'], {
    displayWidth: 174,
    displayHeight: 138,
    alpha: 0.9,
    depth: 745,
    stepDelay: 34,
    frameDuration: 130,
    scalePulse: 1.05
  });
  if (!seq.length) {
    const flash = scene.add.graphics().setDepth(745);
    flash.fillStyle(color, 0.28);
    flash.fillEllipse(target.x, target.y - 18, 150, 210);
    scene.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 1.16,
      duration: 220,
      ease: 'Sine.Out',
      onComplete: () => flash.destroy()
    });
  }
  scene.tweens.add({
    targets: target,
    alpha: 0.34,
    yoyo: true,
    repeat: 2,
    duration: 44,
    onComplete: () => {
      target.alpha = originalAlpha;
    }
  });
}
