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
  ?? 'http://127.0.0.1:4193/';
const report = { url, checks: [], errors: [] };

function assert(value, message) {
  if (!value) throw new Error(message);
}

async function waitScene(page, key) {
  await page.waitForFunction((sceneKey) => window.__ASHEN_GAME__?.scene?.keys?.[sceneKey]?.scene?.isActive(), key);
}

async function sceneState(page, key) {
  return page.evaluate((sceneKey) => {
    const scene = window.__ASHEN_GAME__.scene.keys[sceneKey];
    return {
      active: Boolean(scene?.scene?.isActive()),
      liveText: document.getElementById('ashen-live-region')?.textContent ?? '',
      actionLabels: [...(document.querySelectorAll('#ashen-scene-actions button') ?? [])].map((button) => button.textContent),
      actionScenes: [...(document.querySelectorAll('#ashen-scene-actions button') ?? [])].map((button) => button.dataset.scene)
    };
  }, key);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1 });
await context.addInitScript(() => {
  localStorage.clear();
  localStorage.setItem(
    'ashen-pilgrimage-settings-v1',
    JSON.stringify({ sound: false, music: false, muted: true, animation: false, fastMode: false, tutorialEnabled: false, tutorialSeen: true, storySeen: false })
  );
});
const page = await context.newPage();
page.on('pageerror', (error) => report.errors.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error') report.errors.push(`console: ${message.text()}`);
});

try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await waitScene(page, 'MainMenuScene');
  const menu = await sceneState(page, 'MainMenuScene');
  assert(menu.liveText.includes('开始新旅程'), 'main menu selection was not announced');
  assert(menu.actionLabels.includes('开始新旅程'), 'main menu semantic action is missing');
  assert(menu.actionScenes.every((scene) => scene === 'MainMenuScene'), 'main menu contains stale scene actions');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');

  await waitScene(page, 'PrologueScene');
  const prologueStart = await sceneState(page, 'PrologueScene');
  assert(prologueStart.liveText.includes('序章第 1 页'), 'prologue page was not announced');
  assert(prologueStart.actionLabels.includes('下一页'), 'prologue semantic next action is missing');
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(() => window.__ASHEN_GAME__.scene.keys.PrologueScene.pageIndex === 1);
  await page.keyboard.press('ArrowLeft');
  await page.waitForFunction(() => window.__ASHEN_GAME__.scene.keys.PrologueScene.pageIndex === 0);
  await page.keyboard.press('Escape');

  await waitScene(page, 'CharacterSelectScene');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await waitScene(page, 'VowScene');
  await page.evaluate(() => window.__ASHEN_QA__.chooseVow(0));

  await waitScene(page, 'MapScene');
  const map = await page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.MapScene;
    return {
      invalidHitIds: scene.nodeViews.filter((view) => !view.selectable && view.hit).map((view) => view.id),
      selectableWithoutHit: scene.nodeViews.filter((view) => view.selectable && !view.hit).map((view) => view.id),
      liveText: document.getElementById('ashen-live-region')?.textContent ?? '',
      actions: [...document.querySelectorAll('#ashen-scene-actions button')].map((button) => button.textContent)
    };
  });
  assert(map.invalidHitIds.length === 0, `locked/completed map nodes expose pointer zones: ${map.invalidHitIds.join(', ')}`);
  assert(map.selectableWithoutHit.length === 0, `selectable map nodes lack pointer zones: ${map.selectableWithoutHit.join(', ')}`);
  assert(map.liveText.includes('可选路线') || map.liveText.includes('已选择'), 'map route was not announced');
  assert(map.actions.length > 0, 'map semantic actions are missing');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => {
    const game = window.__ASHEN_GAME__;
    return Boolean(game.registry.get('run')?.map?.activeNode) && !game.scene.keys.MapScene.scene.isActive();
  });
  report.checks.push('keyboard-main-prologue-character-map');

  await page.setViewportSize({ width: 390, height: 844 });
  const portrait = await page.evaluate(() => {
    const overlay = document.getElementById('rotate-device');
    const canvas = document.querySelector('canvas');
    return {
      display: getComputedStyle(overlay).display,
      overlayPointer: getComputedStyle(overlay).pointerEvents,
      canvasPointer: getComputedStyle(canvas).pointerEvents,
      text: overlay.textContent.replace(/\s+/g, ' ').trim()
    };
  });
  assert(portrait.display === 'grid', '390x844 must display the rotate overlay');
  assert(portrait.overlayPointer === 'auto', 'portrait rotate overlay must intercept pointer input');
  assert(portrait.canvasPointer === 'none', 'portrait canvas must not receive pointer input');
  assert(portrait.text.includes('请旋转设备') && portrait.text.includes('横屏展开圣途'), 'rotate overlay copy is incomplete');

  await page.setViewportSize({ width: 844, height: 390 });
  const landscape = await page.evaluate(() => {
    const overlay = document.getElementById('rotate-device');
    const canvas = document.querySelector('canvas');
    return {
      display: getComputedStyle(overlay).display,
      canvasPointer: getComputedStyle(canvas).pointerEvents
    };
  });
  assert(landscape.display === 'none', '844x390 must hide the rotate overlay');
  assert(landscape.canvasPointer !== 'none', 'landscape canvas must restore pointer input');
  report.checks.push('portrait-overlay-and-landscape-recovery');

  assert(report.errors.length === 0, report.errors.join('\n'));
  console.log(JSON.stringify({ ok: true, ...report }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ ok: false, ...report, failure: error.message }, null, 2));
  throw error;
} finally {
  await context.close();
  await browser.close();
}
