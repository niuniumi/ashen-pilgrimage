import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { BUILD_VERSION } from '../src/game/constants.js';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  ({ chromium } = require('C:/Users/16224/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/playwright@1.61.0/node_modules/playwright'));
}

const root = process.cwd();
const outDir = path.join(root, 'qa', 'screenshots', 'product_upgrade');
fs.mkdirSync(outDir, { recursive: true });

const URL = process.env.QA_URL ?? process.argv.find((arg) => arg.startsWith('--url='))?.slice(6) ?? 'http://127.0.0.1:4176';
const report = {
  version: BUILD_VERSION,
  url: URL,
  generatedAt: new Date().toISOString(),
  screenshots: [],
  errors: []
};

const roles = [
  { slug: 'knight', id: 'exiled-knight', select: { x: 300, y: 462 } },
  { slug: 'nun', id: 'candle-nun', select: { x: 640, y: 462 } },
  { slug: 'alchemist', id: 'ashblood-alchemist', select: { x: 980, y: 462 } }
];

function rel(file) {
  return path.relative(root, file).replaceAll('\\', '/');
}

function assert(value, message) {
  if (!value) {
    throw new Error(message);
  }
}

function attachErrors(page) {
  page.on('pageerror', (error) => report.errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      report.errors.push(`console: ${message.text()}`);
    }
  });
}

async function waitScene(page, sceneKey) {
  await page.waitForFunction((key) => window.__ASHEN_GAME__?.scene?.getScenes(true).some((scene) => scene.scene.key === key), sceneKey, {
    timeout: 45000
  });
}

async function canvasRect(page) {
  return page.locator('canvas').evaluate((canvas) => {
    const r = canvas.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
}

async function point(page, x, y) {
  const rect = await canvasRect(page);
  return {
    x: rect.x + (x / 1536) * rect.width,
    y: rect.y + (y / 864) * rect.height
  };
}

async function clickGame(page, x, y, delay = 300) {
  const p = await point(page, x, y);
  await page.mouse.move(p.x, p.y);
  await page.waitForTimeout(30);
  await page.mouse.click(p.x, p.y);
  await page.waitForTimeout(delay);
}

async function screenshot(page, name) {
  await page.waitForTimeout(260);
  const file = path.join(outDir, name);
  await page.screenshot({ path: file });
  report.screenshots.push(rel(file));
}

async function setupPage(browser, viewport = { width: 1536, height: 864 }) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  await context.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem(
      'ashen-pilgrimage-settings-v1',
      JSON.stringify({ sound: false, animation: true, fastMode: false, tutorialEnabled: true, tutorialSeen: true, storySeen: true })
    );
  });
  const page = await context.newPage();
  attachErrors(page);
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('canvas');
  await waitScene(page, 'MainMenuScene');
  return { context, page };
}

async function startCharacterSelect(page) {
  await page.evaluate(() => window.__ASHEN_QA__.startScene('CharacterSelectScene'));
  await waitScene(page, 'CharacterSelectScene');
}

async function startJourneyToMap(page, role = roles[0], vowScreenshot = null) {
  await page.evaluate(({ characterId }) => window.__ASHEN_QA__.startRun(characterId, { seed: 20260710, skipVow: false }), {
    characterId: role.id
  });
  await waitScene(page, 'VowScene');
  if (vowScreenshot) await screenshot(page, vowScreenshot);
  await page.evaluate(() => window.__ASHEN_QA__.chooseVow(0));
  await waitScene(page, 'MapScene');
}

async function firstSelectableNode(page) {
  return page.evaluate(() => {
    const scene = window.__ASHEN_GAME__?.scene?.keys?.MapScene;
    const node = scene?.nodeViews?.find((item) => item.selectable) ?? scene?.nodeViews?.[0];
    return node ? { x: node.x, y: node.y } : null;
  });
}

async function closeTutorialIfOpen(page) {
  const open = await page.evaluate(() => Boolean(window.__ASHEN_GAME__?.scene?.keys?.BattleScene?.tutorialPanel));
  if (open) {
    await clickGame(page, 854, 485, 260);
  }
}

async function startBattleFromMap(page) {
  const result = await page.evaluate(() => window.__ASHEN_QA__.enterNode());
  assert(result, 'no selectable map node found');
  await waitScene(page, 'BattleScene');
  await closeTutorialIfOpen(page);
}

async function forceScene(page, sceneKey, nodeType = null) {
  await page.evaluate(({ sceneKey: target, nodeType: type }) => window.__ASHEN_QA__.forceScene(target, type), {
    sceneKey,
    nodeType
  });
  await waitScene(page, sceneKey);
}

async function captureCoreScenes(browser) {
  const { context, page } = await setupPage(browser);
  try {
    await screenshot(page, '01_menu.png');
    await startCharacterSelect(page);
    await screenshot(page, '02_character_select.png');
    await startJourneyToMap(page, roles[0], '03_vow.png');
    await screenshot(page, '04_map.png');
    await startBattleFromMap(page);
    await screenshot(page, '05_battle.png');

    await forceScene(page, 'RewardScene', 'battle');
    await screenshot(page, '06_reward.png');
    await forceScene(page, 'ShopScene', 'shop');
    await screenshot(page, '07_shop.png');
    await forceScene(page, 'EventScene', 'event');
    await screenshot(page, '08_event.png');
    await forceScene(page, 'RestScene', 'rest');
    await screenshot(page, '09_rest.png');
    await forceScene(page, 'CodexScene');
    await screenshot(page, '10_codex.png');
    await forceScene(page, 'SettingsScene');
    await screenshot(page, '11_settings.png');
  } finally {
    await context.close();
  }
}

async function captureBattleViewport(browser, width, height) {
  const { context, page } = await setupPage(browser, { width, height });
  try {
    await startCharacterSelect(page);
    await startJourneyToMap(page, roles[0]);
    await startBattleFromMap(page);
    await screenshot(page, `battle_${width}x${height}.png`);
  } finally {
    await context.close();
  }
}

try {
  const browser = await chromium.launch({ headless: true });
  try {
    await captureCoreScenes(browser);
    await captureBattleViewport(browser, 1536, 864);
    await captureBattleViewport(browser, 1366, 768);
    await captureBattleViewport(browser, 1280, 720);
  } finally {
    await browser.close();
  }

  assert(report.errors.length === 0, report.errors.join('\n'));
  assert(report.screenshots.length >= 14, 'expected at least 14 screenshots');
  fs.writeFileSync(path.join(root, 'qa', 'product-upgrade-scenes-report.json'), JSON.stringify(report, null, 2), 'utf8');
  console.log(JSON.stringify({ ok: true, screenshots: report.screenshots.length }, null, 2));
} catch (error) {
  report.errors.push(error.stack ?? error.message);
  fs.writeFileSync(path.join(root, 'qa', 'product-upgrade-scenes-report.json'), JSON.stringify(report, null, 2), 'utf8');
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
}
