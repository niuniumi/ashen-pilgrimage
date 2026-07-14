import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';

import { SCENES } from '../src/game/constants.js';
import { getSceneBundleNames, resolveAssetBundles } from '../src/game/AssetBundleCatalog.js';
import { installSceneLoadingView, queueAssetBundles } from '../src/game/SceneAssetLoader.js';

test('boot bundle excludes maps, battles, actors, and non-menu music', () => {
  const assets = resolveAssetBundles(getSceneBundleNames(SCENES.Preload, {}));
  const imageKeys = assets.images.map((asset) => asset.key);
  const audioKeys = assets.audio.map((asset) => asset.key);

  assert.equal(imageKeys.some((key) => /^pixel-bg-(?:map|battle)/.test(key)), false);
  assert.equal(imageKeys.some((key) => key.startsWith('pixel-actor-')), false);
  assert.equal(audioKeys.some((key) => key.startsWith('bgm-') && key !== 'bgm-menu'), false);
  assert.equal(audioKeys.includes('bgm-menu'), true);
  assert.equal(audioKeys.includes('sfx-ui-click-1'), true);
  assert.equal(audioKeys.includes('sfx-ui-hover-1'), true);
});

test('act two battle bundle contains its background, selected hero, act enemies, music, and combat SFX', () => {
  const assets = resolveAssetBundles(getSceneBundleNames(SCENES.Battle, {
    act: 2,
    characterId: 'candle-nun',
    battleType: 'battle'
  }));
  const imageKeys = new Set(assets.images.map((asset) => asset.key));
  const audioKeys = new Set(assets.audio.map((asset) => asset.key));

  assert.equal(imageKeys.has('pixel-bg-battle-2'), true);
  assert.equal(imageKeys.has('pixel-actor-candle-nun'), true);
  assert.equal(imageKeys.has('pixel-actor-wax-novice'), true);
  assert.equal(imageKeys.has('pixel-actor-scripture-moth-swarm'), true);
  assert.equal(imageKeys.has('pixel-actor-ash-veiled-prioress'), true);
  assert.equal(imageKeys.has('pixel-actor-grave-skeleton'), false);
  assert.equal(imageKeys.has('pixel-actor-hollow-spearman'), false);
  assert.equal(audioKeys.has('bgm-battle-act-2'), true);
  assert.equal(audioKeys.has('bgm-battle-act-1'), false);
  assert.equal(audioKeys.has('sfx-attack-1'), true);
  assert.equal(audioKeys.has('sfx-turn-1'), true);
});

test('encounter aliases and repeated bundles resolve to unique descriptor keys', () => {
  const names = getSceneBundleNames(SCENES.Battle, {
    act: 1,
    characterId: 'exiled-knight',
    battleType: 'battle'
  });
  const assets = resolveAssetBundles([...names, ...names]);
  const imageKeys = assets.images.map((asset) => asset.key);
  const audioKeys = assets.audio.map((asset) => asset.key);

  assert.equal(imageKeys.includes('pixel-actor-grave-skeleton'), true);
  assert.equal(imageKeys.includes('pixel-actor-graveyard-skeleton'), false);
  assert.equal(new Set(imageKeys).size, imageKeys.length);
  assert.equal(new Set(audioKeys).size, audioKeys.length);
});

test('boss battle selects the act boss and boss soundtrack without cross-act enemies', () => {
  const assets = resolveAssetBundles(getSceneBundleNames(SCENES.Battle, {
    act: 3,
    characterId: 'ashblood-alchemist',
    battleType: 'boss'
  }));
  const imageKeys = new Set(assets.images.map((asset) => asset.key));
  const audioKeys = new Set(assets.audio.map((asset) => asset.key));

  assert.equal(imageKeys.has('pixel-bg-battle-3'), true);
  assert.equal(imageKeys.has('pixel-actor-ashblood-alchemist'), true);
  assert.equal(imageKeys.has('pixel-actor-hollow-crown-regent'), true);
  assert.equal(imageKeys.has('pixel-actor-pale-wax-matron'), false);
  assert.equal(audioKeys.has('bgm-boss'), true);
  assert.equal(audioKeys.has('bgm-battle-act-3'), false);
  assert.equal(audioKeys.has('sfx-boss-1'), true);
});

test('queueAssetBundles skips cached and duplicate texture and audio keys', () => {
  const imageCalls = [];
  const audioCalls = [];
  const scene = {
    textures: { exists: (key) => key === 'pixel-bg-battle-2' },
    cache: { audio: { exists: (key) => key === 'bgm-battle-act-2' } },
    load: {
      image: (...args) => imageCalls.push(args),
      audio: (...args) => audioCalls.push(args)
    }
  };
  const names = getSceneBundleNames(SCENES.Battle, {
    act: 2,
    characterId: 'candle-nun',
    battleType: 'battle'
  });

  const result = queueAssetBundles(scene, [...names, ...names]);
  const queuedKeys = [...imageCalls, ...audioCalls].map(([key]) => key);

  assert.equal(queuedKeys.includes('pixel-bg-battle-2'), false);
  assert.equal(queuedKeys.includes('bgm-battle-act-2'), false);
  assert.equal(new Set(queuedKeys).size, queuedKeys.length);
  assert.deepEqual(result, { queued: queuedKeys.length, keys: queuedKeys });
  assert.equal(audioCalls.every(([, urls]) => Array.isArray(urls) && urls.length > 0), true);
});

test('loading view reports progress and failed keys then cleans up on scene shutdown', () => {
  const load = new EventEmitter();
  const events = new EventEmitter();
  const objects = [];
  const graphicsCalls = [];

  const makeObject = (properties = {}) => {
    const object = {
      ...properties,
      destroyed: false,
      setDepth(depth) {
        this.depth = depth;
        return this;
      },
      setOrigin(x, y = x) {
        this.origin = [x, y];
        return this;
      },
      setText(value) {
        this.text = value;
        return this;
      },
      destroy() {
        this.destroyed = true;
      }
    };
    objects.push(object);
    return object;
  };

  const scene = {
    load,
    events,
    add: {
      graphics() {
        const graphics = makeObject();
        for (const method of ['fillStyle', 'fillRect']) {
          graphics[method] = (...args) => {
            graphicsCalls.push([method, ...args]);
            return graphics;
          };
        }
        return graphics;
      },
      rectangle(x, y, width, height, color, alpha) {
        return makeObject({ x, y, width, height, color, alpha });
      },
      text(x, y, value, style) {
        return makeObject({ x, y, text: value, style });
      }
    }
  };

  const view = installSceneLoadingView(scene, { title: '展开第二章战场' });
  const percent = objects.find((object) => object.text === '0%');
  const status = objects.find((object) => object.text === '正在整理资源');

  assert.ok(view && typeof view.destroy === 'function');
  assert.ok(graphicsCalls.some(([method]) => method === 'fillRect'), 'view should use crisp pixel rectangles');
  assert.equal(load.listenerCount('progress'), 1);
  assert.equal(load.listenerCount('loaderror'), 1);

  load.emit('progress', 0.5);
  load.emit('loaderror', { key: 'pixel-actor-missing' });
  load.emit('loaderror', { key: 'bgm-missing' });

  assert.equal(percent.text, '50%');
  assert.match(status.text, /pixel-actor-missing/);
  assert.match(status.text, /bgm-missing/);

  events.emit('shutdown');

  assert.equal(load.listenerCount('progress'), 0);
  assert.equal(load.listenerCount('loaderror'), 0);
  assert.equal(objects.every((object) => object.destroyed), true);
  assert.doesNotThrow(() => view.destroy());
});
