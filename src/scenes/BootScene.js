import Phaser from 'phaser';
import { SCENES } from '../game/constants.js';
import { AudioManager } from '../game/AudioManager.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Boot);
  }

  create() {
    document.getElementById('boot-splash')?.remove();
    this.registry.set('audio', new AudioManager());
    this.createGeneratedTextures();
    this.scene.start(SCENES.Preload);
  }

  createGeneratedTextures() {
    const ash = this.add.graphics();
    ash.fillStyle(0xf3bd67, 1);
    ash.fillCircle(4, 4, 4);
    ash.generateTexture('generated-ash-particle', 8, 8);
    ash.destroy();

    const spark = this.add.graphics();
    spark.fillStyle(0xffffff, 1);
    spark.fillCircle(6, 6, 6);
    spark.generateTexture('generated-spark', 12, 12);
    spark.destroy();

    const pixel = this.add.graphics();
    pixel.fillStyle(0xffffff, 1);
    pixel.fillRect(0, 0, 4, 4);
    pixel.generateTexture('generated-card-pixel', 4, 4);
    pixel.destroy();
  }
}
