import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root, 'src', 'scenes', 'ResultScene.js'), 'utf8');
const pixelQaSource = fs.readFileSync(path.join(root, 'scripts', 'qa-pixel-scenes.mjs'), 'utf8');

test('result regions are rendered groups rather than detached QA zones', () => {
  assert.doesNotMatch(source, /createQARegions/);
  assert.doesNotMatch(source, /\.add\.zone\(/);
  for (const name of ['result-figure', 'result-narrative', 'result-stats', 'result-deck', 'result-actions']) {
    assert.match(source, new RegExp(`createResultRegion\\('${name}'`));
  }
});

test('defeat lightning never uses a full-camera flash', () => {
  assert.doesNotMatch(source, /cameras\.main\.flash/);
  assert.match(source, /defeat-lightning-local/);
});

test('pixel QA validates the nested curated tombstone instead of scanning only top-level children', () => {
  assert.match(pixelQaSource, /scene\.tombstoneArt\s*\?\?/);
  assert.match(pixelQaSource, /resultFigure\?\.getByName\?\.\('defeat-tombstone-art'\)/);
  assert.match(pixelQaSource, /tombstone\?\.texture\?\.key\s*===\s*'pixel-ui-defeat-tombstone'/);
  assert.doesNotMatch(pixelQaSource, /scene\.children\.list\.some\(\(item\)\s*=>\s*item\?\.name\s*===\s*'defeat-tombstone-art'/);
});
