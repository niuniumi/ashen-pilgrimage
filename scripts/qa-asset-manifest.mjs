import fs from 'node:fs';
import path from 'node:path';

import { PIXEL_ACTORS, PIXEL_ASSETS, PIXEL_TEXTURE_ASSETS } from '../src/art/PixelAssetCatalog.js';
import { runRuntimeImages } from './build-runtime-images.mjs';
import { assertMatchingImageDimensions } from './runtime-image-container.mjs';
import { resolveCatalogAssetEntries } from './runtime-image-paths.mjs';

const root = process.cwd();
const backgroundAssets = Object.values(PIXEL_ASSETS);
const actors = Object.values(PIXEL_ACTORS);
const issues = [];
const keys = new Set();
let safeEntries = [];
let runtimeVerification = null;

try {
  const resolved = await resolveCatalogAssetEntries({
    assets: PIXEL_TEXTURE_ASSETS,
    runtimeRoot: path.join(root, 'public'),
    sourceRoot: path.join(root, 'qa', 'source-art', 'runtime-masters')
  });
  safeEntries = resolved.entries;
} catch (error) {
  issues.push(`unsafe or missing runtime image path: ${error.message}`);
}

const entriesByUrl = new Map(safeEntries.map((entry) => [entry.webpUrl, entry]));

function validateRuntimeFile(asset, label, minimumMasterBytes) {
  if (!asset?.key || !asset?.url) {
    issues.push(`invalid ${label}: ${JSON.stringify(asset)}`);
    return;
  }
  if (keys.has(asset.key)) issues.push(`duplicate asset key: ${asset.key}`);
  keys.add(asset.key);

  const entry = entriesByUrl.get(asset.url);
  if (!entry) {
    issues.push(`unresolved ${label}: ${asset.url}`);
    return;
  }
  const duplicatePng = entry.runtimePath.replace(/\.webp$/, '.png');
  if (!fs.existsSync(entry.runtimePath)) issues.push(`missing ${label}: ${asset.url}`);
  if (!fs.existsSync(entry.sourcePath)) issues.push(`missing PNG master: ${entry.pngUrl}`);

  if (fs.existsSync(entry.runtimePath) && fs.existsSync(entry.sourcePath)) {
    try {
      const dimensions = assertMatchingImageDimensions(
        fs.readFileSync(entry.sourcePath),
        fs.readFileSync(entry.runtimePath),
        asset.url
      );
      if (dimensions.width < 16 || dimensions.height < 16) {
        issues.push(`${label} has invalid dimensions: ${asset.url}`);
      }
    } catch (error) {
      issues.push(error.message);
    }
  }
  if (fs.existsSync(entry.sourcePath) && fs.statSync(entry.sourcePath).size < minimumMasterBytes) {
    issues.push(`PNG master too small: ${entry.pngUrl}`);
  }
  if (fs.existsSync(duplicatePng)) issues.push(`referenced PNG duplicates runtime WebP in public: ${entry.pngUrl}`);
}

for (const asset of backgroundAssets) validateRuntimeFile(asset, 'pixel asset', 500_000);
for (const asset of PIXEL_TEXTURE_ASSETS.filter((item) => !backgroundAssets.includes(item))) {
  validateRuntimeFile(asset, 'pixel actor', 1_000);
}

const font = path.join(root, 'public/assets/fonts/fusion-pixel-10px-zh-hans.woff2');
if (!fs.existsSync(font) || fs.statSync(font).size < 100_000) issues.push('missing production pixel Chinese font');

for (const actor of actors) {
  if (!actor.key || !actor.url || !actor.facing) issues.push(`invalid pixel actor binding: ${JSON.stringify(actor)}`);
}

if (issues.length === 0) {
  try {
    runtimeVerification = await runRuntimeImages({
      assets: PIXEL_TEXTURE_ASSETS,
      mode: 'verify',
      runtimeRoot: path.join(root, 'public'),
      sourceRoot: path.join(root, 'qa', 'source-art', 'runtime-masters')
    });
  } catch (error) {
    issues.push(`runtime pixel verification failed: ${error.message}`);
  }
}

const report = {
  ok: issues.length === 0,
  count: PIXEL_TEXTURE_ASSETS.length + 1,
  actorBindings: actors.length,
  runtimeVerification,
  issues
};
if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(report, null, 2));
