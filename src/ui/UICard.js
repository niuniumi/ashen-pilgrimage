import Phaser from 'phaser';
import { CARD_TYPES, COLORS } from '../game/constants.js';
import { cardRarityColor, cardTypeBorder, CARD_TYPE_COLORS, drawCardIllustration } from '../art/CardArtFactory.js';
import { FONT } from '../design/textStyles.js';
import { PIXEL_PALETTE, snapPixel } from '../art/PixelArtSystem.js';
import { UITooltip } from './UITooltip.js';


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

    this.frameImage = null;
    this.artImage = null;
    this.pressed = false;
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
      this.tooltip = new UITooltip(scene);
      this.hitZone = scene.add.zone(x, y, this.w, this.h).setOrigin(0.5);
      this.hitZone.setInteractive({ useHandCursor: true });
      this.hitZone.on('pointerover', (pointer) => this.handleOver(pointer));
      this.hitZone.on('pointerout', () => this.handleOut());
      this.hitZone.on('pointerdown', () => { if (!this.disabled) this.pressed = true; });
      this.hitZone.on('pointerup', () => {
        if (!this.disabled && this.pressed) this.options.onClick?.(this);
        this.pressed = false;
      });
      scene.events.on('preupdate', this.syncHitZone, this);
      this.once('destroy', () => {
        scene.events.off('preupdate', this.syncHitZone, this);
        this.hitZone?.destroy();
        this.tooltip?.destroy();
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

  handleOver(pointer) {
    if (this.scene.uiPaused) return;
    this.options.onHover?.(this);
    const fullText = `${this.card.name}${this.card.upgraded ? '+' : ''}\n${this.card.activeText ?? this.card.text}\n${this.card.type} · ${this.card.rarity}`;
    this.tooltip?.show((pointer?.worldX ?? this.x) + 24, (pointer?.worldY ?? this.y) - 118, fullText);
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
    this.pressed = false;
    this.tooltip?.hide();
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
    const fill = CARD_COLORS[this.card.type] ?? COLORS.parchmentDark;
    const typeBorder = cardTypeBorder(this.card);
    const border = this.selected ? PIXEL_PALETTE.candle : typeBorder;
    const alpha = this.disabled ? 0.46 : 1;
    const left = snapPixel(-this.w / 2);
    const top = snapPixel(-this.h / 2);
    const w = snapPixel(this.w);
    const h = snapPixel(this.h);

    this.bg.clear();
    if (this.selected) {
      this.bg.fillStyle(PIXEL_PALETTE.candle, 0.22);
      this.bg.fillRect(left - 8, top - 8, w + 16, h + 16);
    }
    this.bg.fillStyle(border, alpha);
    this.bg.fillRect(left, top, w, h);
    this.bg.fillStyle(PIXEL_PALETTE.void, alpha);
    this.bg.fillRect(left + 4, top + 4, w - 8, h - 8);
    this.bg.fillStyle(PIXEL_PALETTE.coal, alpha);
    this.bg.fillRect(left + 8, top + 8, w - 16, h - 16);
    this.bg.fillStyle(fill, 0.9 * alpha);
    this.bg.fillRect(left + 8, top + 8, w - 16, 28);
    drawCardIllustration(this.bg, this.card, left + 16, top + 40, w - 32, 58, alpha);
    this.bg.fillStyle(PIXEL_PALETTE.black, alpha);
    this.bg.fillRect(left + 12, top + 104, w - 24, 56);
    this.bg.fillStyle(PIXEL_PALETTE.paperDark, 0.78 * alpha);
    this.bg.fillRect(left + 12, top + h - 20, w - 24, 12);
    this.bg.fillStyle(PIXEL_PALETTE.candle, alpha);
    this.bg.fillRect(left + 4, top + 4, 32, 32);
    this.bg.fillStyle(PIXEL_PALETTE.void, alpha);
    this.bg.fillRect(left + 8, top + 8, 24, 24);

    if (this.disabled) {
      this.bg.fillStyle(PIXEL_PALETTE.void, 0.44);
      this.bg.fillRect(left + 4, top + 4, w - 8, h - 8);
    }

    this.nameText
      .setText(`${this.card.name}${this.card.upgraded ? '+' : ''}`)
      .setFontSize(this.card.name.length > 5 ? 15 : 17)
      .setColor('#f4e7c5')
      .setAlpha(this.disabled ? 0.55 : 1);
    this.costText.setText(this.card.cost === null ? '-' : `${this.card.cost}`).setColor('#ffd36a').setAlpha(this.disabled ? 0.55 : 1);
    this.descText
      .setText(this.wrapDescription(this.card.activeText ?? this.card.text))
      .setFontSize(this.descriptionFontSize(this.card.activeText ?? this.card.text))
      .setColor('#d6c7a5')
      .setAlpha(this.disabled ? 0.55 : 1);
    this.typeText.setText(`${this.card.type} · ${this.card.rarity}`).setColor(toCssColor(cardRarityColor(this.card))).setAlpha(this.disabled ? 0.55 : 1);
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
