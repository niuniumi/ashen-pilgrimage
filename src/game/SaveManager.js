import { SAVE_KEY, SETTINGS_KEY } from './constants.js';
import { isValidCharacterId } from '../data/characters.js';
import { getCard, isKnownCardId } from '../data/cards.js';
import { getRelic } from '../data/relics.js';
import { migrateRun } from './RunMigration.js';

const defaultSettings = {
  sound: true,
  music: true,
  muted: false,
  bgmVolume: 0.3,
  sfxVolume: 0.62,
  animation: true,
  fastMode: false,
  tutorialEnabled: true,
  tutorialSeen: false,
  storySeen: false
};

function defaultsForDevice() {
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  return { ...defaultSettings, animation: prefersReducedMotion ? false : defaultSettings.animation };
}

function safeRead(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    console.warn('localStorage read failed', error);
    return null;
  }
}

function safeWrite(key, value) {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn('localStorage write failed', error);
    return false;
  }
}

function safeRemove(key) {
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn('localStorage remove failed', error);
    return false;
  }
}

function clamp01(value, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(1, number));
}

function isValidRun(run) {
  return Boolean(
    run &&
      typeof run === 'object' &&
      isValidCharacterId(run.characterId) &&
      Number.isFinite(run.hp) &&
      Number.isFinite(run.maxHp) &&
      Number.isFinite(run.baseEnergy) &&
      Array.isArray(run.deck) &&
      run.deck.length > 0 &&
      run.deck.every((instance) => isDeckCardAllowed(run.characterId, instance)) &&
      Array.isArray(run.relics) &&
      run.relics.every((id) => Boolean(getRelic(id))) &&
      run.map &&
      Array.isArray(run.map.nodes)
  );
}

function isDeckCardAllowed(characterId, instance) {
  if (!instance || typeof instance !== 'object' || !isKnownCardId(instance.cardId)) return false;
  const card = getCard(instance.cardId);
  return card.character === characterId || card.character === 'common' || card.character === 'status';
}

export class SaveManager {
  static readSettings() {
    const raw = safeRead(SETTINGS_KEY);
    if (!raw) return defaultsForDevice();
    try {
      const parsed = JSON.parse(raw);
      const settings = { ...defaultSettings, ...parsed };
      settings.bgmVolume = clamp01(settings.bgmVolume, defaultSettings.bgmVolume);
      settings.sfxVolume = clamp01(settings.sfxVolume, defaultSettings.sfxVolume);
      return settings;
    } catch (error) {
      safeRemove(SETTINGS_KEY);
      return { ...defaultSettings };
    }
  }

  static saveSettings(settings) {
    const merged = { ...defaultSettings, ...settings };
    merged.bgmVolume = clamp01(merged.bgmVolume, defaultSettings.bgmVolume);
    merged.sfxVolume = clamp01(merged.sfxVolume, defaultSettings.sfxVolume);
    return safeWrite(SETTINGS_KEY, JSON.stringify(merged));
  }

  static hasRun() {
    return isValidRun(this.loadRun());
  }

  static loadRun() {
    const raw = safeRead(SAVE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      const run = migrateRun(parsed);
      if (!isValidRun(run)) {
        safeRemove(SAVE_KEY);
        return null;
      }
      if (run.version !== parsed.version || JSON.stringify(run) !== raw) {
        safeWrite(SAVE_KEY, JSON.stringify(run));
      }
      return run;
    } catch (error) {
      safeRemove(SAVE_KEY);
      return null;
    }
  }

  static saveRun(run) {
    if (!isValidRun(run)) return false;
    return safeWrite(SAVE_KEY, JSON.stringify(run));
  }

  static clearRun() {
    return safeRemove(SAVE_KEY);
  }

  static clearAll() {
    safeRemove(SAVE_KEY);
    safeRemove(SETTINGS_KEY);
  }

  static markTutorialSeen() {
    const settings = this.readSettings();
    settings.tutorialSeen = true;
    this.saveSettings(settings);
  }

  static resetTutorial() {
    const settings = this.readSettings();
    settings.tutorialSeen = false;
    settings.tutorialEnabled = true;
    this.saveSettings(settings);
  }

  static resetStory() {
    const settings = this.readSettings();
    settings.storySeen = false;
    this.saveSettings(settings);
  }
}
