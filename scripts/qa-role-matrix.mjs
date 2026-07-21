import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { characters } from '../src/data/characters.js';
import { getCard, getPlayableRewardCards } from '../src/data/cards.js';
import { createCardInstance, createNewRun } from '../src/game/GameState.js';
import { SAVE_KEY } from '../src/game/constants.js';
import { BattleSystem } from '../src/systems/BattleSystem.js';
import { RewardSystem } from '../src/systems/RewardSystem.js';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  ({ chromium } = require('C:/Users/16224/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/playwright@1.61.0/node_modules/playwright'));
}

const root = process.cwd();
const outDir = path.join(root, 'qa', 'screenshots');
const docsDir = path.join(root, 'docs');
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(docsDir, { recursive: true });

const inlineUrl = process.argv.find((argument) => argument.startsWith('--url='))?.slice('--url='.length);
const urlFlagIndex = process.argv.indexOf('--url');
const URL = process.env.QA_URL
  ?? inlineUrl
  ?? (urlFlagIndex >= 0 ? process.argv[urlFlagIndex + 1] : null)
  ?? 'http://127.0.0.1:4193/';

const roles = [
  {
    slug: 'knight',
    id: 'exiled-knight',
    name: '流亡骑士',
    nameEn: 'Exiled Knight',
    maxHp: 82,
    energyMax: 3,
    battleSpriteKey: 'knight-battle',
    select: { x: 348, y: 452 },
    startingDeck: { 'knight-cleave': 5, 'knight-block': 4, 'knight-rend': 1 },
    cardShot: ['knight-cleave', 'knight-block', 'knight-score', 'knight-rend']
  },
  {
    slug: 'nun',
    id: 'candle-nun',
    name: '圣烛修女',
    nameEn: 'Candle Nun',
    maxHp: 72,
    energyMax: 3,
    battleSpriteKey: 'nun-battle',
    select: { x: 768, y: 452 },
    startingDeck: { 'nun-flame': 5, 'nun-prayer-shield': 4, 'nun-confession-mark': 1 },
    cardShot: ['nun-flame', 'nun-prayer-shield', 'nun-confession-mark', 'nun-ignite']
  },
  {
    slug: 'alchemist',
    id: 'ashblood-alchemist',
    name: '灰血炼金师',
    nameEn: 'Ashblood Alchemist',
    maxHp: 76,
    energyMax: 3,
    battleSpriteKey: 'alchemist-battle',
    select: { x: 1188, y: 452 },
    startingDeck: { 'alc-acid-vial': 5, 'alc-leather-guard': 4, 'alc-forbidden-test': 1 },
    cardShot: ['alc-acid-vial', 'alc-leather-guard', 'alc-forbidden-test', 'alc-corrosive-flask', 'alc-bitter-draught']
  }
];

const results = {
  url: URL,
  generatedAt: new Date().toISOString(),
  data: [],
  mechanics: [],
  browser: [],
  screenshots: [],
  errors: []
};

function fail(message) {
  throw new Error(message);
}

function assert(value, message) {
  if (!value) fail(message);
}

function counts(ids) {
  return ids.reduce((acc, id) => {
    acc[id] = (acc[id] ?? 0) + 1;
    return acc;
  }, {});
}

function sameCounts(actual, expected) {
  const keys = new Set([...Object.keys(actual), ...Object.keys(expected)]);
  return [...keys].every((key) => (actual[key] ?? 0) === (expected[key] ?? 0));
}

function rel(file) {
  return path.relative(root, file).replaceAll('\\', '/');
}

function deckIds(run) {
  return run.deck.map((card) => card.cardId);
}

function assertAllowedCards(role, cardIds, label) {
  for (const cardId of cardIds) {
    const card = getCard(cardId);
    const ok = card.character === role.id || card.character === 'common' || card.character === 'status';
    assert(ok, `${label}: ${role.name} 出现非本职业卡 ${card.name}(${card.id})`);
  }
}

function allBattleIds(battle) {
  return ['drawPile', 'hand', 'discardPile', 'exhaustPile'].flatMap((pile) => battle.deck[pile].map((card) => card.cardId));
}

function play(run, battle, cardId, targetIndex = null) {
  const instance = createCardInstance(cardId);
  battle.deck.hand.unshift(instance);
  battle.player.energy = 9;
  const result = BattleSystem.useCard(run, battle, instance.uid, targetIndex);
  assert(result.ok, `${cardId} 未能打出：${result.reason}`);
  return result;
}

function freshBattle(roleId) {
  const run = createNewRun(roleId);
  const battle = BattleSystem.createBattle(run, 'battle');
  battle.deck.hand = [];
  battle.deck.drawPile = [];
  battle.deck.discardPile = [];
  battle.deck.exhaustPile = [];
  battle.player.energy = 9;
  const enemy = battle.enemies[0];
  enemy.hp = 100;
  enemy.maxHp = 100;
  enemy.block = 0;
  enemy.status = {};
  enemy.currentAction = { name: '等待', intent: 'wait', text: '等待。' };
  return { run, battle, enemy };
}

function validateDataAndRewards() {
  for (const role of roles) {
    const character = characters.find((item) => item.id === role.id);
    assert(character, `${role.name} 缺少角色数据`);
    assert(character.name === role.name, `${role.id} 中文名不一致`);
    assert(character.nameEn === role.nameEn, `${role.id} 英文名不一致`);
    assert(character.maxHp === role.maxHp, `${role.name} maxHp 错误`);
    assert(character.energyMax === role.energyMax, `${role.name} energyMax 错误`);
    assert(character.battleSpriteKey === role.battleSpriteKey, `${role.name} battleSpriteKey 错误`);
    assert(sameCounts(counts(character.startingDeck), role.startingDeck), `${role.name} characters.js 初始牌组错误`);

    const run = createNewRun(role.id);
    assert(run.characterId === role.id, `${role.name} run.characterId 错误`);
    assert(run.characterName === role.name, `${role.name} run.characterName 错误`);
    assert(run.maxHp === role.maxHp && run.hp === role.maxHp, `${role.name} run 生命错误`);
    assert(run.baseEnergy === role.energyMax, `${role.name} run 能量错误`);
    assert(sameCounts(counts(deckIds(run)), role.startingDeck), `${role.name} run 初始牌组错误`);
    assertAllowedCards(role, deckIds(run), '初始牌组');

    const battle = BattleSystem.createBattle(run, 'battle');
    assertAllowedCards(role, allBattleIds(battle), '首场战斗牌堆');
    const rewardPool = getPlayableRewardCards(role.id);
    assert(rewardPool.length >= 3, `${role.name} 奖励池卡牌不足`);
    assertAllowedCards(role, rewardPool.map((card) => card.id), '奖励池');
    const reward = RewardSystem.createReward(run, 'battle');
    assertAllowedCards(role, reward.cards.map((card) => card.id), '随机奖励');

    results.data.push({
      role: role.name,
      characterId: run.characterId,
      maxHp: run.maxHp,
      energyMax: run.baseEnergy,
      startingDeck: counts(deckIds(run)),
      rewardPool: rewardPool.map((card) => `${card.name}(${card.id})`)
    });
  }
}

function validateMechanics() {
  {
    const { run, battle, enemy } = freshBattle('exiled-knight');
    play(run, battle, 'knight-score', 0);
    assert((enemy.status.mark ?? 0) >= 2, '流亡骑士：刻痕没有施加伤痕');
    const before = enemy.hp;
    play(run, battle, 'knight-rend', 0);
    assert(before - enemy.hp >= 13, '流亡骑士：撕裂斩没有按伤痕造成额外伤害');
    assert((enemy.status.mark ?? 0) === 0, '流亡骑士：撕裂后伤痕没有清空');
    results.mechanics.push({ role: '流亡骑士', checks: ['刻痕施加伤痕', '撕裂斩额外伤害', '撕裂后清空伤痕'] });
  }

  {
    const { run, battle, enemy } = freshBattle('candle-nun');
    play(run, battle, 'nun-flame', 0);
    assert((enemy.status.candlemark ?? 0) >= 1, '圣烛修女：烛火没有施加烛印');
    const beforeBurn = enemy.hp;
    BattleSystem.endPlayerTurn(run, battle);
    assert(enemy.hp <= beforeBurn - 2, '圣烛修女：敌人回合末烛印没有燃烧');

    const second = freshBattle('candle-nun');
    play(second.run, second.battle, 'nun-confession-mark', 0);
    assert((second.enemy.status.candlemark ?? 0) >= 3, '圣烛修女：忏悔印没有施加 3 层烛印');
    const stacks = second.enemy.status.candlemark;
    const beforeIgnite = second.enemy.hp;
    play(second.run, second.battle, 'nun-ignite', 0);
    assert(second.enemy.hp <= beforeIgnite - stacks * 2, '圣烛修女：引燃烛印没有即时触发伤害');
    assert(second.enemy.status.candlemark === stacks, '圣烛修女：引燃烛印错误移除了烛印');
    results.mechanics.push({ role: '圣烛修女', checks: ['烛火施加烛印', '回合末烛印燃烧', '忏悔印叠烛印', '引燃烛印且不移除'] });
  }

  {
    const first = freshBattle('ashblood-alchemist');
    const hpBefore = first.battle.player.hp;
    play(first.run, first.battle, 'alc-forbidden-test', null);
    assert(first.battle.player.hp === hpBefore - 4, '灰血炼金师：禁药试验没有自伤');
    assert((first.battle.player.status.strength ?? 0) >= 2, '灰血炼金师：禁药试验没有获得力量');

    const second = freshBattle('ashblood-alchemist');
    const playerBefore = second.battle.player.hp;
    const enemyBefore = second.enemy.hp;
    play(second.run, second.battle, 'alc-corrosive-flask', 0);
    assert(second.battle.player.hp === playerBefore - 2, '灰血炼金师：腐蚀烧瓶没有自伤');
    assert(second.enemy.hp <= enemyBefore - 12, '灰血炼金师：腐蚀烧瓶伤害不足');

    const third = freshBattle('ashblood-alchemist');
    third.battle.deck.drawPile = [createCardInstance('alc-acid-vial'), createCardInstance('alc-leather-guard')];
    const handBefore = third.battle.deck.hand.length;
    play(third.run, third.battle, 'alc-bitter-draught', null);
    assert(third.battle.deck.hand.length >= handBefore + 2, '灰血炼金师：苦味药剂没有抽牌');

    const fourth = freshBattle('ashblood-alchemist');
    fourth.battle.player.hp = 1;
    play(fourth.run, fourth.battle, 'alc-forbidden-test', null);
    assert(fourth.battle.player.hp === 1, '灰血炼金师：自伤把玩家降到了 0');
    results.mechanics.push({ role: '灰血炼金师', checks: ['禁药试验自伤加力量', '腐蚀烧瓶自伤高伤害', '苦味药剂自伤抽牌', '自伤不能致死'] });
  }
}

async function wait(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
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

async function point(page, x, y) {
  const rect = await canvasRect(page);
  return { x: rect.x + (x / 1536) * rect.width, y: rect.y + (y / 864) * rect.height };
}

async function clickGame(page, x, y, delay = 320) {
  const p = await point(page, x, y);
  await page.mouse.move(p.x, p.y);
  await page.waitForTimeout(35);
  await page.mouse.click(p.x, p.y);
  await page.waitForTimeout(delay);
}

async function screenshot(page, fileName) {
  const file = path.join(outDir, fileName);
  await page.waitForTimeout(260);
  await page.screenshot({ path: file });
  results.screenshots.push(rel(file));
}

async function closeTutorialIfOpen(page) {
  const open = await page.evaluate(() => Boolean(window.__ASHEN_GAME__?.scene?.keys?.BattleScene?.tutorialPanel));
  if (open) await clickGame(page, 854, 485, 260);
}

async function firstSelectableNode(page) {
  return page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.MapScene;
    const node = scene.nodeViews.find((item) => item.selectable) ?? scene.nodeViews[0];
    return { x: node.x, y: node.y, id: node.id };
  });
}

async function startRoleBattle(page, role) {
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('canvas');
  await waitScene(page, 'MainMenuScene');
  await page.evaluate(() => window.__ASHEN_QA__.startScene('CharacterSelectScene'));
  await waitScene(page, 'CharacterSelectScene');
  await page.evaluate((characterId) => window.__ASHEN_GAME__.scene.keys.CharacterSelectScene.selectCharacter(characterId), role.id);
  await page.waitForTimeout(180);
  await screenshot(page, `role_matrix_${role.slug}_select.png`);

  const selectState = await page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.CharacterSelectScene;
    const texts = [];
    const visit = (child) => {
      if (child?.type === 'Text') texts.push(child.text);
      if (Array.isArray(child?.list)) child.list.forEach(visit);
    };
    scene.children.list.forEach(visit);
    return {
      selected: scene.selected,
      texts
    };
  });
  assert(selectState.selected === role.id, `${role.name} 选择页 selected 不正确`);
  assert(selectState.texts.some((text) => text.includes(role.name)), `${role.name} 选择页缺少中文名`);
    assert(!selectState.texts.some((text) => text.includes(role.nameEn)), `${role.name} 选择页仍显示英文名`);
  assert(selectState.texts.some((text) => text.includes(`生命：${role.maxHp}`)), `${role.name} 选择页缺少生命值`);
  assert(selectState.texts.some((text) => text.includes(`能量：${role.energyMax}`)), `${role.name} 选择页缺少能量值`);

  await page.evaluate((characterId) => window.__ASHEN_QA__.startRun(characterId, {
    seed: 20260710,
    skipVow: true,
    applyVow: false
  }), role.id);
  await waitScene(page, 'MapScene');
  const runBeforeReload = await page.evaluate(() => window.__ASHEN_GAME__.registry.get('run'));
  assert(runBeforeReload.characterId === role.id, `${role.name} 开始旅途后 characterId 错误`);
  assert(runBeforeReload.characterName === role.name, `${role.name} 开始旅途后 characterName 错误`);
  assert(runBeforeReload.maxHp === role.maxHp && runBeforeReload.hp === role.maxHp, `${role.name} 开始旅途后 hp 错误`);
  assert(runBeforeReload.baseEnergy === role.energyMax, `${role.name} 开始旅途后 energy 错误`);
  assert(sameCounts(counts(runBeforeReload.deck.map((card) => card.cardId)), role.startingDeck), `${role.name} 浏览器 run 初始牌组错误`);

  await page.reload({ waitUntil: 'networkidle' });
  await waitScene(page, 'MainMenuScene');
  await page.evaluate(() => window.__ASHEN_QA__.startScene('MapScene'));
  await waitScene(page, 'MapScene');
  const runAfterReload = await page.evaluate(() => window.__ASHEN_GAME__.registry.get('run'));
  assert(runAfterReload.characterId === role.id, `${role.name} 刷新后继续旅途角色被污染`);

  await page.evaluate(() => window.__ASHEN_QA__.enterNode());
  await waitScene(page, 'BattleScene');
  await closeTutorialIfOpen(page);
  await screenshot(page, `role_matrix_${role.slug}_battle.png`);

  const battleState = await page.evaluate(() => {
    const scene = window.__ASHEN_GAME__.scene.keys.BattleScene;
    const deck = scene.battle.deck;
    const cardIds = [...deck.drawPile, ...deck.hand, ...deck.discardPile, ...deck.exhaustPile].map((card) => card.cardId);
    return {
      runId: scene.run.characterId,
      playerName: scene.playerNameText?.text,
      playerArtKey: scene.playerArtKey,
      hp: scene.battle.player.hp,
      maxHp: scene.battle.player.maxHp,
      energy: scene.battle.player.energy,
      cardIds,
      hand: scene.cardViews.map((view) => ({ id: view.card.id, name: view.card.name, character: view.card.character }))
    };
  });
  assert(battleState.runId === role.id, `${role.name} BattleScene run.characterId 错误`);
  assert(battleState.playerName === role.name, `${role.name} BattleScene 玩家名称错误`);
  assert(battleState.playerArtKey === role.battleSpriteKey, `${role.name} BattleScene 玩家立绘 key 错误`);
  assert(battleState.maxHp === role.maxHp, `${role.name} BattleScene 玩家生命错误`);
  assertAllowedCards(role, battleState.cardIds, '浏览器战斗牌堆');

  const cardShot = await page.evaluate((ids) => {
    const scene = window.__ASHEN_GAME__.scene.keys.BattleScene;
    scene.battle.deck.hand = ids.map((id, index) => ({ uid: `qa-card-${id}-${index}`, cardId: id, upgraded: false }));
    scene.battle.deck.drawPile = [];
    scene.battle.deck.discardPile = [];
    scene.battle.deck.exhaustPile = [];
    scene.battle.player.energy = 9;
    scene.selectedUid = null;
    scene.renderBattle();
    return scene.cardViews.map((view) => ({ id: view.card.id, name: view.card.name, character: view.card.character }));
  }, role.cardShot);
  await screenshot(page, `role_matrix_${role.slug}_cards.png`);
  assert(cardShot.length === role.cardShot.length, `${role.name} 核心机制卡截图数量错误`);
  assertAllowedCards(role, cardShot.map((card) => card.id), '核心机制卡截图');

  results.browser.push({
    role: role.name,
    characterId: role.id,
    selectedStateOk: true,
    run: {
      characterId: runBeforeReload.characterId,
      name: runBeforeReload.characterName,
      maxHp: runBeforeReload.maxHp,
      hp: runBeforeReload.hp,
      energyMax: runBeforeReload.baseEnergy,
      startingDeck: counts(runBeforeReload.deck.map((card) => card.cardId))
    },
    battle: battleState,
    cardShot
  });
}

async function validateInvalidSaveRejected() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.addInitScript((key) => {
    window.localStorage.setItem(key, JSON.stringify({
      characterId: 'missing-role',
      hp: 1,
      maxHp: 1,
      baseEnergy: 3,
      deck: [{ uid: 'bad', cardId: 'knight-cleave', upgraded: false }],
      map: { nodes: [] }
    }));
  }, SAVE_KEY);
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('canvas');
  await waitScene(page, 'MainMenuScene');
  const cleared = await page.evaluate((key) => window.localStorage.getItem(key) === null, SAVE_KEY);
  assert(cleared, '坏档没有被 SaveManager 拒绝并清除');
  await context.close();
  await browser.close();
}

async function validateBrowserMatrix() {
  const browser = await chromium.launch({ headless: true });
  for (const role of roles) {
    const context = await browser.newContext({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1 });
    await context.addInitScript(() => {
      if (!window.sessionStorage.getItem('qa-role-matrix-cleared')) {
        window.localStorage.clear();
        window.sessionStorage.setItem('qa-role-matrix-cleared', '1');
      }
      window.localStorage.setItem(
        'ashen-pilgrimage-settings-v1',
        JSON.stringify({ sound: true, animation: true, fastMode: false, tutorialEnabled: true, tutorialSeen: true, storySeen: true })
      );
      let seed = 91;
      Math.random = () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
      };
    });
    const page = await context.newPage();
    page.on('pageerror', (error) => results.errors.push(`pageerror: ${error.message}`));
    page.on('console', (message) => {
      if (message.type() === 'error') results.errors.push(`console: ${message.text()}`);
    });
    await startRoleBattle(page, role);
    await context.close();
  }
  await browser.close();
  await validateInvalidSaveRejected();
}

function writeReports() {
  const mechanicLines = [
    '# 角色机制验证报告',
    '',
    `生成时间：${results.generatedAt}`,
    '',
    '## 结论',
    '',
    results.mechanics.length === roles.length ? 'P1 角色核心机制全部通过。' : '角色机制验证未完成。',
    '',
    '## 逐项结果',
    ''
  ];
  for (const item of results.mechanics) {
    mechanicLines.push(`### ${item.role}`, '');
    item.checks.forEach((check) => mechanicLines.push(`- 通过：${check}`));
    mechanicLines.push('');
  }
  fs.writeFileSync(path.join(docsDir, 'ROLE_MECHANIC_REPORT.md'), `${mechanicLines.join('\n')}\n`, 'utf8');

  const matrixLines = [
    '# 角色状态一致性矩阵报告',
    '',
    `测试地址：${URL}`,
    `生成时间：${results.generatedAt}`,
    '',
    '## 结论',
    '',
    results.errors.length === 0 ? 'P0/P1 角色选择、存档、牌组、战斗绑定、奖励池矩阵通过。' : '角色矩阵存在错误，禁止部署。',
    '',
    '## 数据与牌组',
    ''
  ];
  for (const item of results.data) {
    matrixLines.push(`### ${item.role}`, '');
    matrixLines.push(`- characterId：${item.characterId}`);
    matrixLines.push(`- 生命/能量：${item.maxHp}/${item.energyMax}`);
    matrixLines.push(`- 初始牌组：${Object.entries(item.startingDeck).map(([id, count]) => `${id} x${count}`).join('，')}`);
    matrixLines.push(`- 奖励池：${item.rewardPool.join('，')}`);
    matrixLines.push('');
  }
  matrixLines.push('## 浏览器矩阵截图', '');
  for (const screenshotPath of results.screenshots) matrixLines.push(`- ${screenshotPath}`);
  matrixLines.push('', '## 浏览器绑定结果', '');
  for (const item of results.browser) {
    matrixLines.push(`### ${item.role}`, '');
    matrixLines.push(`- run.characterId：${item.run.characterId}`);
    matrixLines.push(`- playerName：${item.battle.playerName}`);
    matrixLines.push(`- playerArtKey：${item.battle.playerArtKey}`);
    matrixLines.push(`- battle hp：${item.battle.hp}/${item.battle.maxHp}`);
    matrixLines.push(`- 手牌：${item.battle.hand.map((card) => card.name).join('，')}`);
    matrixLines.push('');
  }
  if (results.errors.length) {
    matrixLines.push('## 错误', '');
    results.errors.forEach((error) => matrixLines.push(`- ${error}`));
    matrixLines.push('');
  }
  fs.writeFileSync(path.join(docsDir, 'ROLE_MATRIX_REPORT.md'), `${matrixLines.join('\n')}\n`, 'utf8');
  fs.writeFileSync(path.join(root, 'qa', 'role-matrix-report.json'), JSON.stringify(results, null, 2), 'utf8');
}

try {
  validateDataAndRewards();
  validateMechanics();
  await validateBrowserMatrix();
  assert(results.errors.length === 0, results.errors.join('\n'));
  writeReports();
  console.log(JSON.stringify({ ok: true, screenshots: results.screenshots }, null, 2));
} catch (error) {
  results.errors.push(error.stack ?? error.message);
  writeReports();
  console.error(error.stack ?? error.message);
  process.exit(1);
}
