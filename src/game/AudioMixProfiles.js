const DEFAULT_PROFILE = Object.freeze({
  gain: 0.62,
  cooldown: 40,
  variance: 0.012
});

const PROFILES = Object.freeze({
  uiHover: { gain: 0.26, cooldown: 96, cooldownGroup: 'hover', variance: 0.01 },
  uiClick: { gain: 0.44, cooldown: 48, variance: 0.012 },
  cardHover: { gain: 0.32, cooldown: 96, cooldownGroup: 'hover', variance: 0.012 },
  cardSelect: { gain: 0.54, cooldown: 54, variance: 0.018 },
  cardPlay: { gain: 0.7, cooldown: 42, variance: 0.024 },
  swordHit: {
    gain: 0.86,
    cooldown: 34,
    variance: 0.028,
    duck: { gain: 0.68, duration: 190, attack: 45, release: 240 }
  },
  shieldBlock: { gain: 0.78, cooldown: 38, variance: 0.02 },
  enemyHit: {
    gain: 0.72,
    cooldown: 34,
    variance: 0.022,
    duck: { gain: 0.74, duration: 160, attack: 40, release: 210 }
  },
  playerHit: {
    gain: 0.8,
    cooldown: 42,
    variance: 0.024,
    duck: { gain: 0.56, duration: 260, attack: 35, release: 300 }
  },
  heal: { gain: 0.66, cooldown: 52, variance: 0.016 },
  debuff: { gain: 0.62, cooldown: 48, variance: 0.018 },
  buff: { gain: 0.6, cooldown: 48, variance: 0.016 },
  turnStart: { gain: 0.48, cooldown: 90, variance: 0.01 },
  enemyTurn: { gain: 0.46, cooldown: 90, variance: 0.01 },
  turn: { gain: 0.48, cooldown: 90, variance: 0.01 },
  coin: { gain: 0.6, cooldown: 56, variance: 0.02 },
  relic: { gain: 0.72, cooldown: 80, variance: 0.014 },
  cardReward: { gain: 0.7, cooldown: 90, variance: 0.014 },
  chestOpen: { gain: 0.74, cooldown: 100, variance: 0.012 },
  storyText: { gain: 0.38, cooldown: 54, variance: 0.01 },
  pageTurn: { gain: 0.52, cooldown: 70, variance: 0.014 },
  bossIntro: {
    gain: 0.9,
    cooldown: 180,
    variance: 0.012,
    duck: { gain: 0.46, duration: 760, attack: 60, release: 420 }
  },
  bossPhase: {
    gain: 0.9,
    cooldown: 140,
    variance: 0.014,
    duck: { gain: 0.48, duration: 620, attack: 55, release: 380 }
  },
  victory: {
    gain: 0.88,
    cooldown: 280,
    variance: 0.01,
    duck: { gain: 0.38, duration: 1100, attack: 70, release: 520 }
  },
  defeat: {
    gain: 0.84,
    cooldown: 280,
    variance: 0.01,
    duck: { gain: 0.34, duration: 1200, attack: 70, release: 560 }
  },
  dialogOpen: { gain: 0.42, cooldown: 70, variance: 0.01 },
  dialogClose: { gain: 0.4, cooldown: 70, variance: 0.01 },
  pauseOpen: { gain: 0.4, cooldown: 80, variance: 0.008 },
  pauseClose: { gain: 0.38, cooldown: 80, variance: 0.008 },
  error: { gain: 0.52, cooldown: 80, variance: 0.008 }
});

export function resolveSfxMixProfile(kind) {
  return PROFILES[kind] ?? DEFAULT_PROFILE;
}
