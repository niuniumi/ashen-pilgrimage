import assert from 'node:assert/strict';
import { chromium } from 'playwright';

import { BGM_TRACKS, SFX_POOLS, createBgmAsset, createSfxPoolAssets } from '../src/game/AudioCatalog.js';

const url = process.env.QA_URL ?? 'http://127.0.0.1:4193/';
const assets = [
  ...BGM_TRACKS.map((name) => ({ kind: 'bgm', key: `bgm-${name}`, path: createBgmAsset(name).urls[0] })),
  ...Object.entries(SFX_POOLS).flatMap(([name, count]) => createSfxPoolAssets(name, count).map((asset) => ({
    kind: 'sfx',
    key: asset.key,
    path: asset.urls[0]
  })))
];

const browser = await chromium.launch({ headless: true });
let results;
try {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  results = await page.evaluate(async (pending) => {
    const context = new AudioContext();
    const decoded = [];
    try {
      for (const asset of pending) {
        const response = await fetch(asset.path);
        if (!response.ok) throw new Error(`${asset.key}: HTTP ${response.status}`);
        const buffer = await context.decodeAudioData(await response.arrayBuffer());
        decoded.push({
          ...asset,
          duration: buffer.duration,
          sampleRate: buffer.sampleRate,
          channels: buffer.numberOfChannels
        });
      }
    } finally {
      await context.close();
    }
    return decoded;
  }, assets);
} finally {
  await browser.close();
}

assert.equal(results.length, assets.length);
for (const asset of results) {
  assert.ok(Number.isFinite(asset.duration) && asset.duration > 0, `${asset.key} has no decoded duration`);
  assert.ok(asset.sampleRate >= 22050, `${asset.key} sample rate is too low`);
  assert.ok(asset.channels >= 1, `${asset.key} has no audio channels`);
  if (asset.kind === 'bgm') assert.ok(asset.duration >= 20, `${asset.key} is too short for looping music`);
  else assert.ok(asset.duration <= 8, `${asset.key} is too long for a sound effect`);
}

console.log(JSON.stringify({
  ok: true,
  decoded: results.length,
  bgm: results.filter((asset) => asset.kind === 'bgm').length,
  sfx: results.filter((asset) => asset.kind === 'sfx').length,
  bgmDurations: Object.fromEntries(results.filter((asset) => asset.kind === 'bgm').map((asset) => [asset.key, Number(asset.duration.toFixed(2))]))
}, null, 2));

