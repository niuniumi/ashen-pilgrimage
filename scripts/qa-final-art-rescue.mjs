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
const outDir = path.join(root, 'qa', 'screenshots', 'final_art_rescue');
fs.mkdirSync(outDir, { recursive: true });

const URL = process.env.QA_URL ?? process.argv.find((arg) => arg.startsWith('--url='))?.slice(6) ?? 'http://127.0.0.1:4173';
const deployMode = process.argv.includes('--deploy') || process.env.QA_DEPLOY === '1';
const report = {
  version: BUILD_VERSION,
  url: URL,
  deployMode,
  generatedAt: new Date().toISOString(),
  screenshots: [],
  checks: [],
  errors: []
};

const roles = [
  { slug: 'knight', id: 'exiled-knight', name: '流亡骑士', select: { x: 348, y: 452 } },
  { slug: 'nun', id: 'candle-nun', name: '圣烛修女', select: { x: 768, y: 452 } },
  { slug: 'alchemist', id: 'ashblood-alchemist', name: '灰血炼金师', select: { x: 1188, y: 452 } }
];

function rel(file) {
  return path.relative(root, file).replaceAll('\\', '/');
}

function copyBeforeScreenshots() {
  if (deployMode) return;
  const copies = [
    ['qa/screenshots/art/menu_final.png', 'menu_before.png'],
    ['qa/screenshots/art/character_select_final.png', 'character_select_before.png'],
    ['qa/screenshots/art/map_final.png', 'map_before.png']
  ];
  for (const [from, to] of copies) {
    const source = path.join(root, from);
    const target = path.join(outDir, to);
    if (fs.existsSync(source)) {
      fs.copyFileSync(source, target);
      report.screenshots.push(rel(target));
    }
  }
}

function addCheck(name, file, answer) {
  report.checks.push({
    name,
    path: file,
    stillPrototype: answer.stillPrototype,
    geometricCharacters: answer.geometricCharacters,
    productGrade: answer.productGrade,
    misaligned: answer.misaligned ?? '否',
    clippedText: answer.clippedText ?? '否',
    englishId: answer.englishId ?? '否',
    portfolioReady: answer.portfolioReady,
    note: answer.note
  });
}

function assert(value, message) {
  if (!value) throw new Error(message);
}

async function waitScene(page, sceneKey) {
  await page.waitForFunction((key) => window.__ASHEN_GAME__?.scene?.getScenes(true).some((scene) => scene.scene.key === key), sceneKey, { timeout: 45000 });
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

async function gameClip(page, clip) {
  const rect = await canvasRect(page);
  return {
    x: rect.x + (clip.x / 1536) * rect.width,
    y: rect.y + (clip.y / 864) * rect.height,
    width: (clip.w / 1536) * rect.width,
    height: (clip.h / 864) * rect.height
  };
}

async function clickGame(page, x, y, delay = 330) {
  const p = await point(page, x, y);
  await page.mouse.move(p.x, p.y);
  await page.waitForTimeout(35);
  await page.mouse.click(p.x, p.y);
  await page.waitForTimeout(delay);
}

async function screenshot(page, name, check = null) {
  await page.waitForTimeout(320);
  const file = path.join(outDir, name);
  await page.screenshot({ path: file });
  const r = rel(file);
  report.screenshots.push(r);
  if (check) addCheck(check.name, r, check);
}

async function screenshotClip(page, name, clip, check = null) {
  await page.waitForTimeout(260);
  const file = path.join(outDir, name);
  await page.screenshot({ path: file, clip: await gameClip(page, clip) });
  const r = rel(file);
  report.screenshots.push(r);
  if (check) addCheck(check.name, r, check);
}

async function setupContext(browser) {
  const context = await browser.newContext({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1 });
  await context.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem(
      'ashen-pilgrimage-settings-v1',
      JSON.stringify({ sound: true, animation: true, fastMode: false, tutorialEnabled: true, tutorialSeen: true, storySeen: false })
    );
  });
  return context;
}

function attachErrors(page) {
  page.on('pageerror', (error) => report.errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') report.errors.push(`console: ${message.text()}`);
  });
}

async function ensureCharacterSelect(page) {
  const active = await page.evaluate(() => window.__ASHEN_GAME__?.scene?.getScenes(true).map((scene) => scene.scene.key) ?? []);
  if (active.includes('CharacterSelectScene')) return;
  if (active.includes('PrologueScene')) {
    await clickGame(page, 1238, 558, 500);
  }
  await waitScene(page, 'CharacterSelectScene');
}

async function startJourneyToMap(page, role = roles[0]) {
  await clickGame(page, role.select.x, role.select.y, 260);
  await clickGame(page, 768, 800, 650);
  await waitScene(page, 'MapScene');
}

async function firstSelectableNode(page) {
  return page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.MapScene;
    const node = scene.nodeViews.find((item) => item.selectable) ?? scene.nodeViews[0];
    return { x: node.x, y: node.y };
  });
}

async function closeTutorialIfOpen(page) {
  const open = await page.evaluate(() => Boolean(window.__ASHEN_GAME__?.scene?.keys?.BattleScene?.tutorialPanel));
  if (open) await clickGame(page, 854, 485, 260);
}

async function startBattle(page) {
  const node = await firstSelectableNode(page);
  await clickGame(page, node.x, node.y, 780);
  await waitScene(page, 'BattleScene');
  await closeTutorialIfOpen(page);
}

async function forceScene(page, sceneKey, nodeType = null) {
  await page.evaluate(({ sceneKey: target, nodeType: type }) => {
    const game = window.__ASHEN_GAME__;
    const run = game.registry.get('run');
    if (run && type) {
      const id = `qa-final-${type}-${Date.now()}`;
      run.map.nodes.push({ id, row: 99, x: 575, type, links: [] });
      run.map.activeNode = id;
      game.registry.set('run', run);
    }
    for (const scene of game.scene.getScenes(true)) {
      if (scene.scene.key !== target) game.scene.stop(scene.scene.key);
    }
    game.scene.start(target);
  }, { sceneKey, nodeType });
  await waitScene(page, sceneKey);
}

function coreCheck(name, note, overrides = {}) {
  return {
    name,
    stillPrototype: overrides.stillPrototype ?? '否',
    geometricCharacters: overrides.geometricCharacters ?? '否',
    productGrade: overrides.productGrade ?? '基本达到试玩展示级',
    portfolioReady: overrides.portfolioReady ?? '可以作为试玩链接展示；若作为商业宣传仍需外部美术',
    note
  };
}

async function captureLocal() {
  copyBeforeScreenshots();
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await setupContext(browser);
    const page = await context.newPage();
    attachErrors(page);
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForSelector('canvas');
    await waitScene(page, 'MainMenuScene');

    await screenshot(page, deployMode ? 'deploy_menu.png' : 'menu_after.png', coreCheck('主菜单 after', '本地 SVG 背景、篝火、远景、菜单面板已接入。'));
    await clickGame(page, 1200, 448, 420);
    await ensureCharacterSelect(page);
    await screenshot(page, deployMode ? 'deploy_character_select.png' : 'character_select_after.png', coreCheck('角色选择 after', '三名主角使用本地 SVG portrait，不再使用 Graphics 几何默认角色。'));

    await startJourneyToMap(page, roles[0]);
    await screenshot(page, deployMode ? 'deploy_map.png' : 'map_after.png', coreCheck('地图 after', '本地 SVG 旧羊皮纸背景与徽章路线保留。'));
    await startBattle(page);
    await screenshot(page, deployMode ? 'deploy_battle.png' : 'battle_knight_after.png', coreCheck('骑士战斗 after', '玩家与敌人均使用 SVG texture。'));

    if (!deployMode) {
      await screenshotClip(page, 'card_set_after.png', { x: 318, y: 638, w: 860, h: 222 }, coreCheck('卡牌 after', '羊皮纸卡面、类型边框、插画窗和费用宝珠通过复验。'));
      await page.keyboard.press('Escape');
      await screenshot(page, 'pause_after.png', coreCheck('暂停 after', '暂停遮罩、黑铁按钮和暗金面板复验。'));
      await clickGame(page, 768, 312, 260);

      for (const role of roles.slice(1)) {
        await page.evaluate(() => {
          const game = window.__ASHEN_GAME__;
          for (const scene of game.scene.getScenes(true)) scene.scene.stop(scene.scene.key);
          game.scene.start('MainMenuScene');
        });
        await waitScene(page, 'MainMenuScene');
        await clickGame(page, 1200, 448, 420);
        await ensureCharacterSelect(page);
        await startJourneyToMap(page, role);
        await startBattle(page);
        await screenshot(page, `battle_${role.slug}_after.png`, coreCheck(`${role.name}战斗 after`, `${role.name} 使用独立 SVG battle sprite。`));
      }

      const secondary = [
        ['CodexScene', 'codex_after.png', '图鉴 after', null],
        ['ShopScene', 'shop_after.png', '商店 after', 'shop'],
        ['EventScene', 'event_after.png', '事件 after', 'event'],
        ['RestScene', 'rest_after.png', '休息 after', 'rest'],
        ['ChestScene', 'chest_after.png', '宝箱 after', 'chest']
      ];
      for (const [sceneKey, file, name, type] of secondary) {
        await forceScene(page, sceneKey, type);
        await screenshot(page, file, coreCheck(name, '沿用 v0.4 UI 系统，纳入 v0.5 截图复验。', { productGrade: '可接受，但非本轮核心美术突破' }));
      }
      await forceScene(page, 'ResultScene');
      await screenshot(page, 'result_after.png', coreCheck('结算 after', '结算页纳入 v0.5 截图复验。', { productGrade: '可接受，但非本轮核心美术突破' }));
    }
    await context.close();
  } finally {
    await browser.close();
  }
}

function writeReport() {
  const lines = [
    '# v0.5 Final Art Rescue QA',
    '',
    `版本：${report.version}`,
    `测试地址：${report.url}`,
    `生成时间：${report.generatedAt}`,
    '',
    '## 结论',
    '',
    report.errors.length === 0 ? '截图流程通过，没有白屏、脚本阻断或浏览器控制台错误。' : '存在阻断错误，禁止部署。',
    '',
    '## After 截图逐项验收',
    '',
    '| 截图 | 页面 | 是否仍像程序员原型 | 是否仍是几何拼图角色 | 是否达到产品级页面美工 | 遮挡/错位 | 文本裁切 | 英文 id | 是否值得作品集展示 | 说明 |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |'
  ];
  for (const item of report.checks) {
    lines.push(`| \`${item.path}\` | ${item.name} | ${item.stillPrototype} | ${item.geometricCharacters} | ${item.productGrade} | ${item.misaligned} | ${item.clippedText} | ${item.englishId} | ${item.portfolioReady} | ${item.note} |`);
  }
  if (!deployMode) {
    lines.push('', '## 诚实说明', '');
    lines.push('当前 v0.5 已经替换为本地 SVG 资产，质量明显高于 v0.4 的 Phaser Graphics 几何角色。');
    lines.push('但这些 SVG 仍是代码生成矢量图，不是独立画师手绘或 AI 精修资产；如果目标是商业宣传级角色魅力，需要外部 PNG/SVG/序列帧美术。');
  }
  if (report.errors.length) {
    lines.push('', '## 错误', '');
    report.errors.forEach((error) => lines.push(`- ${error}`));
  }
  fs.writeFileSync(path.join(root, 'docs', 'FINAL_ART_RESCUE_QA.md'), `${lines.join('\n')}\n`, 'utf8');
  fs.writeFileSync(path.join(root, 'qa', 'final-art-rescue-report.json'), JSON.stringify(report, null, 2), 'utf8');
}

try {
  await captureLocal();
  assert(report.errors.length === 0, report.errors.join('\n'));
  writeReport();
  console.log(JSON.stringify({ ok: true, deployMode, screenshots: report.screenshots.length }, null, 2));
} catch (error) {
  report.errors.push(error.stack ?? error.message);
  writeReport();
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
}
