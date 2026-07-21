import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const url = process.argv.find((argument) => argument.startsWith('--url='))?.slice('--url='.length)
  ?? process.env.QA_URL
  ?? 'http://127.0.0.1:4193/';
const viewports = [
  { width: 1280, height: 720 },
  { width: 1366, height: 768 },
  { width: 1536, height: 864 }
];
const results = [];
const errors = [];
const browser = await chromium.launch({ headless: true });

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
    await context.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem('ashen-pilgrimage-settings-v1', JSON.stringify({ sound: false, animation: true, storySeen: false }));
    });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(`${viewport.width}x${viewport.height}: ${error.message}`));
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForSelector('canvas');
    await page.waitForFunction(() => Boolean(window.__ASHEN_QA__));
    await page.evaluate(() => window.__ASHEN_QA__.startScene('PrologueScene'));
    await page.waitForFunction(() => window.__ASHEN_GAME__?.scene?.isActive('PrologueScene'));

    for (let pageIndex = 0; pageIndex < 4; pageIndex += 1) {
      await page.waitForFunction((index) => {
        const scene = window.__ASHEN_GAME__?.scene?.keys?.PrologueScene;
        return scene?.pageIndex === index && scene?.isTurning === false && Boolean(scene?.pageBody);
      }, pageIndex);
      const layout = await page.evaluate(() => {
        const scene = window.__ASHEN_GAME__.scene.keys.PrologueScene;
        const body = scene.pageBody.getBounds();
        const page = scene.pageIndexText.getBounds();
        return {
          index: scene.pageIndex,
          body: { x: body.x, y: body.y, width: body.width, height: body.height, bottom: body.bottom },
          page: { x: page.x, y: page.y, width: page.width, height: page.height, top: page.top }
        };
      });
      assert.ok(layout.body.width <= 730.01, `${viewport.width}x${viewport.height} page ${pageIndex + 1}: body exceeds 730px`);
      assert.ok(layout.body.x >= 402.99 && layout.body.x + layout.body.width <= 1133.01, `${viewport.width}x${viewport.height} page ${pageIndex + 1}: body leaves panel text area`);
      assert.ok(layout.body.bottom < layout.page.top, `${viewport.width}x${viewport.height} page ${pageIndex + 1}: body collides with page marker`);
      results.push({ viewport, ...layout });
      if (pageIndex < 3) {
        await page.evaluate(() => window.__ASHEN_GAME__.scene.keys.PrologueScene.turnPage(1));
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
}

assert.deepEqual(errors, []);
console.log(JSON.stringify({ ok: true, url, pages: results.length, results }, null, 2));
