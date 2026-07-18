import { SaveManager } from './SaveManager.js';
import { resolveSfxMixProfile } from './AudioMixProfiles.js';
import { resolveBgmProfile } from './AudioProfiles.js';
import { resolveAudioHintLayout } from './AudioHintLayout.js';
import { FONT } from '../design/textStyles.js';

const ALIASES = {
  tap: 'uiClick',
  hover: 'uiHover',
  attack: 'swordHit',
  block: 'shieldBlock',
  reward: 'relic',
  boss: 'bossPhase',
  turn: 'turnStart',
  enemy: 'enemyTurn'
};

const SFX_KEYS = {
  uiHover: ['sfx-ui-hover-1', 'sfx-ui-hover-2', 'sfx-ui-hover-3'],
  uiClick: ['sfx-ui-click-1', 'sfx-ui-click-2', 'sfx-ui-click-3'],
  cardHover: ['sfx-ui-hover-2', 'sfx-ui-hover-3'],
  cardSelect: ['sfx-card-select-1', 'sfx-card-select-2', 'sfx-card-select-3'],
  cardPlay: ['sfx-card-play-1', 'sfx-card-play-2', 'sfx-card-play-3'],
  swordHit: ['sfx-attack-1', 'sfx-attack-2', 'sfx-attack-3'],
  shieldBlock: ['sfx-block-1', 'sfx-block-2', 'sfx-block-3'],
  enemyHit: ['sfx-hit-1', 'sfx-hit-2', 'sfx-hit-3'],
  playerHit: ['sfx-hit-2', 'sfx-hit-3', 'sfx-hit-1'],
  heal: ['sfx-heal-1', 'sfx-heal-2'],
  debuff: ['sfx-debuff-1', 'sfx-debuff-2'],
  buff: ['sfx-buff-1', 'sfx-buff-2'],
  turnStart: ['sfx-turn-1', 'sfx-turn-2'],
  enemyTurn: ['sfx-turn-2', 'sfx-turn-1'],
  coin: ['sfx-coin-1', 'sfx-coin-2', 'sfx-coin-3'],
  relic: ['sfx-relic-1', 'sfx-relic-2'],
  cardReward: ['sfx-success-1', 'sfx-success-2'],
  chestOpen: ['sfx-dialog-open-2', 'sfx-success-1'],
  storyText: ['sfx-page-1', 'sfx-page-2', 'sfx-page-3'],
  pageTurn: ['sfx-page-1', 'sfx-page-2', 'sfx-page-3'],
  bossIntro: ['sfx-boss-1', 'sfx-boss-2', 'sfx-boss-3'],
  victory: ['sfx-success-1', 'sfx-success-2'],
  defeat: ['sfx-fail-1', 'sfx-fail-2'],
  bossPhase: ['sfx-boss-1', 'sfx-boss-2', 'sfx-boss-3'],
  dialogOpen: ['sfx-dialog-open-1', 'sfx-dialog-open-2'],
  dialogClose: ['sfx-dialog-close-1', 'sfx-dialog-close-2'],
  pauseOpen: ['sfx-dialog-open-1', 'sfx-dialog-open-2'],
  pauseClose: ['sfx-dialog-close-1', 'sfx-dialog-close-2'],
  error: ['sfx-error-1', 'sfx-error-2'],
  turn: ['sfx-turn-1', 'sfx-turn-2']
};

function clamp01(value, fallback = 0.3) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(1, number));
}

export class AudioManager {
  constructor(dependencies = {}) {
    this.lastPlayed = new Map();
    this.poolCursor = new Map();
    this.now = dependencies.now ?? (() => globalThis.performance?.now?.() ?? Date.now());
    this.random = dependencies.random ?? Math.random;
    this.schedule = dependencies.setTimeout ?? globalThis.setTimeout.bind(globalThis);
    this.cancelSchedule = dependencies.clearTimeout ?? globalThis.clearTimeout.bind(globalThis);
    this.scene = null;
    this.unlocked = false;
    this.currentBgm = null;
    this.currentBgmKey = null;
    this.currentBgmProfile = resolveBgmProfile('menu');
    this.desiredBgmKind = 'menu';
    this.ducked = false;
    this.transientDuckGain = 1;
    this.transientDuckTimer = null;
    this.transientDuckToken = 0;
    this.transientDuckUntil = 0;
    this.unlockHint = null;
    this.pendingBgmKey = null;
  }

  attachScene(scene) {
    this.scene = scene;
    return this;
  }

  unlock() {
    this.unlocked = true;
    this.hideUnlockHint();
    try {
      this.scene?.sound?.unlock?.();
    } catch (error) {
      console.warn('Phaser audio unlock failed', error);
    }
    if (this.desiredBgmKind) {
      const kind = this.desiredBgmKind;
      this.schedule(() => this.playBgm(kind), 80);
    }
  }

  targetBgmVolume() {
    const settings = SaveManager.readSettings();
    if (settings.muted || !settings.music) return 0;
    return (
      clamp01(settings.bgmVolume, 0.3) *
      (this.currentBgmProfile?.gain ?? 1) *
      (this.ducked ? 0.5 : 1) *
      this.transientDuckGain
    );
  }

  canUsePhaserAudio(key) {
    const scene = this.scene;
    if (!scene?.sound) return false;
    const exists = scene.cache?.audio?.exists?.(key);
    if (!exists) {
      if (scene.load?.isLoading?.() && this.pendingBgmKey !== key) {
        this.pendingBgmKey = key;
        scene.load.once('complete', () => {
          this.pendingBgmKey = null;
          if (this.desiredBgmKind) this.playBgm(this.desiredBgmKind);
        });
      } else if (!scene.load?.isLoading?.()) {
        console.warn(`BGM asset missing: ${key}`);
      }
      return false;
    }
    return true;
  }

  playBgm(kind = 'menu') {
    const settings = SaveManager.readSettings();
    const profile = resolveBgmProfile(kind);
    const key = profile.key;
    this.desiredBgmKind = profile.id;
    if (settings.muted || !settings.music) {
      this.stopBgm(false);
      return;
    }
    const scene = this.scene;
    if (!scene?.sound) return;
    if (!this.unlocked) {
      this.showUnlockHint();
      return;
    }
    if (scene.sound.locked) {
      try {
        scene.sound.unlock?.();
      } catch (error) {
        console.warn('Phaser audio unlock retry failed', error);
      }
    }
    if (!this.canUsePhaserAudio(key)) return;
    if (this.currentBgmKey === key && this.currentBgm) {
      this.currentBgmProfile = profile;
      try {
        if (this.currentBgm.isPaused) this.currentBgm.resume();
        else if (!this.currentBgm.isPlaying) this.currentBgm.play();
        this.currentBgm.setRate?.(profile.rate);
      } catch (error) {
        console.warn(`BGM resume failed: ${key}`, error);
      }
      this.fadeSound(this.currentBgm, this.targetBgmVolume(), 260);
      return;
    }

    const previous = this.currentBgm;
    if (previous) {
      this.fadeSound(previous, 0, 800, () => {
        previous.stop();
        previous.destroy();
      });
    }

    let sound = null;
    try {
      sound = scene.sound.add(key, { loop: true, volume: 0, rate: profile.rate });
      sound.play();
    } catch (error) {
      console.warn(`BGM play failed: ${key}`, error);
      return;
    }
    this.currentBgm = sound;
    this.currentBgmKey = key;
    this.currentBgmProfile = profile;
    this.fadeSound(sound, this.targetBgmVolume(), 800);
  }

  stopBgm(clearDesired = true) {
    if (clearDesired) this.desiredBgmKind = null;
    if (!this.currentBgm) return;
    const sound = this.currentBgm;
    this.currentBgm = null;
    this.currentBgmKey = null;
    this.fadeSound(sound, 0, 500, () => {
      sound.stop();
      sound.destroy();
    });
  }

  pauseBgm() {
    this.currentBgm?.pause?.();
  }

  resumeBgm() {
    this.currentBgm?.resume?.();
    if (this.currentBgm) this.fadeSound(this.currentBgm, this.targetBgmVolume(), 260);
  }

  setBgmVolume(value) {
    const settings = SaveManager.readSettings();
    settings.bgmVolume = clamp01(value, 0.3);
    SaveManager.saveSettings(settings);
    if (this.currentBgm) this.fadeSound(this.currentBgm, this.targetBgmVolume(), 160);
  }

  setSfxVolume(value) {
    const settings = SaveManager.readSettings();
    settings.sfxVolume = clamp01(value, 0.75);
    SaveManager.saveSettings(settings);
  }

  setMusicEnabled(enabled) {
    const settings = SaveManager.readSettings();
    settings.music = Boolean(enabled);
    SaveManager.saveSettings(settings);
    if (!settings.music) this.stopBgm(false);
    else this.playBgm(this.desiredBgmKind ?? 'menu');
  }

  toggleMute() {
    const settings = SaveManager.readSettings();
    settings.muted = !settings.muted;
    SaveManager.saveSettings(settings);
    if (settings.muted) this.stopBgm(false);
    else this.playBgm(this.desiredBgmKind ?? 'menu');
    return settings.muted;
  }

  setBgmDucked(ducked) {
    this.ducked = Boolean(ducked);
    if (this.currentBgm) this.fadeSound(this.currentBgm, this.targetBgmVolume(), 240);
  }

  duckBgmFor(profile) {
    if (!profile) return;
    const duckGain = clamp01(profile.gain, 1);
    const duration = Math.max(0, Number(profile.duration) || 0);
    const attack = Math.max(0, Number(profile.attack) || 0);
    const release = Math.max(0, Number(profile.release) || 0);
    const now = this.now();
    this.transientDuckUntil = Math.max(this.transientDuckUntil, now + duration);
    const remaining = Math.max(0, this.transientDuckUntil - now);
    const token = ++this.transientDuckToken;

    if (this.transientDuckTimer !== null) this.cancelSchedule(this.transientDuckTimer);
    this.transientDuckGain = Math.min(this.transientDuckGain, duckGain);
    if (this.currentBgm) this.fadeSound(this.currentBgm, this.targetBgmVolume(), attack);

    this.transientDuckTimer = this.schedule(() => {
      if (token !== this.transientDuckToken) return;
      this.transientDuckTimer = null;
      this.transientDuckUntil = 0;
      this.transientDuckGain = 1;
      if (this.currentBgm) this.fadeSound(this.currentBgm, this.targetBgmVolume(), release);
    }, remaining);
  }

  fadeSound(sound, volume, duration = 800, onComplete = null) {
    const scene = this.scene;
    if (!sound) return;
    if (!scene?.tweens) {
      sound.setVolume?.(volume);
      onComplete?.();
      return;
    }
    scene.tweens.killTweensOf(sound);
    scene.tweens.add({
      targets: sound,
      volume,
      duration,
      ease: 'Sine.InOut',
      onUpdate: () => sound.setVolume?.(sound.volume),
      onComplete
    });
  }

  showUnlockHint() {
    const scene = this.scene;
    if (!scene?.add || this.unlockHint?.scene) return;
    const sceneKey = scene.scene?.key ?? scene.sys?.settings?.key ?? '';
    const layout = resolveAudioHintLayout(sceneKey);
    this.unlockHint = scene.add
      .text(layout.x, layout.y, '点击任意位置开启音乐', {
        fontFamily: FONT,
        fontSize: 16,
        color: '#f6edd0',
        stroke: '#120b08',
        strokeThickness: 3,
        backgroundColor: '#121118dd',
        padding: { x: 12, y: 6 }
      })
      .setOrigin(...layout.origin)
      .setDepth(30000);
    scene.input?.once?.('pointerdown', () => this.unlock());
  }

  hideUnlockHint() {
    this.unlockHint?.destroy?.();
    this.unlockHint = null;
  }

  play(kind = 'uiClick', options = {}) {
    const settings = SaveManager.readSettings();
    if (!settings.sound || settings.muted) return;
    const sound = ALIASES[kind] ?? kind;
    const profile = resolveSfxMixProfile(sound);
    const cooldownGroup = profile.cooldownGroup ?? sound;
    const now = this.now();
    const last = this.lastPlayed.get(cooldownGroup);
    const cooldown = Number.isFinite(options.cooldown) ? Math.max(0, options.cooldown) : profile.cooldown;
    if (last !== undefined && now - last < cooldown) return;
    const scene = this.scene;
    const pool = SFX_KEYS[sound] ?? SFX_KEYS.uiClick;
    const available = pool.filter((key) => scene?.cache?.audio?.exists?.(key));
    if (!scene?.sound || available.length === 0) {
      console.warn(`SFX asset missing: ${pool.join(', ')}`);
      return;
    }
    const cursor = this.poolCursor.get(sound) ?? 0;
    const key = available[cursor % available.length];
    try {
      const variance = Number.isFinite(options.variance) ? Math.max(0, options.variance) : profile.variance;
      const random = clamp01(this.random(), 0.5);
      const rate = Number.isFinite(options.rate) ? options.rate : 1 + (random * 2 - 1) * variance;
      const detune = Number.isFinite(options.detune) ? options.detune : 0;
      const volume = clamp01(settings.sfxVolume, 0.62) * profile.gain * (Number.isFinite(options.volume) ? options.volume : 1);
      const played = scene.sound.play(key, { volume: clamp01(volume, 0.75), rate, detune });
      if (played === false) return;
      this.lastPlayed.set(cooldownGroup, now);
      this.poolCursor.set(sound, cursor + 1);
      this.duckBgmFor(profile.duck);
    } catch (error) {
      console.warn(`SFX play failed: ${key}`, error);
    }
  }


  startAmbience(kind = 'menu') {
    this.playBgm(kind);
  }

  stopAmbience() {
    this.stopBgm();
  }
}
