import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  ({ chromium } = require('C:/Users/16224/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/playwright@1.61.0/node_modules/playwright'));
}

const url = process.env.QA_URL
  ?? process.argv.find((arg) => arg.startsWith('--url='))?.slice(6)
  ?? 'http://127.0.0.1:4173/';
const report = { url, states: [], errors: [] };

function assert(value, message) {
  if (!value) throw new Error(message);
}

async function waitScene(page, key) {
  await page.waitForFunction((sceneKey) => window.__ASHEN_GAME__?.scene?.keys?.[sceneKey]?.scene?.isActive(), key);
}

async function clickGame(page, x, y, delay = 500) {
  const rect = await page.locator('canvas').evaluate((canvas) => {
    const bounds = canvas.getBoundingClientRect();
    return { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height };
  });
  await page.mouse.click(rect.x + (x / 1536) * rect.width, rect.y + (y / 864) * rect.height);
  await page.waitForTimeout(delay);
}

async function snapshot(page, phase) {
  const state = await page.evaluate(() => {
    const game = window.__ASHEN_GAME__;
    const run = game.registry.get('run');
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem('ashen-pilgrimage-save-v1'));
    } catch {
      saved = null;
    }
    const activeScenes = game.scene.getScenes(true).map((scene) => scene.scene.key);
    const mapScene = game.scene.keys.MapScene;
    return {
      activeScenes,
      activeNode: run?.map?.activeNode ?? null,
      available: [...(run?.map?.available ?? [])],
      completed: [...(run?.map?.completed ?? [])],
      path: [...(run?.map?.path ?? [])],
      pendingReward: run?.pendingReward ?? null,
      rewardClaimed: run?.rewardClaimed ?? false,
      saved: saved
        ? {
            activeNode: saved.map?.activeNode ?? null,
            pendingReward: saved.pendingReward ?? null,
            checkpoint: saved.checkpoint ?? null,
            version: saved.version ?? null
          }
        : null,
      selectable: mapScene?.scene?.isActive()
        ? mapScene.nodeViews.filter((node) => node.selectable).map((node) => ({ id: node.id, type: node.type, x: node.x, y: node.y }))
        : []
    };
  });
  report.states.push({ phase, ...state });
  return state;
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1 });
await context.addInitScript(() => {
  if (sessionStorage.getItem('qa-progression-initialized')) return;
  sessionStorage.setItem('qa-progression-initialized', '1');
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
  await clickGame(page, 1190, 386, 500);
  await waitScene(page, 'CharacterSelectScene');
  await clickGame(page, 980, 462, 260);
  await clickGame(page, 1324, 798, 600);
  await waitScene(page, 'VowScene');
  await clickGame(page, 366, 668, 700);
  await waitScene(page, 'MapScene');

  const initial = await snapshot(page, 'initial-map');
  assert(initial.selectable.length === 1, 'new run must expose exactly one selectable opening node');
  await clickGame(page, initial.selectable[0].x, initial.selectable[0].y, 700);
  await waitScene(page, 'BattleScene');
  const entered = await snapshot(page, 'entered-battle');
  assert(entered.activeNode === initial.selectable[0].id, 'opening node was not activated');

  await page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.BattleScene;
    scene.battle.enemies.forEach((enemy) => {
      enemy.hp = 0;
    });
    scene.battle.ended = true;
    scene.battle.won = true;
    scene.finishIfNeeded();
    scene.finishIfNeeded();
  });
  await waitScene(page, 'RewardScene');
  const reward = await snapshot(page, 'reward-ready');
  assert(reward.activeNode === initial.selectable[0].id, 'battle node must stay active until reward settlement');
  assert(Boolean(reward.pendingReward), 'battle victory did not create a pending reward');

  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitScene(page, 'MainMenuScene');
  await snapshot(page, 'reloaded-menu');
  await page.evaluate(() => window.__ASHEN_GAME__.scene.keys.MainMenuScene.continueRun());
  await page.waitForTimeout(800);
  await snapshot(page, 'after-continue');
  await waitScene(page, 'RewardScene');
  const resumedReward = await snapshot(page, 'resumed-reward');
  assert(resumedReward.activeNode === initial.selectable[0].id, 'reward resume lost its active battle node');
  assert(Boolean(resumedReward.pendingReward), 'reward resume lost the pending reward');

  const rewardSelection = await page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.RewardScene;
    const run = window.__ASHEN_GAME__.registry.get('run');
    const cardId = run.pendingReward.cards[0].id;
    const selected = scene.selectChoice(cardId);
    return { selected, activeNode: run.map.activeNode, pendingReward: Boolean(run.pendingReward) };
  });
  assert(rewardSelection.selected, 'reward card could not be selected');
  assert(rewardSelection.activeNode === initial.selectable[0].id, 'selecting a reward settled the node before confirmation');
  assert(rewardSelection.pendingReward, 'selecting a reward consumed it before confirmation');
  await snapshot(page, 'reward-selected');

  const rewardConfirmation = await page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.RewardScene;
    return { first: scene.confirmChoice(), second: scene.confirmChoice() };
  });
  assert(rewardConfirmation.first === true, 'reward confirmation did not settle the selected card');
  assert(rewardConfirmation.second === false, 'reward confirmation was accepted more than once');
  await waitScene(page, 'MapScene');
  const returned = await snapshot(page, 'returned-map');
  assert(returned.activeNode === null, 'reward settlement left the completed node active');
  assert(returned.pendingReward === null, 'reward settlement left a pending reward');
  assert(returned.completed.includes(initial.selectable[0].id), 'completed battle node was not recorded');
  assert(returned.selectable.length > 0, 'no next route node became selectable');

  const next = returned.selectable[0];
  await clickGame(page, next.x, next.y, 900);
  await page.waitForFunction((nodeId) => {
    const game = window.__ASHEN_GAME__;
    const run = game?.registry?.get('run');
    return run?.map?.activeNode === nodeId && !game.scene.keys.MapScene.scene.isActive();
  }, next.id);
  const advanced = await snapshot(page, 'advanced-next-node');
  assert(advanced.activeNode === next.id, 'next node click did not advance the run');
  assert(report.errors.length === 0, report.errors.join('\n'));

  console.log(JSON.stringify({ ok: true, ...report }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ ok: false, ...report, failure: error.message }, null, 2));
  throw error;
} finally {
  await context.close();
  await browser.close();
}
