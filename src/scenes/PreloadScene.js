import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENES } from '../game/constants.js';
import { queueCoreAudio } from '../game/AudioCatalog.js';
import { applyPixelFilters, PIXEL_PALETTE, queuePixelAssets } from '../art/PixelArtSystem.js';
import { FONT } from '../design/textStyles.js';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Preload);
  }

  preload() {
    this.createLoadingView();
    this.load.on('loaderror', (file) => {
      console.warn(`Asset load failed: ${file?.key ?? 'unknown'}`);
    });
    queuePixelAssets(this);
    queueCoreAudio(this);
  }

  create() {
    applyPixelFilters(this);
    this.time.delayedCall(120, () => this.scene.start(SCENES.MainMenu));
  }

  createLoadingView() {
    const g = this.add.graphics().setDepth(1);
    g.fillStyle(PIXEL_PALETTE.void, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    for (let y = 0; y < GAME_HEIGHT; y += 16) {
      for (let x = (y / 16) % 2 ? 8 : 0; x < GAME_WIDTH; x += 16) {
        g.fillStyle(PIXEL_PALETTE.coal, 0.46);
        g.fillRect(x, y, 8, 8);
      }
    }
    g.fillStyle(PIXEL_PALETTE.goldDark, 1);
    g.fillRect(516, 472, 504, 32);
    g.fillStyle(PIXEL_PALETTE.black, 1);
    g.fillRect(520, 476, 496, 24);
    const bar = this.add.rectangle(524, 480, 0, 16, PIXEL_PALETTE.ember, 1).setOrigin(0, 0).setDepth(2);
    const percent = this.add
      .text(GAME_WIDTH / 2, 526, '0%', {
        fontFamily: FONT,
        fontSize: 18,
        color: '#c7a96f'
      })
      .setOrigin(0.5)
      .setDepth(2);
    this.add
      .text(GAME_WIDTH / 2, 388, '灰烬圣途', {
        fontFamily: FONT,
        fontSize: 52,
        color: '#f2c86d',
        stroke: '#120b08',
        strokeThickness: 6
      })
      .setOrigin(0.5)
      .setDepth(2);
    this.add
      .text(GAME_WIDTH / 2, 438, '正在点燃旅途余烬', {
        fontFamily: FONT,
        fontSize: 22,
        color: '#f6edd0'
      })
      .setOrigin(0.5)
      .setDepth(2);
    this.load.on('progress', (value) => {
      bar.width = 488 * value;
      percent.setText(`${Math.round(value * 100)}%`);
    });
  }
}
