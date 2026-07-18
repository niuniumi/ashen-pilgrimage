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
const report = { url, stages: [], transactions: [], errors: [] };

function assert(value, message) {
  if (!value) throw new Error(message);
}

async function waitScene(page, key) {
  await page.waitForFunction((sceneKey) => window.__ASHEN_GAME__?.scene?.keys?.[sceneKey]?.scene?.isActive(), key, { timeout: 45_000 });
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1 });
await context.addInitScript(() => {
  if (sessionStorage.getItem('resume-stage-qa')) return;
  sessionStorage.setItem('resume-stage-qa', '1');
  localStorage.clear();
  localStorage.setItem('ashen-pilgrimage-settings-v1', JSON.stringify({ sound: false, music: false, muted: true, animation: false, fastMode: true, tutorialEnabled: false, tutorialSeen: true, storySeen: true }));
});
const page = await context.newPage();
page.on('pageerror', (error) => report.errors.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error') report.errors.push(`console: ${message.text()}`);
});

async function saveStage(stage, options = {}) {
  await page.evaluate(({ pendingScene, active, resultVictory }) => {
    const run = structuredClone(window.__ASHEN_GAME__.registry.get('run'));
    run.pendingScene = pendingScene;
    if (resultVictory !== undefined) run.resultVictory = resultVictory;
    if (active) {
      const node = run.map.nodes.find((item) => item.id === run.map.available[0]) ?? run.map.nodes[0];
      run.map.activeNode = node.id;
      if (!run.map.path.includes(node.id)) run.map.path.push(node.id);
    } else {
      run.map.activeNode = null;
    }
    run.checkpoint = null;
    run.pendingReward = null;
    localStorage.setItem('ashen-pilgrimage-save-v1', JSON.stringify(run));
  }, { pendingScene: stage, ...options });
}

try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await waitScene(page, 'MainMenuScene');
  await page.evaluate(() => window.__ASHEN_QA__.startRun('exiled-knight', { seed: 20260712, skipVow: true }));
  await waitScene(page, 'MapScene');

  const stages = [
    ['vow', 'VowScene', false],
    ['shop', 'ShopScene', true],
    ['boss-intro', 'BossIntroScene', true],
    ['act-clear', 'ActClearScene', false],
    ['result', 'ResultScene', false, true]
  ];
  for (const [stage, expected, active, resultVictory] of stages) {
    await saveStage(stage, { active, resultVictory });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitScene(page, 'MainMenuScene');
    await page.evaluate(() => window.__ASHEN_GAME__.scene.keys.MainMenuScene.continueRun());
    await waitScene(page, expected);
    report.stages.push({ stage, expected, actual: expected });
  }

  await page.evaluate(() => window.__ASHEN_QA__.startRun('exiled-knight', { seed: 20260713, skipVow: true }));
  await waitScene(page, 'MapScene');
  await page.evaluate(() => window.__ASHEN_QA__.forceScene('ChestScene', 'chest'));
  await waitScene(page, 'ChestScene');
  const chest = await page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.ChestScene;
    scene.openChest();
    const run = window.__ASHEN_GAME__.registry.get('run');
    const first = { gold: run.gold, completed: [...run.map.completed], activeNode: run.map.activeNode };
    scene.openChest();
    return { first, second: { gold: run.gold, completed: [...run.map.completed], activeNode: run.map.activeNode } };
  });
  assert(chest.first.gold === chest.second.gold, 'chest double activation granted gold twice');
  assert(chest.first.activeNode === null, 'chest did not settle its map node immediately');
  report.transactions.push({ type: 'chest', ...chest });

  await page.evaluate(() => window.__ASHEN_QA__.forceScene('RestScene', 'rest'));
  await waitScene(page, 'RestScene');
  const rest = await page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.RestScene;
    const run = window.__ASHEN_GAME__.registry.get('run');
    run.hp = 1;
    scene.rest();
    const first = run.hp;
    scene.rest();
    return { first, second: run.hp, activeNode: run.map.activeNode };
  });
  assert(rest.first === rest.second, 'rest double activation healed twice');
  assert(rest.activeNode === null, 'rest node was not settled');
  report.transactions.push({ type: 'rest', ...rest });

  await page.evaluate(() => {
    const run = window.__ASHEN_GAME__.registry.get('run');
    run.gold = 999;
    run.hp = run.maxHp;
    window.__ASHEN_QA__.forceScene('EventScene', 'event');
  });
  await waitScene(page, 'EventScene');
  const event = await page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.EventScene;
    const run = window.__ASHEN_GAME__.registry.get('run');
    const choiceId = scene.choiceOptions[0].id;
    scene.selectChoice(choiceId);
    scene.confirmChoice();
    const first = { gold: run.gold, hp: run.hp, deck: run.deck.length, completed: [...run.map.completed], activeNode: run.map.activeNode };
    scene.selectChoice(choiceId);
    scene.confirmChoice();
    return { first, second: { gold: run.gold, hp: run.hp, deck: run.deck.length, completed: [...run.map.completed], activeNode: run.map.activeNode } };
  });
  assert(JSON.stringify(event.first) === JSON.stringify(event.second), 'event option applied more than once');
  assert(event.first.activeNode === null, 'event node was not settled immediately');
  report.transactions.push({ type: 'event', ...event });

  await page.evaluate(() => window.__ASHEN_QA__.forceScene('RewardScene', 'battle'));
  await waitScene(page, 'RewardScene');
  const rewardPause = await page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.RewardScene;
    const run = window.__ASHEN_GAME__.registry.get('run');
    run.pendingScene = 'reward';
    const activeNode = run.map.activeNode;
    const reward = structuredClone(run.pendingReward);
    scene.pauseMenu.prepareRunForMapReturn();
    return { activeNode, afterActiveNode: run.map.activeNode, reward, afterReward: run.pendingReward };
  });
  assert(rewardPause.activeNode === rewardPause.afterActiveNode, 'pause menu rolled back a settled battle node');
  assert(JSON.stringify(rewardPause.reward) === JSON.stringify(rewardPause.afterReward), 'pause menu deleted pending reward');
  report.transactions.push({ type: 'reward-pause', preserved: true });

  assert(report.errors.length === 0, report.errors.join('\n'));
  console.log(JSON.stringify({ ok: true, stages: report.stages.length, transactions: report.transactions.length, errors: report.errors.length }, null, 2));
} catch (error) {
  report.errors.push(error.stack ?? error.message);
  console.error(JSON.stringify(report, null, 2));
  process.exitCode = 1;
} finally {
  await context.close();
  await browser.close();
}
