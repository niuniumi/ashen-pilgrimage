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
  assert(saved?.map?.activeNode == null, 'main menu save kept activeNode');
  await page.evaluate(() => window.__ASHEN_QA__.startScene('MapScene'));
  await waitScene(page, 'MapScene');
  const state = await mapState(page);
  assert(state.selectableCount > 0, 'continue after main menu save has no selectable nodes');
  report.cases.push({ name: 'main-menu-save-continues-to-playable-map', ...state, ok: true });
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
