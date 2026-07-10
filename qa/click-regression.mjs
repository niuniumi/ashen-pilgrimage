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

const viewports = [
  { name: 'letterbox-1567x1207', width: 1567, height: 1207 },
  { name: 'desktop-1920x1080', width: 1920, height: 1080 },
  { name: 'laptop-1366x768', width: 1366, height: 768 },
  { name: 'hd-1280x720', width: 1280, height: 720 }
];

function pagePoint(rect, gx, gy) {
  return {
    x: rect.x + (gx / 1536) * rect.width,
    y: rect.y + (gy / 864) * rect.height
  };
}

async function waitActive(page, key) {
  await page.waitForFunction((sceneKey) => window.__ASHEN_GAME__?.scene?.getScenes(true).some((scene) => scene.scene.key === sceneKey), key);
}

async function clickGame(page, rect, gx, gy, delay = 450) {
  const point = pagePoint(rect, gx, gy);
  await page.mouse.move(point.x, point.y);
  await page.waitForTimeout(80);
  await page.mouse.down();
  await page.waitForTimeout(60);
  await page.mouse.up();
  await page.waitForTimeout(delay);
}

async function activeScenes(page) {
  return page.evaluate(() => window.__ASHEN_GAME__.scene.getScenes(true).map((scene) => scene.scene.key));
}

const browser = await chromium.launch({ headless: true });
const results = [];
const urlArg = process.argv.find((arg) => arg.startsWith('--url='));
const targetUrl = urlArg ? urlArg.slice('--url='.length) : process.env.QA_URL ?? 'http://127.0.0.1:4173';

for (const viewport of viewports) {
  const page = await browser.newPage({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem(
      'ashen-pilgrimage-settings-v1',
      JSON.stringify({ sound: true, animation: true, fastMode: false, tutorialEnabled: true, tutorialSeen: false, storySeen: true })
    );
  });
  await page.goto(targetUrl, { waitUntil: 'networkidle' });
  await waitActive(page, 'MainMenuScene');
  const rect = await page.locator('canvas').evaluate((canvas) => {
    const r = canvas.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });

  await clickGame(page, rect, 1190, 408);
  await waitActive(page, 'CharacterSelectScene');
  await clickGame(page, rect, 300, 462);
  const selected = await page.evaluate(() => window.__ASHEN_GAME__.scene.keys.CharacterSelectScene.selected);
  await clickGame(page, rect, 1324, 798, 700);
  await waitActive(page, 'MapScene');
  const node = await page.evaluate(() => {
    const view = window.__ASHEN_GAME__.scene.keys.MapScene.nodeViews.find((item) => item.selectable);
    return { x: view.x, y: view.y };
  });
  await clickGame(page, rect, node.x, node.y, 900);
  await waitActive(page, 'BattleScene');
  await clickGame(page, rect, 702, 478, 250);
  const tutorialStep = await page.evaluate(() => window.__ASHEN_GAME__.scene.keys.BattleScene.tutorialStep);
  await clickGame(page, rect, 860, 478, 250);
  const tutorialOpen = await page.evaluate(() => Boolean(window.__ASHEN_GAME__.scene.keys.BattleScene.tutorialPanel));
  let attack = await page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.BattleScene;
    const view = scene.cardViews.find((card) => card.card.type === '攻击');
    return view ? { x: view.x, y: view.y } : null;
  });
  if (!attack) {
    attack = await page.evaluate(() => {
      const scene = window.__ASHEN_GAME__.scene.keys.BattleScene;
      const view = scene.cardViews.find((card) => card.card.requiresTarget);
      return view ? { x: view.x, y: view.y } : null;
    });
  }
  if (!attack) throw new Error(`No attack card in ${viewport.name}`);
  const beforeHp = await page.evaluate(() => window.__ASHEN_GAME__.scene.keys.BattleScene.battle.enemies[0].hp);
  await clickGame(page, rect, attack.x, attack.y, 250);
  const selectedCard = await page.evaluate(() => Boolean(window.__ASHEN_GAME__.scene.keys.BattleScene.selectedUid));
  const enemy = await page.evaluate(() => {
    const view = window.__ASHEN_GAME__.scene.keys.BattleScene.enemyViews[0];
    return { x: view.x, y: view.y };
  });
  await clickGame(page, rect, enemy.x, enemy.y, 650);
  const afterHp = await page.evaluate(() => window.__ASHEN_GAME__.scene.keys.BattleScene.battle.enemies[0].hp);

  const ok =
    selected === 'exiled-knight' &&
    tutorialStep === 1 &&
    tutorialOpen === false &&
    selectedCard === true &&
    afterHp < beforeHp &&
    (await activeScenes(page)).includes('BattleScene') &&
    errors.length === 0;

  results.push({
    viewport: viewport.name,
    canvasRect: rect,
    selected,
    tutorialStep,
    tutorialOpen,
    selectedCard,
    beforeHp,
    afterHp,
    activeScenes: await activeScenes(page),
    errors,
    ok
  });
  await page.close();
}

await browser.close();

const reportPath = path.join(process.cwd(), 'qa', 'click-regression-report.json');
fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

const failed = results.filter((result) => !result.ok);
if (failed.length > 0) {
  console.error(JSON.stringify(failed, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(results, null, 2));
