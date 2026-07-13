import { COLORS } from '../game/constants.js';
import { addUiAsset, HANDPAINTED_KEYS, hasTexture } from '../art/HandPaintedAssets.js';
import { FONT } from '../design/textStyles.js';
import { PIXEL_PALETTE, drawPixelPanel } from '../art/PixelArtSystem.js';


export function showTurnBanner(scene, message) {
  const g = scene.add.graphics().setDepth(850);
  drawPixelPanel(g, 768, 132, 360, 64, { fill: PIXEL_PALETTE.coal, inner: PIXEL_PALETTE.black, stroke: PIXEL_PALETTE.gold, dither: false });
  const text = scene.add
    .text(768, 132, message, {
      fontFamily: FONT,
      fontSize: 27,
      color: '#f4d89c',
      stroke: '#120b08',
      strokeThickness: 5
    })
    .setOrigin(0.5)
    .setDepth(851);
  scene.tweens.add({
    targets: [g, text],
    alpha: 0,
    delay: 360,
    duration: 280,
    ease: 'Sine.Out',
    onComplete: () => {
      g.destroy();
      text.destroy();
    }
  });
}
