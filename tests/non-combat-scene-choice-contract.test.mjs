import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readScene = (name) => fs.readFileSync(path.join(root, 'src', 'scenes', `${name}Scene.js`), 'utf8');
const readScript = (name) => fs.readFileSync(path.join(root, 'scripts', name), 'utf8');

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

test('progression QA verifies reward selection before exactly-once confirmation', () => {
  const source = readScript('qa-progression-regression.mjs');
  assert.match(source, /scene\.selectChoice\(cardId\)/);
  assert.match(source, /selecting a reward settled the node before confirmation/);
  assert.match(source, /first:\s*scene\.confirmChoice\(\),\s*second:\s*scene\.confirmChoice\(\)/);
  assert.match(source, /reward confirmation was accepted more than once/);
});

test('resume QA uses the event select-confirm contract instead of the removed choose API', () => {
  const source = readScript('qa-resume-stages.mjs');
  assert.match(source, /scene\.selectChoice\(choiceId\)/);
  assert.match(source, /scene\.confirmChoice\(\)/);
  assert.doesNotMatch(source, /scene\.choose\(/);
});
