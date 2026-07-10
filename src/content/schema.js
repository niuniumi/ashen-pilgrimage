import { CARD_TYPES, RARITIES } from '../game/constants.js';

export const CARD_TYPES_ALLOWED = new Set(Object.values(CARD_TYPES));
export const CARD_RARITY_ALLOWED = new Set(Object.values(RARITIES));
export const ENEMY_TYPES_ALLOWED = new Set(['normal', 'elite', 'boss']);
export const ENEMY_INTENTS_ALLOWED = new Set(['attack', 'block', 'buff', 'debuff', 'special', 'heal']);

export function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function hasNumber(value) {
  return Number.isFinite(value);
}

export function isArray(value) {
  return Array.isArray(value);
}

export function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
