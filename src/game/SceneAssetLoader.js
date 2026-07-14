import { FONT } from '../design/textStyles.js';
import { GAME_HEIGHT, GAME_WIDTH } from './constants.js';
import { resolveAssetBundles } from './AssetBundleCatalog.js';

export function queueAssetBundles(scene, bundleNames) {
  const assets = resolveAssetBundles(bundleNames);
  const keys = [];

  for (const image of assets.images) {
    if (scene.textures.exists(image.key)) continue;
    scene.load.image(image.key, image.url);
    keys.push(image.key);
  }

  for (const audio of assets.audio) {
    if (scene.cache.audio.exists(audio.key)) continue;
    scene.load.audio(audio.key, audio.urls);
    keys.push(audio.key);
  }

  return { queued: keys.length, keys };
}

export function installSceneLoadingView(scene, options = {}) {
  const depth = options.depth ?? 20000;
  const centerX = GAME_WIDTH / 2;
  const barLeft = centerX - 244;
  const barTop = GAME_HEIGHT / 2 + 28;
  const objects = [];
  const failedKeys = new Set();
  let destroyed = false;

  const background = scene.add.graphics().setDepth(depth);
  background.fillStyle(0x08090d, 0.94);
  background.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  background.fillStyle(0x8f612f, 1);
  background.fillRect(barLeft - 4, barTop - 4, 496, 24);
  background.fillStyle(0x11131a, 1);
  background.fillRect(barLeft, barTop, 488, 16);
  objects.push(background);

  const bar = scene.add
    .rectangle(barLeft, barTop, 0, 16, 0xd75a32, 1)
    .setOrigin(0, 0)
    .setDepth(depth + 1);
  objects.push(bar);

  const title = scene.add
    .text(centerX, barTop - 68, options.title ?? '正在整理旅途', {
      fontFamily: FONT,
      fontSize: 24,
      color: '#f4e7c5',
      stroke: '#08090d',
      strokeThickness: 4
    })
    .setOrigin(0.5)
    .setDepth(depth + 1);
  objects.push(title);

  const percent = scene.add
    .text(centerX, barTop + 42, '0%', {
      fontFamily: FONT,
      fontSize: 18,
      color: '#d0a24f'
    })
    .setOrigin(0.5)
    .setDepth(depth + 1);
  objects.push(percent);

  const status = scene.add
    .text(centerX, barTop + 78, '正在整理资源', {
      fontFamily: FONT,
      fontSize: 16,
      color: '#d6c7a5',
      align: 'center',
      wordWrap: { width: 880 }
    })
    .setOrigin(0.5)
    .setDepth(depth + 1);
  objects.push(status);

  const onProgress = (value) => {
    const progress = Math.max(0, Math.min(1, Number(value) || 0));
    bar.width = 488 * progress;
    percent.setText(`${Math.round(progress * 100)}%`);
  };

  const onLoadError = (file) => {
    failedKeys.add(file?.key ?? 'unknown');
    status.setText(`加载失败: ${[...failedKeys].join(', ')}`);
  };

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    scene.load.off('progress', onProgress);
    scene.load.off('loaderror', onLoadError);
    scene.load.off('complete', onComplete);
    scene.events.off('shutdown', destroy);
    objects.forEach((object) => object.destroy());
  };

  const onComplete = () => {
    if (failedKeys.size === 0) destroy();
  };

  scene.load.on('progress', onProgress);
  scene.load.on('loaderror', onLoadError);
  scene.load.on('complete', onComplete);
  scene.events.once('shutdown', destroy);

  return { destroy };
}
