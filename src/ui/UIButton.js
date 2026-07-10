import Phaser from 'phaser';
import { COLORS } from '../game/constants.js';
import { addUiAsset, ensureFrame, HANDPAINTED_KEYS, hasTexture, UI_FRAMES } from '../art/HandPaintedAssets.js';

const FONT = 'Georgia, "Microsoft YaHei", serif';

export class UIButton extends Phaser.GameObjects.Container {
  constructor(scene, x, y, width, height, label, onClick, options = {}) {
    super(scene, x, y);
    this.widthValue = width;
    this.heightValue = height;
    this.label = label;
    this.onClick = onClick;
    this.disabled = Boolean(options.disabled);
    this.style = options;
    this.asset = hasTexture(scene, HANDPAINTED_KEYS.ui)
      ? addUiAsset(scene, this.disabled ? 'buttonDisabled' : 'button', 0, 0, {
          displayWidth: width,
          displayHeight: height,
          alpha: this.disabled ? 0.72 : 1
        })
      : null;
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
    this.onClick?.();
  }

  handleUp() {
    if (this.disabled) return;
    this.scene.audio?.unlock?.();
    this.setScale(this.style.scale ?? 1);
  }

  draw(hover = false) {
    const w = this.widthValue;
    const h = this.heightValue;
    this.bg.clear();
    if (this.asset) {
      const frameKey = this.disabled ? 'buttonDisabled' : hover ? 'buttonGlow' : this.style.variant === 'muted' ? 'buttonDisabled' : 'button';
      ensureFrame(this.scene, HANDPAINTED_KEYS.ui, `ui-${frameKey}`, UI_FRAMES[frameKey]);
      this.asset.setTexture(HANDPAINTED_KEYS.ui, `ui-${frameKey}`);
      this.asset.setDisplaySize(w, h);
      this.asset.setAlpha(this.disabled ? 0.66 : hover ? 1 : 0.96);
      if (hover && !this.disabled) {
        this.bg.lineStyle(8, COLORS.candle, 0.22);
        this.bg.strokeRoundedRect(-w / 2 - 5, -h / 2 - 5, w + 10, h + 10, 14);
      }
      this.text.setAlpha(this.disabled ? 0.46 : 1);
      this.text.setColor(this.disabled ? '#8e806f' : '#f9efd6');
      return;
    }
    const fill = this.disabled ? 0x282420 : this.style.fill ?? COLORS.iron;
    const line = this.disabled ? 0x5b5145 : hover ? COLORS.paleGold : 0xb88935;
    this.bg.fillStyle(0x030202, this.disabled ? 0.5 : 0.74);
    this.bg.fillRoundedRect(-w / 2 - 5, -h / 2 + 5, w + 10, h + 2, 8);
    this.bg.fillStyle(fill, this.disabled ? 0.56 : 0.96);
    this.bg.fillRoundedRect(-w / 2, -h / 2, w, h, 7);
    this.bg.fillStyle(0xffffff, hover && !this.disabled ? 0.1 : 0.04);
    this.bg.fillRoundedRect(-w / 2 + 6, -h / 2 + 5, w - 12, Math.max(8, h * 0.32), 5);
    this.bg.fillStyle(0x000000, 0.18);
    this.bg.fillRoundedRect(-w / 2 + 6, h / 2 - Math.max(8, h * 0.25) - 5, w - 12, Math.max(8, h * 0.25), 5);
    this.bg.lineStyle(2, line, this.disabled ? 0.48 : 0.92);
    this.bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 7);
    this.bg.lineStyle(1, 0x000000, 0.45);
    this.bg.strokeRoundedRect(-w / 2 + 5, -h / 2 + 5, w - 10, h - 10, 4);
    this.bg.lineStyle(1, 0xf2c86d, hover && !this.disabled ? 0.45 : 0.18);
    this.bg.lineBetween(-w / 2 + 14, -h / 2 + 8, w / 2 - 14, -h / 2 + 8);
    this.bg.lineStyle(2, line, this.disabled ? 0.2 : 0.55);
    this.bg.lineBetween(-w / 2 + 8, -h / 2 + 20, -w / 2 + 8, -h / 2 + 8);
    this.bg.lineBetween(w / 2 - 8, -h / 2 + 20, w / 2 - 8, -h / 2 + 8);
    if (hover && !this.disabled) {
      this.bg.lineStyle(7, COLORS.candle, 0.2);
      this.bg.strokeRoundedRect(-w / 2 - 4, -h / 2 - 4, w + 8, h + 8, 10);
      this.bg.fillStyle(COLORS.candle, 0.08);
      this.bg.fillRoundedRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 5);
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
