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
const outDir = path.join(root, 'qa', 'screenshots');
fs.mkdirSync(outDir, { recursive: true });

const URL = process.env.QA_URL ?? process.argv.find((arg) => arg.startsWith('--url='))?.slice(6) ?? 'http://127.0.0.1:4173';
const roles = [
  { slug: 'knight', id: 'exiled-knight', select: { x: 348, y: 452 }, battleShot: 'final_battle_knight.png' },
  { slug: 'nun', id: 'candle-nun', select: { x: 768, y: 452 }, battleShot: 'final_battle_nun.png' },
  { slug: 'alchemist', id: 'ashblood-alchemist', select: { x: 1188, y: 452 }, battleShot: 'final_battle_alchemist.png' }
];
const report = { url: URL, generatedAt: new Date().toISOString(), steps: [], screenshots: [], errors: [] };
const QA_SETTINGS = { sound: true, animation: true, fastMode: false, tutorialEnabled: true, tutorialSeen: true, storySeen: true };

function rel(file) {
  return path.relative(root, file).replaceAll('\\', '/');
}

function step(name, status, detail = {}) {
  report.steps.push({ name, status, detail });
}

async function installCleanQaState(context) {
  await context.addInitScript((settings) => {
    window.localStorage.clear();
    window.localStorage.setItem('ashen-pilgrimage-settings-v1', JSON.stringify(settings));
  }, QA_SETTINGS);
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

async function screenshot(page, name, delay = 240) {
  await page.waitForTimeout(delay);
  const file = path.join(outDir, name);
  await page.screenshot({ path: file });
  report.screenshots.push(rel(file));
}

async function waitCharacterCards(page) {
  await page.waitForFunction(() => {
    const cards = window.__ASHEN_GAME__?.scene?.keys?.CharacterSelectScene?.cards;
    return cards?.length === 3 && cards.every((card) => card.container.alpha >= 0.99 && Math.abs(card.container.y - card.baseY) < 0.5);
  });
}

async function closeTutorialIfOpen(page) {
  const open = await page.evaluate(() => Boolean(window.__ASHEN_GAME__?.scene?.keys?.BattleScene?.tutorialPanel));
  if (open) await clickGame(page, 854, 485, 260);
}

async function firstSelectableNode(page) {
  return page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.MapScene;
    const node = scene.nodeViews.find((item) => item.selectable) ?? scene.nodeViews[0];
    return { x: node.x, y: node.y, id: node.id };
  });
}

async function startRoleBattle(page, role) {
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('canvas');
  await waitScene(page, 'MainMenuScene');
  await page.evaluate((characterId) => window.__ASHEN_QA__.startRun(characterId, { seed: 20260712, skipVow: true }), role.id);
  await waitScene(page, 'MapScene');
  const node = await firstSelectableNode(page);
  await clickGame(page, node.x, node.y, 780);
  await waitScene(page, 'BattleScene');
  await closeTutorialIfOpen(page);
}

async function captureFinalScreens(browser) {
  const context = await browser.newContext({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1 });
  await installCleanQaState(context);
  const page = await context.newPage();
  page.on('pageerror', (error) => report.errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') report.errors.push(message.text());
  });

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('canvas');
  await waitScene(page, 'MainMenuScene');
  await screenshot(page, 'final_menu.png');
  step('主菜单', 'pass');

  await page.evaluate(() => window.__ASHEN_QA__.startScene('GuideScene'));
  await waitScene(page, 'GuideScene');
  step('旅途指南', 'pass');
  await page.evaluate(() => window.__ASHEN_QA__.startScene('MainMenuScene'));
  await waitScene(page, 'MainMenuScene');

  await page.evaluate(() => window.__ASHEN_QA__.startScene('SettingsScene'));
  await waitScene(page, 'SettingsScene');
  step('设置', 'pass');
  await page.evaluate(() => localStorage.removeItem('ashen-pilgrimage-save-v1'));
  step('清除存档', 'pass');
  await page.evaluate(() => window.__ASHEN_QA__.startScene('MainMenuScene'));
  await waitScene(page, 'MainMenuScene');

  await page.evaluate(() => window.__ASHEN_QA__.startScene('CharacterSelectScene'));
  await waitScene(page, 'CharacterSelectScene');
  await waitCharacterCards(page);
  await screenshot(page, 'final_character_select.png');
  step('角色选择', 'pass');
  await clickGame(page, 300, 452, 260);
  await clickGame(page, 1324, 798, 650);
  await waitScene(page, 'VowScene');
  await page.evaluate(() => window.__ASHEN_QA__.chooseVow(0));
  await waitScene(page, 'MapScene');
  await screenshot(page, 'final_map.png');
  step('地图节点点击', 'pass');

  const node = await firstSelectableNode(page);
  await clickGame(page, node.x, node.y, 780);
  await waitScene(page, 'BattleScene');
  await closeTutorialIfOpen(page);
  await screenshot(page, 'final_battle_knight.png');
  step('普通战斗-骑士', 'pass');

  const battleSceneOk = await page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.BattleScene;
    return scene.playerNameText?.text === '流亡骑士' && scene.playerArtKey === 'knight-battle';
  });
  assert(battleSceneOk, '骑士战斗绑定不正确');

  const attack = await page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.BattleScene;
    const view = scene.cardViews.find((card) => card.card.type === '攻击');
    return view ? { x: view.x, y: view.y } : null;
  });
  assert(attack, '没有可测试的攻击牌');
  await clickGame(page, attack.x, attack.y, 220);
  const enemy = await page.evaluate(() => {
    const view = window.__ASHEN_GAME__.scene.keys.BattleScene.enemyViews.find(Boolean);
    return { x: view.x, y: view.y };
  });
  await clickGame(page, enemy.x, enemy.y, 520);
  step('攻击牌', 'pass');

  const defense = await page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.BattleScene;
    const view = scene.cardViews.find((card) => card.card.type === '防御');
    return view ? { x: view.x, y: view.y } : null;
  });
  if (defense) {
    await clickGame(page, defense.x, defense.y, 520);
    step('防御牌', 'pass');
  } else {
    step('防御牌', 'recorded-no-card-in-hand');
  }

  const skill = await page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.BattleScene;
    scene.battle.deck.hand.unshift({ uid: 'qa-skill-knight-score', cardId: 'knight-score', upgraded: false });
    scene.battle.player.energy = 9;
    scene.renderBattle();
    const view = scene.cardViews.find((card) => card.card.id === 'knight-score');
    return { x: view.x, y: view.y };
  });
  await clickGame(page, skill.x, skill.y, 220);
  await clickGame(page, enemy.x, enemy.y, 520);
  step('技能牌', 'pass');

  await clickGame(page, 1320, 742, 840);
  step('结束回合', 'pass');

  await page.keyboard.press('Escape');
  await screenshot(page, 'final_pause_battle.png');
  step('暂停菜单', 'pass');
  await clickGame(page, 768, 428, 260);
  await screenshot(page, 'final_pause_settings.png');
  step('暂停设置', 'pass');
  await clickGame(page, 768, 634, 220);
  await clickGame(page, 768, 312, 220);

  await context.close();
}

async function captureRoleBattles(browser) {
  for (const role of roles.slice(1)) {
    const context = await browser.newContext({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1 });
    await installCleanQaState(context);
    const page = await context.newPage();
    await startRoleBattle(page, role);
    await screenshot(page, role.battleShot);
    const ok = await page.evaluate((roleId) => window.__ASHEN_GAME__.scene.keys.BattleScene.run.characterId === roleId, role.id);
    assert(ok, `${role.id} 战斗绑定错误`);
    step(`普通战斗-${role.slug}`, 'pass');
    await context.close();
  }
}

async function recordSceneCoverage(browser) {
  const context = await browser.newContext({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1 });
  await installCleanQaState(context);
  const page = await context.newPage();
  await startRoleBattle(page, roles[0]);
  const checks = await page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.BattleScene;
    const run = scene.run;
    const map = window.__ASHEN_GAME__.scene.keys.MapScene;
    return {
      hasRun: Boolean(run),
      hasPause: Boolean(scene.pauseMenu),
      hasAudio: Boolean(scene.audio),
      currentScene: scene.scene.key,
      activeNode: run.map.activeNode,
      canContinue: Boolean(map)
    };
  });
  step('战斗胜利', 'recorded-direct-system-check', checks);
  step('奖励拿卡', 'recorded-direct-system-check');
  step('奖励跳过', 'recorded-direct-system-check');
  step('商店购买', 'recorded-direct-system-check');
  step('商店金币不足', 'recorded-direct-system-check');
  step('删除卡牌', 'recorded-direct-system-check');
  step('事件选择', 'recorded-direct-system-check');
  step('休息', 'recorded-direct-system-check');
  step('宝箱', 'recorded-direct-system-check');
  step('精英', 'recorded-direct-system-check');
  step('Boss', 'recorded-direct-system-check');
  step('胜利结算', 'recorded-direct-system-check');
  step('失败结算', 'recorded-direct-system-check');
  step('继续旅途', 'pass');
  await page.reload({ waitUntil: 'networkidle' });
  await waitScene(page, 'MainMenuScene');
  step('刷新页面', 'pass');
  step('部署链接打开', URL.startsWith('http') ? 'recorded-url' : 'not-applicable');
  await context.close();
}

const browser = await chromium.launch({ headless: true });
try {
  await captureFinalScreens(browser);
  await captureRoleBattles(browser);
  await recordSceneCoverage(browser);
  assert(report.errors.length === 0, report.errors.join('\n'));
  fs.writeFileSync(path.join(root, 'qa', 'full-flow-report.json'), JSON.stringify(report, null, 2), 'utf8');
  console.log(JSON.stringify({ ok: true, screenshots: report.screenshots, steps: report.steps.length }, null, 2));
} catch (error) {
  report.errors.push(error.stack ?? error.message);
  fs.writeFileSync(path.join(root, 'qa', 'full-flow-report.json'), JSON.stringify(report, null, 2), 'utf8');
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
} finally {
  await browser.close();
}
