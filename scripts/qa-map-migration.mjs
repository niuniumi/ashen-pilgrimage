import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const url = process.env.QA_URL ?? process.argv.find((arg) => arg.startsWith('--url='))?.slice(6) ?? 'http://127.0.0.1:4173';
const outputDir = path.join(root, 'qa', 'screenshots', 'map-migration');
fs.mkdirSync(outputDir, { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function legacyRun() {
  const nodes = Array.from({ length: 7 }, (_, row) => ({
    id: `old-${row}`,
    row,
    column: 0,
    x: 1080 + row * 12,
    type: row === 6 ? 'boss' : 'battle',
    links: row < 6 ? [`old-${row + 1}`] : []
  }));
  const completed = nodes.slice(0, 6).map((node) => node.id);
  return {
    version: 2,
    id: 'legacy-map-regression',
    seed: 20260711,
    characterId: 'ashblood-alchemist',
    characterName: '灰血炼金师',
    maxHp: 76,
    hp: 42,
    baseEnergy: 3,
    gold: 202,
    floor: 6,
    deck: [{ uid: 'legacy-alchemist-card', cardId: 'alc-acid-vial', upgraded: true }],
    relics: ['black-iron-mask', 'rusty-nail'],
    vows: [],
    runStrength: 0,
    act: 1,
    startTime: 20260711,
    map: { act: 1, nodes, completed, available: ['old-6'], activeNode: null, path: completed }
  };
}

async function waitForMap(page) {
  await page.waitForFunction(() => window.__ASHEN_GAME__?.scene?.keys?.MapScene?.scene?.isActive());
}

async function readMapState(page) {
  return page.evaluate(() => {
    const game = window.__ASHEN_GAME__;
    const scene = game.scene.keys.MapScene;
    const run = game.registry.get('run');
    const labels = new Set(['战斗', '普通战斗', '精英', '事件', '商店', '休息', '宝箱', '首领']);
    const nodeContainers = scene.children.list.filter((child) => {
      return child.type === 'Container' && child.list?.some((item) => item.type === 'Text' && labels.has(item.text));
    });
    return {
      version: run.version,
      floor: run.floor,
      hp: run.hp,
      gold: run.gold,
      relics: run.relics,
      deck: run.deck,
      maxRow: Math.max(...run.map.nodes.map((node) => node.row)),
      completedRows: run.map.completed.map((id) => run.map.nodes.find((node) => node.id === id)?.row),
      availableRows: run.map.available.map((id) => run.map.nodes.find((node) => node.id === id)?.row),
      nodeViews: scene.nodeViews.map(({ id, x, y, depth }) => ({ id, x, y, depth })),
      nodeAlphas: nodeContainers.map((node) => node.alpha),
      routeAlpha: scene.children.list.find((child) => child.type === 'Graphics' && child.depth === 10)?.alpha ?? null,
      unlockPath: (() => {
        const effect = scene.children.getByName('map-unlock-path');
        const bounds = effect?.getBounds?.();
        return effect ? {
          type: effect.type,
          childCount: effect.list?.length ?? 0,
          depth: effect.depth,
          alpha: effect.alpha,
          bounds: bounds ? { width: bounds.width, height: bounds.height } : null
        } : null;
      })(),
      minNodeDepth: Math.min(...scene.nodeViews.map((node) => node.depth ?? Infinity)),
      tweenCount: scene.tweens.getTweens().length,
      mapJson: JSON.stringify(run.map)
    };
  });
}

function verify(state, phase) {
  assert(state.version === 4, `${phase}: expected run version 4`);
  assert(state.maxRow === 11, `${phase}: expected a twelve-row map`);
  assert(state.floor === 6, `${phase}: floor progress changed`);
  assert(state.hp === 42 && state.gold === 202, `${phase}: core run stats changed`);
  assert(state.relics.join(',') === 'black-iron-mask,rusty-nail', `${phase}: relics changed`);
  assert(state.deck.length === 1 && state.deck[0].upgraded, `${phase}: deck changed`);
  assert(state.completedRows.join(',') === '0,1,2,3,4,5', `${phase}: completed path was not restored`);
  assert(state.availableRows.length > 0 && state.availableRows.every((row) => row === 6), `${phase}: next row is not selectable`);
  assert(state.nodeViews.length >= 17, `${phase}: map nodes were not rendered`);
  assert(state.nodeViews.every((node) => node.x >= 360 && node.x <= 1160 && node.y >= 142 && node.y <= 704), `${phase}: node escaped map bounds`);
  assert(state.nodeAlphas.length === state.nodeViews.length, `${phase}: node containers are missing (${state.nodeAlphas.length}/${state.nodeViews.length})`);
  assert(state.nodeAlphas.every((alpha) => alpha === 1), `${phase}: a map node started transparent`);
  assert(state.routeAlpha >= 0.46, `${phase}: route layer started invisible`);
  assert(state.unlockPath?.type === 'Container' && state.unlockPath.childCount > 0, `${phase}: newly unlocked route is not rendered content`);
  assert(state.unlockPath.bounds?.width > 0 && state.unlockPath.bounds?.height > 0, `${phase}: unlock route has no real rendered bounds`);
  assert(state.unlockPath.depth < state.minNodeDepth, `${phase}: unlock route can obstruct map nodes or labels`);
  assert(state.unlockPath.alpha === 1, `${phase}: disabled animation did not apply the final route highlight`);
  assert(state.tweenCount === 0, `${phase}: disabled animation left ${state.tweenCount} map tweens`);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1536, height: 864 } });
await context.addInitScript((run) => {
  localStorage.clear();
  localStorage.setItem('ashen-pilgrimage-save-v1', JSON.stringify(run));
  localStorage.setItem('ashen-pilgrimage-settings-v1', JSON.stringify({
    sound: false,
    music: false,
    muted: true,
    animation: false,
    fastMode: false,
    tutorialSeen: true,
    storySeen: true
  }));
}, legacyRun());

const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});

try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => Boolean(window.__ASHEN_QA__));
  await page.evaluate(() => window.__ASHEN_QA__.startScene('MapScene'));
  await waitForMap(page);
  const initial = await readMapState(page);
  verify(initial, 'initial migration');
  await page.waitForTimeout(1000);
  const afterEffect = await readMapState(page);
  assert(afterEffect.mapJson === initial.mapJson, 'unlock feedback mutated migrated map topology or statuses');
  await page.screenshot({ path: path.join(outputDir, 'legacy-map-restored.png') });

  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => Boolean(window.__ASHEN_QA__));
  await page.evaluate(() => window.__ASHEN_QA__.startScene('MapScene'));
  await waitForMap(page);
  const reloaded = await readMapState(page);
  verify(reloaded, 'persisted migration');

  const entered = await page.evaluate(() => {
    const run = window.__ASHEN_GAME__.registry.get('run');
    return window.__ASHEN_QA__.enterNode(run.map.available[0]);
  });
  assert(entered?.nodeId, 'restored selectable node could not be entered');
  assert(errors.length === 0, errors.join('\n'));
  console.log(JSON.stringify({ ok: true, initial, reloaded, entered }, null, 2));
} finally {
  await context.close();
  await browser.close();
}
