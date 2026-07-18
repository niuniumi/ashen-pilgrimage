import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { enemies } from '../src/data/enemies.js';
import { resolvePixelActorAsset } from '../src/art/PixelAssetCatalog.js';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  ({ chromium } = require('C:/Users/16224/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/playwright@1.61.0/node_modules/playwright'));
}

const root = process.cwd();
const url = process.env.QA_URL
  ?? process.argv.find((arg) => arg.startsWith('--url='))?.slice(6)
  ?? 'http://127.0.0.1:4173/';
const outputDir = path.join(root, 'qa', 'screenshots', 'actor-roster');
const reportPath = path.join(root, 'qa', 'actor-roster-report.json');
const report = { url, actors: [], errors: [] };

function assert(value, message) {
  if (!value) throw new Error(message);
}

async function waitScene(page, key) {
  await page.waitForFunction((sceneKey) => window.__ASHEN_GAME__?.scene?.keys?.[sceneKey]?.scene?.isActive(), key);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1 });
await context.addInitScript(() => {
  localStorage.clear();
  localStorage.setItem(
    'ashen-pilgrimage-settings-v1',
    JSON.stringify({ sound: false, music: false, muted: true, animation: false, fastMode: true, tutorialEnabled: false, tutorialSeen: true, storySeen: true })
  );
});
const page = await context.newPage();
page.on('pageerror', (error) => report.errors.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error') report.errors.push(`console: ${message.text()}`);
});

try {
  fs.mkdirSync(outputDir, { recursive: true });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await waitScene(page, 'MainMenuScene');
  await page.evaluate(() => window.__ASHEN_QA__.startRun('exiled-knight', { seed: 20260714, skipVow: true }));
  await waitScene(page, 'MapScene');
  await page.evaluate(() => window.__ASHEN_QA__.enterNode());
  await waitScene(page, 'BattleScene');

  const rosterAssets = [...new Map(enemies.map((definition) => {
    const resolved = resolvePixelActorAsset(definition.id);
    return [resolved.asset.key, { key: resolved.asset.key, url: resolved.asset.url }];
  })).values()];
  const preload = await page.evaluate(async (assets) => {
    const scene = window.__ASHEN_GAME__.scene.keys.BattleScene;
    const pending = assets.filter((asset) => !scene.textures.exists(asset.key));
    if (pending.length === 0) return { queued: 0, failures: [] };
    const failures = [];
    await new Promise((resolve) => {
      const onError = (file) => failures.push(file?.key ?? 'unknown');
      scene.load.on('loaderror', onError);
      scene.load.once('complete', () => {
        scene.load.off('loaderror', onError);
        resolve();
      });
      for (const asset of pending) scene.load.image(asset.key, asset.url);
      scene.load.start();
    });
    return { queued: pending.length, failures };
  }, rosterAssets);
  assert(preload.failures.length === 0, `roster preload failed: ${preload.failures.join(', ')}`);

  for (const [index, definition] of enemies.entries()) {
    const resolved = resolvePixelActorAsset(definition.id);
    const expectedFlipX = resolved.asset.facing !== 'left';
    const observed = await page.evaluate(({ id, name, type }) => {
      const scene = window.__ASHEN_GAME__.scene.keys.BattleScene;
      const enemy = scene.battle.enemies[0];
      scene.battle.enemies = [enemy];
      Object.assign(enemy, {
        id,
        name,
        type,
        hp: Math.max(1, enemy.hp),
        maxHp: Math.max(1, enemy.maxHp),
        block: 0,
        status: {}
      });
      scene.renderBattle();
      const actor = scene.enemyViews[0]?.artContainer?.actorSprite;
      return {
        assetId: actor?.getData('assetId') ?? null,
        enemyId: actor?.getData('enemyId') ?? null,
        flipX: actor?.flipX ?? null,
        width: actor?.displayWidth ?? 0,
        height: actor?.displayHeight ?? 0
      };
    }, { id: definition.id, name: definition.name, type: definition.type });
    assert(observed.assetId === resolved.assetId, `${definition.id} rendered ${observed.assetId}`);
    assert(observed.enemyId === definition.id, `${definition.id} lost its semantic enemy id`);
    assert(observed.flipX === expectedFlipX, `${definition.id} flipX ${observed.flipX}, expected ${expectedFlipX}`);
    assert(observed.width > 20 && observed.height > 20, `${definition.id} rendered blank or undersized`);

    const file = path.join(outputDir, `${String(index + 1).padStart(2, '0')}-${definition.id}.png`);
    await page.screenshot({ path: file, clip: { x: 500, y: 92, width: 650, height: 590 } });
    report.actors.push({ id: definition.id, name: definition.name, expectedFlipX, ...observed, screenshot: path.relative(root, file).replaceAll('\\', '/') });
  }

  assert(report.errors.length === 0, report.errors.join('\n'));
  fs.writeFileSync(reportPath, JSON.stringify({ ok: true, ...report }, null, 2), 'utf8');
  console.log(JSON.stringify({ ok: true, actors: report.actors.length }, null, 2));
} catch (error) {
  fs.writeFileSync(reportPath, JSON.stringify({ ok: false, ...report, failure: error.stack ?? error.message }, null, 2), 'utf8');
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
} finally {
  await context.close();
  await browser.close();
}
