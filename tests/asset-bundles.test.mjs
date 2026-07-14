import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';

import { SCENES } from '../src/game/constants.js';
import { getSceneBundleNames, resolveAssetBundles } from '../src/game/AssetBundleCatalog.js';
import { SFX_POOLS } from '../src/game/AudioCatalog.js';
import { installSceneLoadingView, queueAssetBundles } from '../src/game/SceneAssetLoader.js';

function resolveDirectEntryAssets(sceneKey, context = {}) {
  return resolveAssetBundles([
    ...getSceneBundleNames(SCENES.Preload, {}),
    ...getSceneBundleNames(sceneKey, context)
  ]);
}

function expectedSfxKeys(poolName) {
  return Array.from(
    { length: SFX_POOLS[poolName] },
    (_, index) => `sfx-${poolName}-${index + 1}`
  );
}

function createQueueScene(cachedImages = [], cachedAudio = []) {
  const load = new EventEmitter();
  const pending = new Set();
  const imageCalls = [];
  const audioCalls = [];

  load.image = (key, url) => {
    const identity = `image:${key}`;
    if (pending.has(identity)) return load;
    pending.add(identity);
    imageCalls.push([key, url]);
    load.emit('addfile', key, 'image', load);
    return load;
  };
  load.audio = (key, urls) => {
    const identity = `audio:${key}`;
    if (pending.has(identity)) return load;
    pending.add(identity);
    audioCalls.push([key, urls]);
    load.emit('addfile', key, 'audio', load);
    return load;
  };

  return {
    scene: {
      textures: { exists: (key) => cachedImages.includes(key) },
      cache: { audio: { exists: (key) => cachedAudio.includes(key) } },
      load
    },
    imageCalls,
    audioCalls
  };
}

function createLoadingScene() {
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

  return {
    load,
    events,
    objects,
    graphicsCalls,
    scene: {
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
    }
  };
}

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

test('direct-entry scene bundles preserve every runtime SFX pool used by their scene', () => {
  const cases = [
    ['boot shared UI', SCENES.Preload, {}, ['ui-click', 'ui-hover', 'dialog-open', 'dialog-close', 'error']],
    ['main menu dialogs', SCENES.MainMenu, {}, ['dialog-open', 'dialog-close']],
    ['character selection', SCENES.CharacterSelect, {}, ['card-select']],
    ['map pause menu', SCENES.Map, { act: 2 }, ['dialog-open', 'dialog-close']],
    ['battle and pause menu', SCENES.Battle, { act: 2, battleType: 'battle' }, [
      'dialog-open', 'dialog-close', 'error', 'card-play', 'attack', 'block', 'hit',
      'turn', 'heal', 'buff', 'debuff', 'success', 'fail'
    ]],
    ['boss intro story', SCENES.BossIntro, { act: 2 }, ['boss', 'page', 'dialog-open', 'dialog-close']],
    ['act clear story', SCENES.ActClear, {}, ['page', 'success', 'dialog-open', 'dialog-close']],
    ['prologue story', SCENES.Prologue, {}, ['page', 'dialog-close']],
    ['vow selection', SCENES.Vow, {}, ['relic']],
    ['reward selection', SCENES.Reward, {}, ['coin', 'card-select', 'relic', 'success', 'dialog-open', 'dialog-close']],
    ['shop and pause menu', SCENES.Shop, {}, ['coin', 'relic', 'dialog-open', 'dialog-close']],
    ['rest and pause menu', SCENES.Rest, {}, ['heal', 'relic', 'dialog-open', 'dialog-close']],
    ['chest and pause menu', SCENES.Chest, {}, ['relic', 'dialog-open', 'dialog-close']],
    ['event pause menu', SCENES.Event, {}, ['dialog-open', 'dialog-close']],
    ['victory result', SCENES.Result, { victory: true }, ['success']],
    ['defeat result', SCENES.Result, { victory: false }, ['fail']]
  ];
  const missing = [];
  const coveredPools = new Set();

  for (const [label, sceneKey, context, pools] of cases) {
    const keys = new Set(resolveDirectEntryAssets(sceneKey, context).audio.map((asset) => asset.key));
    for (const pool of pools) {
      coveredPools.add(pool);
      for (const key of expectedSfxKeys(pool)) {
        if (!keys.has(key)) missing.push(`${label}: ${key}`);
      }
    }
  }

  assert.deepEqual(missing, []);
  assert.deepEqual(Object.keys(SFX_POOLS).filter((pool) => !coveredPools.has(pool)), []);
});

test('rest bundle does not preload the shop-only coin pool', () => {
  const keys = new Set(resolveDirectEntryAssets(SCENES.Rest).audio.map((asset) => asset.key));

  assert.equal(keys.has('sfx-coin-1'), false);
});

test('resolved BGM descriptors keep exact ordered OGG and MP3 fallback URLs', () => {
  const assets = resolveDirectEntryAssets(SCENES.Battle, {
    act: 2,
    characterId: 'candle-nun',
    battleType: 'battle'
  });
  const bgm = assets.audio.find((asset) => asset.key === 'bgm-battle-act-2');

  assert.deepEqual(bgm, {
    key: 'bgm-battle-act-2',
    urls: [
      'assets/audio/v2/bgm-battle-act-2.ogg',
      'assets/audio/v2/bgm-battle-act-2.mp3'
    ]
  });
});

test('queueAssetBundles skips cached and duplicate texture and audio keys', () => {
  const { scene, imageCalls, audioCalls } = createQueueScene(
    ['pixel-bg-battle-2'],
    ['bgm-battle-act-2']
  );
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

test('queueAssetBundles reports no keys rejected as already pending or inflight', () => {
  const { scene, imageCalls, audioCalls } = createQueueScene();
  const names = getSceneBundleNames(SCENES.Battle, {
    act: 1,
    characterId: 'exiled-knight',
    battleType: 'battle'
  });

  const first = queueAssetBundles(scene, names);
  const second = queueAssetBundles(scene, names);

  assert.equal(first.queued, imageCalls.length + audioCalls.length);
  assert.deepEqual(first.keys, [...imageCalls, ...audioCalls].map(([key]) => key));
  assert.deepEqual(second, { queued: 0, keys: [] });
  assert.equal(scene.load.listenerCount('addfile'), 0);
});

test('loading view reports progress and failed keys then cleans up on scene shutdown', () => {
  const { scene, load, events, objects, graphicsCalls } = createLoadingScene();

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
  assert.equal(load.listenerCount('complete'), 0);
  assert.equal(events.listenerCount('shutdown'), 0);
  assert.equal(objects.every((object) => object.destroyed), true);
  assert.doesNotThrow(() => view.destroy());
});

test('loading view removes every listener and object after successful completion', () => {
  const { scene, load, events, objects } = createLoadingScene();

  installSceneLoadingView(scene, { title: '展开旅途地图' });

  assert.equal(load.listenerCount('progress'), 1);
  assert.equal(load.listenerCount('loaderror'), 1);
  assert.equal(load.listenerCount('complete'), 1);
  assert.equal(events.listenerCount('shutdown'), 1);

  load.emit('complete');

  assert.equal(load.listenerCount('progress'), 0);
  assert.equal(load.listenerCount('loaderror'), 0);
  assert.equal(load.listenerCount('complete'), 0);
  assert.equal(events.listenerCount('shutdown'), 0);
  assert.equal(objects.every((object) => object.destroyed), true);
});
