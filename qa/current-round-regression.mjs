import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const root = process.cwd();
const url = process.env.QA_URL ?? 'http://127.0.0.1:4176';
const outDir = path.join(root, 'qa', 'screenshots', 'current_round');
fs.mkdirSync(outDir, { recursive: true });

const report = {
  ok: true,
  screenshots: [],
  checks: [],
  errors: []
};

function rel(file) {
  return path.relative(root, file).replaceAll('\\', '/');
}

function addCheck(name, ok, details = {}) {
  report.checks.push({ name, ok, details });
  if (!ok) report.ok = false;
}

async function wait(page, ms = 260) {
  await page.waitForTimeout(ms);
}

async function waitScene(page, sceneKey) {
  await page.waitForFunction((key) => window.__ASHEN_GAME__?.scene?.getScenes(true).some((scene) => scene.scene.key === key), sceneKey);
}

async function canvasRect(page) {
  return page.locator('canvas').evaluate((canvas) => {
    const r = canvas.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
}

async function canvasPoint(page, x, y) {
  const rect = await canvasRect(page);
  return {
    x: rect.x + (x / 1536) * rect.width,
    y: rect.y + (y / 864) * rect.height
  };
}

async function clickGame(page, x, y, delay = 260) {
  const point = await canvasPoint(page, x, y);
  await page.mouse.move(point.x, point.y);
  await page.mouse.click(point.x, point.y);
  await wait(page, delay);
}

async function moveGame(page, x, y, delay = 160) {
  const point = await canvasPoint(page, x, y);
  await page.mouse.move(point.x, point.y);
  await wait(page, delay);
}

async function shot(page, name, delay = 260) {
  await wait(page, delay);
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file });
  report.screenshots.push(rel(file));
}

async function startScene(page, scene, data = {}) {
  await page.evaluate(({ scene, data }) => {
    const game = window.__ASHEN_GAME__;
    game.scene.getScenes(true).forEach((item) => {
      if (item.scene.key !== scene) game.scene.stop(item.scene.key);
    });
    game.scene.start(scene, data);
  }, { scene, data });
  await waitScene(page, scene);
  await wait(page, 520);
}

function overlap(a, b) {
  return !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
}

async function enemyHitRects(page) {
  return page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.BattleScene;
    return scene.enemyHitZones.map((zone, index) => {
      const w = zone.input.hitArea.width;
      const h = zone.input.hitArea.height;
      return {
        index,
        x: zone.x,
        y: zone.y,
        width: w,
        height: h,
        left: zone.x - w / 2,
        right: zone.x + w / 2,
        top: zone.y - h / 2,
        bottom: zone.y + h / 2
      };
    });
  });
}

async function assertNoEnemyOverlap(page, label) {
  const rects = await enemyHitRects(page);
  let ok = true;
  const collisions = [];
  for (let i = 0; i < rects.length; i += 1) {
    for (let j = i + 1; j < rects.length; j += 1) {
      if (overlap(rects[i], rects[j])) {
        ok = false;
        collisions.push([i, j]);
      }
    }
  }
  addCheck(label, ok, { rects, collisions });
}

async function battleActorTextures(page) {
  return page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.BattleScene;
    const actorFrom = (view) => {
      const sprite = view?.artContainer?.actorSprite;
      return {
        name: view?.nameText?.text ?? null,
        x: view?.x ?? null,
        y: view?.y ?? null,
        assetId: sprite?.getData?.('assetId') ?? null,
        textureKey: sprite?.getData?.('textureKey') ?? sprite?.texture?.key ?? null,
        objectName: sprite?.name ?? null
      };
    };
    return {
      player: actorFrom(scene.playerView),
      enemies: scene.enemyViews.filter(Boolean).map(actorFrom)
    };
  });
}

async function currentCard(page) {
  return page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.getScenes(true)[0];
    const card = scene.children.list.find((item) => item.card && Number.isFinite(item.baseY));
    if (!card) return null;
    return { x: card.x, y: card.y, baseY: card.baseY, scale: card.scaleX, name: card.card.name };
  });
}

async function assertCardHoverStable(page, sceneName) {
  const before = await currentCard(page);
  if (!before) {
    addCheck(`${sceneName} card hover stable`, false, { reason: 'no card found' });
    return;
  }
  for (let i = 0; i < 4; i += 1) {
    await moveGame(page, before.x, before.y, 220);
    await moveGame(page, 40, 40, 220);
  }
  const after = await currentCard(page);
  const ok = after && Math.abs(after.y - before.baseY) <= 0.5 && Math.abs(after.scale - 1) <= 0.02;
  addCheck(`${sceneName} card hover stable`, ok, { before, after });
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1 });
await context.addInitScript(() => {
  window.localStorage.setItem(
    'ashen-pilgrimage-settings-v1',
    JSON.stringify({
      sound: true,
      music: true,
      muted: false,
      bgmVolume: 0.3,
      sfxVolume: 0.75,
      animation: true,
      fastMode: false,
      tutorialEnabled: true,
      tutorialSeen: true,
      storySeen: true
    })
  );
});

const page = await context.newPage();
page.on('pageerror', (error) => {
  report.ok = false;
  report.errors.push(`pageerror: ${error.message}`);
});
page.on('console', (message) => {
  if (message.type() === 'error') {
    report.ok = false;
    report.errors.push(`console: ${message.text()}`);
  }
});

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForSelector('canvas');
await waitScene(page, 'MainMenuScene');
await wait(page, 620);
await shot(page, 'menu_fixed');
const audioBefore = await page.evaluate(() => {
  const audio = window.__ASHEN_GAME__.registry.get('audio');
  return { unlocked: audio.unlocked, currentBgmKey: audio.currentBgmKey, pendingBgmKey: audio.pendingBgmKey };
});
addCheck('audio waits for first gesture', audioBefore.currentBgmKey === null && audioBefore.pendingBgmKey === 'bgm-shared', audioBefore);

await clickGame(page, 1190, 386, 620);
const audioAfterClick = await page.evaluate(() => {
  const audio = window.__ASHEN_GAME__.registry.get('audio');
  return { unlocked: audio.unlocked, currentBgmKey: audio.currentBgmKey, pendingBgmKey: audio.pendingBgmKey };
});
addCheck('first menu click unlocks shared bgm', audioAfterClick.unlocked && audioAfterClick.currentBgmKey === 'bgm-shared', audioAfterClick);

await startScene(page, 'PrologueScene');
await shot(page, 'prologue_story_sketch');
const prologueAudio = await page.evaluate(() => window.__ASHEN_GAME__.registry.get('audio').currentBgmKey);
addCheck('prologue keeps shared bgm', prologueAudio === 'bgm-shared', { currentBgmKey: prologueAudio });

await startScene(page, 'CharacterSelectScene');
await clickGame(page, 300, 462, 260);
await clickGame(page, 1324, 798, 680);
await waitScene(page, 'MapScene');
const mapAudio = await page.evaluate(() => window.__ASHEN_GAME__.registry.get('audio').currentBgmKey);
addCheck('map keeps shared bgm', mapAudio === 'bgm-shared', { currentBgmKey: mapAudio });

await startScene(page, 'BattleScene', { battleType: 'normal' });
const normalBattleAudio = await page.evaluate(() => window.__ASHEN_GAME__.registry.get('audio').currentBgmKey);
const normalBattleTextures = await battleActorTextures(page);
addCheck('normal battle keeps shared bgm', normalBattleAudio === 'bgm-shared', { currentBgmKey: normalBattleAudio });
addCheck(
  'normal battle uses low-noise raster actor textures',
  normalBattleTextures.player.textureKey?.startsWith('ln-hero-') &&
    normalBattleTextures.enemies.length >= 1 &&
    normalBattleTextures.enemies.every((enemy) => enemy.textureKey?.startsWith('ln-enemy-')),
  normalBattleTextures
);

await startScene(page, 'BattleScene', { battleType: 'boss' });
await page.evaluate(() => {
  const scene = window.__ASHEN_GAME__.scene.keys.BattleScene;
  const boss = scene.battle.enemies.find((enemy) => enemy.type === 'boss');
  boss.hp = Math.max(24, boss.hp);
  scene.battle.enemies = [
    boss,
    {
      id: 'graveyard-skeleton',
      uid: 'qa-skeleton-left',
      name: '墓园骷髅',
      hp: 24,
      maxHp: 24,
      block: 0,
      type: 'normal',
      status: {},
      currentAction: { intent: 'attack', damage: 7, text: '攻击 7。' },
      summoned: true
    },
    {
      id: 'graveyard-skeleton',
      uid: 'qa-skeleton-right',
      name: '墓园骷髅',
      hp: 24,
      maxHp: 24,
      block: 0,
      type: 'normal',
      status: {},
      currentAction: { intent: 'block', block: 9, text: '防御 9。' },
      summoned: true
    }
  ];
  scene.renderBattle();
});
await wait(page, 360);
await shot(page, 'boss_summons_no_overlap');
await assertNoEnemyOverlap(page, 'boss summons do not overlap');
const bossTextures = await battleActorTextures(page);
addCheck(
  'boss battle uses low-noise raster actor textures',
  bossTextures.player.textureKey?.startsWith('ln-hero-') &&
    bossTextures.enemies.length === 3 &&
    bossTextures.enemies.every((enemy) => enemy.textureKey?.startsWith('ln-enemy-') && !enemy.objectName?.includes('final-battle-actor-sprite')),
  bossTextures
);
const bossAudio = await page.evaluate(() => window.__ASHEN_GAME__.registry.get('audio').currentBgmKey);
addCheck('boss battle keeps shared bgm', bossAudio === 'bgm-shared', { currentBgmKey: bossAudio });

await page.evaluate(() => {
  const scene = window.__ASHEN_GAME__.scene.keys.BattleScene;
  scene.battle.enemies = [
    {
      id: 'rotting-villager',
      uid: 'qa-dead-villager',
      name: '腐烂村民',
      hp: 0,
      maxHp: 32,
      block: 0,
      type: 'normal',
      status: {},
      currentAction: { intent: 'attack', value: 8, text: '攻击 8。' }
    },
    {
      id: 'black-hound',
      uid: 'qa-living-hound',
      name: '黑犬',
      hp: 22,
      maxHp: 22,
      block: 0,
      type: 'normal',
      status: {},
      currentAction: { intent: 'attack', value: 6, text: '攻击 6。' }
    }
  ];
  scene.selectedUid = null;
  scene.renderBattle();
});
await wait(page, 320);
await shot(page, 'dead_enemy_removed_from_targets');
const deadTargetState = await page.evaluate(() => {
  const scene = window.__ASHEN_GAME__.scene.keys.BattleScene;
  return {
    hitZones: scene.enemyHitZones.length,
    hasDeadView: Boolean(scene.enemyViews[0]),
    hasLivingView: Boolean(scene.enemyViews[1]),
    livingX: scene.enemyViews[1]?.x ?? null
  };
});
addCheck('dead enemies do not keep hit zones', deadTargetState.hitZones === 1 && !deadTargetState.hasDeadView && deadTargetState.hasLivingView, deadTargetState);
const deadEnemyTextures = await battleActorTextures(page);
addCheck(
  'dead enemy cleanup keeps only the living enemy asset',
  deadEnemyTextures.enemies.length === 1 &&
    deadEnemyTextures.enemies[0].assetId === 'black-hound' &&
    deadEnemyTextures.enemies[0].textureKey?.startsWith('ln-enemy-black-hound-'),
  deadEnemyTextures
);

await startScene(page, 'RewardScene');
await shot(page, 'reward_cards_hover_baseline');
const rewardAudio = await page.evaluate(() => window.__ASHEN_GAME__.registry.get('audio').currentBgmKey);
addCheck('reward keeps shared bgm', rewardAudio === 'bgm-shared', { currentBgmKey: rewardAudio });
await assertCardHoverStable(page, 'reward');

await startScene(page, 'ShopScene');
await shot(page, 'shop_cards_hover_baseline');
const shopAudio = await page.evaluate(() => window.__ASHEN_GAME__.registry.get('audio').currentBgmKey);
addCheck('shop keeps shared bgm', shopAudio === 'bgm-shared', { currentBgmKey: shopAudio });
await assertCardHoverStable(page, 'shop');

await startScene(page, 'ResultScene', { victory: false });
const defeatAudio = await page.evaluate(() => window.__ASHEN_GAME__.registry.get('audio').currentBgmKey);
addCheck('defeat result keeps shared bgm', defeatAudio === 'bgm-shared', { currentBgmKey: defeatAudio });

await browser.close();

const reportPath = path.join(root, 'qa', 'current-round-regression-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
