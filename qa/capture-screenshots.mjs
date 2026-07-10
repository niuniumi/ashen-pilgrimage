import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/16224/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/playwright@1.61.0/node_modules/playwright');

const root = path.resolve(process.cwd());
const outDir = path.join(root, 'qa', 'screenshots');
fs.mkdirSync(outDir, { recursive: true });

const errors = [];
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1536, height: 864 },
  deviceScaleFactor: 1
});

await context.addInitScript(() => {
  window.localStorage.clear();
  let seed = 12;
  Math.random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
});

const page = await context.newPage();
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`${message.type()}: ${message.text()}`);
});

async function wait(ms = 350) {
  await page.waitForTimeout(ms);
}

async function shot(name) {
  await wait(220);
  await page.screenshot({ path: path.join(outDir, `${name}.png`) });
}

async function click(x, y, delay = 350) {
  await page.mouse.click(x, y);
  await wait(delay);
}

async function startScene(scene, data = {}) {
  await page.evaluate(({ scene, data }) => {
    const game = window.__ASHEN_GAME__;
    game.scene.getScenes(true).forEach((item) => {
      if (item.scene.key !== scene) game.scene.stop(item.scene.key);
    });
    game.scene.start(scene, data);
  }, { scene, data });
  await page.waitForFunction((sceneKey) => window.__ASHEN_GAME__?.scene?.getScenes(true).some((item) => item.scene.key === sceneKey), scene);
  await wait(700);
}

async function getBattleCards() {
  return page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.BattleScene;
    return scene.cardViews.map((view) => {
      const instance = scene.battle.deck.hand.find((card) => card.uid === view.uid);
      return { uid: view.uid, x: view.x, y: view.y, cardId: instance?.cardId };
    });
  });
}

async function ensureCard(cardId) {
  let cards = await getBattleCards();
  let found = cards.find((card) => card.cardId === cardId);
  if (found) return found;
  await page.evaluate((cardId) => {
    const scene = window.__ASHEN_GAME__.scene.keys.BattleScene;
    scene.battle.deck.hand.unshift({ uid: `qa-${cardId}-${Date.now()}`, cardId, upgraded: false });
    scene.renderBattle();
  }, cardId);
  await wait(120);
  cards = await getBattleCards();
  return cards.find((card) => card.cardId === cardId);
}

async function firstEnemyPosition() {
  return page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.BattleScene;
    const view = scene.enemyViews.find(Boolean);
    return { x: view.x, y: view.y };
  });
}

await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
await page.waitForSelector('canvas');
await page.waitForFunction(() => window.__ASHEN_GAME__?.scene?.keys?.MainMenuScene);
await wait(700);

await shot('01_main_menu');
await click(1200, 498);
await shot('02_guide');
await click(116, 56);
await click(1200, 448);
await shot('03_character_select');
await click(348, 452);
await shot('04_exiled_knight_selected');
await click(768, 800, 700);
await shot('05_map_initial');
const initialNode = await page.evaluate(() => {
  const view = window.__ASHEN_GAME__.scene.keys.MapScene.nodeViews.find((item) => item.selectable);
  return { x: view.x, y: view.y };
});
await click(initialNode.x, initialNode.y, 900);
await shot('07_first_battle_tutorial');
await click(860, 478, 450);
await shot('06_battle_start');

const attack = await ensureCard('knight-cleave');
await page.mouse.move(attack.x, attack.y);
await shot('08_card_hover');
await click(attack.x, attack.y, 250);
await shot('09_card_selected');
const enemy = await firstEnemyPosition();
await click(enemy.x, enemy.y, 650);
await shot('10_attack_hit');

const block = await ensureCard('knight-block');
await click(block.x, block.y, 650);
await shot('11_block_effect');
await shot('12_hand_after_card_used');
await click(1320, 742, 850);
await shot('13_enemy_turn');

await page.evaluate(() => {
  const scene = window.__ASHEN_GAME__.scene.keys.BattleScene;
  scene.battle.enemies.forEach((enemy) => {
    if (enemy.hp > 0) enemy.hp = 1;
  });
  scene.battle.player.energy = 3;
  scene.battle.deck.hand.unshift({ uid: `qa-kill-${Date.now()}`, cardId: 'knight-cleave', upgraded: true });
  scene.renderBattle();
});
await wait(150);
const killCard = await ensureCard('knight-cleave');
await click(killCard.x, killCard.y, 150);
const enemy2 = await firstEnemyPosition();
await click(enemy2.x, enemy2.y, 1200);
await shot('14_reward');

await click(768, 700, 800);
await click(735, 570, 700);
await shot('15_shop');

await startScene('EventScene');
await shot('16_event');
await startScene('RestScene');
await shot('17_rest');
await startScene('ChestScene');
await shot('18_chest');
await startScene('BattleScene', { battleType: 'boss' });
await page.waitForFunction(() => window.__ASHEN_GAME__.scene.keys.BattleScene.battle?.enemies?.some((enemy) => enemy.type === 'boss'));
await shot('19_boss_start');
await page.evaluate(() => {
  const scene = window.__ASHEN_GAME__.scene.keys.BattleScene;
  const boss = scene.battle.enemies.find((enemy) => enemy.type === 'boss');
  if (!boss) throw new Error('Boss enemy was not initialized for QA screenshot.');
  boss.hp = 50;
  scene.lastBossPhase = 1;
  scene.checkBossPhaseFeedback();
  scene.renderBattle();
});
await wait(500);
await shot('20_boss_phase_switch');
await startScene('ResultScene', { victory: true });
await shot('21_victory_result');
await startScene('ResultScene', { victory: false, run: await page.evaluate(() => window.__ASHEN_GAME__.registry.get('run')) });
await shot('22_failure_result');

await browser.close();
fs.writeFileSync(path.join(root, 'qa', 'qa-runtime-report.json'), JSON.stringify({ errors, screenshots: fs.readdirSync(outDir).filter((file) => file.endsWith('.png')).sort() }, null, 2));

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}
