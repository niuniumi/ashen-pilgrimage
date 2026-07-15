import assert from 'node:assert/strict';
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
