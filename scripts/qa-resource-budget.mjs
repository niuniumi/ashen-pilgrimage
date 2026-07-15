import assert from 'node:assert/strict';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';

import { BattleSystem } from '../src/systems/BattleSystem.js';
import { createNewRun } from '../src/game/GameState.js';
import { MapSystem } from '../src/systems/MapSystem.js';
import { SAVE_KEY, SETTINGS_KEY } from '../src/game/constants.js';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const useLocalBuild = process.argv.includes('--local');
const explicitUrl = process.argv.find((argument) => argument.startsWith('--url='))?.slice(6);
const VIEWPORT = { width: 1536, height: 864 };
const QA_SETTINGS = {
  sound: true,
  music: true,
  muted: false,
  animation: false,
  fastMode: true,
  tutorialEnabled: false,
  tutorialSeen: true,
  storySeen: true
};
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

function createScenarioRun({ act = 1, characterId = 'candle-nun', nodeType = null, seed = 20260714 } = {}) {
  const run = createNewRun(characterId, { seed });
  if (act !== 1) {
    const generated = MapSystem.createSeededMap(act, run.rngState);
    run.act = act;
    run.actPage = 0;
    run.map = generated.map;
    run.rngState = generated.state;
    run.floor = 0;
    run.highestFloor = 0;
  }
  if (nodeType) {
    const nodeId = `qa-${nodeType}-act-${act}`;
    run.map.nodes.push({ id: nodeId, row: 0, column: 0, x: 575, type: nodeType, links: [] });
    run.map.activeNode = nodeId;
    run.map.available = [];
    run.map.path = [nodeId];
    run.floor = 1;
    run.highestFloor = act * 100 + 1;
    run.pendingScene = nodeType === 'boss' ? 'boss-intro' : nodeType;
    run.pendingBattleType = nodeType === 'boss' ? 'boss' : nodeType === 'elite' ? 'elite' : 'battle';
  }
  return run;
}

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

async function createScenarioPage(browser, targetUrl, persistedRun = null) {
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  await context.addInitScript(({ run, saveKey, settings, settingsKey }) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem(settingsKey, JSON.stringify(settings));
    if (run) window.localStorage.setItem(saveKey, JSON.stringify(run));
  }, { run: persistedRun, saveKey: SAVE_KEY, settings: QA_SETTINGS, settingsKey: SETTINGS_KEY });
  const page = await context.newPage();
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.waitForFunction(
    () => window.__ASHEN_GAME__?.scene?.keys?.MainMenuScene?.scene?.isActive(),
    undefined,
    { timeout: 120_000 }
  );
  return { context, page };
}

async function verifyMissingAssetRecovery(browser, targetUrl) {
  const { context, page } = await createScenarioPageWithRoute(browser, targetUrl, null, async (candidate) => {
    let failMenuAsset = true;
    await candidate.route('**/assets/pixel/backgrounds/menu.png', (route) => {
      if (failMenuAsset) route.abort('failed');
      else route.continue();
    });
    return () => { failMenuAsset = false; };
  });

  try {
    const controls = await page.evaluate(() => window.__ASHEN_GAME__.scene.keys.MainMenuScene.children.list
      .map((child) => child.label)
      .filter(Boolean));
    assert.equal(controls.includes('重试加载'), true, `missing retry control: ${controls.join(', ')}`);
    assert.equal(controls.includes('安全返回'), true, `missing safe-return control: ${controls.join(', ')}`);

    const coveredControl = await page.evaluate(() => {
      const scene = window.__ASHEN_GAME__.scene.keys.MainMenuScene;
      const control = scene.children.list.find((child) => child.label?.includes('新旅程'));
      return control ? { x: control.hitZone.x, y: control.hitZone.y } : null;
    });
    assert.ok(coveredControl, 'main menu covered control not found');
    const canvasBox = await page.locator('canvas').boundingBox();
    assert.ok(canvasBox, 'game canvas not found');
    await page.mouse.click(
      canvasBox.x + coveredControl.x * canvasBox.width / VIEWPORT.width,
      canvasBox.y + coveredControl.y * canvasBox.height / VIEWPORT.height
    );
    await page.waitForTimeout(120);
    const pointerBlocked = await page.evaluate(() => ({
      active: window.__ASHEN_GAME__.scene.getScenes(true).map((scene) => scene.scene.key),
      retryVisible: window.__ASHEN_GAME__.scene.keys.MainMenuScene.children.list.some((child) => child.label === '重试加载')
    }));

    context.__allowAsset();
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
        keyboardEnabled: scene.input.keyboard?.enabled,
        completeListeners: scene.load.listenerCount('complete'),
        errorListeners: scene.load.listenerCount('loaderror'),
        progressListeners: scene.load.listenerCount('progress')
      };
    });
    assert.deepEqual(pointerBlocked.active, ['MainMenuScene'], 'covered menu control received pointer input');
    assert.equal(pointerBlocked.retryVisible, true, 'recovery modal disappeared after covered click');
    assert.equal(recovered.controls.includes('重试加载'), false);
    assert.equal(recovered.keyboardEnabled, true);
    assert.deepEqual({
      complete: recovered.completeListeners,
      error: recovered.errorListeners,
      progress: recovered.progressListeners
    }, { complete: 0, error: 0, progress: 0 });
    return { controls, pointerBlocked: true, recovered: true };
  } finally {
    await context.close();
  }
}

async function createScenarioPageWithRoute(browser, targetUrl, persistedRun, installRoute) {
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  await context.addInitScript(({ run, saveKey, settings, settingsKey }) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem(settingsKey, JSON.stringify(settings));
    if (run) window.localStorage.setItem(saveKey, JSON.stringify(run));
  }, { run: persistedRun, saveKey: SAVE_KEY, settings: QA_SETTINGS, settingsKey: SETTINGS_KEY });
  const page = await context.newPage();
  context.__allowAsset = await installRoute(page);
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.waitForFunction(
    () => window.__ASHEN_GAME__?.scene?.keys?.MainMenuScene?.scene?.isActive(),
    undefined,
    { timeout: 120_000 }
  );
  return { context, page };
}

async function verifyRecoveryShutdownAndReturn(browser, targetUrl) {
  const run = createScenarioRun();
  const { context, page } = await createScenarioPageWithRoute(browser, targetUrl, run, async (candidate) => {
    await candidate.route('**/assets/pixel/backgrounds/folio.png', (route) => route.abort('failed'));
    return () => {};
  });

  const startFailedGuide = async () => {
    await page.evaluate((registryRun) => {
      window.__ASHEN_GAME__.registry.set('run', structuredClone(registryRun));
      window.__ASHEN_QA__.startScene('GuideScene');
    }, run);
    await page.waitForFunction(() => {
      const scene = window.__ASHEN_GAME__?.scene?.keys?.GuideScene;
      return scene?.scene?.isActive() && scene.children.list.some((child) => child.label === '安全返回');
    }, undefined, { timeout: 120_000 });
  };

  try {
    await startFailedGuide();
    await page.evaluate(() => {
      const scene = window.__ASHEN_GAME__.scene.keys.GuideScene;
      scene.scene.stop();
    });
    await page.waitForFunction(
      () => !window.__ASHEN_GAME__?.scene?.keys?.GuideScene?.scene?.isActive(),
      undefined,
      { timeout: 120_000 }
    );
    await page.evaluate(() => window.__ASHEN_QA__.startScene('MainMenuScene'));
    await page.waitForFunction(
      () => window.__ASHEN_GAME__?.scene?.keys?.MainMenuScene?.scene?.isActive(),
      undefined,
      { timeout: 120_000 }
    );
    const shutdownRestored = await page.evaluate(() => window.__ASHEN_GAME__.scene.keys.MainMenuScene.input.keyboard?.enabled);
    assert.equal(shutdownRestored, true, 'shutdown left input disabled for the next scene');

    await startFailedGuide();
    await page.evaluate(() => {
      const scene = window.__ASHEN_GAME__.scene.keys.GuideScene;
      scene.children.list.find((child) => child.label === '安全返回').onClick();
    });
    await page.waitForFunction(
      () => window.__ASHEN_GAME__?.scene?.keys?.MainMenuScene?.scene?.isActive(),
      undefined,
      { timeout: 120_000 }
    );
    const returnRestored = await page.evaluate(() => ({
      guideKeyboard: window.__ASHEN_GAME__.scene.keys.GuideScene.input.keyboard?.enabled,
      menuKeyboard: window.__ASHEN_GAME__.scene.keys.MainMenuScene.input.keyboard?.enabled
    }));
    assert.deepEqual(returnRestored, { guideKeyboard: true, menuKeyboard: true });
    return { shutdownRestored: true, returnRestored: true };
  } finally {
    await context.close();
  }
}

function createSceneEntryChecks() {
  const act1 = createScenarioRun({ act: 1 });
  const act2 = createScenarioRun({ act: 2 });
  const act3 = createScenarioRun({ act: 3 });
  const normal = createScenarioRun({ act: 1, nodeType: 'battle' });
  const elite = createScenarioRun({ act: 2, nodeType: 'elite' });
  const boss = createScenarioRun({ act: 3, nodeType: 'boss' });
  const restoredRun = createScenarioRun({ act: 2, characterId: 'candle-nun', nodeType: 'boss', seed: 20260715 });
  const restoredBattle = BattleSystem.createBattle(restoredRun, 'boss');
  const explicitResultRun = createScenarioRun({ act: 3, characterId: 'ashblood-alchemist' });
  const persistedResultRun = createScenarioRun({ act: 2, characterId: 'exiled-knight' });

  return [
    { label: 'main menu', sceneKey: 'MainMenuScene', persistedRun: null, bgmKey: 'bgm-menu', textureKeys: ['pixel-bg-menu'], backgroundKey: 'pixel-bg-menu' },
    { label: 'guide folio', sceneKey: 'GuideScene', persistedRun: act1, bgmKey: 'bgm-menu', textureKeys: ['pixel-bg-folio'], backgroundKey: 'pixel-bg-folio' },
    { label: 'settings folio', sceneKey: 'SettingsScene', persistedRun: act1, bgmKey: 'bgm-menu', textureKeys: ['pixel-bg-folio'], backgroundKey: 'pixel-bg-folio' },
    { label: 'character select', sceneKey: 'CharacterSelectScene', persistedRun: null, bgmKey: 'bgm-menu', textureKeys: ['pixel-bg-folio', 'pixel-actor-candle-nun'] },
    { label: 'vow', sceneKey: 'VowScene', persistedRun: act1, bgmKey: 'bgm-map-act-2', textureKeys: ['pixel-bg-folio'] },
    { label: 'prologue', sceneKey: 'PrologueScene', persistedRun: act1, bgmKey: 'bgm-map-act-2', textureKeys: ['pixel-bg-folio'] },
    { label: 'act clear', sceneKey: 'ActClearScene', persistedRun: act1, bgmKey: 'bgm-map-act-2', textureKeys: ['pixel-bg-folio'] },
    ...[act1, act2, act3].map((run, index) => ({ label: `map act ${index + 1}`, sceneKey: 'MapScene', persistedRun: run, bgmKey: `bgm-map-act-${index + 1}`, textureKeys: ['pixel-bg-map'], backgroundKey: 'pixel-bg-map' })),
    ...[act1, act2, act3].map((run, index) => ({
      label: `boss intro act ${index + 1}`,
      sceneKey: 'BossIntroScene',
      persistedRun: run,
      bgmKey: 'bgm-boss',
      textureKeys: [`pixel-bg-battle-${index + 1}`, `pixel-actor-${['headless-grave-knight', 'pale-wax-matron', 'hollow-crown-regent'][index]}`],
      backgroundKey: `pixel-bg-battle-${index + 1}`
    })),
    { label: 'normal battle act 1', sceneKey: 'BattleScene', persistedRun: normal, data: { battleType: 'battle' }, bgmKey: 'bgm-battle-act-1', textureKeys: ['pixel-bg-battle-1', 'pixel-actor-candle-nun'], backgroundKey: 'pixel-bg-battle-1', expectedBattleType: 'battle' },
    { label: 'elite battle act 2', sceneKey: 'BattleScene', persistedRun: elite, data: { battleType: 'elite' }, bgmKey: 'bgm-battle-act-2', textureKeys: ['pixel-bg-battle-2', 'pixel-actor-candle-nun'], backgroundKey: 'pixel-bg-battle-2', expectedBattleType: 'elite' },
    { label: 'boss battle act 3', sceneKey: 'BattleScene', persistedRun: boss, data: { battleType: 'boss' }, bgmKey: 'bgm-boss', textureKeys: ['pixel-bg-battle-3', 'pixel-actor-hollow-crown-regent'], backgroundKey: 'pixel-bg-battle-3', expectedBattleType: 'boss' },
    { label: 'restored battle precedence', sceneKey: 'BattleScene', persistedRun: restoredRun, data: { battleType: 'battle', restoredBattle }, bgmKey: 'bgm-boss', textureKeys: ['pixel-bg-battle-2', 'pixel-actor-pale-wax-matron'], backgroundKey: 'pixel-bg-battle-2', expectedBattleType: 'boss' },
    { label: 'reward', sceneKey: 'RewardScene', persistedRun: act1, bgmKey: 'bgm-map-act-2', textureKeys: ['pixel-bg-folio'] },
    { label: 'shop', sceneKey: 'ShopScene', persistedRun: act1, bgmKey: 'bgm-map-act-1', textureKeys: ['pixel-bg-folio'] },
    { label: 'event', sceneKey: 'EventScene', persistedRun: act1, bgmKey: 'bgm-map-act-2', textureKeys: ['pixel-bg-folio'] },
    { label: 'rest', sceneKey: 'RestScene', persistedRun: act1, bgmKey: 'bgm-map-act-1', textureKeys: ['pixel-bg-folio'] },
    { label: 'chest', sceneKey: 'ChestScene', persistedRun: act1, bgmKey: 'bgm-map-act-1', textureKeys: ['pixel-bg-folio'] },
    { label: 'codex', sceneKey: 'CodexScene', persistedRun: act1, bgmKey: 'bgm-map-act-2', textureKeys: ['pixel-bg-folio', 'pixel-actor-hollow-crown-regent'] },
    { label: 'result explicit run precedence', sceneKey: 'ResultScene', persistedRun: act1, registryRun: act1, data: { victory: true, run: explicitResultRun }, bgmKey: 'bgm-map-act-2', textureKeys: ['pixel-bg-folio', 'pixel-actor-ashblood-alchemist'], expectedCharacterId: 'ashblood-alchemist' },
    { label: 'result persisted run fallback', sceneKey: 'ResultScene', persistedRun: persistedResultRun, registryRun: null, data: { victory: true, run: null }, bgmKey: 'bgm-map-act-2', textureKeys: ['pixel-bg-folio', 'pixel-actor-exiled-knight'], expectedCharacterId: 'exiled-knight' },
    { label: 'result defeat', sceneKey: 'ResultScene', persistedRun: act3, data: { victory: false }, bgmKey: 'bgm-map-act-3', textureKeys: ['pixel-bg-folio', 'pixel-ui-defeat-tombstone'] }
  ];
}

async function verifySceneEntryScenario(browser, targetUrl, scenario) {
  const { context, page } = await createScenarioPage(browser, targetUrl, scenario.persistedRun);
  const bgmWarnings = [];
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    const value = message.text();
    if (value.includes('BGM asset missing')) bgmWarnings.push(value);
  });

  try {
    await page.evaluate(({ data, registryRun, sceneKey }) => {
      if (registryRun === null) window.__ASHEN_GAME__.registry.remove('run');
      else if (registryRun) window.__ASHEN_GAME__.registry.set('run', structuredClone(registryRun));
      else if (window.localStorage.getItem('ashen-pilgrimage-save-v1')) {
        window.__ASHEN_GAME__.registry.set('run', structuredClone(JSON.parse(window.localStorage.getItem('ashen-pilgrimage-save-v1'))));
      }
      window.__ASHEN_GAME__.registry.get('audio').unlocked = true;
      window.__ASHEN_QA__.startScene(sceneKey, data ?? {});
    }, { data: scenario.data, registryRun: scenario.registryRun, sceneKey: scenario.sceneKey });
    await page.waitForFunction(
      (sceneKey) => window.__ASHEN_GAME__?.scene?.keys?.[sceneKey]?.scene?.isActive(),
      scenario.sceneKey,
      { timeout: 120_000 }
    );
    await page.waitForTimeout(100);
    const state = await page.evaluate(({ bgmKey, sceneKey, textureKeys }) => {
      const scene = window.__ASHEN_GAME__.scene.keys[sceneKey];
      const background = scene.children.list.find((child) => child.name?.startsWith('pixel-background-'));
      return {
        battleType: scene.battle?.battleType ?? null,
        bgmCached: scene.cache.audio.exists(bgmKey),
        backgroundKey: background?.texture?.key ?? null,
        characterId: scene.run?.characterId ?? null,
        texturesCached: Object.fromEntries(textureKeys.map((key) => [key, scene.textures.exists(key)])),
        listeners: {
          complete: scene.load.listenerCount('complete'),
          loaderror: scene.load.listenerCount('loaderror'),
          progress: scene.load.listenerCount('progress')
        }
      };
    }, { bgmKey: scenario.bgmKey, sceneKey: scenario.sceneKey, textureKeys: scenario.textureKeys });

    assert.equal(state.bgmCached, true, `${scenario.label} missing ${scenario.bgmKey}`);
    for (const textureKey of scenario.textureKeys) {
      assert.equal(state.texturesCached[textureKey], true, `${scenario.label} missing ${textureKey}`);
    }
    if (scenario.backgroundKey) assert.equal(state.backgroundKey, scenario.backgroundKey, `${scenario.label} rendered ${state.backgroundKey}`);
    if (scenario.expectedBattleType) assert.equal(state.battleType, scenario.expectedBattleType, `${scenario.label} battle precedence`);
    if (scenario.expectedCharacterId) assert.equal(state.characterId, scenario.expectedCharacterId, `${scenario.label} run precedence`);
    assert.deepEqual(state.listeners, { complete: 0, loaderror: 0, progress: 0 }, `${scenario.label} loader listeners`);
    assert.deepEqual(bgmWarnings, [], `${scenario.label} BGM warnings: ${bgmWarnings.join('; ')}`);
    assert.deepEqual(pageErrors, [], `${scenario.label} page errors: ${pageErrors.join('; ')}`);
    return scenario.label;
  } finally {
    await context.close();
  }
}

async function verifySceneEntries(browser, targetUrl) {
  const checks = createSceneEntryChecks();
  const results = [];
  for (const scenario of checks) {
    results.push(await verifySceneEntryScenario(browser, targetUrl, scenario));
  }
  return results;
}

async function getBattleState(page) {
  return page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.BattleScene;
    const run = scene.registry.get('run');
    const checkpoint = run?.checkpoint ? structuredClone(run.checkpoint) : null;
    if (checkpoint) delete checkpoint.savedAt;
    const projectCard = (card) => ({ uid: card.uid, cardId: card.cardId, upgraded: Boolean(card.upgraded) });
    return {
      battleType: scene.battle?.battleType ?? null,
      checkpoint,
      drawPile: scene.battle?.deck?.drawPile?.map(projectCard) ?? null,
      encounterHistory: [...(run?.encounterHistory ?? [])],
      enemies: scene.battle?.enemies ? structuredClone(scene.battle.enemies) : null,
      hand: scene.battle?.deck?.hand?.map(projectCard) ?? null,
      rngState: structuredClone(run?.rngState ?? null),
      settlements: [...(run?.settlements ?? [])]
    };
  });
}

async function openBattle(browser, targetUrl, initialRun, { failAsset = false } = {}) {
  if (!failAsset) {
    const created = await createScenarioPage(browser, targetUrl, initialRun);
    await created.page.evaluate((run) => {
      window.__ASHEN_GAME__.registry.set('run', structuredClone(run));
      window.__ASHEN_QA__.startScene('BattleScene', { battleType: 'battle' });
    }, initialRun);
    return created;
  }
  return createScenarioPageWithRoute(browser, targetUrl, initialRun, async (page) => {
    let blocked = true;
    await page.route('**/assets/pixel/backgrounds/battle-act-1.png', (route) => {
      if (blocked) route.abort('failed');
      else route.continue();
    });
    return () => { blocked = false; };
  });
}

async function verifyBattleRetryState(browser, targetUrl) {
  const initialRun = createScenarioRun({ act: 1, characterId: 'candle-nun', nodeType: 'battle', seed: 20260714 });
  const initialRunState = {
    checkpoint: initialRun.checkpoint ?? null,
    encounterHistory: [...(initialRun.encounterHistory ?? [])],
    rngState: structuredClone(initialRun.rngState),
    settlements: [...(initialRun.settlements ?? [])]
  };

  const baseline = await openBattle(browser, targetUrl, initialRun);
  let baselineState;
  try {
    await baseline.page.waitForFunction(
      () => window.__ASHEN_GAME__?.scene?.keys?.BattleScene?.battle,
      undefined,
      { timeout: 120_000 }
    );
    baselineState = await getBattleState(baseline.page);
  } finally {
    await baseline.context.close();
  }

  const failed = await openBattle(browser, targetUrl, initialRun, { failAsset: true });
  try {
    await failed.page.evaluate((run) => {
      window.__ASHEN_GAME__.registry.set('run', structuredClone(run));
      window.__ASHEN_QA__.startScene('BattleScene', { battleType: 'battle' });
    }, initialRun);
    await failed.page.waitForFunction(() => {
      const scene = window.__ASHEN_GAME__?.scene?.keys?.BattleScene;
      return scene?.scene?.isActive() && scene.children.list.some((child) => child.label === '重试加载');
    }, undefined, { timeout: 120_000 });

    const failedState = await getBattleState(failed.page);
    await failed.page.evaluate(() => {
      const scene = window.__ASHEN_GAME__.scene.keys.BattleScene;
      scene.__qaEndTurnCalls = 0;
      const endTurn = scene.endTurn.bind(scene);
      scene.endTurn = (...args) => {
        scene.__qaEndTurnCalls += 1;
        return endTurn(...args);
      };
    });
    await failed.page.keyboard.press('KeyE');
    await failed.page.waitForTimeout(100);
    const keyboardCalls = await failed.page.evaluate(() => window.__ASHEN_GAME__.scene.keys.BattleScene.__qaEndTurnCalls);

    failed.context.__allowAsset();
    await failed.page.evaluate(() => {
      const scene = window.__ASHEN_GAME__.scene.keys.BattleScene;
      scene.children.list.find((child) => child.label === '重试加载').onClick();
    });
    await failed.page.waitForFunction(() => {
      const scene = window.__ASHEN_GAME__?.scene?.keys?.BattleScene;
      return scene?.scene?.isActive() && scene.battle && !scene.children.list.some((child) => child.label === '重试加载');
    }, undefined, { timeout: 120_000 });
    await failed.page.waitForTimeout(100);
    const retriedState = await getBattleState(failed.page);
    const keyboardRestored = await failed.page.evaluate(() => window.__ASHEN_GAME__.scene.keys.BattleScene.input.keyboard?.enabled);

    assert.deepEqual({
      checkpoint: failedState.checkpoint,
      encounterHistory: failedState.encounterHistory,
      rngState: failedState.rngState,
      settlements: failedState.settlements
    }, initialRunState, 'failed preload mutated the run before critical assets were ready');
    assert.equal(failedState.enemies, null, 'failed preload generated enemies');
    assert.equal(failedState.drawPile, null, 'failed preload generated a draw pile');
    assert.equal(failedState.hand, null, 'failed preload generated an opening hand');
    assert.equal(keyboardCalls, 0, 'Battle keyboard command reached the covered scene');
    assert.equal(keyboardRestored, true, 'Battle keyboard state was not restored after retry');
    assert.deepEqual(retriedState, baselineState, 'retry did not reproduce the one-time seeded Battle state');
    return {
      checkpointId: retriedState.checkpoint?.id,
      encounter: retriedState.encounterHistory.at(-1),
      hand: retriedState.hand.map((card) => card.cardId),
      rngCursor: retriedState.rngState.cursor,
      statePreserved: true
    };
  } finally {
    await failed.context.close();
  }
}

const localServer = useLocalBuild ? await startDistServer() : null;
const targetUrl = explicitUrl ?? localServer?.url ?? process.env.QA_URL ?? 'http://127.0.0.1:4173/';
const browser = await chromium.launch({ headless: true });
const battleRetryOnly = process.argv.includes('--battle-retry-only');

try {
  if (battleRetryOnly) {
    const battleRetry = await verifyBattleRetryState(browser, targetUrl);
    console.log(JSON.stringify({ battleRetry }, null, 2));
  } else {
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  await context.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  const page = await context.newPage();
  const browserErrors = [];
  const bgmWarnings = [];

  page.on('pageerror', (error) => browserErrors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    const value = message.text();
    if (message.type() === 'error') browserErrors.push(`console: ${value}`);
    if (value.includes('BGM asset missing')) bgmWarnings.push(value);
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
  const recoveryLifecycle = await verifyRecoveryShutdownAndReturn(browser, targetUrl);
  console.log(JSON.stringify({ recoveryLifecycle }, null, 2));
  const battleRetry = await verifyBattleRetryState(browser, targetUrl);
  console.log(JSON.stringify({ battleRetry }, null, 2));
  const sceneEntries = await verifySceneEntries(browser, targetUrl);
  console.log(JSON.stringify({ isolatedSceneEntries: sceneEntries.length, bgmWarnings: 0 }, null, 2));
  }
} finally {
  await browser.close();
  await localServer?.close();
}
