import assert from 'node:assert/strict';
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

const URL = process.env.QA_URL ?? 'http://127.0.0.1:4185';
const root = process.cwd();
const outDir = path.join(root, 'qa', 'screenshots', 'responsive-v3');
fs.mkdirSync(outDir, { recursive: true });

const viewports = [
  { width: 1150, height: 768 },
  { width: 1171, height: 731 }
];
const errors = [];
const results = [];

async function waitScene(page, key) {
  await page.waitForFunction((sceneKey) => window.__ASHEN_GAME__?.scene?.getScenes(true).some((scene) => scene.scene.key === sceneKey), key);
}

async function waitCharacterCards(page) {
  await page.waitForFunction(() => {
    const cards = window.__ASHEN_GAME__?.scene?.keys?.CharacterSelectScene?.cards;
    return cards?.length === 3 && cards.every((card) => card.container.alpha >= 0.99 && Math.abs(card.container.y - card.baseY) < 0.5);
  });
}

for (const viewport of viewports) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  await context.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem(
      'ashen-pilgrimage-settings-v1',
      JSON.stringify({ sound: false, animation: true, fastMode: false, tutorialEnabled: true, tutorialSeen: false, storySeen: true })
    );
  });
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(`${viewport.width}x${viewport.height} pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('Asset load failed')) {
      errors.push(`${viewport.width}x${viewport.height} console: ${message.text()}`);
    }
  });

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('canvas');
  await page.waitForFunction(() => Boolean(window.__ASHEN_QA__));
  await waitScene(page, 'MainMenuScene');
  await page.evaluate(() => window.__ASHEN_QA__.startScene('CharacterSelectScene'));
  await waitScene(page, 'CharacterSelectScene');
  await waitCharacterCards(page);

  const selectState = await page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.CharacterSelectScene;
    const canvasRect = document.querySelector('canvas').getBoundingClientRect();
    return {
      selected: scene.selected,
      startDisabled: scene.startButton.disabled,
      heroTextures: scene.cards.map((card) => card.art.actorSprite?.texture?.key ?? null),
      heroFlipX: scene.cards.map((card) => card.art.actorSprite?.flipX ?? null),
      heroDisplayHeights: scene.cards.map((card) => card.art.actorSprite?.displayHeight ?? null),
      heroFootLines: scene.cards.map((card) => card.container.y + card.art.y + (card.art.actorSprite?.y ?? 0)),
      canvas: { x: canvasRect.x, y: canvasRect.y, width: canvasRect.width, height: canvasRect.height },
      scroll: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight }
    };
  });
  assert.equal(selectState.selected, 'exiled-knight');
  assert.equal(selectState.startDisabled, false);
  assert.deepEqual(selectState.heroTextures, [
    'pixel-actor-exiled-knight',
    'pixel-actor-candle-nun',
    'pixel-actor-ashblood-alchemist'
  ]);
  assert.deepEqual(selectState.heroFlipX, [false, false, false]);
  assert.deepEqual(selectState.heroDisplayHeights, [300, 300, 300]);
  assert.ok(
    Math.max(...selectState.heroFootLines) - Math.min(...selectState.heroFootLines) < 0.5,
    'character portrait foot baselines must remain visually identical'
  );
  assert.ok(selectState.canvas.x >= -0.5 && selectState.canvas.y >= -0.5);
  assert.ok(selectState.canvas.x + selectState.canvas.width <= viewport.width + 0.5);
  assert.ok(selectState.canvas.y + selectState.canvas.height <= viewport.height + 0.5);
  assert.ok(selectState.scroll.width <= viewport.width && selectState.scroll.height <= viewport.height);
  await page.screenshot({ path: path.join(outDir, `character-select-${viewport.width}x${viewport.height}.png`) });

  await page.evaluate(() => window.__ASHEN_QA__.startRun('ashblood-alchemist', { seed: 20260714, skipVow: true }));
  await waitScene(page, 'MapScene');
  await page.evaluate(() => window.__ASHEN_QA__.startScene('BattleScene', { battleType: 'battle' }));
  await waitScene(page, 'BattleScene');
  await page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.BattleScene;
    const enemy = scene.battle.enemies[0];
    Object.assign(enemy, {
      id: 'plague-rat-swarm',
      name: '瘟疫鼠群',
      hp: 26,
      maxHp: 26,
      block: 0,
      status: {},
      currentAction: { name: '撕咬', intent: 'attack', value: 9, text: '造成 9 点伤害。' }
    });
    scene.renderBattle();
    scene.showTutorial(0);
  });

  const battleState = await page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.BattleScene;
    const player = scene.playerView.artContainer.actorSprite;
    const enemy = scene.enemyViews.find(Boolean).artContainer.actorSprite;
    const tutorial = scene.tutorialPanel.getBounds();
    return {
      playerTexture: player.texture.key,
      enemyTexture: enemy.texture.key,
      playerFlipX: player.flipX,
      enemyFlipX: enemy.flipX,
      tutorial: { x: tutorial.x, y: tutorial.y, width: tutorial.width, height: tutorial.height }
    };
  });
  assert.equal(battleState.playerTexture, 'pixel-actor-ashblood-alchemist');
  assert.equal(battleState.enemyTexture, 'pixel-actor-plague-rat-swarm');
  assert.equal(battleState.playerFlipX, false, 'player source sprite must face right');
  assert.equal(battleState.enemyFlipX, false, 'normalized enemy source sprite must already face left');
  assert.ok(battleState.tutorial.x >= 0 && battleState.tutorial.y >= 0);
  assert.ok(battleState.tutorial.x + battleState.tutorial.width <= 1536);
  assert.ok(battleState.tutorial.y + battleState.tutorial.height <= 864);
  await page.screenshot({ path: path.join(outDir, `battle-rats-${viewport.width}x${viewport.height}.png`) });

  results.push({ viewport, selectState, battleState });
  await context.close();
  await browser.close();
}

assert.deepEqual(errors, []);
fs.writeFileSync(path.join(root, 'qa', 'responsive-facing-report.json'), `${JSON.stringify({ url: URL, results, errors }, null, 2)}\n`);
console.log(JSON.stringify({ ok: true, screenshots: outDir, viewports }, null, 2));
