import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveCardArtKind } from '../src/art/CardVisualCatalog.js';
import { cards } from '../src/data/cards.js';

test('production cards use a varied semantic pixel-art vocabulary', () => {
  const kinds = cards.map((card) => resolveCardArtKind(card));
  assert.ok(new Set(kinds).size >= 10);
  for (const character of ['exiled-knight', 'candle-nun', 'ashblood-alchemist']) {
    const characterKinds = new Set(cards.filter((card) => card.character === character).map((card) => resolveCardArtKind(card)));
    assert.ok(characterKinds.size >= 4, `${character} needs at least four illustration silhouettes`);
  }
});
