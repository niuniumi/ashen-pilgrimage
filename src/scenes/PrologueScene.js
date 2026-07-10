import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENES } from '../game/constants.js';
import { SaveManager } from '../game/SaveManager.js';
import { UIButton } from '../ui/UIButton.js';
import { SceneTransition } from '../ui/SceneTransition.js';
import { drawBackArrowButton } from '../ui/UIOrnament.js';
import { attachSceneServices } from './SceneHelpers.js';
import { addHandPaintedBackground, HANDPAINTED_KEYS } from '../art/HandPaintedAssets.js';

const PROLOGUE_PAGE_KEYS = ['prologue-user-1', 'prologue-user-2', 'prologue-user-3', 'prologue-user-4'];

export default class PrologueScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Prologue);
  }

  create() {
    attachSceneServices(this);
    this.audio?.startAmbience?.('story');
    this.pageIndex = 0;
    this.pageImage = null;
    this.isTurning = false;
    this.drawBackdrop();
    this.createPage();
    this.createControls();
    this.cameras.main.fadeIn(360, 0, 0, 0);
  }

  drawBackdrop() {
    addHandPaintedBackground(this, HANDPAINTED_KEYS.folioBg, { depth: 0 });
  }

  createPage() {
    const key = PROLOGUE_PAGE_KEYS[this.pageIndex];
    if (!this.textures.exists(key)) {
      console.warn(`Prologue asset missing: ${key}`);
      this.finish();
      return;
    }
    const image = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, key).setOrigin(0.5).setDepth(10);
    this.fitPageImage(image);
    image.setAlpha(0);
    this.pageImage = image;
    this.tweens.add({
      targets: image,
      alpha: 1,
      duration: 460,
      ease: 'Sine.Out'
    });
  }

  fitPageImage(image) {
    const texture = this.textures.get(image.texture.key);
    const source = texture.getSourceImage();
    const sourceWidth = source?.width ?? 1536;
    const sourceHeight = source?.height ?? 864;
    const maxWidth = 1488;
    const maxHeight = 824;
    const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
    image.setDisplaySize(sourceWidth * scale, sourceHeight * scale);
  }

  createControls() {
    this.prevButton = drawBackArrowButton(this, 82, GAME_HEIGHT / 2, '', () => this.turnPage(-1), {
      width: 142,
      height: 40,
      depth: 30
    });
    this.nextButton = drawBackArrowButton(this, GAME_WIDTH - 82, GAME_HEIGHT / 2, '', () => this.turnPage(1), {
      direction: 'right',
      width: 142,
      height: 40,
      depth: 30
    });
    new UIButton(this, GAME_WIDTH - 146, 58, 180, 46, '跳过剧情', () => this.finish(), {
      fontSize: 20,
      hitDepth: 30000
    }).setDepth(31);
    this.updateControls();
  }

  updateControls() {
    this.prevButton?.setVisible(this.pageIndex > 0);
  }

  turnPage(direction) {
    if (this.isTurning) return;
    const nextIndex = this.pageIndex + direction;
    if (nextIndex >= PROLOGUE_PAGE_KEYS.length) {
      this.finish();
      return;
    }
    if (nextIndex < 0) return;
    this.isTurning = true;
    this.audio?.play?.('pageTurn');
    const current = this.pageImage;
    this.tweens.add({
      targets: current,
      alpha: 0,
      duration: 260,
      ease: 'Sine.In',
      onComplete: () => {
        current?.destroy();
        this.pageIndex = nextIndex;
        const key = PROLOGUE_PAGE_KEYS[this.pageIndex];
        const image = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, key).setOrigin(0.5).setDepth(10);
        this.fitPageImage(image);
        image.setAlpha(0);
        this.pageImage = image;
        this.updateControls();
        this.tweens.add({
          targets: image,
          alpha: 1,
          duration: 430,
          ease: 'Sine.Out',
          onComplete: () => {
            this.isTurning = false;
          }
        });
      }
    });
  }

  finish() {
    const settings = SaveManager.readSettings();
    settings.storySeen = true;
    SaveManager.saveSettings(settings);
    this.audio?.play('dialogClose');
    SceneTransition.fadeTo(this, SCENES.CharacterSelect, {}, 420);
  }
}
