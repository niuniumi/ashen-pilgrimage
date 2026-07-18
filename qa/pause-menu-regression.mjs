import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { SAVE_KEY, SETTINGS_KEY } from '../src/game/constants.js';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  ({ chromium } = require('C:/Users/16224/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/playwright@1.61.0/node_modules/playwright'));
}

const targetUrl = process.argv.find((arg) => arg.startsWith('--url='))?.slice(6) ?? process.env.QA_URL ?? 'http://127.0.0.1:4176/';
const report = { url: targetUrl, generatedAt: new Date().toISOString(), cases: [], errors: [] };

function assert(value, message) {
  if (!value) throw new Error(message);
}

async function waitScene(page, sceneKey) {
  await page.waitForFunction((key) => window.__ASHEN_GAME__?.scene?.getScenes(true).some((scene) => scene.scene.key === key), sceneKey, {
    timeout: 45000
  });
}

async function canvasRect(page) {
  return page.locator('canvas').evaluate((canvas) => {
    const rect = canvas.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });
}

async function clickGame(page, x, y, delay = 320) {
  const rect = await canvasRect(page);
  await page.mouse.click(rect.x + (x / 1536) * rect.width, rect.y + (y / 864) * rect.height);
  await page.waitForTimeout(delay);
}

async function setupPage(browser) {
  const page = await browser.newPage({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1 });
  page.on('pageerror', (error) => report.errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') report.errors.push(message.text());
  });
  await page.addInitScript(({ settingsKey }) => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem(
      settingsKey,
      JSON.stringify({ sound: false, animation: true, fastMode: false, tutorialEnabled: true, tutorialSeen: true, storySeen: true })
    );
  }, { settingsKey: SETTINGS_KEY });
  await page.goto(targetUrl, { waitUntil: 'networkidle' });
  await waitScene(page, 'MainMenuScene');
  return page;
}

async function startBattle(page) {
  await page.evaluate(() => window.__ASHEN_QA__.startRun('exiled-knight', {
    seed: 20260710,
    skipVow: true,
    applyVow: false
  }));
  await waitScene(page, 'MapScene');
  const node = await page.evaluate(() => window.__ASHEN_QA__.enterNode());
  assert(node, 'no selectable node before battle');
  await waitScene(page, 'BattleScene');
}

async function startSettlement(page, { won, battleType = 'battle' }) {
  if (battleType === 'boss') {
    await page.evaluate(() => {
      window.__ASHEN_QA__.startRun('exiled-knight', { seed: 20260719, skipVow: true, applyVow: false });
      window.__ASHEN_QA__.forceScene('BattleScene', 'boss');
    });
    await waitScene(page, 'BattleScene');
  } else {
    await startBattle(page);
  }
  return page.evaluate(({ victory }) => {
    const scene = window.__ASHEN_GAME__.scene.keys.BattleScene;
    scene.battle.ended = true;
    scene.battle.won = victory;
    scene.pauseMenu.open();
    scene.finishIfNeeded();
    const blocked = scene.pauseMenu.goMap() === false;
    return {
      blocked,
      pendingScene: scene.run.pendingScene,
      activeNode: scene.run.map.activeNode,
      pauseSubmenu: scene.pauseMenu.submenu
    };
  }, { victory: won });
}

async function firstSelectableNode(page) {
  return page.evaluate(() => {
    const view = window.__ASHEN_GAME__.scene.keys.MapScene?.nodeViews?.find((item) => item.selectable);
    return view ? { x: view.x, y: view.y } : null;
  });
}

async function mapState(page) {
  return page.evaluate(({ saveKey }) => {
    const game = window.__ASHEN_GAME__;
    const run = game.registry.get('run');
    const mapScene = game.scene.keys.MapScene;
    const saved = JSON.parse(localStorage.getItem(saveKey) || 'null');
    return {
      activeScenes: game.scene.getScenes(true).map((scene) => scene.scene.key),
      activeNode: run?.map?.activeNode ?? null,
      path: [...(run?.map?.path ?? [])],
      selectableCount: mapScene?.nodeViews?.filter((item) => item.selectable).length ?? 0,
      savedActiveNode: saved?.map?.activeNode ?? null,
      hasSavedRun: Boolean(saved)
    };
  }, { saveKey: SAVE_KEY });
}

async function runReturnMapCase(browser) {
  const page = await setupPage(browser);
  await startBattle(page);
  await page.evaluate(() => window.__ASHEN_GAME__.scene.keys.BattleScene.pauseMenu.goMap());
  await waitScene(page, 'MapScene');
  const state = await mapState(page);
  assert(state.activeNode === null, 'return map left activeNode in registry');
  assert(state.savedActiveNode === null, 'return map saved activeNode');
  assert(state.selectableCount > 0, 'return map left no selectable nodes');
  const node = await page.evaluate(() => window.__ASHEN_QA__.enterNode());
  assert(node, 'return map did not expose a selectable node to click');
  await waitScene(page, 'BattleScene');
  const enteredBattle = await page.evaluate(() => window.__ASHEN_GAME__.scene.keys.BattleScene?.scene?.isActive?.() === true);
  assert(enteredBattle, 'clicking a node after return map did not enter battle');
  report.cases.push({ name: 'return-map-cancels-active-node-and-can-start-next-node', ...state, clickedNode: node, ok: true });
  await page.close();
}

async function runResumeCase(browser) {
  const page = await setupPage(browser);
  await startBattle(page);
  const result = await page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.BattleScene;
    scene.pauseMenu.open();
    const opened = scene.uiPaused === true && Boolean(scene.pauseMenu.container);
    scene.pauseMenu.close();
    return {
      opened,
      closed: scene.uiPaused === false && !scene.pauseMenu.container,
      battleActive: scene.scene.isActive()
    };
  });
  assert(result.opened, 'pause menu did not open');
  assert(result.closed, 'pause menu did not close and resume');
  assert(result.battleActive, 'battle scene not active after closing pause menu');
  report.cases.push({ name: 'pause-menu-open-close-resumes-battle', ...result, ok: true });
  await page.close();
}

async function runMainMenuContinueCase(browser) {
  const page = await setupPage(browser);
  await startBattle(page);
  await page.evaluate(() => window.__ASHEN_GAME__.scene.keys.BattleScene.pauseMenu.goMainMenu());
  await waitScene(page, 'MainMenuScene');
  const saved = await page.evaluate(({ saveKey }) => JSON.parse(localStorage.getItem(saveKey) || 'null'), { saveKey: SAVE_KEY });
  assert(saved?.map?.activeNode, 'main menu did not preserve the active battle node');
  assert(saved?.checkpoint?.sceneKey === 'BattleScene', 'main menu did not preserve the battle checkpoint');
  const checkpointId = saved.checkpoint.id;
  await page.evaluate(() => window.__ASHEN_GAME__.scene.keys.MainMenuScene.continueRun());
  await waitScene(page, 'BattleScene');
  const resumed = await page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.BattleScene;
    return { activeNode: scene.run.map.activeNode, checkpointId: scene.run.checkpoint?.id, restored: Boolean(scene.restoredBattle) };
  });
  assert(resumed.activeNode === saved.map.activeNode, 'continued battle changed active node');
  assert(resumed.checkpointId === checkpointId, 'continued battle changed checkpoint');
  assert(resumed.restored, 'main menu continue did not restore the battle checkpoint');
  report.cases.push({ name: 'main-menu-save-preserves-and-restores-battle-checkpoint', ...resumed, ok: true });
  await page.close();
}

async function runSettlementWindowCase(browser, { name, won, battleType, expectedScene, expectedStage }) {
  const page = await setupPage(browser);
  const beforeDelay = await startSettlement(page, { won, battleType });
  assert(beforeDelay.blocked, `${name} allowed map exit while settlement was scheduled`);
  assert(beforeDelay.pendingScene === expectedStage, `${name} did not set ${expectedStage} before delayed transition`);
  assert(beforeDelay.pauseSubmenu === 'map-locked', `${name} did not show settlement feedback`);
  await waitScene(page, expectedScene);
  const afterDelay = await page.evaluate(() => {
    const run = window.__ASHEN_GAME__.registry.get('run');
    return { pendingScene: run?.pendingScene ?? null, activeNode: run?.map?.activeNode ?? null };
  });
  assert(afterDelay.pendingScene === expectedStage, `${name} settlement stage was lost after delayed transition`);
  report.cases.push({ name, beforeDelay, afterDelay, ok: true });
  await page.close();
}

async function runRestartCase(browser) {
  const page = await setupPage(browser);
  await startBattle(page);
  await page.evaluate(() => window.__ASHEN_GAME__.scene.keys.BattleScene.pauseMenu.restartRun());
  await waitScene(page, 'CharacterSelectScene');
  const result = await page.evaluate(({ saveKey }) => ({
    hasSavedRun: Boolean(localStorage.getItem(saveKey)),
    activeScenes: window.__ASHEN_GAME__.scene.getScenes(true).map((scene) => scene.scene.key)
  }), { saveKey: SAVE_KEY });
  assert(result.hasSavedRun === false, 'restart did not clear saved run');
  assert(result.activeScenes.includes('CharacterSelectScene'), 'restart did not return to character select');
  report.cases.push({ name: 'restart-clears-run-and-opens-character-select', ...result, ok: true });
  await page.close();
}

try {
  const browser = await chromium.launch({ headless: true });
  try {
    await runReturnMapCase(browser);
    await runResumeCase(browser);
    await runMainMenuContinueCase(browser);
    await runSettlementWindowCase(browser, {
      name: 'normal-victory-keeps-reward-during-850ms-settlement-window',
      won: true,
      battleType: 'battle',
      expectedScene: 'RewardScene',
      expectedStage: 'reward'
    });
    await runSettlementWindowCase(browser, {
      name: 'boss-victory-keeps-act-clear-during-850ms-settlement-window',
      won: true,
      battleType: 'boss',
      expectedScene: 'ActClearScene',
      expectedStage: 'act-clear'
    });
    await runSettlementWindowCase(browser, {
      name: 'defeat-keeps-result-during-850ms-settlement-window',
      won: false,
      battleType: 'battle',
      expectedScene: 'ResultScene',
      expectedStage: 'result'
    });
    await runRestartCase(browser);
  } finally {
    await browser.close();
  }
  assert(report.errors.length === 0, report.errors.join('\n'));
  fs.writeFileSync(path.join(process.cwd(), 'qa', 'pause-menu-regression-report.json'), JSON.stringify(report, null, 2), 'utf8');
  console.log(JSON.stringify({ ok: true, cases: report.cases.length }, null, 2));
} catch (error) {
  report.errors.push(error.stack ?? error.message);
  fs.writeFileSync(path.join(process.cwd(), 'qa', 'pause-menu-regression-report.json'), JSON.stringify(report, null, 2), 'utf8');
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
}
