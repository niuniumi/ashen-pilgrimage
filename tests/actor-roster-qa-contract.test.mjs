import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root, 'scripts', 'qa-actor-roster.mjs'), 'utf8');

test('actor roster QA explicitly loads every scoped enemy asset before rendering the catalog', () => {
  assert.match(source, /resolvePixelActorAsset\(definition\.id\)/);
  assert.match(source, /pending\s*=\s*assets\.filter\(\(asset\)\s*=>\s*!scene\.textures\.exists\(asset\.key\)\)/);
  assert.match(source, /scene\.load\.image\(asset\.key,\s*asset\.url\)/);
  assert.match(source, /scene\.load\.on\('loaderror'/);
  assert.match(source, /roster preload failed/);
});
