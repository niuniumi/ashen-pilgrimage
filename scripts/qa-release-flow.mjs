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
const outDir = path.join(root, 'qa', 'screenshots', 'release');
fs.mkdirSync(outDir, { recursive: true });

const URL = process.env.QA_URL ?? process.argv.find((arg) => arg.startsWith('--url='))?.slice(6) ?? 'http://127.0.0.1:4173';
const report = { url: URL, generatedAt: new Date().toISOString(), screenshots: [], steps: [], errors: [] };

const roles = [
  { name: 'knight', id: 'exiled-knight', shot: 'battle_knight.png' },
  { name: 'nun', id: 'candle-nun', shot: 'battle_nun.png' },
  { name: 'alchemist', id: 'ashblood-alchemist', shot: 'battle_alchemist.png' }
];

function rel(file) {
  return path.relative(root, file).replaceAll('\\', '/');
}

function step(name, status, detail = {}) {
  report.steps.push({ name, status, detail });
}

function assert(value, message) {
  if (!value) throw new Error(message);
}

async function waitScene(page, sceneKey) {
  await page.waitForFunction((key) => window.__ASHEN_GAME__?.scene?.getScenes(true).some((scene) => scene.scene.key === key), sceneKey);
}

async function waitSceneSoft(page, sceneKey, timeout = 1600) {
  try {
    await page.waitForFunction((key) => window.__ASHEN_GAME__?.scene?.getScenes(true).some((scene) => scene.scene.key === key), sceneKey, {
      timeout
    });
    return true;
  } catch {
    return false;
  }
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

async function clickGame(page, x, y, delay = 260) {
  const p = await point(page, x, y);
  await page.mouse.move(p.x, p.y);
  await page.waitForTimeout(30);
  await page.mouse.click(p.x, p.y);
  await page.waitForTimeout(delay);
}

async function screenshot(page, name, delay = 220) {
  await page.waitForTimeout(delay);
  const file = path.join(outDir, name);
  await page.screenshot({ path: file });
  report.screenshots.push(rel(file));
}

async function completeActClear(page, targetScene) {
  await page.evaluate(() => window.__ASHEN_GAME__?.scene?.keys?.ActClearScene?.finish?.());
  if (targetScene === 'MapScene') {
    await waitScene(page, 'VowScene');
    await page.evaluate(() => window.__ASHEN_QA__.chooseVow(0));
  }
  await waitScene(page, targetScene);
}

async function closeTutorialIfOpen(page) {
  const open = await page.evaluate(() => Boolean(window.__ASHEN_GAME__?.scene?.keys?.BattleScene?.tutorialPanel));
  if (open) await clickGame(page, 858, 486, 220);
}

async function firstSelectableNode(page) {
  return page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.MapScene;
    const node = scene.nodeViews.find((item) => item.selectable) ?? scene.nodeViews[0];
    return { x: node.x, y: node.y, id: node.id };
  });
}

async function setStorySeen(context) {
  await context.addInitScript(() => {
    window.localStorage.setItem(
      'ashen-pilgrimage-settings-v1',
      JSON.stringify({ sound: true, animation: true, fastMode: false, tutorialEnabled: true, tutorialSeen: true, storySeen: true })
    );
  });
}

async function setupContext(browser, viewport = { width: 1536, height: 864 }, storySeen = false) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  await context.addInitScript(() => window.localStorage.clear());
  if (storySeen) await setStorySeen(context);
  return context;
}

async function startRole(page, role) {
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('canvas');
  await waitScene(page, 'MainMenuScene');
  await page.evaluate((characterId) => window.__ASHEN_QA__.startRun(characterId, {
    seed: 20260710,
    skipVow: true
  }), role.id);
  await waitScene(page, 'MapScene');
}

async function startBattleFromMap(page) {
  await page.evaluate(() => window.__ASHEN_QA__.enterNode());
  await waitScene(page, 'BattleScene');
  await closeTutorialIfOpen(page);
}

async function forceMapNode(page, type) {
  await page.evaluate((nodeType) => {
    const sceneMap = {
      event: 'EventScene',
      shop: 'ShopScene',
      rest: 'RestScene',
      chest: 'ChestScene',
      elite: 'BattleScene',
      boss: 'BossIntroScene'
    };
    const target = sceneMap[nodeType];
    window.__ASHEN_QA__.forceScene(target, nodeType);
  }, type);
}

async function captureMainFlow(browser) {
  const context = await setupContext(browser);
  const page = await context.newPage();
  page.on('pageerror', (error) => report.errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') report.errors.push(message.text());
  });

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('canvas');
  await waitScene(page, 'MainMenuScene');
  await screenshot(page, 'menu.png');
  step('主菜单', 'pass');

  await page.evaluate(() => window.__ASHEN_QA__.startScene('PrologueScene'));
  await waitScene(page, 'PrologueScene');
  await screenshot(page, 'prologue.png');
  step('序章', 'pass');
  await page.evaluate(() => window.__ASHEN_QA__.startScene('CharacterSelectScene'));
  await waitScene(page, 'CharacterSelectScene');
  await screenshot(page, 'character_select.png');
  step('角色选择', 'pass');

  await page.evaluate((characterId) => window.__ASHEN_QA__.startRun(characterId, {
    seed: 20260710,
    skipVow: false
  }), roles[0].id);
  await waitScene(page, 'VowScene');
  await screenshot(page, 'vow.png');
  step('誓约', 'pass');
  await page.evaluate(() => window.__ASHEN_QA__.chooseVow(0));
  await waitScene(page, 'MapScene');
  await screenshot(page, 'map.png');
  step('地图', 'pass');

  await startBattleFromMap(page);
  await screenshot(page, 'battle_knight.png');
  step('骑士战斗', 'pass');

  const attack = await page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.BattleScene;
    const view = scene.cardViews.find((card) => card.card.type === '攻击');
    return view ? { x: view.x, y: view.y } : null;
  });
  if (attack) {
    await clickGame(page, attack.x, attack.y, 160);
    const enemy = await page.evaluate(() => {
      const view = window.__ASHEN_GAME__.scene.keys.BattleScene.enemyViews.find(Boolean);
      return { x: view.x, y: view.y };
    });
    await clickGame(page, enemy.x, enemy.y, 440);
    step('攻击牌', 'pass');
  } else {
    step('攻击牌', 'skip-no-card');
  }

  const defense = await page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.BattleScene;
    const view = scene.cardViews.find((card) => card.card.type === '防御');
    return view ? { x: view.x, y: view.y } : null;
  });
  if (defense) {
    await clickGame(page, defense.x, defense.y, 380);
    step('防御牌', 'pass');
  } else {
    step('防御牌', 'skip-no-card');
  }

  await page.keyboard.press('Escape');
  await screenshot(page, 'pause_menu.png');
  step('暂停菜单', 'pass');
  await page.evaluate(() => window.__ASHEN_GAME__.scene.keys.BattleScene?.pauseMenu?.close?.());

  await page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.BattleScene;
    scene.battle.enemies.forEach((enemy) => {
      enemy.hp = 0;
    });
    scene.battle.ended = true;
    scene.battle.won = true;
    scene.finishIfNeeded();
  });
  await waitScene(page, 'RewardScene');
  await screenshot(page, 'reward.png');
  step('奖励', 'pass');
  await forceMapNode(page, 'event');
  await waitScene(page, 'EventScene');
  await screenshot(page, 'event.png');
  step('事件', 'pass');
  await forceMapNode(page, 'shop');
  await waitScene(page, 'ShopScene');
  await screenshot(page, 'shop.png');
  step('商店', 'pass');
  await forceMapNode(page, 'rest');
  await waitScene(page, 'RestScene');
  await screenshot(page, 'rest.png');
  step('休息', 'pass');
  await forceMapNode(page, 'chest');
  await waitScene(page, 'ChestScene');
  await screenshot(page, 'chest.png');
  step('宝箱', 'pass');
  await forceMapNode(page, 'elite');
  await waitScene(page, 'BattleScene');
  await closeTutorialIfOpen(page);
  step('精英战斗', 'pass');

  await forceMapNode(page, 'boss');
  await waitScene(page, 'BossIntroScene');
  await screenshot(page, 'boss_intro.png');
  step('Boss 登场', 'pass');
  await page.evaluate(() => window.__ASHEN_QA__.startScene('BattleScene', { battleType: 'boss' }));
  await waitScene(page, 'BattleScene');
  await screenshot(page, 'boss_battle.png', 1000);
  step('Boss 战', 'pass');

  await page.evaluate(() => {
    const game = window.__ASHEN_GAME__;
    for (const scene of game.scene.getScenes(true)) {
      if (scene.scene.key !== 'ActClearScene') game.scene.stop(scene.scene.key);
    }
    game.scene.start('ActClearScene');
  });
  await waitScene(page, 'ActClearScene');
  await screenshot(page, 'act_clear.png');
  step('通关演出', 'pass');
  await completeActClear(page, 'MapScene');
  await waitScene(page, 'MapScene');
  const act2 = await page.evaluate(() => window.__ASHEN_GAME__.registry.get('run')?.act);
  assert(act2 === 2, `expected act 2 after first chapter, got ${act2}`);
  await screenshot(page, 'act2_map.png');
  step('第二章地图', 'pass');

  await page.evaluate(() => {
    const game = window.__ASHEN_GAME__;
    for (const scene of game.scene.getScenes(true)) {
      if (scene.scene.key !== 'ActClearScene') game.scene.stop(scene.scene.key);
    }
    game.scene.start('ActClearScene');
  });
  await waitScene(page, 'ActClearScene');
  await screenshot(page, 'act2_clear.png');
  step('第二章通关演出', 'pass');
  await completeActClear(page, 'MapScene');
  await waitScene(page, 'MapScene');
  const act3 = await page.evaluate(() => window.__ASHEN_GAME__.registry.get('run')?.act);
  assert(act3 === 3, `expected act 3 after second chapter, got ${act3}`);
  await screenshot(page, 'act3_map.png');
  step('第三章地图', 'pass');

  await page.evaluate(() => {
    const game = window.__ASHEN_GAME__;
    const run = game.registry.get('run');
    run.act = 3;
    game.registry.set('run', run);
    for (const scene of game.scene.getScenes(true)) {
      if (scene.scene.key !== 'ActClearScene') game.scene.stop(scene.scene.key);
    }
    game.scene.start('ActClearScene');
  });
  await waitScene(page, 'ActClearScene');
  await screenshot(page, 'act3_clear.png');
  step('第三章通关演出', 'pass');
  await completeActClear(page, 'ResultScene');
  await waitScene(page, 'ResultScene');
  await screenshot(page, 'result_victory.png');
  step('胜利结算', 'pass');

  await page.evaluate(() => {
    const game = window.__ASHEN_GAME__;
    for (const scene of game.scene.getScenes(true)) {
      if (scene.scene.key !== 'ResultScene') game.scene.stop(scene.scene.key);
    }
    game.scene.start('ResultScene', { victory: false, run: game.registry.get('run') });
  });
  await waitScene(page, 'ResultScene');
  await screenshot(page, 'result_defeat.png');
  step('失败结算', 'pass');

  await page.evaluate(() => {
    const game = window.__ASHEN_GAME__;
    for (const scene of game.scene.getScenes(true)) {
      if (scene.scene.key !== 'CodexScene') game.scene.stop(scene.scene.key);
    }
    game.scene.start('CodexScene');
  });
  await waitScene(page, 'CodexScene');
  await screenshot(page, 'codex.png');
  step('图鉴', 'pass');

  await context.close();
}

async function captureRoleBattles(browser) {
  for (const role of roles.slice(1)) {
    const context = await setupContext(browser, { width: 1536, height: 864 }, true);
    const page = await context.newPage();
    await startRole(page, role);
    await startBattleFromMap(page);
    await screenshot(page, role.shot);
    step(`${role.name} 战斗`, 'pass');
    await context.close();
  }
}

async function captureResponsive(browser) {
  for (const viewport of [
    { width: 1920, height: 1080 },
    { width: 1536, height: 864 },
    { width: 1366, height: 768 },
    { width: 1280, height: 720 }
  ]) {
    const context = await setupContext(browser, viewport, true);
    const page = await context.newPage();
    await startRole(page, roles[0]);
    await screenshot(page, `responsive_${viewport.width}x${viewport.height}_map.png`);
    await startBattleFromMap(page);
    await screenshot(page, `responsive_${viewport.width}x${viewport.height}_battle.png`);
    step(`响应式 ${viewport.width}x${viewport.height}`, 'pass');
    await context.close();
  }
}

const browser = await chromium.launch({ headless: true });
try {
  await captureMainFlow(browser);
  await captureRoleBattles(browser);
  await captureResponsive(browser);
  assert(report.errors.length === 0, report.errors.join('\n'));
  fs.writeFileSync(path.join(root, 'qa', 'release-flow-report.json'), JSON.stringify(report, null, 2), 'utf8');
  console.log(JSON.stringify({ ok: true, screenshots: report.screenshots.length, steps: report.steps.length }, null, 2));
} catch (error) {
  report.errors.push(error.stack ?? error.message);
  fs.writeFileSync(path.join(root, 'qa', 'release-flow-report.json'), JSON.stringify(report, null, 2), 'utf8');
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
} finally {
  await browser.close();
}
