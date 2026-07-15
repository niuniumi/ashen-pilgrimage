import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
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
  return file;
}

const RESULT_REGION_NAMES = ['result-figure', 'result-narrative', 'result-stats', 'result-deck', 'result-actions'];

function overlaps(a, b, gap = 0) {
  return !(
    a.right + gap <= b.left ||
    b.right + gap <= a.left ||
    a.bottom + gap <= b.top ||
    b.bottom + gap <= a.top
  );
}

async function resultLayoutSnapshot(page) {
  return page.evaluate((regionNames) => {
    const scene = window.__ASHEN_GAME__?.scene?.keys?.ResultScene;
    const regions = Object.fromEntries(regionNames.map((name) => {
      const region = scene?.children?.getByName(name);
      if (!region) return [name, null];
      const bounds = region.getBounds();
      return [name, {
        left: bounds.left,
        top: bounds.top,
        right: bounds.right,
        bottom: bounds.bottom,
        width: bounds.width,
        height: bounds.height
      }];
    }));
    const tombstone = scene?.children?.getByName('defeat-tombstone-art');
    return {
      regions,
      tombstone: tombstone ? {
        sourceWidth: tombstone.width,
        sourceHeight: tombstone.height,
        displayWidth: tombstone.displayWidth,
        displayHeight: tombstone.displayHeight
      } : null
    };
  }, RESULT_REGION_NAMES);
}

function assertResultLayout(snapshot, label, victory) {
  for (const name of RESULT_REGION_NAMES) {
    const region = snapshot.regions[name];
    assert(region, `${label}: missing named result region ${name}`);
    assert(region.width > 0 && region.height > 0, `${label}: ${name} must have stable dimensions`);
    assert(region.left >= 0 && region.top >= 0 && region.right <= 1536 && region.bottom <= 864, `${label}: ${name} escapes the game canvas`);
  }

  const figure = snapshot.regions['result-figure'];
  const narrative = snapshot.regions['result-narrative'];
  const stats = snapshot.regions['result-stats'];
  const deck = snapshot.regions['result-deck'];
  const actions = snapshot.regions['result-actions'];
  assert(!overlaps(figure, narrative), `${label}: figure overlaps narrative`);
  assert(!overlaps(figure, stats), `${label}: figure overlaps statistics`);
  assert(!overlaps(figure, deck), `${label}: figure overlaps deck`);
  assert(!overlaps(narrative, stats), `${label}: narrative overlaps statistics`);
  assert(!overlaps(narrative, deck), `${label}: narrative overlaps deck`);
  assert(!overlaps(stats, deck), `${label}: statistics overlaps deck`);
  assert(!overlaps(actions, stats), `${label}: actions overlaps statistics`);
  assert(!overlaps(actions, deck), `${label}: actions overlaps deck`);

  if (!victory) {
    assert(snapshot.tombstone, `${label}: defeat tombstone is not rendered`);
    const sourceRatio = snapshot.tombstone.sourceWidth / snapshot.tombstone.sourceHeight;
    const displayRatio = snapshot.tombstone.displayWidth / snapshot.tombstone.displayHeight;
    assert(Math.abs(sourceRatio - displayRatio) < 0.002, `${label}: defeat tombstone aspect ratio is distorted`);
  }
}

function inspectDefeatPalette(file) {
  const program = String.raw`
import json
import sys
from PIL import Image

image = Image.open(sys.argv[1]).convert("RGB")
pixels = list(image.getdata())
green = sum(1 for red, value, blue in pixels if value >= 48 and value > red * 1.18 and value > blue * 1.08)
print(json.dumps({"pixels": len(pixels), "greenDominant": green, "ratio": green / max(1, len(pixels))}))
`;
  const candidates = [
    { command: process.env.PYTHON ?? 'python', args: [] },
    { command: 'py', args: ['-3'] }
  ];
  const failures = [];
  for (const candidate of candidates) {
    const result = spawnSync(candidate.command, [...candidate.args, '-c', program, file], {
      encoding: 'utf8',
      windowsHide: true
    });
    if (!result.error && result.status === 0) return JSON.parse(result.stdout.trim());
    failures.push(result.error?.message ?? result.stderr.trim() ?? `exit ${result.status}`);
  }
  throw new Error(`unable to inspect defeat palette: ${failures.join('; ')}`);
}

async function startResult(page, victory, animation) {
  await page.evaluate(() => window.__ASHEN_QA__.startRun('exiled-knight', { seed: 20260710, skipVow: true }));
  await waitScene(page, 'MapScene');
  await page.evaluate(({ isVictory, motionEnabled }) => {
    const settingsKey = 'ashen-pilgrimage-settings-v1';
    const settings = JSON.parse(window.localStorage.getItem(settingsKey) ?? '{}');
    window.localStorage.setItem(settingsKey, JSON.stringify({ ...settings, sound: false, animation: motionEnabled }));
    const run = window.__ASHEN_GAME__.registry.get('run');
    run.id = `qa-result-${isVictory ? 'victory' : 'defeat'}-${motionEnabled ? 'motion' : 'still'}`;
    run.characterName = '流亡骑士';
    run.act = 3;
    run.floor = 12;
    run.highestFloor = 312;
    run.kills = 41;
    run.gold = 187;
    run.startTime = Date.now() - 734_000;
    run.endTime = Date.now();
    run.relics = ['iron-rosary', 'pilgrim-bell', 'wax-seal'];
    run.vows = ['vow-embers', 'vow-iron'];
    const cardIds = [
      'knight-cleave', 'knight-cleave', 'knight-cleave', 'knight-block', 'knight-rend',
      'common-bandage', 'common-crossbow', 'common-old-shield', 'common-torch-swing',
      'common-ash-dodge', 'common-field-ration', 'common-smoke-bomb', 'common-grave-salt'
    ];
    run.deck = cardIds.map((cardId, index) => ({
      uid: `qa-result-card-${index}`,
      cardId,
      upgraded: index === 2 || index === 8
    }));
    window.__ASHEN_QA__.startScene('ResultScene', { victory: isVictory, run });
  }, { isVictory: victory, motionEnabled: animation });
  await waitScene(page, 'ResultScene');
  await clickGame(page, 676, 682, 80);
  await page.evaluate(() => document.activeElement?.blur());
  await page.waitForTimeout(animation ? 850 : 120);
}

async function captureResultViewport(browser, victory, width, height, animation = true) {
  const { context, page } = await setupPage(browser, { width, height });
  const label = `${victory ? 'victory' : 'defeat'} ${width}x${height}`;
  try {
    await startResult(page, victory, animation);
    const snapshot = await resultLayoutSnapshot(page);
    assertResultLayout(snapshot, label, victory);
    const file = await screenshot(page, `result_${victory ? 'victory' : 'defeat'}_${width}x${height}.png`);
    if (!victory) {
      const palette = inspectDefeatPalette(file);
      report[`defeatPalette${width}x${height}`] = palette;
      assert(palette.ratio <= 0.0005, `${label}: rendered palette contains ${palette.greenDominant} green-dominant pixels`);
    }
    if (!animation) {
      const motionState = await page.evaluate(() => {
        const scene = window.__ASHEN_GAME__?.scene?.keys?.ResultScene;
        return { enabled: scene?.motionEnabled, tweenCount: scene?.tweens?.getTweens()?.length ?? -1 };
      });
      assert(motionState.enabled === false, `${label}: result scene ignored the disabled animation setting`);
      assert(motionState.tweenCount === 0, `${label}: result scene owns active tweens while animation is disabled`);
    }
    return snapshot;
  } finally {
    await context.close();
  }
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
    const resultSnapshots = [
      await captureResultViewport(browser, true, 1536, 864),
      await captureResultViewport(browser, false, 1536, 864),
      await captureResultViewport(browser, true, 1280, 720),
      await captureResultViewport(browser, false, 1280, 720, false)
    ];
    const [reference, ...comparisons] = resultSnapshots;
    for (const snapshot of comparisons) {
      assert(snapshot.regions['result-actions'].left === reference.regions['result-actions'].left, 'result actions shift horizontally between outcomes or viewports');
      assert(snapshot.regions['result-actions'].top === reference.regions['result-actions'].top, 'result actions shift vertically between outcomes or viewports');
      assert(snapshot.regions['result-stats'].top === reference.regions['result-stats'].top, 'result statistics shift with outcome, viewport, or deck length');
    }
  } finally {
    await browser.close();
  }

  assert(report.errors.length === 0, report.errors.join('\n'));
  assert(report.screenshots.length >= 18, 'expected at least 18 screenshots');
  fs.writeFileSync(path.join(root, 'qa', 'product-upgrade-scenes-report.json'), JSON.stringify(report, null, 2), 'utf8');
  console.log(JSON.stringify({ ok: true, screenshots: report.screenshots.length }, null, 2));
} catch (error) {
  report.errors.push(error.stack ?? error.message);
  fs.writeFileSync(path.join(root, 'qa', 'product-upgrade-scenes-report.json'), JSON.stringify(report, null, 2), 'utf8');
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
}
