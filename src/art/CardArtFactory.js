import { CARD_TYPES, RARITIES } from '../game/constants.js';
import { THEME } from '../game/Theme.js';
import { drawCandleFlame, drawPixelGrain, drawSlashMarks } from './PixelSpriteFactory.js';
import { PIXEL_PALETTE, snapPixel, stablePixelHash } from './PixelArtSystem.js';
import { resolveCardArtKind } from './CardVisualCatalog.js';

export const CARD_TYPE_COLORS = {
  [CARD_TYPES.ATTACK]: 0x77302b,
  [CARD_TYPES.DEFENSE]: 0x2f6484,
  [CARD_TYPES.SKILL]: 0x8a6133,
  [CARD_TYPES.SPELL]: 0x6e4cb0,
  [CARD_TYPES.STATUS]: 0x51493d,
  [CARD_TYPES.CURSE]: 0x2a1b32
};

export const CARD_RARITY_COLORS = {
  [RARITIES.COMMON]: 0xf4eee2,
  [RARITIES.RARE]: 0x6eb6e8,
  [RARITIES.EPIC]: 0xa77bff,
  [RARITIES.LEGENDARY]: 0xf2c86d,
  [RARITIES.ABSOLUTE]: 0xd94c3f
};

export const CARD_RARITY_FACE_COLORS = {
  [RARITIES.COMMON]: 0xf6eedf,
  [RARITIES.RARE]: 0xd7e8f4,
  [RARITIES.EPIC]: 0xe2d8f2,
  [RARITIES.LEGENDARY]: 0xf2dfaa,
  [RARITIES.ABSOLUTE]: 0xefc6b8
};

function drawCardGlyph(g, kind, cx, cy, alpha) {
  const gold = PIXEL_PALETTE.candle;
  const bone = PIXEL_PALETTE.bone;
  const blood = PIXEL_PALETTE.blood;
  const iron = PIXEL_PALETTE.ironLight;
  if (kind === 'blade' || kind === 'marked-blade') {
    g.fillStyle(bone, alpha);
    for (let i = -20; i <= 16; i += 4) g.fillRect(cx + i, cy - i - 4, 4, 8);
    g.fillStyle(gold, alpha);
    g.fillRect(cx - 18, cy + 14, 24, 4);
    if (kind === 'marked-blade') {
      g.fillStyle(blood, alpha);
      g.fillRect(cx + 8, cy - 16, 8, 8);
      g.fillRect(cx + 12, cy - 8, 8, 4);
    }
    return;
  }
  if (kind === 'volley') {
    g.fillStyle(gold, alpha);
    for (let offset = -12; offset <= 12; offset += 12) {
      for (let i = -12; i <= 12; i += 4) g.fillRect(cx + i + offset, cy - i - 4, 4, 4);
    }
    g.fillStyle(blood, alpha);
    g.fillRect(cx - 22, cy + 16, 44, 4);
    return;
  }
  if (kind === 'heavy-blade') {
    g.fillStyle(iron, alpha);
    g.fillRect(cx - 8, cy - 22, 16, 36);
    g.fillRect(cx - 12, cy - 18, 24, 24);
    g.fillStyle(bone, alpha);
    g.fillRect(cx - 4, cy - 18, 8, 30);
    g.fillStyle(gold, alpha);
    g.fillRect(cx - 20, cy + 10, 40, 8);
    g.fillStyle(blood, alpha);
    g.fillRect(cx - 4, cy + 18, 8, 8);
    return;
  }
  if (kind === 'shield') {
    g.fillStyle(PIXEL_PALETTE.blue, alpha);
    g.fillRect(cx - 18, cy - 18, 36, 12);
    g.fillRect(cx - 16, cy - 6, 32, 16);
    g.fillRect(cx - 12, cy + 10, 24, 8);
    g.fillRect(cx - 6, cy + 18, 12, 4);
    g.fillStyle(gold, alpha);
    g.fillRect(cx - 2, cy - 14, 4, 28);
    return;
  }
  if (kind === 'candle') {
    g.fillStyle(bone, alpha);
    g.fillRect(cx - 10, cy - 2, 20, 24);
    g.fillStyle(PIXEL_PALETTE.ember, alpha);
    g.fillRect(cx - 8, cy - 14, 16, 12);
    g.fillStyle(gold, alpha);
    g.fillRect(cx - 4, cy - 22, 8, 16);
    g.fillRect(cx - 22, cy + 18, 44, 4);
    return;
  }
  if (kind === 'prayer') {
    g.fillStyle(PIXEL_PALETTE.paper, alpha);
    g.fillRect(cx - 22, cy - 16, 18, 32);
    g.fillRect(cx + 4, cy - 16, 18, 32);
    g.fillStyle(PIXEL_PALETTE.paperDark, alpha);
    g.fillRect(cx - 4, cy - 12, 8, 32);
    g.fillStyle(gold, alpha);
    g.fillRect(cx - 2, cy - 20, 4, 24);
    g.fillRect(cx - 10, cy - 12, 20, 4);
    return;
  }
  if (kind === 'vial' || kind === 'injection') {
    g.fillStyle(bone, alpha);
    if (kind === 'vial') {
      g.fillRect(cx - 8, cy - 22, 16, 8);
      g.fillRect(cx - 16, cy - 14, 32, 32);
      g.fillStyle(PIXEL_PALETTE.teal, alpha);
      g.fillRect(cx - 12, cy + 2, 24, 12);
      g.fillRect(cx - 8, cy - 2, 16, 4);
    } else {
      g.fillRect(cx - 22, cy - 6, 40, 12);
      g.fillRect(cx + 14, cy - 14, 8, 28);
      g.fillStyle(blood, alpha);
      g.fillRect(cx - 14, cy - 2, 24, 4);
      g.fillStyle(gold, alpha);
      g.fillRect(cx - 26, cy - 2, 8, 4);
    }
    return;
  }
  if (kind === 'smoke') {
    g.fillStyle(PIXEL_PALETTE.ironLight, 0.72 * alpha);
    g.fillRect(cx - 22, cy + 8, 40, 12);
    g.fillRect(cx - 14, cy - 4, 28, 12);
    g.fillRect(cx - 4, cy - 16, 20, 12);
    g.fillRect(cx + 6, cy - 24, 12, 8);
    return;
  }
  if (kind === 'lotus') {
    g.fillStyle(bone, alpha);
    g.fillRect(cx - 6, cy - 20, 12, 24);
    g.fillRect(cx - 22, cy - 12, 16, 24);
    g.fillRect(cx + 6, cy - 12, 16, 24);
    g.fillStyle(PIXEL_PALETTE.teal, alpha);
    g.fillRect(cx - 26, cy + 12, 52, 8);
    g.fillStyle(gold, alpha);
    g.fillRect(cx - 4, cy - 4, 8, 8);
    return;
  }
  if (kind === 'anvil') {
    g.fillStyle(iron, alpha);
    g.fillRect(cx - 22, cy - 10, 44, 12);
    g.fillRect(cx - 14, cy + 2, 28, 12);
    g.fillRect(cx - 20, cy + 14, 40, 8);
    g.fillStyle(gold, alpha);
    g.fillRect(cx + 8, cy - 22, 8, 16);
    return;
  }
  if (kind === 'curse' || kind === 'wound') {
    g.fillStyle(kind === 'curse' ? PIXEL_PALETTE.violet : blood, alpha);
    g.fillRect(cx - 18, cy - 14, 36, 28);
    g.fillStyle(PIXEL_PALETTE.void, alpha);
    g.fillRect(cx - 10, cy - 6, 8, 8);
    g.fillRect(cx + 2, cy - 6, 8, 8);
    g.fillRect(cx - 4, cy + 8, 8, 8);
    return;
  }
  g.fillStyle(PIXEL_PALETTE.paper, alpha);
  g.fillRect(cx - 22, cy - 16, 44, 32);
  g.fillStyle(PIXEL_PALETTE.paperDark, alpha);
  g.fillRect(cx - 14, cy - 8, 28, 4);
  g.fillRect(cx - 14, cy, 24, 4);
  g.fillRect(cx - 14, cy + 8, 28, 4);
}

export function drawCardIllustration(g, card, x, y, width, height, alpha = 1) {
  const left = snapPixel(x);
  const top = snapPixel(y);
  const w = snapPixel(width);
  const h = snapPixel(height);
  const cx = snapPixel(left + w / 2);
  const cy = snapPixel(top + h / 2);
  const hash = stablePixelHash(card.id ?? card.name);
  g.fillStyle(PIXEL_PALETTE.void, alpha);
  g.fillRect(left, top, w, h);
  g.fillStyle(PIXEL_PALETTE.iron, 0.8 * alpha);
  g.fillRect(left + 4, top + 4, w - 8, h - 8);
  for (let i = 0; i < 5; i += 1) {
    g.fillStyle(i % 2 ? PIXEL_PALETTE.black : PIXEL_PALETTE.ironLight, 0.16 * alpha);
    g.fillRect(left + 8 + ((hash + i * 19) % Math.max(4, w - 20)), top + 8 + ((hash + i * 13) % Math.max(4, h - 20)), 4, 4);
  }
  const characterTint = card.character === 'ashblood-alchemist'
    ? PIXEL_PALETTE.teal
    : card.character === 'candle-nun'
      ? PIXEL_PALETTE.goldDark
      : PIXEL_PALETTE.bloodDark;
  g.fillStyle(characterTint, 0.18 * alpha);
  g.fillRect(left + 8, top + h - 12, w - 16, 4);
  drawCardGlyph(g, resolveCardArtKind(card), cx, cy, alpha);
}

export function cardTypeBorder(card) {
  return CARD_TYPE_COLORS[card.type] ?? THEME.colors.darkGold;
}

export function cardRarityColor(card) {
  return CARD_RARITY_COLORS[card.rarity] ?? THEME.colors.darkGold;
}

export function cardRarityFaceColor(card) {
  return CARD_RARITY_FACE_COLORS[card.rarity] ?? CARD_RARITY_FACE_COLORS[RARITIES.COMMON];
}

function drawAttackArt(g, cx, cy, w, h, alpha) {
  g.fillStyle(0x5c1d1a, 0.66 * alpha);
  g.fillTriangle(cx - w * 0.44, cy + h * 0.34, cx + w * 0.4, cy - h * 0.42, cx + w * 0.12, cy + h * 0.38);
  drawSlashMarks(g, cx, cy, 0.78, 0xe5c06f);
  g.lineStyle(3, 0xffefd1, 0.72 * alpha);
  g.lineBetween(cx - w * 0.22, cy + h * 0.25, cx + w * 0.43, cy - h * 0.08);
  g.lineStyle(2, THEME.colors.blood, 0.9 * alpha);
  g.lineBetween(cx - w * 0.45, cy - h * 0.24, cx + w * 0.1, cy + h * 0.12);
}

function drawDefenseArt(g, cx, cy, w, h, alpha) {
  g.fillStyle(THEME.colors.shield, 0.95 * alpha);
  g.fillTriangle(cx, cy - h * 0.43, cx + w * 0.36, cy - h * 0.08, cx, cy + h * 0.43);
  g.fillTriangle(cx, cy - h * 0.43, cx - w * 0.36, cy - h * 0.08, cx, cy + h * 0.43);
  g.lineStyle(5, 0xd8c894, 0.68 * alpha);
  g.strokeCircle(cx, cy, Math.min(w, h) * 0.42);
  g.lineStyle(2, 0xe9f2ff, 0.62 * alpha);
  g.lineBetween(cx - w * 0.18, cy - h * 0.2, cx + w * 0.2, cy + h * 0.18);
}

function drawSkillArt(g, cx, cy, w, h, alpha) {
  g.fillStyle(0xcaa568, 0.93 * alpha);
  g.fillRoundedRect(cx - w * 0.32, cy - h * 0.28, w * 0.64, h * 0.56, 7);
  g.fillStyle(0x6f4b24, 0.5 * alpha);
  g.fillCircle(cx - w * 0.32, cy, h * 0.16);
  g.fillCircle(cx + w * 0.32, cy, h * 0.16);
  g.lineStyle(2, 0x8a5f26, 0.92 * alpha);
  g.lineBetween(cx - w * 0.18, cy - h * 0.12, cx + w * 0.18, cy - h * 0.12);
  g.lineBetween(cx - w * 0.16, cy + h * 0.08, cx + w * 0.16, cy + h * 0.08);
  g.fillStyle(THEME.colors.candle, 0.88 * alpha);
  g.fillCircle(cx, cy - h * 0.24, h * 0.08);
}

function drawSpellArt(g, cx, cy, w, h, alpha) {
  g.fillStyle(THEME.colors.arcane, 0.74 * alpha);
  g.fillTriangle(cx, cy - h * 0.45, cx + w * 0.31, cy + h * 0.32, cx - w * 0.31, cy + h * 0.32);
  drawCandleFlame(g, cx, cy - h * 0.05, 1.05, alpha);
  g.lineStyle(2, 0xd8c5ff, 0.78 * alpha);
  g.strokeCircle(cx, cy, Math.min(w, h) * 0.42);
  g.lineBetween(cx - w * 0.28, cy, cx + w * 0.28, cy);
}

function drawCurseArt(g, cx, cy, w, h, alpha) {
  g.fillStyle(0x09060b, 0.62 * alpha);
  g.fillCircle(cx, cy, h * 0.42);
  g.lineStyle(5, 0x19101f, 0.96 * alpha);
  g.lineBetween(cx - w * 0.34, cy - h * 0.38, cx - w * 0.04, cy - h * 0.05);
  g.lineBetween(cx - w * 0.04, cy - h * 0.05, cx - w * 0.22, cy + h * 0.36);
  g.lineBetween(cx + w * 0.1, cy - h * 0.4, cx + w * 0.38, cy - h * 0.02);
  g.lineBetween(cx + w * 0.38, cy - h * 0.02, cx + w * 0.08, cy + h * 0.34);
  g.lineStyle(2, 0x8d63bd, 0.74 * alpha);
  g.lineBetween(cx - w * 0.38, cy + h * 0.02, cx + w * 0.4, cy - h * 0.26);
}

function drawStatusArt(g, cx, cy, w, h, alpha) {
  g.fillStyle(0x675d4b, 0.8 * alpha);
  g.fillCircle(cx, cy, h * 0.36);
  g.lineStyle(2, 0xd8c894, 0.55 * alpha);
  g.strokeCircle(cx, cy, h * 0.44);
  g.lineStyle(3, 0x2b2118, 0.5 * alpha);
  g.lineBetween(cx - w * 0.28, cy - h * 0.22, cx + w * 0.28, cy + h * 0.18);
}
