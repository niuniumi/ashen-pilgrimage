import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../game/constants.js';
import { flattenFinalArtAssets } from '../art/FinalArtAssets.js';
import { flattenRelicAssets } from '../art/RelicAssets.js';
import { queueCoreAudio } from '../game/AudioCatalog.js';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Preload);
  }

  preload() {
    this.createLoadingView();
    this.load.on('loaderror', (file) => {
      console.warn(`Asset load failed: ${file?.key ?? 'unknown'}`);
    });
    flattenFinalArtAssets().forEach((asset) => {
      if (asset.url.endsWith('.svg')) this.load.svg(asset.key, asset.url, { width: asset.width, height: asset.height });
      else this.load.image(asset.key, asset.url);
    });
    flattenRelicAssets().forEach((asset) => {
      this.load.image(asset.key, asset.url);
    });
    this.load.image('ui-gold-arrow-left', 'assets/generated/ui/gold-arrow-left.png');
    this.load.image('ui-gold-arrow-right', 'assets/generated/ui/gold-arrow-right.png');
    this.load.image('prologue-user-1', 'assets/generated/prologue-user/prologue-user-1.png');
    queueCoreAudio(this);
    this.load.image('generated-character-card-faces-atlas', 'assets/generated/character-card-faces-atlas.png');
    this.load.image('hp-bg-menu-journey-v2', 'assets/handpainted/menu-background-journey-v2.png');
    this.load.image('hp-bg-folio', 'assets/handpainted/folio-background.png');
    this.load.image('hp-ui', 'assets/handpainted/ui-atlas.png');
    this.load.image('hp-vfx', 'assets/handpainted/vfx-atlas.png');
  }

  create() {
    this.time.delayedCall(120, () => this.scene.start(SCENES.MainMenu));
  }

  createLoadingView() {
    const g = this.add.graphics().setDepth(1);
    g.fillGradientStyle(0x161018, 0x161018, 0x372015, 0x0a0705, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    g.fillStyle(0x060403, 0.5);
    g.fillEllipse(GAME_WIDTH / 2, 510, 620, 96);
    g.lineStyle(3, COLORS.gold, 0.85);
    g.strokeRoundedRect(518, 474, 500, 28, 7);
    const bar = this.add.rectangle(526, 481, 0, 14, COLORS.ember, 0.92).setOrigin(0, 0).setDepth(2);
    const percent = this.add
      .text(GAME_WIDTH / 2, 526, '0%', {
        fontFamily: 'Georgia, "Microsoft YaHei", serif',
        fontSize: 18,
        color: '#c7a96f'
      })
      .setOrigin(0.5)
      .setDepth(2);
    this.add
      .text(GAME_WIDTH / 2, 388, '灰烬圣途', {
        fontFamily: 'Georgia, "Microsoft YaHei", serif',
        fontSize: 52,
        color: '#f2c86d',
        stroke: '#120b08',
        strokeThickness: 6
      })
      .setOrigin(0.5)
      .setDepth(2);
    this.add
      .text(GAME_WIDTH / 2, 438, '正在点燃旅途余烬', {
        fontFamily: 'Georgia, "Microsoft YaHei", serif',
        fontSize: 22,
        color: '#f6edd0'
      })
      .setOrigin(0.5)
      .setDepth(2);
    this.load.on('progress', (value) => {
      bar.width = 484 * value;
      percent.setText(`${Math.round(value * 100)}%`);
    });
  }
}
