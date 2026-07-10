import Phaser from 'phaser';
import { THEME } from '../game/Theme.js';

export function addAmbientAsh(scene, options = {}) {
  const count = Math.max(0, Math.round((options.count ?? 42) * (options.density ?? 0.38)));
  const depth = options.depth ?? 2;
  const container = scene.add.container(0, 0).setDepth(depth);
  for (let i = 0; i < count; i += 1) {
    const x = (options.xMin ?? 0) + ((i * 137) % (options.width ?? 1536));
    const y = (options.yMin ?? 0) + ((i * 79) % (options.height ?? 864));
    const dot = scene.add.circle(
      Phaser.Math.Clamp(x, 8, 1528),
      Phaser.Math.Clamp(y, 8, 856),
      0.75 + (i % 2) * 0.5,
      i % 4 === 0 ? THEME.colors.candle : THEME.colors.ash,
      (options.alpha ?? 0.035) + (i % 4) * 0.008
    );
    container.add(dot);
    scene.tweens.add({
      targets: dot,
      y: dot.y - 18 - (i % 12),
      x: dot.x + ((i % 2 ? 1 : -1) * (4 + (i % 7))),
      alpha: Math.max(0.008, dot.alpha * 0.28),
      yoyo: true,
      repeat: -1,
      duration: 3200 + (i % 9) * 300,
      ease: 'Sine.InOut'
    });
  }
  return container;
}
