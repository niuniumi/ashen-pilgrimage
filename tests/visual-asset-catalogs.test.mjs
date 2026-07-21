import assert from 'node:assert/strict';
import test from 'node:test';

import { CARD_ART_ATLAS, CARD_ART_ENTRIES } from '../src/art/CardAssetCatalog.js';
import { UI_ICON_ATLAS, UI_ICON_ENTRIES } from '../src/art/UIIconAssetCatalog.js';
import { cards } from '../src/data/cards.js';
import fs from 'node:fs';

test('every playable card owns a distinct assetized illustration frame', () => {
  assert.equal(CARD_ART_ENTRIES.length, cards.length);
  assert.deepEqual(
    new Set(CARD_ART_ENTRIES.map((entry) => entry.id)),
    new Set(cards.map((card) => card.id))
  );
  assert.equal(new Set(CARD_ART_ENTRIES.map((entry) => entry.icon)).size, cards.length);
  assert.equal(new Set(CARD_ART_ENTRIES.map((entry) => entry.frame)).size, cards.length);
  assert.match(CARD_ART_ATLAS.url, /\.webp$/);
});

test('map nodes and common UI concepts own distinct atlas frames', () => {
  const nodeTypes = ['battle', 'elite', 'event', 'shop', 'rest', 'chest', 'boss'];
  const byType = new Map(UI_ICON_ENTRIES.map((entry) => [entry.type, entry]));
  const nodeEntries = nodeTypes.map((type) => byType.get(type));
  assert.ok(nodeEntries.every(Boolean));
  assert.equal(new Set(nodeEntries.map((entry) => entry.icon)).size, nodeTypes.length);
  assert.equal(new Set(UI_ICON_ENTRIES.map((entry) => entry.frame)).size, UI_ICON_ENTRIES.length);
  assert.match(UI_ICON_ATLAS.url, /\.webp$/);
});

test('card and icon components prefer texture frames over procedural glyphs', () => {
  const cardSource = fs.readFileSync(new URL('../src/ui/UICard.js', import.meta.url), 'utf8');
  const iconSource = fs.readFileSync(new URL('../src/ui/UIIcon.js', import.meta.url), 'utf8');
  assert.match(cardSource, /resolveCardArtFrame/);
  assert.match(cardSource, /scene\.add\.image\(0, -23, CARD_ART_ATLAS\.key, artFrame\)/);
  assert.match(iconSource, /resolveUIIconFrame/);
  assert.match(iconSource, /UI_ICON_ATLAS\.key, frame/);
});

test('map nodes provide motion-aware hover and selectable-state feedback', () => {
  const source = fs.readFileSync(new URL('../src/scenes/MapScene.js', import.meta.url), 'utf8');
  assert.match(source, /targets: aura,[\s\S]*repeat: -1/);
  assert.match(source, /const targetScale = candidate\.restingScale \+ \(active \? 0\.1 : 0\)/);
  assert.match(source, /if \(!this\.motionEnabled\) \{[\s\S]*candidate\.container\.setScale\(targetScale\)\.setY\(targetY\);[\s\S]*continue;/);
  assert.match(source, /targets: candidate\.container,[\s\S]*duration: 130/);
  assert.doesNotMatch(source, /duration: this\.motionEnabled \? 130 : 0/);
});
