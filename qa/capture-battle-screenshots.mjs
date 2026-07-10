import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/16224/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/playwright@1.61.0/node_modules/playwright');

const root = path.resolve(process.cwd());
const outDir = path.join(root, 'qa', 'screenshots');
fs.mkdirSync(outDir, { recursive: true });

const URL = process.env.QA_URL ?? 'http://127.0.0.1:4173';
const fixedShotName = process.env.FIXED_SHOT_NAME ?? 'battle_scene_fixed_round_1';
const errors = [];
const captures = [];

async function wait(page, ms = 260) {
  await page.waitForTimeout(ms);
}

async function canvasPoint(page, x, y) {
  const box = await page.locator('canvas').boundingBox();
  if (!box) throw new Error('canvas not found');
  return {
    x: box.x + (x / 1536) * box.width,
    y: box.y + (y / 864) * box.height
  };
}

async function clickGame(page, x, y, delay = 320) {
  const point = await canvasPoint(page, x, y);
  await page.mouse.click(point.x, point.y);
  await wait(page, delay);
}

async function shot(page, name) {
  await wait(page, 360);
  const output = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: output });
  captures.push(path.relative(root, output).replaceAll('\\', '/'));
}

async function enterBattle(page) {
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('canvas');
  await page.waitForFunction(() => window.__ASHEN_GAME__?.scene?.keys?.MainMenuScene);
  await wait(page, 650);
  await clickGame(page, 1200, 448, 320);
  await clickGame(page, 348, 452, 320);
  await clickGame(page, 768, 800, 620);
  await page.waitForFunction(() => window.__ASHEN_GAME__?.scene?.keys?.MapScene?.nodeViews?.length);
  const node = await page.evaluate(() => {
    const view = window.__ASHEN_GAME__.scene.keys.MapScene.nodeViews.find((item) => item.selectable);
    return { x: view.x, y: view.y };
  });
  await clickGame(page, node.x, node.y, 820);
  await page.waitForFunction(() => window.__ASHEN_GAME__?.scene?.keys?.BattleScene?.scene?.isActive());
  await wait(page, 450);
  await clickGame(page, 854, 485, 420);
}

async function captureViewport(browser, viewport, names) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1
  });
  await context.addInitScript(() => {
    window.localStorage.clear();
    let seed = 12;
    Math.random = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
  });
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(`${viewport.width}x${viewport.height} pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`${viewport.width}x${viewport.height} console: ${message.text()}`);
  });
  await enterBattle(page);
  for (const name of names) {
    await shot(page, name);
  }
  await context.close();
}

const browser = await chromium.launch({ headless: true });

await captureViewport(browser, { width: 1536, height: 864 }, [fixedShotName, 'battle_1536x864']);
await captureViewport(browser, { width: 1366, height: 768 }, ['battle_1366x768']);
await captureViewport(browser, { width: 1280, height: 720 }, ['battle_1280x720']);

await browser.close();

const report = {
  url: URL,
  errors,
  screenshots: captures,
  generatedAt: new Date().toISOString()
};
fs.writeFileSync(path.join(root, 'qa', 'battle-visual-report.json'), JSON.stringify(report, null, 2));

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}
