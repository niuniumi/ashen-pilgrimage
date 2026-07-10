import fs from 'node:fs';
import path from 'node:path';
import { flattenFinalArtAssets } from '../src/art/FinalArtAssets.js';

const root = process.cwd();
const assets = flattenFinalArtAssets();
const keys = new Set();
const issues = [];

function check(condition, message) {
  if (!condition) {
    issues.push(message);
  }
}

for (const asset of assets) {
  check(asset.key, `asset missing key: ${JSON.stringify(asset)}`);
  check(asset.url, `asset missing url: ${asset.key}`);
  check(Number.isFinite(asset.width) && asset.width > 0, `asset invalid width: ${asset.key}`);
  check(Number.isFinite(asset.height) && asset.height > 0, `asset invalid height: ${asset.key}`);

  if (asset.key) {
    check(!keys.has(asset.key), `duplicate asset key: ${asset.key}`);
    keys.add(asset.key);
  }

  if (asset.url) {
    const file = path.join(root, 'public', asset.url);
    check(fs.existsSync(file), `missing asset file: ${asset.url}`);
    if (fs.existsSync(file)) {
      const size = fs.statSync(file).size;
      check(size > 512, `asset file too small: ${asset.url}`);
    }
  }
}

const report = {
  ok: issues.length === 0,
  count: assets.length,
  issues
};

if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(report, null, 2));
