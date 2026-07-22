import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const inlineUrl = process.argv.find((argument) => argument.startsWith('--url='))?.slice('--url='.length);
const urlFlagIndex = process.argv.indexOf('--url');
const url = process.env.QA_URL
  ?? inlineUrl
  ?? (urlFlagIndex >= 0 ? process.argv[urlFlagIndex + 1] : null)
  ?? 'http://127.0.0.1:4193/';
const outputDir = path.resolve('qa', 'screenshots', 'v2.4');
await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const errors = [];

async function startCharacterSelect(page) {
  await page.evaluate(() => window.__ASHEN_QA__.startScene('CharacterSelectScene'));
  await page.waitForFunction(() => {
    const game = window.__ASHEN_GAME__;
    const scene = game?.scene?.keys?.CharacterSelectScene;
    return scene?.scene?.isActive()
      && scene?.cards?.length === 3
      && scene.cards.every((card) => card.container.alpha >= 0.99 && Math.abs(card.container.y - card.baseY) < 0.5);
  });
}

async function captureImmediateSelection() {
  const viewport = { width: 1536, height: 864 };
  const name = 'character-select-immediate-third';
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  await context.addInitScript(() => window.localStorage.clear());
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForSelector('canvas');
  await page.evaluate(() => window.__ASHEN_QA__.startScene('CharacterSelectScene'));
  await page.waitForFunction(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.CharacterSelectScene;
    return scene?.scene?.isActive() && scene.cards?.length === 3 && Boolean(scene.characterInput);
  });
  const immediate = await page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.CharacterSelectScene;
    scene.characterInput.handleKey('Digit3');
    return {
      selected: scene.selected,
      alphasAtSelection: scene.cards.map((card) => card.container.alpha)
    };
  });
  await page.waitForTimeout(600);
  const settled = await page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.CharacterSelectScene;
    return {
      selected: scene.selected,
      cards: scene.cards.map((card) => ({
        id: card.character.id,
        alpha: card.container.alpha,
        visible: card.container.visible,
        x: card.container.x,
        y: card.container.y
      }))
    };
  });
  const screenshot = path.join(outputDir, `${name}.png`);
  await page.screenshot({ path: screenshot });
  assert.equal(settled.selected, 'ashblood-alchemist', `${name}: immediate input did not select the third character`);
  assert.ok(
    settled.cards.every((card) => card.visible && card.alpha >= 0.99),
    `${name}: immediate selection left a character card invisible: ${JSON.stringify({ immediate, settled })}`
  );
  await context.close();
  return { name, viewport, immediate, settled, screenshot: path.relative(process.cwd(), screenshot).replaceAll('\\', '/') };
}

async function capture(viewport, name, keyboardSteps = 0) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  await context.addInitScript(() => window.localStorage.clear());
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForSelector('canvas');
  await startCharacterSelect(page);
  for (let index = 0; index < keyboardSteps; index += 1) await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(240);

  const state = await page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.CharacterSelectScene;
    return {
      selected: scene.selected,
      metrics: scene.cards.map((card) => ({
        id: card.character.id,
        selected: card.character.id === scene.selected,
        displayWidth: card.art.actorSprite.displayWidth,
        displayHeight: card.art.actorSprite.displayHeight,
        footY: card.container.y + card.art.y + card.art.actorSprite.y,
        artAlpha: card.art.alpha,
        cardScale: card.container.scaleX
      }))
    };
  });
  const { metrics } = state;

  const heights = metrics.map((metric) => metric.displayHeight);
  const footLines = metrics.map((metric) => metric.footY);
  assert.equal(Math.max(...heights) - Math.min(...heights), 0, `${name}: portrait height drifted`);
  assert.equal(Math.max(...footLines) - Math.min(...footLines), 0, `${name}: foot baseline drifted`);
  assert.ok(metrics.every((metric) => metric.cardScale === 1), `${name}: selection changed portrait scale`);
  const expectedSelection = keyboardSteps === 2 ? 'ashblood-alchemist' : 'exiled-knight';
  assert.equal(state.selected, expectedSelection, `${name}: keyboard selection drifted`);

  const screenshot = path.join(outputDir, `${name}.png`);
  await page.screenshot({ path: screenshot });

  let lifecycle = null;
  if (keyboardSteps === 2) {
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => window.__ASHEN_GAME__?.scene?.isActive('MainMenuScene'));
    await startCharacterSelect(page);
    lifecycle = await page.evaluate(() => {
      const scene = window.__ASHEN_GAME__.scene.keys.CharacterSelectScene;
      return {
        selected: scene.selected,
        runStarting: scene.runStarting,
        controllerLocked: scene.characterInput?.locked,
        controllerDestroyed: scene.characterInput?.destroyed
      };
    });
    assert.deepEqual(lifecycle, {
      selected: 'exiled-knight',
      runStarting: false,
      controllerLocked: false,
      controllerDestroyed: false
    });
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__ASHEN_GAME__?.scene?.isActive('VowScene'));
  }

  await context.close();
  return { name, viewport, selected: state.selected, metrics, lifecycle, screenshot: path.relative(process.cwd(), screenshot).replaceAll('\\', '/') };
}

let captures;
try {
  captures = [
    await captureImmediateSelection(),
    await capture({ width: 1280, height: 720 }, 'character-select-1280'),
    await capture({ width: 1366, height: 768 }, 'character-select-1366'),
    await capture({ width: 1536, height: 864 }, 'character-select-1536'),
    await capture({ width: 1536, height: 864 }, 'character-select-keyboard-third', 2),
    await capture({ width: 1920, height: 1080 }, 'character-select-1920')
  ];
} finally {
  await browser.close();
}
assert.deepEqual(errors, []);
console.log(JSON.stringify({ url, captures, errors }, null, 2));
