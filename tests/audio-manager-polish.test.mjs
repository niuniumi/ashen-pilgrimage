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
}

function createHarness({ random = 1 } = {}) {
  installSettings();
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
    advance(milliseconds) {
      now += milliseconds;
    },
    attachBgm(volume = 0.3) {
      const bgm = {
        volume,
        setVolume(nextVolume) {
          this.volume = nextVolume;
        }
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

test('explicit play options and legacy aliases remain authoritative', () => {
  const harness = createHarness({ random: 0 });

  harness.manager.play('attack', { cooldown: 0, detune: 37, rate: 1.08, volume: 0.5 });

  assert.match(harness.plays[0].key, /^sfx-attack-/);
  assert.equal(harness.plays[0].config.detune, 37);
  assert.equal(harness.plays[0].config.rate, 1.08);
});
