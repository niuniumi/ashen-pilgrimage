import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { SCENES } from '../src/game/constants.js';

const root = process.cwd();

test('every release scene declares its own deterministic preload dependency', () => {
  const sceneFiles = {
    MainMenuScene: SCENES.MainMenu,
    GuideScene: SCENES.Guide,
    CharacterSelectScene: SCENES.CharacterSelect,
    VowScene: SCENES.Vow,
    PrologueScene: SCENES.Prologue,
    BossIntroScene: SCENES.BossIntro,
    ActClearScene: SCENES.ActClear,
    MapScene: SCENES.Map,
    BattleScene: SCENES.Battle,
    RewardScene: SCENES.Reward,
    ShopScene: SCENES.Shop,
    EventScene: SCENES.Event,
    RestScene: SCENES.Rest,
    ChestScene: SCENES.Chest,
    CodexScene: SCENES.Codex,
    SettingsScene: SCENES.Settings,
    ResultScene: SCENES.Result
  };
  const missing = [];

  for (const [fileName, sceneKey] of Object.entries(sceneFiles)) {
    const source = fs.readFileSync(path.join(root, 'src', 'scenes', `${fileName}.js`), 'utf8');
    if (!/\n  preload\(\) \{/.test(source) || !source.includes(`preloadSceneAssets(this, SCENES.${sceneKey.replace('Scene', '')}`)) {
      missing.push(fileName);
    }
  }

  assert.deepEqual(missing, []);
});

test('boot preload uses the boot bundle instead of the legacy full queues', () => {
  const source = fs.readFileSync(path.join(root, 'src', 'scenes', 'PreloadScene.js'), 'utf8');

  assert.equal(source.includes('getSceneBundleNames(SCENES.Preload'), true);
  assert.equal(source.includes('queueAssetBundles(this'), true);
  assert.equal(source.includes('queuePixelAssets'), false);
  assert.equal(source.includes('queueCoreAudio'), false);
});

test('scene preload helper resolves run context, queues bundles, and installs cleanup-aware loading UI', () => {
  const source = fs.readFileSync(path.join(root, 'src', 'scenes', 'SceneHelpers.js'), 'utf8');

  assert.match(source, /export function preloadSceneAssets\(/);
  assert.equal(source.includes("scene.registry.get('run')"), true);
  assert.equal(source.includes('SaveManager.loadRun()'), true);
  assert.equal(source.includes('getSceneBundleNames(sceneKey'), true);
  assert.equal(source.includes('queueAssetBundles(scene'), true);
  assert.equal(source.includes('installSceneLoadingView(scene'), true);
  assert.equal(source.includes("scene.load.on('loaderror'"), true);
  assert.equal(source.includes("scene.load.once('complete'"), true);
  assert.equal(source.includes("'重试加载'"), true);
  assert.equal(source.includes("'安全返回'"), true);
  assert.equal(source.includes('scene.scene.restart(restartData)'), true);
  assert.equal(source.includes('scene.scene.start(SCENES.MainMenu)'), true);
});

test('battle and result declarations pass their direct-entry state into bundle resolution', () => {
  const battleSource = fs.readFileSync(path.join(root, 'src', 'scenes', 'BattleScene.js'), 'utf8');
  const resultSource = fs.readFileSync(path.join(root, 'src', 'scenes', 'ResultScene.js'), 'utf8');

  assert.equal(battleSource.includes('battleType: this.battleType'), true);
  assert.equal(resultSource.includes('victory: this.victory'), true);
  assert.equal(resultSource.includes('run: this.resultRun'), true);
});

test('battle defers business initialization until critical preload assets are ready', () => {
  const source = fs.readFileSync(path.join(root, 'src', 'scenes', 'BattleScene.js'), 'utf8');
  const createBody = source.slice(source.indexOf('  create() {'), source.indexOf('  saveCheckpoint() {'));

  assert.equal(source.includes('areSceneAssetsReady'), true);
  assert.match(createBody, /create\(\) \{\s+if \(!areSceneAssetsReady\(this\)\) return;/);
  assert.ok(
    createBody.indexOf('areSceneAssetsReady(this)') < createBody.indexOf('BattleSystem.createBattle'),
    'asset readiness must be checked before battle generation'
  );
});

test('recovery UI owns a full-screen blocker and restores keyboard state', () => {
  const source = fs.readFileSync(path.join(root, 'src', 'scenes', 'SceneHelpers.js'), 'utf8');

  assert.match(source, /scene\.add\s*\.zone\(/);
  assert.equal(source.includes('.setInteractive()'), true);
  assert.equal(source.includes('scene.input.keyboard.enabled = false'), true);
  assert.equal(source.includes('scene.input.keyboard.enabled = previousKeyboardEnabled'), true);
});

test('boss intro renders the queued act-specific battle background', () => {
  const source = fs.readFileSync(path.join(root, 'src', 'scenes', 'BossIntroScene.js'), 'utf8');

  assert.match(source, /HANDPAINTED_KEYS\.battleBg, \{ depth: 0, act: this\.chapter\?\.number \?\? 1 \}/);
});

test('resource QA uses portable Playwright and clean contexts per scene scenario', () => {
  const source = fs.readFileSync(path.join(root, 'scripts', 'qa-resource-budget.mjs'), 'utf8');

  assert.equal(source.includes("from 'playwright'"), true);
  assert.equal(source.includes('C:/Users/'), false);
  assert.equal(source.includes('async function verifySceneEntryScenario'), true);
  assert.match(source, /for \(const scenario of checks\) \{\s+results\.push\(await verifySceneEntryScenario/);
});

test('scene services no longer schedule or own a global deferred loader', () => {
  const source = fs.readFileSync(path.join(root, 'src', 'scenes', 'SceneHelpers.js'), 'utf8');

  assert.equal(source.includes('ensureDeferredAssets'), false);
  assert.equal(source.includes('queueDeferredAudio'), false);
  assert.equal(source.includes('queueDeferredVisuals'), false);
  assert.equal(source.includes('deferredAssetsState'), false);
});
