import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/16224/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/playwright@1.61.0/node_modules/playwright');

const root = path.resolve(process.cwd());
const outDir = path.join(root, 'qa', 'screenshots');
fs.mkdirSync(outDir, { recursive: true });

const URL = process.env.QA_URL ?? 'http://127.0.0.1:4173';
const errors = [];
const screenshots = [];

function rel(file) {
  return path.relative(root, file).replaceAll('\\', '/');
}

async function wait(page, ms = 260) {
  await page.waitForTimeout(ms);
}

async function canvasRect(page) {
  return page.locator('canvas').evaluate((canvas) => {
    const r = canvas.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
}

async function canvasPoint(page, x, y) {
  const rect = await canvasRect(page);
  return {
    x: rect.x + (x / 1536) * rect.width,
    y: rect.y + (y / 864) * rect.height
  };
}

async function clickGame(page, x, y, delay = 320) {
  const point = await canvasPoint(page, x, y);
  await page.mouse.move(point.x, point.y);
  await page.waitForTimeout(40);
  await page.mouse.click(point.x, point.y);
  await wait(page, delay);
}

async function shot(page, name, delay = 240) {
  await wait(page, delay);
  const output = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: output });
  screenshots.push(rel(output));
}

async function waitScene(page, sceneKey) {
  await page.waitForFunction((key) => window.__ASHEN_GAME__?.scene?.getScenes(true).some((scene) => scene.scene.key === key), sceneKey);
}

async function startScene(page, scene, data = {}) {
  await page.evaluate(({ scene, data }) => {
    const game = window.__ASHEN_GAME__;
    game.scene.getScenes(true).forEach((item) => {
      if (item.scene.key !== scene) game.scene.stop(item.scene.key);
    });
    game.scene.start(scene, data);
  }, { scene, data });
  await waitScene(page, scene);
  await wait(page, 620);
}

async function closeTutorialIfOpen(page) {
  const open = await page.evaluate(() => Boolean(window.__ASHEN_GAME__?.scene?.keys?.BattleScene?.tutorialPanel));
  if (open) await clickGame(page, 854, 485, 360);
}

async function firstSelectableNode(page) {
  return page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.MapScene;
    const node = scene.nodeViews.find((item) => item.selectable) ?? scene.nodeViews[0];
    return { x: node.x, y: node.y, id: node.id };
  });
}

async function firstEnemy(page) {
  return page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.BattleScene;
    const view = scene.enemyViews.find(Boolean);
    return { x: view.x, y: view.y };
  });
}

async function ensureBattleCard(page, matcher) {
  return page.evaluate((matcher) => {
    const scene = window.__ASHEN_GAME__.scene.keys.BattleScene;
    let view = scene.cardViews.find((card) => card.card?.type === matcher.type || card.card?.id === matcher.id);
    if (!view && matcher.id) {
      scene.battle.deck.hand.unshift({ uid: `qa-${matcher.id}-${Date.now()}`, cardId: matcher.id, upgraded: false });
      scene.renderBattle();
      view = scene.cardViews.find((card) => card.card?.id === matcher.id);
    }
    if (!view) return null;
    return { x: view.x, y: view.y, uid: view.uid, name: view.card.name, type: view.card.type };
  }, matcher);
}

async function enterBattleThroughFlow(page) {
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('canvas');
  await waitScene(page, 'MainMenuScene');
  await wait(page, 620);
  await clickGame(page, 1200, 448, 420);
  await waitScene(page, 'CharacterSelectScene');
  await clickGame(page, 348, 452, 260);
  await clickGame(page, 768, 800, 650);
  await waitScene(page, 'MapScene');
  const node = await firstSelectableNode(page);
  await clickGame(page, node.x, node.y, 780);
  await waitScene(page, 'BattleScene');
  await closeTutorialIfOpen(page);
  await wait(page, 500);
}

async function newPage(context) {
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  return page;
}

async function addInit(context) {
  await context.addInitScript(() => {
    window.localStorage.clear();
    let seed = 12;
    Math.random = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
  });
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1 });
await addInit(context);
const page = await newPage(context);

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForSelector('canvas');
await waitScene(page, 'MainMenuScene');
await wait(page, 650);
await shot(page, 'menu_polished');
await clickGame(page, 1200, 448, 420);
await waitScene(page, 'CharacterSelectScene');
await shot(page, 'character_select_polished');
await clickGame(page, 348, 452, 260);
await clickGame(page, 768, 800, 650);
await waitScene(page, 'MapScene');
await shot(page, 'map_polished');
const node = await firstSelectableNode(page);
await clickGame(page, node.x, node.y, 780);
await waitScene(page, 'BattleScene');
await closeTutorialIfOpen(page);
await shot(page, 'battle_polished', 620);

const attack = await ensureBattleCard(page, { type: '攻击', id: 'knight-cleave' });
if (!attack) throw new Error('No attack card for Stage 2 capture.');
await clickGame(page, attack.x, attack.y, 220);
await shot(page, 'battle_card_selected');
const enemy = await firstEnemy(page);
await clickGame(page, enemy.x, enemy.y, 380);
await shot(page, 'battle_attack_animation', 80);
await page.keyboard.press('Escape');
await shot(page, 'battle_pause_menu');
await shot(page, 'pause_battle');
await clickGame(page, 768, 428, 260);
await shot(page, 'pause_settings');
await clickGame(page, 768, 634, 220);
await clickGame(page, 768, 544, 220);
await shot(page, 'pause_confirm_return_menu');

await startScene(page, 'CodexScene');
await shot(page, 'codex_polished_cards');
await clickGame(page, 230, 380, 280);
await shot(page, 'codex_polished_relics');
await clickGame(page, 230, 456, 280);
await shot(page, 'codex_polished_enemies');
await startScene(page, 'RewardScene');
await shot(page, 'reward_polished');
await startScene(page, 'ShopScene');
await shot(page, 'shop_polished');
await startScene(page, 'EventScene');
await shot(page, 'event_polished');
await startScene(page, 'RestScene');
await shot(page, 'rest_polished');
await startScene(page, 'ChestScene');
await shot(page, 'chest_polished');
const runForResult = await page.evaluate(() => window.__ASHEN_GAME__.registry.get('run'));
await startScene(page, 'ResultScene', { victory: true, run: runForResult });
await shot(page, 'result_victory');
await startScene(page, 'ResultScene', { victory: false, run: runForResult });
await shot(page, 'result_defeat');

await context.close();

for (const viewport of [
  { width: 1536, height: 864, name: 'stage2_1536x864' },
  { width: 1366, height: 768, name: 'stage2_1366x768' },
  { width: 1280, height: 720, name: 'stage2_1280x720' }
]) {
  const responsiveContext = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1 });
  await addInit(responsiveContext);
  const responsivePage = await newPage(responsiveContext);
  await enterBattleThroughFlow(responsivePage);
  await shot(responsivePage, viewport.name, 520);
  await responsiveContext.close();
}

await browser.close();

const report = {
  url: URL,
  errors,
  screenshots,
  generatedAt: new Date().toISOString()
};
fs.writeFileSync(path.join(root, 'qa', 'stage2-visual-report.json'), JSON.stringify(report, null, 2));

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}
