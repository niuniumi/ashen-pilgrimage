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
const outDir = path.join(root, 'qa', 'screenshots');
fs.mkdirSync(outDir, { recursive: true });

const URL = process.env.DEPLOY_URL ?? process.argv.find((arg) => arg.startsWith('--url='))?.slice(6) ?? 'https://ashen-pilgrimage-stage2.netlify.app/';
const roles = [
  { slug: 'knight', id: 'exiled-knight', select: { x: 292, y: 460 }, shot: 'deploy_art_final_battle.png' },
  { slug: 'nun', id: 'candle-nun', select: { x: 632, y: 460 }, shot: 'deploy_nun_battle.png' },
  { slug: 'alchemist', id: 'ashblood-alchemist', select: { x: 966, y: 460 }, shot: 'deploy_alchemist_battle.png' }
];
const report = { url: URL, buildVersion: BUILD_VERSION, generatedAt: new Date().toISOString(), screenshots: [], roles: [], errors: [] };

function rel(file) {
  return path.relative(root, file).replaceAll('\\', '/');
}

function assert(value, message) {
  if (!value) throw new Error(message);
}

async function waitScene(page, sceneKey) {
  await page.waitForFunction((key) => window.__ASHEN_GAME__?.scene?.getScenes(true).some((scene) => scene.scene.key === key), sceneKey);
}

async function canvasRect(page) {
  return page.locator('canvas').evaluate((canvas) => {
    const r = canvas.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
}

async function point(page, x, y) {
  const rect = await canvasRect(page);
  return { x: rect.x + (x / 1536) * rect.width, y: rect.y + (y / 864) * rect.height };
}

async function clickGame(page, x, y, delay = 330) {
  const p = await point(page, x, y);
  await page.mouse.move(p.x, p.y);
  await page.waitForTimeout(35);
  await page.mouse.click(p.x, p.y);
  await page.waitForTimeout(delay);
}

async function screenshot(page, name) {
  await page.waitForTimeout(260);
  const file = path.join(outDir, name);
  await page.screenshot({ path: file });
  report.screenshots.push(rel(file));
}

async function closeTutorialIfOpen(page) {
  const open = await page.evaluate(() => Boolean(window.__ASHEN_GAME__?.scene?.keys?.BattleScene?.tutorialPanel));
  if (open) await clickGame(page, 854, 485, 260);
}

async function firstSelectableNode(page) {
  return page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.MapScene;
    const node = scene.nodeViews.find((item) => item.selectable) ?? scene.nodeViews[0];
    return { x: node.x, y: node.y };
  });
}

async function openCleanPage(browser, { storySeen = false } = {}) {
  const context = await browser.newContext({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1 });
  await context.addInitScript((seen) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    if (seen) {
      window.localStorage.setItem(
        'ashen-pilgrimage-settings-v1',
        JSON.stringify({ sound: true, animation: true, fastMode: false, tutorialEnabled: true, tutorialSeen: true, storySeen: true })
      );
    }
  }, storySeen);
  const page = await context.newPage();
  page.on('pageerror', (error) => report.errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') report.errors.push(`console: ${message.text()}`);
  });
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('canvas');
  return { context, page };
}

async function startRoleBattle(page, role) {
  await waitScene(page, 'MainMenuScene');
  await clickGame(page, 1190, 386, 420);
  await waitScene(page, 'CharacterSelectScene');
  await clickGame(page, role.select.x, role.select.y, 260);
  await clickGame(page, 1324, 798, 650);
  await waitScene(page, 'MapScene');
  if (role.slug === 'knight') await screenshot(page, 'deploy_art_final_map.png');
  const node = await firstSelectableNode(page);
  await clickGame(page, node.x, node.y, 780);
  await waitScene(page, 'BattleScene');
  await closeTutorialIfOpen(page);
}

const browser = await chromium.launch({ headless: true });
try {
  {
    const { context, page } = await openCleanPage(browser);
    await waitScene(page, 'MainMenuScene');
    await screenshot(page, 'deploy_art_final_menu.png');
    const menuTexts = await page.evaluate(() => window.__ASHEN_GAME__.scene.keys.MainMenuScene.children.list.filter((child) => child.type === 'Text').map((child) => child.text));
    assert(menuTexts.some((text) => text.includes(BUILD_VERSION)), `线上主菜单没有显示版本号 ${BUILD_VERSION}`);
    await clickGame(page, 1190, 386, 420);
    await waitScene(page, 'PrologueScene');
    await screenshot(page, 'deploy_release_prologue.png');
    await clickGame(page, 1238, 558, 420);
    await waitScene(page, 'CharacterSelectScene');
    await screenshot(page, 'deploy_art_final_character.png');
    await context.close();
  }

  for (const role of roles) {
    const { context, page } = await openCleanPage(browser, { storySeen: true });
    await startRoleBattle(page, role);
    await screenshot(page, role.shot);
    const state = await page.evaluate(() => {
      const scene = window.__ASHEN_GAME__.scene.keys.BattleScene;
      return {
        characterId: scene.run.characterId,
        playerName: scene.playerNameText?.text,
        playerArtKey: scene.playerArtKey,
        hand: scene.cardViews.map((view) => ({ id: view.card.id, name: view.card.name, character: view.card.character }))
      };
    });
    assert(state.characterId === role.id, `线上 ${role.id} 战斗角色错误`);
    if (role.slug === 'knight') {
      await page.keyboard.press('Escape');
      await screenshot(page, 'deploy_art_final_pause.png');
    }
    report.roles.push({ role: role.slug, state });
    await context.close();
  }

  assert(report.errors.length === 0, report.errors.join('\n'));
  fs.writeFileSync(path.join(root, 'qa', 'deploy-smoke-report.json'), JSON.stringify(report, null, 2), 'utf8');
  console.log(JSON.stringify({ ok: true, screenshots: report.screenshots }, null, 2));
} catch (error) {
  report.errors.push(error.stack ?? error.message);
  fs.writeFileSync(path.join(root, 'qa', 'deploy-smoke-report.json'), JSON.stringify(report, null, 2), 'utf8');
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
} finally {
  await browser.close();
}
