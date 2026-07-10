const RELIC_BASE = 'assets/generated/relics';

export const RELIC_ASSETS = {
  'rusted-holy-emblem': { key: 'relic-rusted-holy-emblem', url: `${RELIC_BASE}/rusted-holy-emblem.png` },
  'broken-knight-sword': { key: 'relic-broken-knight-sword', url: `${RELIC_BASE}/broken-knight-sword.png` },
  'crow-feather': { key: 'relic-crow-feather', url: `${RELIC_BASE}/crow-feather.png` },
  'old-silver-coin': { key: 'relic-old-silver-coin', url: `${RELIC_BASE}/old-silver-coin.png` },
  'church-candle': { key: 'relic-church-candle', url: `${RELIC_BASE}/church-candle.png` },
  'graveyard-key': { key: 'relic-graveyard-key', url: `${RELIC_BASE}/graveyard-key.png` },
  'black-iron-mask': { key: 'relic-black-iron-mask', url: `${RELIC_BASE}/black-iron-mask.png` },
  'broken-shield': { key: 'relic-broken-shield', url: `${RELIC_BASE}/broken-shield.png` },
  'alchemy-flask': { key: 'relic-alchemy-flask', url: `${RELIC_BASE}/alchemy-flask.png` },
  'saint-bone-casket': { key: 'relic-saint-bone-casket', url: `${RELIC_BASE}/saint-bone-casket.png` },
  'ebony-crossbow': { key: 'relic-ebony-crossbow', url: `${RELIC_BASE}/ebony-crossbow.png` },
  'monastery-bell': { key: 'relic-monastery-bell', url: `${RELIC_BASE}/monastery-bell.png` },
  'witch-hunter-tongs': { key: 'relic-witch-hunter-tongs', url: `${RELIC_BASE}/witch-hunter-tongs.png` },
  'worn-cloak': { key: 'relic-worn-cloak', url: `${RELIC_BASE}/worn-cloak.png` },
  'royal-signet': { key: 'relic-royal-signet', url: `${RELIC_BASE}/royal-signet.png` },
  'blood-ruby': { key: 'relic-blood-ruby', url: `${RELIC_BASE}/blood-ruby.png` },
  'silver-chalice': { key: 'relic-silver-chalice', url: `${RELIC_BASE}/silver-chalice.png` },
  'knight-spurs': { key: 'relic-knight-spurs', url: `${RELIC_BASE}/knight-spurs.png` },
  'ash-crown': { key: 'relic-ash-crown', url: `${RELIC_BASE}/ash-crown.png` },
  'bone-dice': { key: 'relic-bone-dice', url: `${RELIC_BASE}/bone-dice.png` },
  'rusty-nail': { key: 'relic-rusty-nail', url: `${RELIC_BASE}/rusty-nail.png` },
  'white-wax-stub': { key: 'relic-white-wax-stub', url: `${RELIC_BASE}/white-wax-stub.png` },
  'cracked-vial': { key: 'relic-cracked-vial', url: `${RELIC_BASE}/cracked-vial.png` },
  'broken-watch': { key: 'relic-broken-watch', url: `${RELIC_BASE}/broken-watch.png` },
  'rusted-crown': { key: 'relic-rusted-crown', url: `${RELIC_BASE}/rusted-crown.png` },
  'pilgrim-ember': { key: 'relic-pilgrim-ember', url: `${RELIC_BASE}/pilgrim-ember.png` },
  'old-tithe-box': { key: 'relic-old-tithe-box', url: `${RELIC_BASE}/old-tithe-box.png` },
  'grave-bell': { key: 'relic-grave-bell', url: `${RELIC_BASE}/grave-bell.png` },
  'black-iron-nail': { key: 'relic-black-iron-nail', url: `${RELIC_BASE}/black-iron-nail.png` },
  'candle-snuffer': { key: 'relic-candle-snuffer', url: `${RELIC_BASE}/candle-snuffer.png` },
  'stitched-satchel': { key: 'relic-stitched-satchel', url: `${RELIC_BASE}/stitched-satchel.png` },
  'saint-coin': { key: 'relic-saint-coin', url: `${RELIC_BASE}/saint-coin.png` },
  'ash-splinter': { key: 'relic-ash-splinter', url: `${RELIC_BASE}/ash-splinter.png` }
};

export function relicAssetFor(relicId) {
  return RELIC_ASSETS[relicId] ?? null;
}

export function flattenRelicAssets() {
  return Object.values(RELIC_ASSETS);
}
