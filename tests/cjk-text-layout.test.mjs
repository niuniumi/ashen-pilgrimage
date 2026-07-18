import assert from 'node:assert/strict';
import test from 'node:test';

import { cjkWordWrap, wrapMeasuredText } from '../src/ui/CjkTextLayout.js';

const openingPunctuation = /[（【《“‘]/u;
const closingPunctuation = /[，。！？；：、）】》”’]/u;

test('wrapMeasuredText keeps CJK grapheme lines within the measured width', () => {
  const wrapped = wrapMeasuredText(
    '今夜墓园深处传来第十三声钟鸣。',
    8,
    (value) => [...value].length
  );

  assert.ok(wrapped.split('\n').every((line) => [...line].length <= 8));
});

test('wrapMeasuredText keeps Chinese opening and closing punctuation with text', () => {
  const wrapped = wrapMeasuredText('“余烬不灭”，钟声仍在回响。', 5, (value) => [...value].length);
  const lines = wrapped.split('\n');

  assert.ok(lines.every((line) => [...line].length <= 5));
  assert.equal(lines.some((line) => closingPunctuation.test(line[0] ?? '')), false);
  assert.equal(lines.some((line) => openingPunctuation.test(line.at(-1) ?? '')), false);
});

test('wrapMeasuredText prioritizes measured width when a closing mark cannot share a legal line', () => {
  const measure = (value) => [...value].reduce(
    (total, glyph) => total + ({ A: 1, '甲': 2, '，': 2 }[glyph] ?? 1),
    0
  );
  const wrapped = wrapMeasuredText('A甲，', 3, measure);
  const lines = wrapped.split('\n');

  assert.deepEqual(lines, ['A甲', '，']);
  assert.ok(lines.every((line) => measure(line) <= 3));
});

test('wrapMeasuredText preserves authored blank paragraphs', () => {
  assert.equal(
    wrapMeasuredText('第一段\n\n第二段', 12, (value) => [...value].length),
    '第一段\n\n第二段'
  );
});

test('cjkWordWrap delegates Phaser measuring to measured wrapping', () => {
  const wordWrap = cjkWordWrap(4);
  assert.equal(wordWrap.width, 4);
  assert.equal(
    wordWrap.callback('灰白圣火照亮归途', { context: { measureText: (value) => ({ width: [...value].length }) } }),
    '灰白圣火\n照亮归途'
  );
});
