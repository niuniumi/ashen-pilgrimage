import Phaser from 'phaser';
import { SaveManager } from '../game/SaveManager.js';

function motionEnabled() {
  return SaveManager.readSettings().animation !== false;
}

export function hitStop(scene, duration = 44, timeScale = 0.14) {
  if (!motionEnabled() || !scene?.tweens) return;
  scene._hitStopToken = (scene._hitStopToken ?? 0) + 1;
  const token = scene._hitStopToken;
  scene.tweens.timeScale = timeScale;
  scene.time.delayedCall(duration, () => {
    if (scene._hitStopToken === token && scene.tweens) scene.tweens.timeScale = 1;
  });
}

export function impactBurst(scene, x, y, amount = 0, color = 0xf3d48b) {
  if (!motionEnabled()) return;
  const strength = Phaser.Math.Clamp(Number(amount) || 0, 4, 30);
  const burst = scene.add.graphics().setDepth(770);
  burst.lineStyle(4 + strength * 0.08, color, 0.9);
  burst.strokeCircle(x, y, 20 + strength * 0.45);
  burst.lineStyle(2, 0xffffff, 0.72);
  for (let i = 0; i < 10; i += 1) {
    const angle = (Math.PI * 2 * i) / 10 + (i % 2) * 0.11;
    const inner = 26 + strength * 0.22;
    const outer = inner + 20 + (i % 3) * 8 + strength * 0.35;
    burst.lineBetween(
      x + Math.cos(angle) * inner,
      y + Math.sin(angle) * inner,
      x + Math.cos(angle) * outer,
      y + Math.sin(angle) * outer
    );
  }
  scene.tweens.add({
    targets: burst,
    alpha: 0,
    scaleX: 1.32,
    scaleY: 1.32,
    duration: 220,
    ease: 'Cubic.Out',
    onComplete: () => burst.destroy()
  });
}

export function bossPhaseSurge(scene, target, phase = 2) {
  if (!motionEnabled()) return;
  const x = target?.x ?? 840;
  const y = (target?.y ?? 430) - 30;
  const veil = scene.add.rectangle(768, 432, 1536, 864, 0x531313, 0.34).setDepth(730);
  const ring = scene.add.graphics().setDepth(775);
  ring.lineStyle(8, phase >= 3 ? 0xffd080 : 0xe46b4b, 0.86);
  ring.strokeCircle(x, y, 72);
  ring.lineStyle(2, 0xffffff, 0.58);
  ring.strokeCircle(x, y, 92);
  ring.setScale(0.55);
  scene.cameras.main.flash(120, phase >= 3 ? 196 : 138, 42, 32, false);
  if (target?.scene) {
    scene.tweens.add({ targets: target, scaleX: 1.075, scaleY: 1.075, yoyo: true, duration: 150, ease: 'Sine.InOut' });
  }
  scene.tweens.add({
    targets: veil,
    alpha: 0,
    duration: 360,
    ease: 'Sine.Out',
    onComplete: () => veil.destroy()
  });
  scene.tweens.add({
    targets: ring,
    scaleX: 1.85,
    scaleY: 1.85,
    alpha: 0,
    duration: 430,
    ease: 'Cubic.Out',
    onComplete: () => ring.destroy()
  });
}
