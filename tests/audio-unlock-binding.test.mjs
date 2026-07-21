import assert from 'node:assert/strict';
import test from 'node:test';

import { installAudioUnlockGestures } from '../src/game/AudioUnlockBinding.js';

class Emitter {
  constructor() {
    this.listeners = new Map();
  }

  once(event, listener) {
    const entries = this.listeners.get(event) ?? [];
    entries.push({ listener, once: true });
    this.listeners.set(event, entries);
  }

  off(event, listener) {
    const entries = this.listeners.get(event) ?? [];
    this.listeners.set(event, entries.filter((entry) => entry.listener !== listener));
  }

  emit(event, ...args) {
    const entries = [...(this.listeners.get(event) ?? [])];
    this.listeners.set(event, entries.filter((entry) => !entry.once));
    for (const { listener } of entries) listener(...args);
  }

  listenerCount(event) {
    return (this.listeners.get(event) ?? []).length;
  }
}

function createScene() {
  const input = new Emitter();
  input.keyboard = new Emitter();
  return { input, events: new Emitter() };
}

async function flush() {
  await Promise.resolve();
  await Promise.resolve();
}

test('a false first unlock rebinds both gestures and a later success removes them', async () => {
  const scene = createScene();
  const outcomes = [false, true];
  const audio = {
    unlocked: false,
    calls: 0,
    async unlock() {
      this.calls += 1;
      const outcome = outcomes.shift();
      if (outcome) this.unlocked = true;
      return outcome;
    }
  };

  installAudioUnlockGestures(scene, audio);
  scene.input.emit('pointerdown');
  await flush();

  assert.equal(audio.calls, 1);
  assert.equal(scene.input.listenerCount('pointerdown'), 1);
  assert.equal(scene.input.keyboard.listenerCount('keydown'), 1);
  assert.equal(scene.events.listenerCount('shutdown'), 1);

  scene.input.keyboard.emit('keydown');
  await flush();
  assert.equal(audio.calls, 2);
  assert.equal(scene.input.listenerCount('pointerdown'), 0);
  assert.equal(scene.input.keyboard.listenerCount('keydown'), 0);
  assert.equal(scene.events.listenerCount('shutdown'), 0);
});

test('a rejected unlock can retry, but shutdown during rejection never rebinds', async () => {
  const retryScene = createScene();
  const retryAudio = {
    unlocked: false,
    calls: 0,
    async unlock() {
      this.calls += 1;
      if (this.calls === 1) throw new Error('transient rejection');
      this.unlocked = true;
      return true;
    }
  };
  installAudioUnlockGestures(retryScene, retryAudio);
  retryScene.input.emit('pointerdown');
  await flush();
  assert.equal(retryScene.input.listenerCount('pointerdown'), 1);
  retryScene.input.emit('pointerdown');
  await flush();
  assert.equal(retryAudio.calls, 2);
  assert.equal(retryScene.input.listenerCount('pointerdown'), 0);

  let rejectUnlock;
  const shutdownScene = createScene();
  const shutdownAudio = {
    unlocked: false,
    unlock() {
      return new Promise((_resolve, reject) => {
        rejectUnlock = reject;
      });
    }
  };
  installAudioUnlockGestures(shutdownScene, shutdownAudio);
  shutdownScene.input.emit('pointerdown');
  shutdownScene.events.emit('shutdown');
  rejectUnlock(new Error('scene closed'));
  await flush();
  assert.equal(shutdownScene.input.listenerCount('pointerdown'), 0);
  assert.equal(shutdownScene.input.keyboard.listenerCount('keydown'), 0);
  assert.equal(shutdownScene.events.listenerCount('shutdown'), 0);
});
