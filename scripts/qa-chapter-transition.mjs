import fs from 'node:fs';
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
const url = process.argv.find((arg) => arg.startsWith('--url='))?.slice(6) ?? 'http://127.0.0.1:4173/';
const reportPath = path.join(root, 'qa', 'chapter-transition-report.json');
const screenshotPath = path.join(root, 'qa', 'screenshots', 'chapter-transition-act2.png');
const report = { url, states: [], errors: [] };

function assert(value, message) {
  if (!value) throw new Error(message);
}

async function waitScene(page, key) {
  await page.waitForFunction((sceneKey) => window.__ASHEN_GAME__?.scene?.keys?.[sceneKey]?.scene?.isActive(), key);
}

async function canvasPoint(page, x, y) {
  const rect = await page.locator('canvas').evaluate((canvas) => {
    const bounds = canvas.getBoundingClientRect();
    return { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height };
  });
  return { x: rect.x + (x / 1536) * rect.width, y: rect.y + (y / 864) * rect.height };
}

async function clickGame(page, x, y, delay = 300) {
  const point = await canvasPoint(page, x, y);
  await page.mouse.click(point.x, point.y);
  await page.waitForTimeout(delay);
}

async function completeStoryDialog(page) {
  for (let index = 0; index < 4; index += 1) {
    await page.waitForTimeout(1_050);
    await clickGame(page, 1098, 734, 120);
  }
}

async function snapshot(page, phase) {
  const state = await page.evaluate((label) => {
    const game = window.__ASHEN_GAME__;
    const run = game.registry.get('run');
    const mapScene = game.scene.keys.MapScene;
    return {
      phase: label,
      activeScenes: game.scene.getScenes(true).map((scene) => scene.scene.key),
      act: run?.act ?? null,
      mapAct: run?.map?.act ?? null,
      activeNode: run?.map?.activeNode ?? null,
      available: [...(run?.map?.available ?? [])],
      pendingScene: run?.pendingScene ?? null,
      pendingBattleType: run?.pendingBattleType ?? null,
      battleType: game.scene.keys.BattleScene?.scene?.isActive() ? game.scene.keys.BattleScene.battleType : null,
      selectable: mapScene?.scene?.isActive()
        ? mapScene.nodeViews.filter((node) => node.selectable).map((node) => ({ id: node.id, x: node.x, y: node.y }))
        : []
    };
  }, phase);
  report.states.push(state);
  return state;
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1 });
await context.addInitScript(() => {
  if (sessionStorage.getItem('qa-chapter-transition-ready')) return;
  sessionStorage.setItem('qa-chapter-transition-ready', '1');
  localStorage.clear();
  localStorage.setItem(
    'ashen-pilgrimage-settings-v1',
    JSON.stringify({ sound: false, music: false, muted: true, animation: true, fastMode: false, tutorialEnabled: false, tutorialSeen: true, storySeen: true })
  );
});
const page = await context.newPage();
page.on('pageerror', (error) => report.errors.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error') report.errors.push(`console: ${message.text()}`);
});

try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await waitScene(page, 'MainMenuScene');
  await page.evaluate(() => window.__ASHEN_QA__.startRun('exiled-knight', { seed: 20260714, skipVow: true }));
  await waitScene(page, 'MapScene');

  const bossNode = await page.evaluate(() => {
    const game = window.__ASHEN_GAME__;
    const run = game.registry.get('run');
    const boss = run.map.nodes.find((node) => node.type === 'boss');
    run.map.completed = run.map.nodes.filter((node) => node.row < boss.row).map((node) => node.id);
    run.map.path = [...run.map.completed, boss.id];
    run.map.available = [boss.id];
    run.map.activeNode = null;
    run.floor = boss.row;
    delete run.pendingScene;
    delete run.pendingBattleType;
    window.__ASHEN_QA__.saveRun(run);
    window.__ASHEN_QA__.startScene('MapScene');
    return boss.id;
  });
  await waitScene(page, 'MapScene');
  const bossView = await page.evaluate((nodeId) => {
    const view = window.__ASHEN_GAME__.scene.keys.MapScene.nodeViews.find((node) => node.id === nodeId);
    return view ? { x: view.x, y: view.y, selectable: view.selectable } : null;
  }, bossNode);
  assert(bossView?.selectable, 'chapter one boss node is not selectable');
  await clickGame(page, bossView.x, bossView.y, 500);
  await waitScene(page, 'BossIntroScene');
  await completeStoryDialog(page);
  await waitScene(page, 'BattleScene');

  await page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.BattleScene;
    delete scene.battle.battleType;
    scene.saveCheckpoint();
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitScene(page, 'MainMenuScene');
  await page.evaluate(() => window.__ASHEN_GAME__.scene.keys.MainMenuScene.continueRun());
  await waitScene(page, 'BattleScene');
  const resumed = await snapshot(page, 'restored-legacy-boss');
  assert(resumed.battleType === 'boss', `legacy boss checkpoint resumed as ${resumed.battleType}`);

  await page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.BattleScene;
    scene.battle.enemies.forEach((enemy) => {
      enemy.hp = 0;
    });
    scene.battle.ended = true;
    scene.battle.won = true;
    scene.finishIfNeeded();
  });
  await waitScene(page, 'ActClearScene');
  await completeStoryDialog(page);
  await waitScene(page, 'VowScene');
  await clickGame(page, 366, 668, 500);
  await waitScene(page, 'MapScene');
  const act2 = await snapshot(page, 'act-two-map');
  assert(act2.act === 2, `expected run act 2, got ${act2.act}`);
  assert(act2.mapAct === 2, `expected map act 2, got ${act2.mapAct}`);
  assert(act2.selectable.length === 1, `expected one selectable opening node, got ${act2.selectable.length}`);
  assert(report.errors.length === 0, report.errors.join('\n'));

  fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
  await page.screenshot({ path: screenshotPath });
  fs.writeFileSync(reportPath, JSON.stringify({ ok: true, ...report }, null, 2), 'utf8');
  console.log(JSON.stringify({ ok: true, act: act2.act, mapAct: act2.mapAct, selectable: act2.selectable.length }, null, 2));
} catch (error) {
  fs.writeFileSync(reportPath, JSON.stringify({ ok: false, ...report, failure: error.stack ?? error.message }, null, 2), 'utf8');
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
} finally {
  await context.close();
  await browser.close();
}
