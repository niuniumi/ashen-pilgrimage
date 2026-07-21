import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { AudioManager } from '../src/game/AudioManager.js';

function installSettings(overrides = {}) {
  const settings = {
    sound: true,
    music: true,
    muted: false,
    bgmVolume: 0.3,
    sfxVolume: 0.62,
    ...overrides
  };
  const values = new Map([['ashen-pilgrimage-settings-v1', JSON.stringify(settings)]]);
  globalThis.window = {
    matchMedia: () => ({ matches: false }),
    localStorage: {
      getItem(key) {
        return values.get(key) ?? null;
      },
      setItem(key, value) {
        values.set(key, String(value));
      },
      removeItem(key) {
        values.delete(key);
      }
    }
  };
  return {
    update(next) {
      Object.assign(settings, next);
      values.set('ashen-pilgrimage-settings-v1', JSON.stringify(settings));
    }
  };
}

function createHarness({ random = 1, context = null, settings = {} } = {}) {
  const settingsStore = installSettings(settings);
  let now = 1000;
  let timerId = 0;
  const timers = new Map();
  const clearedTimers = new Set();
  const plays = [];
  const unlocks = [];
  const setTimeout = (callback, delay) => {
    const id = ++timerId;
    timers.set(id, { callback, delay });
    return id;
  };
  const clearTimeout = (id) => {
    clearedTimers.add(id);
  };
  window.setTimeout = setTimeout;

  const scene = {
    cache: { audio: { exists: () => true } },
    sound: {
      context,
      play(key, config) {
        plays.push({ key, config });
      },
      unlock() {
        unlocks.push(true);
      }
    }
  };
  const manager = new AudioManager({
    now: () => now,
    random: () => random,
    setTimeout,
    clearTimeout
  }).attachScene(scene);

  return {
    manager,
    plays,
    timers,
    clearedTimers,
    unlocks,
    settingsStore,
    advance(milliseconds) {
      now += milliseconds;
    },
    attachBgm(volume = 0.3) {
      const bgm = {
        volume,
        isPlaying: true,
        isPaused: false,
        pauseCalls: 0,
        resumeCalls: 0,
        pause() {
          this.pauseCalls += 1;
          this.isPlaying = false;
          this.isPaused = true;
        },
        resume() {
          this.resumeCalls += 1;
          this.isPlaying = true;
          this.isPaused = false;
        },
        setVolume(nextVolume) {
          this.volume = nextVolume;
        },
        stop() {},
        destroy() {}
      };
      manager.currentBgm = bgm;
      manager.currentBgmProfile = { gain: 1 };
      return bgm;
    },
    fire(id, { includeCleared = false } = {}) {
      const timer = timers.get(id);
      if (!timer || (!includeCleared && clearedTimers.has(id))) return;
      timer.callback();
    }
  };
}

test('audio pitch sampling does not require booting the Phaser runtime', async () => {
  const source = await readFile(new URL('../src/game/AudioManager.js', import.meta.url), 'utf8');

  assert.doesNotMatch(source, /import Phaser from ['"]phaser['"]/);
});

test('UI, card, and combat sounds have increasing presence with subtle default pitch variation', () => {
  const harness = createHarness({ random: 1 });

  harness.manager.play('uiHover');
  harness.advance(120);
  harness.manager.play('cardPlay');
  harness.advance(120);
  harness.manager.play('swordHit');

  const [ui, card, combat] = harness.plays.map(({ config }) => config);
  assert.ok(ui.volume < card.volume);
  assert.ok(card.volume < combat.volume);
  for (const config of [ui, card, combat]) {
    assert.ok(config.rate > 1);
    assert.ok(config.rate <= 1.04);
  }
});

test('UI and card hover sounds share a cooldown so rapid pointer movement cannot stack them', () => {
  const harness = createHarness();

  harness.manager.play('uiHover');
  harness.manager.play('cardHover');
  assert.equal(harness.plays.length, 1);

  harness.advance(120);
  harness.manager.play('cardHover');
  assert.equal(harness.plays.length, 2);
});

test('heavy impacts, received hits, victory, and defeat duck BGM briefly then restore it', async (t) => {
  for (const event of ['swordHit', 'playerHit', 'victory', 'defeat']) {
    await t.test(event, () => {
      const harness = createHarness();
      const bgm = harness.attachBgm();

      harness.manager.play(event);

      assert.ok(bgm.volume < 0.3);
      assert.equal(harness.timers.size, 1);
      harness.fire([...harness.timers.keys()][0]);
      assert.equal(bgm.volume, 0.3);
    });
  }
});

test('overlapping transient ducks cannot restore early and preserve a manual pause duck', () => {
  const harness = createHarness();
  const bgm = harness.attachBgm();

  harness.manager.setBgmDucked(true);
  assert.equal(bgm.volume, 0.15);

  harness.manager.play('swordHit');
  const firstTimer = [...harness.timers.keys()][0];
  assert.ok(bgm.volume < 0.15);

  harness.advance(80);
  harness.manager.play('victory');
  const secondTimer = [...harness.timers.keys()].at(-1);
  const deepestDuck = bgm.volume;

  assert.ok(harness.clearedTimers.has(firstTimer));
  harness.fire(firstTimer, { includeCleared: true });
  assert.equal(bgm.volume, deepestDuck);

  harness.fire(secondTimer);
  assert.equal(bgm.volume, 0.15);
  harness.manager.setBgmDucked(false);
  assert.equal(bgm.volume, 0.3);
});

test('a later short impact cannot end an existing long outcome duck early', () => {
  const harness = createHarness();
  const bgm = harness.attachBgm();

  harness.manager.play('victory');
  harness.advance(100);
  harness.manager.play('swordHit');
  const latestTimer = [...harness.timers.entries()].at(-1);

  assert.equal(latestTimer[1].delay, 1000);
  assert.ok(bgm.volume <= 0.3 * 0.38);
  harness.fire(latestTimer[0]);
  assert.equal(bgm.volume, 0.3);
});

test('unlock still retries the desired BGM after Phaser audio is unlocked', () => {
  const harness = createHarness();
  const requested = [];
  harness.manager.playBgm = (kind) => requested.push(kind);

  harness.manager.unlock();

  assert.equal(harness.manager.unlocked, true);
  assert.equal(harness.unlocks.length, 1);
  assert.deepEqual(requested, []);
  const [id, timer] = [...harness.timers.entries()][0];
  assert.equal(timer.delay, 80);
  harness.fire(id);
  assert.deepEqual(requested, ['menu']);
});

test('unlock awaits a suspended AudioContext before exposing the unlocked state', async () => {
  let finishResume;
  const context = {
    state: 'suspended',
    resumeCalls: 0,
    resume() {
      this.resumeCalls += 1;
      return new Promise((resolve) => {
        finishResume = () => {
          this.state = 'running';
          resolve();
        };
      });
    }
  };
  const harness = createHarness({ context });

  const unlocking = harness.manager.unlock();
  assert.equal(context.resumeCalls, 1);
  assert.equal(harness.manager.unlocked, false);

  finishResume();
  assert.equal(await unlocking, true);
  assert.equal(harness.manager.unlocked, true);
});

test('a failed AudioContext resume keeps audio locked and does not queue BGM', async () => {
  const context = {
    state: 'suspended',
    resumeCalls: 0,
    async resume() {
      this.resumeCalls += 1;
      throw new Error('gesture rejected');
    }
  };
  const harness = createHarness({ context });
  const originalWarn = console.warn;
  console.warn = () => {};

  try {
    assert.equal(await harness.manager.unlock(), false);
    assert.equal(context.resumeCalls, 1);
    assert.equal(harness.manager.unlocked, false);
    assert.equal(harness.timers.size, 0);
  } finally {
    console.warn = originalWarn;
  }
});

test('lifecycle listeners install once and route visibility and pagehide state', async () => {
  const harness = createHarness();
  const documentListeners = new Map();
  const windowListeners = new Map();
  const documentTarget = {
    hidden: false,
    visibilityState: 'visible',
    addEventListener(name, handler) {
      documentListeners.set(name, handler);
    }
  };
  const windowTarget = {
    addEventListener(name, handler) {
      windowListeners.set(name, handler);
    }
  };
  const states = [];
  harness.manager.handleVisibilityChange = async (hidden) => states.push(hidden);

  assert.equal(harness.manager.installLifecycleListeners(documentTarget, windowTarget), true);
  assert.equal(harness.manager.installLifecycleListeners(documentTarget, windowTarget), false);
  assert.equal(documentListeners.size, 1);
  assert.equal(windowListeners.size, 1);

  documentTarget.hidden = true;
  documentTarget.visibilityState = 'hidden';
  documentListeners.get('visibilitychange')();
  documentTarget.hidden = false;
  documentTarget.visibilityState = 'visible';
  documentListeners.get('visibilitychange')();
  windowListeners.get('pagehide')();
  await Promise.resolve();
  assert.deepEqual(states, [true, false, true]);
});

test('lifecycle resumes only BGM that it paused and fades to the configured target', async () => {
  const context = {
    state: 'running',
    resumeCalls: 0,
    async resume() {
      this.resumeCalls += 1;
    }
  };
  const harness = createHarness({ context });
  const bgm = harness.attachBgm();
  harness.manager.unlocked = true;

  await harness.manager.handleVisibilityChange(true);
  assert.equal(bgm.pauseCalls, 1);
  assert.equal(bgm.resumeCalls, 0);

  context.state = 'suspended';
  await harness.manager.handleVisibilityChange(false);
  assert.equal(context.resumeCalls, 1);
  assert.equal(bgm.resumeCalls, 1);
  assert.equal(bgm.volume, 0.3);
});

test('lifecycle does not claim a manually paused BGM or revive music disabled while hidden', async () => {
  const manualHarness = createHarness();
  const manuallyPaused = manualHarness.attachBgm();
  manualHarness.manager.unlocked = true;
  manuallyPaused.isPlaying = false;
  manuallyPaused.isPaused = true;

  await manualHarness.manager.handleVisibilityChange(true);
  await manualHarness.manager.handleVisibilityChange(false);
  assert.equal(manuallyPaused.pauseCalls, 0);
  assert.equal(manuallyPaused.resumeCalls, 0);

  const disabledHarness = createHarness();
  const disabledBgm = disabledHarness.attachBgm();
  disabledHarness.manager.unlocked = true;
  await disabledHarness.manager.handleVisibilityChange(true);
  disabledHarness.settingsStore.update({ music: false });
  await disabledHarness.manager.handleVisibilityChange(false);
  assert.equal(disabledBgm.resumeCalls, 0);
});

test('SceneHelpers installs pointer and keyboard unlock gestures as one shared binding', async () => {
  const source = await readFile(new URL('../src/scenes/SceneHelpers.js', import.meta.url), 'utf8');

  assert.match(source, /if \(scene\.audio\?\.unlocked\) return;/);
  assert.match(source, /input\?\.once\?\.\('pointerdown', unlockAudio\)/);
  assert.match(source, /input\?\.keyboard\?\.once\?\.\('keydown', unlockAudio\)/);
  assert.match(source, /input\?\.off\?\.\('pointerdown', unlockAudio\)/);
  assert.match(source, /input\?\.keyboard\?\.off\?\.\('keydown', unlockAudio\)/);
});

test('BGM fades drive setVolume even when the Phaser volume property is not directly writable', () => {
  const harness = createHarness();
  let audibleVolume = 1;
  const sound = {
    get volume() {
      return audibleVolume;
    },
    set volume(_value) {},
    setVolume(value) {
      audibleVolume = value;
    }
  };
  harness.manager.scene.tweens = {
    killTweensOf() {},
    add(config) {
      config.targets.volume = config.volume;
      config.onUpdate();
    }
  };

  harness.manager.fadeSound(sound, 0.272, 260);

  assert.equal(audibleVolume, 0.272);
});

test('new BGM is explicitly silenced before its entrance fade starts', () => {
  const harness = createHarness();
  const volumeWrites = [];
  const sound = {
    volume: 1,
    play() {},
    setVolume(value) {
      this.volume = value;
      volumeWrites.push(value);
    }
  };
  harness.manager.unlocked = true;
  harness.manager.scene.sound.add = () => sound;

  harness.manager.playBgm('menu');

  assert.equal(volumeWrites[0], 0);
});

test('explicit play options and legacy aliases remain authoritative', () => {
  const harness = createHarness({ random: 0 });

  harness.manager.play('attack', { cooldown: 0, detune: 37, rate: 1.08, volume: 0.5 });

  assert.match(harness.plays[0].key, /^sfx-attack-/);
  assert.equal(harness.plays[0].config.detune, 37);
  assert.equal(harness.plays[0].config.rate, 1.08);
});
