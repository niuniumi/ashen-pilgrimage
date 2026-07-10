import Phaser from 'phaser';
import { CARD_TYPES, COLORS } from '../game/constants.js';
import { cardRarityColor, cardRarityFaceColor, cardTypeBorder, CARD_TYPE_COLORS, drawCardIllustration } from '../art/CardArtFactory.js';
import {
  addUiAsset,
  addVfxAsset,
  chooseCardFrame,
  chooseCardVfx,
  ensureFrame,
  HANDPAINTED_KEYS,
  hasTexture,
  UI_FRAMES,
  VFX_FRAMES
} from '../art/HandPaintedAssets.js';

const FONT = 'Georgia, "Microsoft YaHei", serif';

const CARD_COLORS = CARD_TYPE_COLORS;

function toCssColor(color) {
  return `#${color.toString(16).padStart(6, '0')}`;
}

export class UICard extends Phaser.GameObjects.Container {
  constructor(scene, x, y, card, options = {}) {
    super(scene, x, y);
    this.card = card;
    this.options = options;
    this.w = options.width ?? 132;
    this.h = options.height ?? 184;
    this.selected = false;
    this.disabled = Boolean(options.disabled);
    this.baseX = options.baseX ?? x;
    this.baseY = options.baseY ?? y;
    this.baseScale = options.scale ?? 1;

    this.frameImage = hasTexture(scene, HANDPAINTED_KEYS.ui)
      ? addUiAsset(scene, chooseCardFrame(card), 0, 0, {
          displayWidth: this.w,
          displayHeight: this.h,
          alpha: this.disabled ? 0.62 : 1
        })
      : null;
    this.artImage = hasTexture(scene, HANDPAINTED_KEYS.vfx)
      ? addVfxAsset(scene, chooseCardVfx(card), 0, -16, {
          displayWidth: 92,
          displayHeight: 58,
          alpha: this.disabled ? 0.48 : 0.96
        })
      : null;
    this.bg = scene.add.graphics();
    this.nameText = scene.add
      .text(7, -72, '', {
        fontFamily: FONT,
        fontSize: 17,
        color: '#fff2cf',
        align: 'center',
        wordWrap: { width: this.w - 52 }
      })
      .setOrigin(0.5);
    this.costText = scene.add
      .text(-48, -73, '', {
        fontFamily: FONT,
        fontSize: 20,
        color: '#1d130c',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);
    this.descText = scene.add
      .text(0, 39, '', {
        fontFamily: FONT,
        fontSize: 12,
        color: '#2b1a12',
        align: 'center',
        lineSpacing: 2,
        wordWrap: { width: this.w - 28 }
      })
      .setOrigin(0.5);
    this.typeText = scene.add
      .text(0, 82, '', {
        fontFamily: FONT,
        fontSize: 11,
        color: '#4b321d',
        align: 'center'
      })
      .setOrigin(0.5);

    this.add([this.frameImage, this.bg, this.artImage, this.nameText, this.costText, this.descText, this.typeText].filter(Boolean));
    this.setSize(this.w, this.h);
    this.setScale(this.baseScale);
    this.setRotation(options.rotation ?? 0);
    scene.add.existing(this);

    if (options.interactive !== false) {
      this.hitZone = scene.add.zone(x, y, this.w, this.h).setOrigin(0.5);
      this.hitZone.setInteractive({ useHandCursor: true });
      this.hitZone.on('pointerover', () => this.handleOver());
      this.hitZone.on('pointerout', () => this.handleOut());
      this.hitZone.on('pointerdown', () => this.options.onClick?.(this));
      scene.events.on('preupdate', this.syncHitZone, this);
      this.once('destroy', () => {
        scene.events.off('preupdate', this.syncHitZone, this);
        this.hitZone?.destroy();
      });
      this.syncHitZone();
    }
    this.renderCard();
  }

  setSelected(value) {
    this.selected = value;
    this.renderCard();
    return this;
  }

  setDisabled(value) {
    this.disabled = value;
    this.renderCard();
    return this;
  }

  handleOver() {
    if (this.scene.uiPaused) return;
    this.options.onHover?.(this);
    if (this.disabled) return;
    this.scene.audio?.play('cardHover');
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      y: this.baseY - 24,
      scale: this.baseScale * 1.12,
      duration: 120,
      ease: 'Sine.Out'
    });
  }

  handleOut() {
    if (this.scene.uiPaused) return;
    this.options.onOut?.(this);
    if (!this.selected) {
      this.scene.tweens.killTweensOf(this);
      this.scene.tweens.add({
        targets: this,
        y: this.baseY,
        scale: this.baseScale,
        duration: 120,
        ease: 'Sine.Out'
      });
    }
  }

  renderCard() {
    if (this.frameImage) {
      this.renderHandPaintedCard();
      return;
    }
    const fill = CARD_COLORS[this.card.type] ?? COLORS.parchmentDark;
    const face = cardRarityFaceColor(this.card);
    const typeBorder = cardTypeBorder(this.card);
    const border = this.selected ? COLORS.candle : 0xb88935;
    const alpha = this.disabled ? 0.46 : 1;
    const left = -this.w / 2;
    const top = -this.h / 2;

    this.bg.clear();
    if (this.selected) {
      this.bg.lineStyle(10, COLORS.candle, 0.2);
      this.bg.strokeRoundedRect(left - 5, top - 5, this.w + 10, this.h + 10, 10);
    }

    this.bg.fillStyle(0x120b08, alpha);
    this.bg.fillRoundedRect(left, top, this.w, this.h, 7);
    this.bg.fillStyle(fill, 0.98 * alpha);
    this.bg.fillRoundedRect(left + 4, top + 4, this.w - 8, this.h - 8, 6);
    this.bg.fillStyle(face, 0.98 * alpha);
    this.bg.fillRoundedRect(left + 10, top + 32, this.w - 20, this.h - 42, 5);
    this.bg.fillStyle(typeBorder, 0.1 * alpha);
    this.bg.fillRoundedRect(left + 14, top + 36, this.w - 28, this.h - 50, 4);
    for (let i = 0; i < 18; i += 1) {
      this.bg.fillStyle(i % 2 ? 0x7a5832 : 0xffffff, i % 2 ? 0.035 * alpha : 0.045 * alpha);
      this.bg.fillRect(left + 17 + ((i * 31) % (this.w - 34)), top + 41 + ((i * 47) % (this.h - 68)), 2 + (i % 3), 1 + (i % 2));
    }

    this.bg.lineStyle(2, border, 0.88 * alpha);
    this.bg.strokeRoundedRect(left + 2, top + 2, this.w - 4, this.h - 4, 7);
    this.drawGildedCardCorners(left, top, alpha);
    this.bg.lineStyle(1, 0x2b1a12, 0.58 * alpha);
    this.bg.strokeRoundedRect(left + 9, top + 9, this.w - 18, this.h - 18, 5);
    this.bg.lineStyle(1, 0xf2c86d, 0.18 * alpha);
    this.bg.strokeRoundedRect(left + 15, top + 38, this.w - 30, this.h - 56, 3);

    this.drawCostOrb(alpha);
    this.drawTitlePlate(fill, alpha);
    this.drawIllustration(alpha);
    this.drawDescriptionFrame(alpha);

    if (this.disabled) {
      this.bg.fillStyle(0x070604, 0.38);
      this.bg.fillRoundedRect(left + 4, top + 4, this.w - 8, this.h - 8, 6);
    }

    this.nameText
      .setText(`${this.card.name}${this.card.upgraded ? '+' : ''}`)
      .setFontSize(this.card.name.length > 5 ? 15 : 17)
      .setAlpha(this.disabled ? 0.55 : 1);
    this.costText.setText(this.card.cost === null ? '-' : `${this.card.cost}`).setAlpha(this.disabled ? 0.55 : 1);
    this.descText
      .setText(this.wrapDescription(this.card.activeText ?? this.card.text))
      .setFontSize(this.descriptionFontSize(this.card.activeText ?? this.card.text))
      .setAlpha(this.disabled ? 0.55 : 1);
    this.typeText.setText(`${this.card.type} · ${this.card.rarity}`).setAlpha(this.disabled ? 0.55 : 1);
  }

  renderHandPaintedCard() {
    const frameKey = chooseCardFrame(this.card);
    const artKey = chooseCardVfx(this.card);
    const alpha = this.disabled ? 0.5 : 1;
    this.bg.clear();
    ensureFrame(this.scene, HANDPAINTED_KEYS.ui, `ui-${frameKey}`, UI_FRAMES[frameKey]);
    this.frameImage.setTexture(HANDPAINTED_KEYS.ui, `ui-${frameKey}`);
    this.frameImage.setDisplaySize(this.w, this.h);
    this.frameImage.setAlpha(this.disabled ? 0.55 : 1);
    if (this.artImage) {
      ensureFrame(this.scene, HANDPAINTED_KEYS.vfx, `vfx-${artKey}`, VFX_FRAMES[artKey]);
      this.artImage.setTexture(HANDPAINTED_KEYS.vfx, `vfx-${artKey}`);
      this.artImage.setDisplaySize(92, 58);
      this.artImage.setAlpha(this.disabled ? 0.36 : 0.92);
      this.artImage.setPosition(0, -17);
    }
    if (this.selected) {
      this.bg.lineStyle(10, COLORS.candle, 0.28);
      this.bg.strokeRoundedRect(-this.w / 2 - 5, -this.h / 2 - 5, this.w + 10, this.h + 10, 10);
      this.bg.lineStyle(2, 0xffefb3, 0.82);
      this.bg.strokeRoundedRect(-this.w / 2 + 4, -this.h / 2 + 4, this.w - 8, this.h - 8, 7);
    }
    this.drawRarityFaceWash(alpha);
    this.bg.lineStyle(2, 0xb88935, this.disabled ? 0.22 : 0.62);
    this.bg.strokeRoundedRect(-this.w / 2 + 4, -this.h / 2 + 4, this.w - 8, this.h - 8, 7);
    this.drawGildedCardCorners(-this.w / 2, -this.h / 2, alpha);
    if (this.disabled) {
      this.bg.fillStyle(0x170f0a, 0.36);
      this.bg.fillRoundedRect(-this.w / 2 + 5, -this.h / 2 + 5, this.w - 10, this.h - 10, 8);
    }
    const text = this.card.activeText ?? this.card.text;
    this.nameText
      .setText(`${this.card.name}${this.card.upgraded ? '+' : ''}`)
      .setPosition(12, -74)
      .setFontSize(this.card.name.length > 5 ? 14 : 16)
      .setColor('#f9efd6')
      .setAlpha(alpha);
    this.costText
      .setText(this.card.cost === null ? '-' : `${this.card.cost}`)
      .setPosition(-48, -74)
      .setColor('#21150c')
      .setAlpha(alpha);
    this.descText
      .setText(this.wrapDescription(text))
      .setPosition(0, 39)
      .setFontSize(this.descriptionFontSize(text))
      .setColor('#3d2a1a')
      .setAlpha(alpha);
    this.typeText
      .setText(`${this.card.type} · ${this.card.rarity}`)
      .setPosition(0, 80)
      .setColor(toCssColor(cardRarityColor(this.card)))
      .setAlpha(this.disabled ? 0.5 : 0.86);
  }

  drawCostOrb(alpha) {
    this.bg.fillStyle(0x1a100b, 0.95 * alpha);
    this.bg.fillCircle(-48, -73, 19);
    this.bg.fillStyle(0xf0c873, alpha);
    this.bg.fillCircle(-48, -73, 17);
    this.bg.lineStyle(2, 0x6f461d, 0.9 * alpha);
    this.bg.strokeCircle(-48, -73, 17);
    this.bg.fillStyle(0xffffff, 0.24 * alpha);
    this.bg.fillCircle(-54, -80, 5);
  }

  drawTitlePlate(fill, alpha) {
    this.bg.fillStyle(fill, 0.88 * alpha);
    this.bg.fillRoundedRect(-32, -87, 86, 30, 5);
    this.bg.lineStyle(1, 0x24140d, 0.6 * alpha);
    this.bg.strokeRoundedRect(-32, -87, 86, 30, 5);
    this.bg.lineStyle(1, 0xf2c86d, 0.35 * alpha);
    this.bg.lineBetween(-25, -58, 47, -58);
  }

  drawIllustration(alpha) {
    drawCardIllustration(this.bg, this.card, -48, -47, 96, 55, alpha);
  }

  drawDescriptionFrame(alpha) {
    this.bg.fillStyle(0xe2cc96, 0.9 * alpha);
    this.bg.fillRoundedRect(-52, 13, 104, 58, 4);
    this.bg.lineStyle(1, 0x8a6030, 0.5 * alpha);
    this.bg.strokeRoundedRect(-52, 13, 104, 58, 4);
    this.bg.fillStyle(0xc9a96d, 0.62 * alpha);
    this.bg.fillRoundedRect(-52, 73, 104, 16, 3);
  }

  drawRarityFaceWash(alpha) {
    const left = -this.w / 2;
    const top = -this.h / 2;
    const face = cardRarityFaceColor(this.card);
    this.bg.fillStyle(face, 0.32 * alpha);
    this.bg.fillRoundedRect(left + 11, top + 31, this.w - 22, this.h - 45, 6);
    this.bg.fillStyle(0xffffff, 0.12 * alpha);
    this.bg.fillRoundedRect(left + 18, top + 42, this.w - 36, 28, 5);
    this.bg.fillStyle(0x8a6a35, 0.08 * alpha);
    this.bg.fillRoundedRect(left + 16, top + 100, this.w - 32, 61, 4);
  }

  drawGildedCardCorners(left, top, alpha) {
    const right = left + this.w;
    const bottom = top + this.h;
    this.bg.lineStyle(2, 0xe5bd62, 0.45 * alpha);
    const marks = [
      [left + 11, top + 14, left + 34, top + 8, left + 18, top + 38],
      [right - 11, top + 14, right - 34, top + 8, right - 18, top + 38],
      [left + 11, bottom - 14, left + 34, bottom - 8, left + 18, bottom - 38],
      [right - 11, bottom - 14, right - 34, bottom - 8, right - 18, bottom - 38]
    ];
    marks.forEach(([x1, y1, x2, y2, x3, y3]) => {
      this.bg.lineBetween(x1, y1, x2, y2);
      this.bg.lineBetween(x1, y1, x3, y3);
      this.bg.fillStyle(0xf4d89c, 0.36 * alpha);
      this.bg.fillCircle(x1, y1, 2.2);
    });
    this.bg.lineStyle(1, 0x7b5a28, 0.35 * alpha);
    this.bg.lineBetween(left + 22, top + 12, right - 22, top + 12);
    this.bg.lineBetween(left + 22, bottom - 12, right - 22, bottom - 12);
  }

  wrapDescription(text) {
    const clean = String(text ?? '').replace(/\s+/g, ' ').trim();
    const lines = [];
    let line = '';
    for (const char of clean) {
      const limit = /[，。；、]/.test(char) ? 9 : 8;
      if (line.length >= limit) {
        lines.push(line);
        line = '';
      }
      line += char;
      if (/[。；]/.test(char) && lines.length < 2) {
        lines.push(line);
        line = '';
      }
      if (lines.length === 3) break;
    }
    if (line && lines.length < 3) lines.push(line);
    if (lines.length > 3) lines.length = 3;
    const result = lines.join('\n');
    return result.length < clean.length && !result.endsWith('。') ? `${result.slice(0, -1)}…` : result;
  }

  descriptionFontSize(text) {
    const length = String(text ?? '').replace(/\s+/g, '').length;
    if (length > 46) return 9;
    if (length > 34) return 10;
    if (length > 24) return 11;
    return 12;
  }

  syncHitZone() {
    if (!this.hitZone || !this.scene || !this.active) return;
    const matrix = this.getWorldTransformMatrix();
    const sx = Math.hypot(matrix.a, matrix.b) || 1;
    const sy = Math.hypot(matrix.c, matrix.d) || 1;
    const width = this.w * sx;
    const height = this.h * sy;
    this.hitZone.setPosition(matrix.tx, matrix.ty);
    this.hitZone.setSize(width, height);
    if (this.hitZone.input?.hitArea?.setTo) {
      this.hitZone.input.hitArea.setTo(0, 0, width, height);
    } else if (this.hitZone.input?.hitArea) {
      this.hitZone.input.hitArea.width = width;
      this.hitZone.input.hitArea.height = height;
    }
    this.hitZone.setAngle(Phaser.Math.RadToDeg(Math.atan2(matrix.b, matrix.a)));
    this.hitZone.setDepth(10000);
    this.hitZone.setActive(this.active);
  }
}
