import Phaser from 'phaser';
import { COLORS } from '../game/constants.js';
import { FONT } from '../design/textStyles.js';
import { PIXEL_PALETTE, snapPixel } from '../art/PixelArtSystem.js';


export class UIButton extends Phaser.GameObjects.Container {
  constructor(scene, x, y, width, height, label, onClick, options = {}) {
    super(scene, x, y);
    this.widthValue = width;
    this.heightValue = height;
    this.label = label;
    this.onClick = onClick;
    this.disabled = Boolean(options.disabled);
    this.pressed = false;
    this.style = options;
    this.asset = null;
    this.bg = scene.add.graphics();
    this.text = scene.add
      .text(0, 0, label, {
        fontFamily: FONT,
        fontSize: options.fontSize ?? 24,
        color: '#f6edd0',
        align: 'center'
      })
      .setOrigin(0.5);
    this.add([this.asset, this.bg, this.text].filter(Boolean));
    this.setSize(width, height);
    this.setScale(options.scale ?? 1);
    scene.add.existing(this);

    this.hitZone = scene.add.zone(x, y, width, height).setOrigin(0.5);
    this.hitZone.setInteractive({ useHandCursor: true });
    this.hitZone.on('pointerover', () => this.handleOver());
    this.hitZone.on('pointerout', () => this.handleOut());
    this.hitZone.on('pointerdown', () => this.handleDown());
    this.hitZone.on('pointerup', () => this.handleUp());
    scene.events.on('preupdate', this.syncHitZone, this);
    this.once('destroy', () => {
      scene.events.off('preupdate', this.syncHitZone, this);
      this.hitZone?.destroy();
    });
    this.syncHitZone();
    this.draw();
  }

  setDisabled(disabled) {
    this.disabled = disabled;
    this.draw();
    return this;
  }

  handleOver() {
    if (this.scene.uiPaused && !this.style.ignorePause) return;
    if (this.disabled) {
      this.scene.audio?.play('error');
      return;
    }
    this.scene.audio?.play(this.style.hoverSound ?? 'uiHover');
    if (this.style.tooltip && typeof this.scene.setPrompt === 'function') {
      this.scene.setPrompt(this.style.tooltip);
    }
    this.draw(true);
  }

  handleOut() {
    this.pressed = false;
    this.setScale(this.style.scale ?? 1);
    this.draw(false);
    if (this.style.tooltip && typeof this.scene.updatePrompt === 'function') {
      this.scene.updatePrompt();
    }
  }

  handleDown() {
    if (this.scene.uiPaused && !this.style.ignorePause) return;
    if (this.disabled) {
      this.scene.audio?.play('error');
      return;
    }
    this.scene.audio?.unlock?.();
    this.scene.audio?.play(this.style.clickSound ?? 'uiClick');
    this.setScale((this.style.scale ?? 1) * 0.97);
    this.pressed = true;
  }

  handleUp() {
    if (this.disabled || !this.pressed) return;
    this.pressed = false;
    this.scene.audio?.unlock?.();
    this.setScale(this.style.scale ?? 1);
    this.onClick?.();
  }

  draw(hover = false) {
    const w = this.widthValue;
    const h = this.heightValue;
    this.bg.clear();
    const left = snapPixel(-w / 2);
    const top = snapPixel(-h / 2);
    const pw = snapPixel(w);
    const ph = snapPixel(h);
    const fill = this.disabled ? PIXEL_PALETTE.coal : this.style.fill ?? PIXEL_PALETTE.iron;
    const line = this.disabled ? PIXEL_PALETTE.iron : hover ? PIXEL_PALETTE.candle : PIXEL_PALETTE.goldDark;
    this.bg.fillStyle(PIXEL_PALETTE.void, 0.8);
    this.bg.fillRect(left + 4, top + 8, pw, ph);
    this.bg.fillStyle(line, this.disabled ? 0.52 : 1);
    this.bg.fillRect(left, top, pw, ph);
    this.bg.fillStyle(PIXEL_PALETTE.black, 1);
    this.bg.fillRect(left + 4, top + 4, pw - 8, ph - 8);
    this.bg.fillStyle(fill, this.disabled ? 0.62 : 1);
    this.bg.fillRect(left + 8, top + 8, pw - 16, ph - 16);
    this.bg.fillStyle(hover && !this.disabled ? PIXEL_PALETTE.gold : PIXEL_PALETTE.ironLight, hover ? 0.38 : 0.2);
    this.bg.fillRect(left + 8, top + 8, pw - 16, 4);
    this.bg.fillStyle(PIXEL_PALETTE.void, 0.3);
    this.bg.fillRect(left + 8, top + ph - 12, pw - 16, 4);
    if (hover && !this.disabled) {
      this.bg.fillStyle(PIXEL_PALETTE.candle, 0.24);
      this.bg.fillRect(left - 4, top - 4, pw + 8, 4);
      this.bg.fillRect(left - 4, top + ph, pw + 8, 4);
      this.bg.fillRect(left - 4, top, 4, ph);
      this.bg.fillRect(left + pw, top, 4, ph);
    }
    this.text.setAlpha(this.disabled ? 0.42 : 1);
    this.text.setColor(this.disabled ? '#9a8a70' : '#f6edd0');
  }

  syncHitZone() {
    if (!this.hitZone || !this.scene || !this.active) return;
    const matrix = this.getWorldTransformMatrix();
    const sx = Math.hypot(matrix.a, matrix.b) || 1;
    const sy = Math.hypot(matrix.c, matrix.d) || 1;
    const width = this.widthValue * sx;
    const height = this.heightValue * sy;
    this.hitZone.setPosition(matrix.tx, matrix.ty);
    this.hitZone.setSize(width, height);
    if (this.hitZone.input?.hitArea?.setTo) {
      this.hitZone.input.hitArea.setTo(0, 0, width, height);
    } else if (this.hitZone.input?.hitArea) {
      this.hitZone.input.hitArea.width = width;
      this.hitZone.input.hitArea.height = height;
    }
    this.hitZone.setAngle(Phaser.Math.RadToDeg(Math.atan2(matrix.b, matrix.a)));
    this.hitZone.setDepth(this.style.hitDepth ?? 10000);
    this.hitZone.setActive(this.active);
  }
}
