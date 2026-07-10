export const ENCOUNTER_POOLS = {
  1: {
    battle: [
      ['rotting-villager'],
      ['graveyard-skeleton'],
      ['black-hound'],
      ['plague-rat-swarm'],
      ['crow-messenger'],
      ['armor-broken-militia'],
      ['rotting-villager', 'black-hound'],
      ['graveyard-skeleton', 'crow-messenger']
    ],
    elite: [['plague-doctor'], ['iron-maiden-nun'], ['fallen-paladin']],
    boss: [['headless-grave-knight']]
  },
  2: {
    battle: [
      ['wax-novice'],
      ['cinder-acolyte'],
      ['bell-tower-sentry'],
      ['scripture-moth-swarm'],
      ['wax-novice', 'scripture-moth-swarm'],
      ['cinder-acolyte', 'bell-tower-sentry']
    ],
    elite: [['choir-exorcist'], ['reliquary-jailer'], ['ash-veiled-prioress']],
    boss: [['pale-wax-matron']]
  },
  3: {
    battle: [
      ['hollow-spearman'],
      ['ashen-banneret'],
      ['gutter-fire-archer'],
      ['crownless-hound'],
      ['hollow-spearman', 'gutter-fire-archer'],
      ['ashen-banneret', 'crownless-hound']
    ],
    elite: [['gate-iron-vicar'], ['royal-pyre-knight'], ['clockwork-confessor']],
    boss: [['hollow-crown-regent']]
  }
};

export function getEncounterPool(act = 1, type = 'battle') {
  const pools = ENCOUNTER_POOLS[act] ?? ENCOUNTER_POOLS[1];
  return pools[type] ?? pools.battle;
}
