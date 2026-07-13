import fs from 'node:fs';
import path from 'node:path';
import { PIXEL_ACTORS, PIXEL_ASSETS } from '../src/art/PixelAssetCatalog.js';

const root = process.cwd();
const assets = Object.values(PIXEL_ASSETS);
const actors = Object.values(PIXEL_ACTORS);
const issues = [];
const keys = new Set();

for (const asset of assets) {
  if (!asset.key || !asset.url) issues.push(`invalid pixel asset: ${JSON.stringify(asset)}`);
  if (keys.has(asset.key)) issues.push(`duplicate asset key: ${asset.key}`);
  keys.add(asset.key);
  const file = path.join(root, 'public', asset.url);
  if (!fs.existsSync(file)) issues.push(`missing asset file: ${asset.url}`);
  else if (fs.statSync(file).size < 500_000) issues.push(`production pixel asset too small: ${asset.url}`);
}

for (const asset of actors) {
  if (!asset.key || !asset.url) issues.push(`invalid pixel actor: ${JSON.stringify(asset)}`);
  if (keys.has(asset.key)) issues.push(`duplicate asset key: ${asset.key}`);
  keys.add(asset.key);
  const file = path.join(root, 'public', asset.url);
  if (!fs.existsSync(file)) issues.push(`missing pixel actor: ${asset.url}`);
  else if (fs.statSync(file).size < 10_000) issues.push(`pixel actor too small: ${asset.url}`);
}

const font = path.join(root, 'public/assets/fonts/fusion-pixel-10px-zh-hans.woff2');
if (!fs.existsSync(font) || fs.statSync(font).size < 100_000) issues.push('missing production pixel Chinese font');

const report = { ok: issues.length === 0, count: assets.length + actors.length + 1, issues };
if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(report, null, 2));
