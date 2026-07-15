import fs from 'node:fs';
import path from 'node:path';
import { PIXEL_ACTORS, PIXEL_ASSETS, PIXEL_TEXTURE_ASSETS } from '../src/art/PixelAssetCatalog.js';

const root = process.cwd();
const assets = Object.values(PIXEL_ASSETS);
const actors = Object.values(PIXEL_ACTORS);
const issues = [];
const keys = new Set();

function webpDimensions(file) {
  const data = fs.readFileSync(file);
  if (data.length < 20 || data.toString('ascii', 0, 4) !== 'RIFF' || data.toString('ascii', 8, 12) !== 'WEBP') return null;

  for (let offset = 12; offset + 8 <= data.length;) {
    const type = data.toString('ascii', offset, offset + 4);
    const size = data.readUInt32LE(offset + 4);
    const payload = offset + 8;
    if (payload + size > data.length) return null;

    if (type === 'VP8X' && size >= 10) {
      return {
        width: data.readUIntLE(payload + 4, 3) + 1,
        height: data.readUIntLE(payload + 7, 3) + 1
      };
    }
    if (type === 'VP8L' && size >= 5 && data[payload] === 0x2f) {
      const bits = data.readUInt32LE(payload + 1);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >>> 14) & 0x3fff) + 1
      };
    }
    if (type === 'VP8 ' && size >= 10 && data[payload + 3] === 0x9d && data[payload + 4] === 0x01 && data[payload + 5] === 0x2a) {
      return {
        width: data.readUInt16LE(payload + 6) & 0x3fff,
        height: data.readUInt16LE(payload + 8) & 0x3fff
      };
    }

    offset = payload + size + (size % 2);
  }
  return null;
}

function validateRuntimeFile(asset, label, minimumMasterBytes) {
  if (!asset.key || !asset.url) issues.push(`invalid ${label}: ${JSON.stringify(asset)}`);
  if (!asset.url?.endsWith('.webp')) issues.push(`${label} must use WebP: ${asset.url}`);
  if (keys.has(asset.key)) issues.push(`duplicate asset key: ${asset.key}`);
  keys.add(asset.key);

  const runtimeFile = path.join(root, 'public', asset.url);
  const relativePng = asset.url.replace(/\.webp$/, '.png');
  const masterFile = path.join(root, 'qa/source-art/runtime-masters', relativePng);
  const duplicatePng = path.join(root, 'public', relativePng);
  if (!fs.existsSync(runtimeFile)) issues.push(`missing ${label}: ${asset.url}`);
  else {
    const dimensions = webpDimensions(runtimeFile);
    if (!dimensions || dimensions.width < 16 || dimensions.height < 16) {
      issues.push(`${label} has invalid WebP dimensions: ${asset.url}`);
    }
  }
  if (!fs.existsSync(masterFile)) issues.push(`missing PNG master: ${relativePng}`);
  else if (fs.statSync(masterFile).size < minimumMasterBytes) issues.push(`PNG master too small: ${relativePng}`);
  if (fs.existsSync(duplicatePng)) issues.push(`referenced PNG duplicates runtime WebP in public: ${relativePng}`);
}

for (const asset of assets) {
  validateRuntimeFile(asset, 'pixel asset', 500_000);
}

for (const asset of PIXEL_TEXTURE_ASSETS.filter((item) => !assets.includes(item))) {
  validateRuntimeFile(asset, 'pixel actor', 1_000);
}

const font = path.join(root, 'public/assets/fonts/fusion-pixel-10px-zh-hans.woff2');
if (!fs.existsSync(font) || fs.statSync(font).size < 100_000) issues.push('missing production pixel Chinese font');

for (const actor of actors) {
  if (!actor.key || !actor.url || !actor.facing) issues.push(`invalid pixel actor binding: ${JSON.stringify(actor)}`);
}

const report = { ok: issues.length === 0, count: PIXEL_TEXTURE_ASSETS.length + 1, actorBindings: actors.length, issues };
if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(report, null, 2));
