import { THEME } from '../game/Theme.js';
import { addUiAsset, addVfxAsset, HANDPAINTED_KEYS, hasTexture } from '../art/HandPaintedAssets.js';
import { FONT } from '../design/textStyles.js';
import { PIXEL_PALETTE, drawPixelDivider, snapPixel } from '../art/PixelArtSystem.js';
import { SaveManager } from '../game/SaveManager.js';
import { isMotionEnabled } from '../game/MotionPolicy.js';

export function drawDivider(scene, x, y, width, options = {}) {
  const g = scene.add.graphics();
  const color = options.color ?? THEME.colors.darkGold;
  drawPixelDivider(g, x, y, width, color, options.alpha ?? 0.8);
  if (Number.isFinite(options.depth)) g.setDepth(options.depth);
  return g;
}

export function drawWaxSeal(scene, x, y, radius = 24, color = THEME.colors.blood) {
  const g = scene.add.graphics();
  const size = snapPixel(radius * 2);
  g.fillStyle(PIXEL_PALETTE.void, 0.8);
  g.fillRect(snapPixel(x - size / 2 + 4), snapPixel(y - size / 2 + 4), size, size);
  g.fillStyle(color, 0.95);
  g.fillRect(snapPixel(x - size / 2), snapPixel(y - size / 2), size, size);
  g.fillStyle(PIXEL_PALETTE.gold, 0.72);
  g.fillRect(snapPixel(x - radius * 0.45), snapPixel(y - 2), snapPixel(radius * 0.9), 4);
  g.fillRect(snapPixel(x - 2), snapPixel(y - radius * 0.45), 4, snapPixel(radius * 0.9));
  return g;
}

export function drawCandle(scene, x, y, scale = 1) {
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
  const motionEnabled = isMotionEnabled(SaveManager.readSettings());
  const arrow = scene.textures.exists(key)
    ? scene.add.image(0, 0, key).setOrigin(0.5).setDisplaySize(w, h).setAlpha(options.alpha ?? 0.96)
    : scene.add
        .text(0, 0, direction === 'right' ? '›' : '‹', {
        fontFamily: FONT,
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
    const hoverX = x + (direction === 'right' ? 4 : -4);
    if (!motionEnabled) {
      container.setPosition(hoverX, y).setScale(1.06);
      arrow.setAlpha?.(1);
      return;
    }
    scene.tweens.add({
      targets: container,
      x: hoverX,
      scaleX: 1.06,
      scaleY: 1.06,
      duration: 100,
      ease: 'Sine.Out'
    });
    arrow.setAlpha?.(1);
  });
  hit.on('pointerout', () => {
    scene.tweens.killTweensOf(container);
    if (!motionEnabled) {
      container.setPosition(x, y).setScale(1);
      arrow.setAlpha?.(options.alpha ?? 0.96);
      return;
    }
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
