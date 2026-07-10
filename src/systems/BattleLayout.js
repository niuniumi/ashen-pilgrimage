const DEFAULT_SINGLE = { x: 845, y: 448 };
const DEFAULT_PAIR = [
  { x: 730, y: 454 },
  { x: 978, y: 454 }
];

export function getEnemyVisualMetrics(enemy) {
  const isBoss = enemy?.type === 'boss';
  const isSummoned = Boolean(enemy?.summoned);
  const isSmall = enemy?.id === 'black-hound' || enemy?.id === 'plague-rat-swarm' || enemy?.id === 'scripture-moth-swarm';
  if (isBoss) {
    return {
      artScale: 1.16,
      generatedHeight: 356,
      intentY: -242,
      nameY: 146,
      nameSize: 22,
      barY: 180,
      barWidth: 292,
      statusX: -100,
      statusY: 214,
      hitWidth: 306,
      hitHeight: 382,
      frameWidth: 302,
      frameHeight: 384
    };
  }
  if (isSummoned) {
    return {
      artScale: 0.76,
      generatedHeight: 238,
      intentY: -158,
      nameY: 98,
      nameSize: 18,
      barY: 126,
      barWidth: 166,
      statusX: -58,
      statusY: 158,
      hitWidth: 168,
      hitHeight: 246,
      frameWidth: 160,
      frameHeight: 236
    };
  }
  if (isSmall) {
    return {
      artScale: 0.9,
      generatedHeight: 264,
      intentY: -172,
      nameY: 106,
      nameSize: 19,
      barY: 136,
      barWidth: 190,
      statusX: -62,
      statusY: 168,
      hitWidth: 190,
      hitHeight: 270,
      frameWidth: 182,
      frameHeight: 260
    };
  }
  return {
    artScale: 1,
    generatedHeight: 306,
    intentY: -198,
    nameY: 126,
    nameSize: 21,
    barY: 156,
    barWidth: 230,
    statusX: -76,
    statusY: 190,
    hitWidth: 230,
    hitHeight: 336,
    frameWidth: 218,
    frameHeight: 318
  };
}

export function computeEnemyLayout(enemies = [], options = {}) {
  const livingEntries = enemies
    .map((enemy, originalIndex) => ({ enemy, originalIndex }))
    .filter(({ enemy }) => enemy && enemy.hp > 0);
  const single = options.enemySingle ?? DEFAULT_SINGLE;
  const pair = options.enemyPair ?? DEFAULT_PAIR;
  const bossEntry = livingEntries.find(({ enemy }) => enemy.type === 'boss');

  return livingEntries.map((entry, livingIndex) => {
    const { enemy } = entry;
    const metrics = getEnemyVisualMetrics(enemy);
    let position;

    if (bossEntry) {
      if (enemy.type === 'boss') {
        position = { x: 802, y: 390 };
      } else {
        const addIndex = livingEntries
          .filter(({ enemy: item }) => item.type !== 'boss')
          .findIndex(({ enemy: item }) => item === enemy);
        const addPositions = [
          { x: 1078, y: 540 },
          { x: 524, y: 540 },
          { x: 1078, y: 288 },
          { x: 524, y: 288 }
        ];
        position = addPositions[Math.max(0, addIndex)] ?? { x: 492 + addIndex * 156, y: 512 + (addIndex % 2) * 18 };
      }
    } else if (livingEntries.length <= 1) {
      position = single;
    } else if (livingEntries.length === 2) {
      position = pair[Math.min(livingIndex, 1)];
    } else {
      const positions = [
        { x: 586, y: 458 },
        { x: 828, y: 438 },
        { x: 1070, y: 458 },
        { x: 696, y: 512 },
        { x: 960, y: 512 }
      ];
      position = positions[livingIndex] ?? { x: 620 + livingIndex * 172, y: 456 };
    }

    return {
      ...entry,
      livingIndex,
      x: position.x,
      y: position.y,
      metrics
    };
  });
}
