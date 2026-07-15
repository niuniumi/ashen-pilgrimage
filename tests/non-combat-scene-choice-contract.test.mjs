import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readScene = (name) => fs.readFileSync(path.join(root, 'src', 'scenes', `${name}Scene.js`), 'utf8');

test('reward pointer input selects while confirm and skip own synchronous settlement gates', () => {
  const source = readScene('Reward');
  assert.match(source, /new SceneChoiceController\(/);
  assert.match(source, /onClick:\s*\(\) => this\.selectChoice\(card\.id\)/);
  assert.match(source, /confirmChoice\(\)[\s\S]*?choiceController\?\.confirm\(\)/);
  assert.match(source, /skipReward\(\)[\s\S]*?choiceController\?\.lock\(\)/);
  assert.doesNotMatch(source, /onClick:\s*\(\) => this\.claim\(card\.id\)/);
});

test('event pointer input selects and only confirm applies the event', () => {
  const source = readScene('Event');
  assert.match(source, /new SceneChoiceController\(/);
  assert.match(source, /\(\) => this\.selectChoice\(option\.id\)/);
  assert.match(source, /confirmChoice\(\)[\s\S]*?choiceController\?\.confirm\(\)/);
  assert.doesNotMatch(source, /onClick:\s*\(\) => this\.choose\(option\)/);
});

test('rest pointer input selects and only confirm invokes a rest business action', () => {
  const source = readScene('Rest');
  assert.match(source, /new SceneChoiceController\(/);
  assert.match(source, /\(\) => this\.selectChoice\(id\)/);
  assert.match(source, /confirmChoice\(\)[\s\S]*?choiceController\?\.confirm\(\)/);
  assert.doesNotMatch(source, /drawChoiceCard\([^\n]+\(\) => this\.(?:rest|upgrade)\(\)/);
});
