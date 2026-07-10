import { THEME } from '../game/Theme.js';
import { addUiAsset, addVfxAsset, HANDPAINTED_KEYS, hasTexture } from '../art/HandPaintedAssets.js';

export function drawDivider(scene, x, y, width, options = {}) {
  if (hasTexture(scene, HANDPAINTED_KEYS.ui)) {
    return addUiAsset(scene, 'divider', x, y, {
      displayWidth: width,
      displayHeight: Math.max(18, width * 0.11),
      alpha: options.alpha ?? 0.9,
      depth: options.depth
    });
  }
  const g = scene.add.graphics();
  const color = options.color ?? THEME.colors.darkGold;
  g.lineStyle(1, color, options.alpha ?? 0.54);
  g.lineBetween(x - width / 2, y, x + width / 2, y);
  g.fillStyle(color, 0.7);
  g.fillCircle(x - width / 2, y, 3);
  g.fillCircle(x + width / 2, y, 3);
  g.fillTriangle(x - 8, y, x, y - 5, x + 8, y);
  g.fillTriangle(x - 8, y, x, y + 5, x + 8, y);
  return g;
}

export function drawWaxSeal(scene, x, y, radius = 24, color = THEME.colors.blood) {
  if (hasTexture(scene, HANDPAINTED_KEYS.ui)) {
    return addUiAsset(scene, 'waxSeal', x, y, {
      displayWidth: radius * 2.25,
      displayHeight: radius * 2,
      alpha: 0.96
    });
  }
  const g = scene.add.graphics();
  g.fillStyle(color, 0.95);
  g.fillCircle(x, y, radius);
  g.fillStyle(0x5a1714, 0.35);
  g.fillCircle(x + radius * 0.22, y - radius * 0.18, radius * 0.64);
  g.lineStyle(2, THEME.colors.candle, 0.48);
  g.strokeCircle(x, y, radius - 4);
  g.lineStyle(2, 0xf1c76a, 0.7);
  g.lineBetween(x - radius * 0.45, y, x + radius * 0.45, y);
  g.lineBetween(x, y - radius * 0.45, x, y + radius * 0.45);
  return g;
}

export function drawCandle(scene, x, y, scale = 1) {
  if (hasTexture(scene, HANDPAINTED_KEYS.vfx)) {
    return addVfxAsset(scene, 'blessingA', x, y + 12 * scale, {
      displayWidth: 92 * scale,
      displayHeight: 82 * scale,
      alpha: 0.82
    });
  }
  const g = scene.add.graphics();
  g.fillStyle(0xd9c28f, 0.95);
  g.fillRoundedRect(x - 8 * scale, y, 16 * scale, 46 * scale, 4 * scale);
  g.fillStyle(0x7b2b24, 0.55);
  g.fillRect(x - 8 * scale, y + 26 * scale, 16 * scale, 6 * scale);
  g.fillStyle(THEME.colors.candle, 0.94);
  g.fillTriangle(x - 9 * scale, y - 3 * scale, x, y - 28 * scale, x + 9 * scale, y - 3 * scale);
  g.fillStyle(0xf7e6a4, 0.88);
  g.fillTriangle(x - 4 * scale, y - 2 * scale, x, y - 16 * scale, x + 4 * scale, y - 2 * scale);
  g.fillStyle(THEME.colors.candle, 0.1);
  g.fillCircle(x, y - 9 * scale, 38 * scale);
  return g;
}

export function drawVignette(scene, depth = 1) {
  const g = scene.add.graphics().setDepth(depth);
  for (let i = 0; i < 9; i += 1) {
    const alpha = 0.03 + i * 0.018;
    g.fillStyle(0x030202, alpha);
    g.fillRect(i * 14, 0, 18, 864);
    g.fillRect(1536 - 18 - i * 14, 0, 18, 864);
    g.fillRect(0, i * 10, 1536, 13);
    g.fillRect(0, 864 - 13 - i * 10, 1536, 13);
  }
  return g;
}

export function drawBackArrowButton(scene, x, y, label, onClick, options = {}) {
  const direction = options.direction === 'right' ? 'right' : 'left';
  const key = direction === 'right' ? 'ui-gold-arrow-right' : 'ui-gold-arrow-left';
  const w = options.width ?? 164;
  const h = options.height ?? 46;
  const depth = options.depth ?? 20;
  const container = scene.add.container(x, y).setDepth(depth);
  const arrow = scene.textures.exists(key)
    ? scene.add.image(0, 0, key).setOrigin(0.5).setDisplaySize(w, h).setAlpha(options.alpha ?? 0.96)
    : scene.add
        .text(0, 0, direction === 'right' ? '›' : '‹', {
          fontFamily: 'Georgia, "Microsoft YaHei", serif',
          fontSize: Math.max(42, h),
          color: '#f6d78a',
          stroke: '#2b1a12',
          strokeThickness: 4
        })
        .setOrigin(0.5);
  container.add(arrow);

  const hit = scene.add.zone(x, y, w, h).setOrigin(0.5).setInteractive({ useHandCursor: true });
  hit.on('pointerover', () => {
    scene.audio?.play?.('uiHover');
    scene.tweens.killTweensOf(container);
    scene.tweens.add({
      targets: container,
      x: x + (direction === 'right' ? 4 : -4),
      scaleX: 1.06,
      scaleY: 1.06,
      duration: 100,
      ease: 'Sine.Out'
    });
    arrow.setAlpha?.(1);
  });
  hit.on('pointerout', () => {
    scene.tweens.killTweensOf(container);
    scene.tweens.add({ targets: container, x, scaleX: 1, scaleY: 1, duration: 120, ease: 'Sine.Out' });
    arrow.setAlpha?.(options.alpha ?? 0.96);
  });
  hit.on('pointerup', () => {
    scene.audio?.unlock?.();
    scene.audio?.play?.('uiClick');
    onClick?.();
  });
  container.once('destroy', () => hit.destroy());
  return container;
}
