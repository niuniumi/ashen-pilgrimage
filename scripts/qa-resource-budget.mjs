import assert from 'node:assert/strict';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  ({ chromium } = require('C:/Users/16224/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/playwright@1.61.0/node_modules/playwright'));
}

const root = process.cwd();
const distDir = path.join(root, 'dist');
const useLocalBuild = process.argv.includes('--local');
const explicitUrl = process.argv.find((argument) => argument.startsWith('--url='))?.slice(6);
const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp'
};

async function startDistServer() {
  const server = http.createServer(async (request, response) => {
    try {
      const requestPath = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      const relativePath = requestPath === '/' ? 'index.html' : requestPath.replace(/^\/+/, '');
      const filePath = path.resolve(distDir, relativePath);
      const relativeToDist = path.relative(distDir, filePath);
      if (relativeToDist.startsWith('..') || path.isAbsolute(relativeToDist)) {
        response.writeHead(403).end('Forbidden');
        return;
      }

      const fileStat = await stat(filePath);
      if (!fileStat.isFile()) throw new Error('Not a file');
      response.writeHead(200, {
        'Cache-Control': 'no-store',
        'Content-Length': fileStat.size,
        'Content-Type': MIME_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream'
      });
      if (request.method === 'HEAD') response.end();
      else createReadStream(filePath).pipe(response);
    } catch {
      response.writeHead(404).end('Not found');
    }
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  return {
    close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())),
    url: `http://127.0.0.1:${address.port}/`
  };
}

async function verifyMissingAssetRecovery(browser, targetUrl) {
  const context = await browser.newContext({
    viewport: { width: 1536, height: 864 },
    deviceScaleFactor: 1
  });
  await context.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  const page = await context.newPage();
  let failMenuAsset = true;
  await page.route('**/assets/pixel/backgrounds/menu.png', (route) => {
    if (failMenuAsset) route.abort('failed');
    else route.continue();
  });

  try {
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await page.waitForFunction(
      () => window.__ASHEN_GAME__?.scene?.keys?.MainMenuScene?.scene?.isActive(),
      undefined,
      { timeout: 120_000 }
    );
    const controls = await page.evaluate(() => window.__ASHEN_GAME__.scene.keys.MainMenuScene.children.list
      .map((child) => child.label)
      .filter(Boolean));
    assert.equal(controls.includes('重试加载'), true, `missing retry control: ${controls.join(', ')}`);
    assert.equal(controls.includes('安全返回'), true, `missing safe-return control: ${controls.join(', ')}`);

    failMenuAsset = false;
    await page.evaluate(() => {
      const scene = window.__ASHEN_GAME__.scene.keys.MainMenuScene;
      scene.children.list.find((child) => child.label === '重试加载').onClick();
    });
    await page.waitForFunction(() => {
      const scene = window.__ASHEN_GAME__?.scene?.keys?.MainMenuScene;
      return scene?.scene?.isActive() && scene.textures.exists('pixel-bg-menu');
    }, undefined, { timeout: 120_000 });
    await page.waitForTimeout(100);

    const recovered = await page.evaluate(() => {
      const scene = window.__ASHEN_GAME__.scene.keys.MainMenuScene;
      return {
        controls: scene.children.list.map((child) => child.label).filter(Boolean),
        completeListeners: scene.load.listenerCount('complete'),
        errorListeners: scene.load.listenerCount('loaderror'),
        progressListeners: scene.load.listenerCount('progress')
      };
    });
    assert.equal(recovered.controls.includes('重试加载'), false);
    assert.deepEqual({
      complete: recovered.completeListeners,
      error: recovered.errorListeners,
      progress: recovered.progressListeners
    }, { complete: 0, error: 0, progress: 0 });
    return { controls, recovered: true };
  } finally {
    await context.close();
  }
}

async function verifySceneEntries(browser, targetUrl) {
  const context = await browser.newContext({
    viewport: { width: 1536, height: 864 },
    deviceScaleFactor: 1
  });
  await context.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem('ashen-pilgrimage-settings-v1', JSON.stringify({
      sound: true,
      music: true,
      muted: false,
      animation: false,
      fastMode: true,
      tutorialEnabled: false,
      tutorialSeen: true,
      storySeen: true
    }));
  });
  const page = await context.newPage();
  const bgmWarnings = [];
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    const text = message.text();
    if (text.includes('BGM asset missing')) bgmWarnings.push(text);
  });

  const checks = [
    ['MainMenuScene', {}, 'bgm-menu', 'pixel-bg-menu'],
    ['GuideScene', {}, 'bgm-menu', 'pixel-bg-menu'],
    ['CharacterSelectScene', {}, 'bgm-menu', 'pixel-actor-candle-nun'],
    ['VowScene', {}, 'bgm-map-act-2', 'pixel-bg-folio'],
    ['PrologueScene', {}, 'bgm-map-act-2', 'pixel-bg-folio'],
    ['BossIntroScene', {}, 'bgm-boss', 'pixel-actor-headless-grave-knight'],
    ['ActClearScene', {}, 'bgm-map-act-2', 'pixel-bg-folio'],
    ['MapScene', {}, 'bgm-map-act-1', 'pixel-bg-map'],
    ['BattleScene', { battleType: 'battle' }, 'bgm-battle-act-1', 'pixel-actor-candle-nun'],
    ['BattleScene', { battleType: 'boss' }, 'bgm-boss', 'pixel-actor-headless-grave-knight'],
    ['RewardScene', {}, 'bgm-map-act-2', 'pixel-bg-folio'],
    ['ShopScene', {}, 'bgm-map-act-1', 'pixel-bg-folio'],
    ['EventScene', {}, 'bgm-map-act-2', 'pixel-bg-folio'],
    ['RestScene', {}, 'bgm-map-act-1', 'pixel-bg-folio'],
    ['ChestScene', {}, 'bgm-map-act-1', 'pixel-bg-folio'],
    ['CodexScene', {}, 'bgm-map-act-2', 'pixel-actor-hollow-crown-regent'],
    ['SettingsScene', {}, 'bgm-menu', 'pixel-bg-menu'],
    ['ResultScene', { victory: true }, 'bgm-map-act-2', 'pixel-actor-candle-nun'],
    ['ResultScene', { victory: false }, 'bgm-map-act-3', 'pixel-ui-defeat-tombstone']
  ];
  const results = [];

  try {
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await page.waitForFunction(
      () => window.__ASHEN_GAME__?.scene?.keys?.MainMenuScene?.scene?.isActive(),
      undefined,
      { timeout: 120_000 }
    );
    await page.evaluate(() => window.__ASHEN_QA__.startRun('candle-nun', {
      seed: 20260714,
      skipVow: true
    }));
    await page.waitForFunction(
      () => window.__ASHEN_GAME__?.scene?.keys?.MapScene?.scene?.isActive(),
      undefined,
      { timeout: 120_000 }
    );

    for (const [sceneKey, data, bgmKey, imageKey] of checks) {
      await page.evaluate(({ targetScene, sceneData }) => {
        window.__ASHEN_GAME__.registry.get('audio').unlocked = true;
        window.__ASHEN_QA__.startScene(targetScene, sceneData);
      }, { targetScene: sceneKey, sceneData: data });
      await page.waitForFunction(
        (targetScene) => window.__ASHEN_GAME__?.scene?.keys?.[targetScene]?.scene?.isActive(),
        sceneKey,
        { timeout: 120_000 }
      );
      await page.waitForTimeout(80);
      const state = await page.evaluate(({ targetScene, targetBgm, targetImage }) => {
        const scene = window.__ASHEN_GAME__.scene.keys[targetScene];
        return {
          bgmCached: scene.cache.audio.exists(targetBgm),
          imageCached: scene.textures.exists(targetImage),
          listeners: {
            complete: scene.load.listenerCount('complete'),
            loaderror: scene.load.listenerCount('loaderror'),
            progress: scene.load.listenerCount('progress')
          }
        };
      }, { targetScene: sceneKey, targetBgm: bgmKey, targetImage: imageKey });
      assert.equal(state.bgmCached, true, `${sceneKey} missing ${bgmKey}`);
      assert.equal(state.imageCached, true, `${sceneKey} missing ${imageKey}`);
      assert.deepEqual(state.listeners, { complete: 0, loaderror: 0, progress: 0 }, `${sceneKey} loader listeners`);
      results.push({ sceneKey, bgmKey, imageKey });
    }

    assert.deepEqual(bgmWarnings, [], `BGM warnings: ${bgmWarnings.join('; ')}`);
    assert.deepEqual(pageErrors, [], `page errors: ${pageErrors.join('; ')}`);
    return results;
  } finally {
    await context.close();
  }
}

const localServer = useLocalBuild ? await startDistServer() : null;
const targetUrl = explicitUrl ?? localServer?.url ?? process.env.QA_URL ?? 'http://127.0.0.1:4173/';
const browser = await chromium.launch({ headless: true });

try {
  const context = await browser.newContext({
    viewport: { width: 1536, height: 864 },
    deviceScaleFactor: 1
  });
  await context.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  const page = await context.newPage();
  const browserErrors = [];
  const bgmWarnings = [];

  page.on('pageerror', (error) => browserErrors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    const text = message.text();
    if (message.type() === 'error') browserErrors.push(`console: ${text}`);
    if (text.includes('BGM asset missing')) bgmWarnings.push(text);
  });

  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.waitForFunction(
    () => window.__ASHEN_GAME__?.scene?.getScenes(true).some((scene) => scene.scene.key === 'MainMenuScene'),
    undefined,
    { timeout: 120_000 }
  );
  await page.waitForTimeout(400);
  await page.waitForLoadState('networkidle', { timeout: 120_000 });
  await page.waitForTimeout(300);

  const initialEntries = await page.evaluate(() => performance
    .getEntriesByType('resource')
    .map((entry) => ({
      name: entry.name,
      encodedBodySize: entry.encodedBodySize,
      initiatorType: entry.initiatorType
    })));
  const encodedBytes = initialEntries.reduce((total, entry) => total + entry.encodedBodySize, 0);
  const summary = {
    url: targetUrl,
    initialRequests: initialEntries.length,
    encodedBytes,
    encodedMiB: Number((encodedBytes / (1024 * 1024)).toFixed(2)),
    largestResources: [...initialEntries]
      .sort((left, right) => right.encodedBodySize - left.encodedBodySize)
      .slice(0, 8)
      .map((entry) => ({
        name: new URL(entry.name).pathname,
        encodedBytes: entry.encodedBodySize,
        initiatorType: entry.initiatorType
      }))
  };
  console.log(JSON.stringify(summary, null, 2));

  assert.ok(initialEntries.length <= 24, `initial requests: ${initialEntries.length}`);
  assert.ok(encodedBytes <= 6 * 1024 * 1024, `initial bytes: ${encodedBytes}`);
  assert.equal(initialEntries.some((entry) => /battle-act-[123]|map-act-[123]/.test(entry.name)), false);
  assert.equal(initialEntries.some((entry) => /pale-wax-matron|hollow-crown-regent/.test(entry.name)), false);
  assert.deepEqual(bgmWarnings, [], `BGM warnings: ${bgmWarnings.join('; ')}`);
  assert.deepEqual(browserErrors, [], `browser errors: ${browserErrors.join('; ')}`);

  await context.close();
  const recovery = await verifyMissingAssetRecovery(browser, targetUrl);
  console.log(JSON.stringify({ missingAssetRecovery: recovery }, null, 2));
  const sceneEntries = await verifySceneEntries(browser, targetUrl);
  console.log(JSON.stringify({ sceneEntries: sceneEntries.length, bgmWarnings: 0 }, null, 2));
} finally {
  await browser.close();
  await localServer?.close();
}
