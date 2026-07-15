import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { access } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import { PIXEL_TEXTURE_ASSETS } from '../src/art/PixelAssetCatalog.js';

const projectRoot = path.resolve(import.meta.dirname, '..');
const publicRoot = path.join(projectRoot, 'public');
const masterRoot = path.join(projectRoot, 'qa', 'source-art', 'runtime-masters');

test('runtime pixel catalog uses WebP while PNG masters remain outside public', async () => {
  for (const asset of PIXEL_TEXTURE_ASSETS) {
    assert.match(asset.url, /\.webp$/, `${asset.key} must use a WebP runtime asset`);

    const relativePng = asset.url.replace(/\.webp$/, '.png');
    await access(path.join(publicRoot, asset.url));
    await access(path.join(masterRoot, relativePng));
    await assert.rejects(
      access(path.join(publicRoot, relativePng)),
      { code: 'ENOENT' },
      `${asset.key} must not ship its referenced PNG master`
    );
  }
});

test('committed runtime images pass read-only lossless pixel verification', () => {
  const result = spawnSync(process.execPath, ['scripts/build-runtime-images.mjs', '--verify'], {
    cwd: projectRoot,
    encoding: 'utf8',
    env: { ...process.env, PYTHONUTF8: '1' },
    windowsHide: true
  });
  assert.equal(result.status, 0, result.stderr);
  const summary = JSON.parse(result.stdout.trim());
  assert.equal(summary.mode, 'verify');
  assert.equal(summary.count, PIXEL_TEXTURE_ASSETS.length);
  assert.equal(summary.verified, PIXEL_TEXTURE_ASSETS.length);
  assert.equal(summary.changed, 0);
});
