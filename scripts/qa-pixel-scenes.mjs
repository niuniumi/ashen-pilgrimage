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
const url = process.env.QA_URL
  ?? process.argv.find((arg) => arg.startsWith('--url='))?.slice(6)
  ?? 'http://127.0.0.1:4173/';
const outDir = path.join(root, 'qa', 'screenshots', 'pixel_scenes');
const reportFile = path.join(root, 'qa', 'pixel-scenes-report.json');
fs.mkdirSync(outDir, { recursive: true });

const report = { url, generatedAt: new Date().toISOString(), scenes: [], errors: [] };
const targets = [
  ['01_prologue', 'PrologueScene'],
  ['02_guide', 'GuideScene'],
  ['03_chest', 'ChestScene', 'chest'],
  ['04_event', 'EventScene', 'event'],
  ['05_settings', 'SettingsScene'],
  ['06_boss_intro', 'BossIntroScene'],
  ['07_act_clear', 'ActClearScene'],
  ['08_result_defeat', 'ResultScene', null, { victory: false }],
  ['09_result_victory', 'ResultScene', null, { victory: true }]
];

function assert(value, message) {
  if (!value) throw new Error(message);
}

async function waitScene(page, key) {
  await page.waitForFunction((sceneKey) => window.__ASHEN_GAME__?.scene?.keys?.[sceneKey]?.scene?.isActive(), key, { timeout: 45_000 });
}

async function inspectScene(page, sceneKey) {
  return page.evaluate((key) => {
    const scene = window.__ASHEN_GAME__.scene.keys[key];
    const textObjects = scene.children.list.filter((item) => item?.type === 'Text');
    const fonts = [...new Set(textObjects.map((item) => item.style?.fontFamily).filter(Boolean))];
    const legacyFonts = fonts.filter((font) => /Georgia|serif/i.test(font));
    const overflow = textObjects
      .map((item) => ({ text: String(item.text).slice(0, 40), bounds: item.getBounds() }))
      .filter(({ bounds }) => bounds.right < -4 || bounds.left > 1540 || bounds.bottom < -4 || bounds.top > 868);
    const resultFigure = scene.children.getByName('result-figure');
    const tombstone = scene.tombstoneArt ?? resultFigure?.getByName?.('defeat-tombstone-art');
    return {
      active: scene.scene.isActive(),
      textCount: textObjects.length,
      fonts,
      legacyFonts,
      overflow,
      defeatTombstone: Boolean(
        tombstone?.visible
        && tombstone?.texture?.key === 'pixel-ui-defeat-tombstone'
        && tombstone.displayWidth > 100
        && tombstone.displayHeight > 200
      ),
      pixelBackgrounds: scene.children.list.filter((item) => String(item?.name ?? '').startsWith('pixel-background-')).map((item) => item.name)
    };
  }, sceneKey);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1 });
await context.addInitScript(() => {
  localStorage.clear();
  sessionStorage.clear();
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
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await waitScene(page, 'MainMenuScene');
  await page.evaluate(() => window.__ASHEN_QA__.startRun('exiled-knight', { seed: 20260712, skipVow: true }));
  await waitScene(page, 'MapScene');

  for (const [slug, sceneKey, nodeType, data] of targets) {
    if (sceneKey === 'ResultScene') {
      await page.evaluate(({ target, sceneData }) => {
        const run = window.__ASHEN_GAME__.registry.get('run');
        window.__ASHEN_QA__.startScene(target, { ...sceneData, run: structuredClone(run) });
      }, { target: sceneKey, sceneData: data });
    } else if (nodeType) {
      await page.evaluate(({ target, type }) => window.__ASHEN_QA__.forceScene(target, type), { target: sceneKey, type: nodeType });
    } else {
      await page.evaluate((target) => window.__ASHEN_QA__.startScene(target), sceneKey);
    }
    await waitScene(page, sceneKey);
    await page.waitForTimeout(320);
    const file = path.join(outDir, `${slug}.png`);
    await page.screenshot({ path: file });
    const inspection = await inspectScene(page, sceneKey);
    const bytes = fs.statSync(file).size;
    report.scenes.push({ slug, sceneKey, screenshot: path.relative(root, file).replaceAll('\\', '/'), bytes, ...inspection });
    assert(bytes > 80_000, `${sceneKey} screenshot looks blank (${bytes} bytes)`);
    assert(inspection.active, `${sceneKey} is not active`);
    assert(inspection.legacyFonts.length === 0, `${sceneKey} still uses legacy fonts: ${inspection.legacyFonts.join(', ')}`);
    if (slug === '08_result_defeat') assert(inspection.defeatTombstone, 'defeat result did not render the curated tombstone asset');
  }

  assert(report.errors.length === 0, report.errors.join('\n'));
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), 'utf8');
  console.log(JSON.stringify({ ok: true, scenes: report.scenes.length, errors: report.errors.length }, null, 2));
} catch (error) {
  report.errors.push(error.stack ?? error.message);
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), 'utf8');
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
} finally {
  await context.close();
  await browser.close();
}
