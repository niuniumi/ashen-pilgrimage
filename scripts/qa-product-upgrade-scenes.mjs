import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { BUILD_VERSION } from '../src/game/constants.js';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  ({ chromium } = require('C:/Users/16224/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/playwright@1.61.0/node_modules/playwright'));
}

const root = process.cwd();
const outDir = path.join(root, 'qa', 'screenshots', 'product_upgrade');
fs.mkdirSync(outDir, { recursive: true });

const URL = process.env.QA_URL ?? process.argv.find((arg) => arg.startsWith('--url='))?.slice(6) ?? 'http://127.0.0.1:4176';
const TASK5_ONLY = process.argv.includes('--task5-only');
const report = {
  version: BUILD_VERSION,
  url: URL,
  generatedAt: new Date().toISOString(),
  screenshots: [],
  errors: []
};

const roles = [
  { slug: 'knight', id: 'exiled-knight', select: { x: 300, y: 462 } },
  { slug: 'nun', id: 'candle-nun', select: { x: 640, y: 462 } },
  { slug: 'alchemist', id: 'ashblood-alchemist', select: { x: 980, y: 462 } }
];

function rel(file) {
  return path.relative(root, file).replaceAll('\\', '/');
}

function assert(value, message) {
  if (!value) {
    throw new Error(message);
  }
}

function attachErrors(page) {
  page.on('pageerror', (error) => report.errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      report.errors.push(`console: ${message.text()}`);
    }
  });
}

async function waitScene(page, sceneKey) {
  await page.waitForFunction((key) => window.__ASHEN_GAME__?.scene?.getScenes(true).some((scene) => scene.scene.key === key), sceneKey, {
    timeout: 45000
  });
}

async function canvasRect(page) {
  return page.locator('canvas').evaluate((canvas) => {
    const r = canvas.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
}

async function point(page, x, y) {
  const rect = await canvasRect(page);
  return {
    x: rect.x + (x / 1536) * rect.width,
    y: rect.y + (y / 864) * rect.height
  };
}

async function clickGame(page, x, y, delay = 300) {
  const p = await point(page, x, y);
  await page.mouse.move(p.x, p.y);
  await page.waitForTimeout(30);
  await page.mouse.click(p.x, p.y);
  await page.waitForTimeout(delay);
}

async function screenshot(page, name, delay = 260) {
  if (delay > 0) await page.waitForTimeout(delay);
  const file = path.join(outDir, name);
  await page.screenshot({ path: file });
  report.screenshots.push(rel(file));
  return file;
}

function contained(bounds) {
  return bounds.left >= 0 && bounds.top >= 0 && bounds.right <= 1536 && bounds.bottom <= 864;
}

async function choiceSceneSnapshot(page, sceneKey) {
  return page.evaluate((key) => {
    const scene = window.__ASHEN_GAME__?.scene?.keys?.[key];
    const boundsOf = (view) => {
      const bounds = view?.getBounds?.();
      if (!bounds) return null;
      return {
        left: bounds.left,
        top: bounds.top,
        right: bounds.right,
        bottom: bounds.bottom,
        width: bounds.width,
        height: bounds.height
      };
    };
    return {
      controller: scene?.choiceController?.state ?? null,
      choices: (scene?.choiceViews ?? []).map(({ id, view }) => ({
        id,
        type: view?.type,
        name: view?.name,
        selected: view?.selected,
        confirmed: view?.confirmed,
        disabled: view?.disabled,
        textAlpha: view?.nameText?.alpha ?? view?.text?.alpha ?? null,
        x: view?.x,
        y: view?.y,
        baseY: view?.baseY,
        bounds: boundsOf(view),
        attached: Boolean(view && scene?.children?.exists(view))
      })),
      confirm: scene?.confirmButton ? {
        type: scene.confirmButton.type,
        name: scene.confirmButton.name,
        disabled: scene.confirmButton.disabled,
        x: scene.confirmButton.x,
        y: scene.confirmButton.y,
        bounds: boundsOf(scene.confirmButton),
        attached: scene.children.exists(scene.confirmButton)
      } : null,
      skip: scene?.skipButton ? {
        type: scene.skipButton.type,
        name: scene.skipButton.name,
        disabled: scene.skipButton.disabled,
        x: scene.skipButton.x,
        y: scene.skipButton.y,
        bounds: boundsOf(scene.skipButton),
        attached: scene.children.exists(scene.skipButton)
      } : null,
      tweenCount: scene?.tweens?.getTweens()?.length ?? -1
    };
  }, sceneKey);
}

async function runSnapshot(page) {
  return page.evaluate(() => {
    const run = window.__ASHEN_GAME__?.registry?.get('run');
    return JSON.stringify({
      hp: run?.hp,
      maxHp: run?.maxHp,
      gold: run?.gold,
      deck: run?.deck,
      relics: run?.relics,
      currentEvent: run?.currentEvent,
      pendingReward: run?.pendingReward,
      pendingScene: run?.pendingScene,
      pendingBattleType: run?.pendingBattleType,
      map: run?.map
    });
  });
}

function assertChoiceLayout(snapshot, label, sceneKey) {
  assert(snapshot.controller, `${label}: ${sceneKey} has no SceneChoiceController state`);
  assert(snapshot.choices.length >= 2, `${label}: ${sceneKey} has fewer than two real choices`);
  assert(snapshot.confirm, `${label}: ${sceneKey} has no fixed confirmation command`);
  assert(snapshot.confirm.type === 'Container' && snapshot.confirm.attached, `${label}: confirmation is not a rendered component`);
  assert(contained(snapshot.confirm.bounds), `${label}: confirmation bounds escape the game canvas`);
  for (const choice of snapshot.choices) {
    assert(choice.type === 'Container' && choice.attached, `${label}: ${choice.id} is not a rendered component`);
    assert(choice.bounds?.width > 0 && choice.bounds?.height > 0, `${label}: ${choice.id} has no rendered bounds`);
    assert(contained(choice.bounds), `${label}: ${choice.id} escapes the game canvas`);
    assert(!overlaps(choice.bounds, snapshot.confirm.bounds, 8), `${label}: ${choice.id} overlaps confirmation`);
  }
  for (let index = 0; index < snapshot.choices.length; index += 1) {
    for (let other = index + 1; other < snapshot.choices.length; other += 1) {
      assert(!overlaps(snapshot.choices[index].bounds, snapshot.choices[other].bounds, 8), `${label}: repeated choices overlap`);
    }
  }
  if (snapshot.skip) {
    assert(snapshot.skip.type === 'Container' && snapshot.skip.attached, `${label}: reward skip is not rendered`);
    assert(contained(snapshot.skip.bounds), `${label}: reward skip escapes the canvas`);
    assert(!overlaps(snapshot.skip.bounds, snapshot.confirm.bounds, 8), `${label}: reward skip overlaps confirmation`);
  }
}

async function installSaveWriteCounter(page) {
  await page.evaluate(() => {
    window.__TASK5_SAVE_WRITES__ = 0;
    if (window.__TASK5_SAVE_COUNTER_INSTALLED__) return;
    window.__TASK5_SAVE_COUNTER_INSTALLED__ = true;
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function task5CountedSetItem(key, value) {
      if (key === 'ashen-pilgrimage-save-v1') window.__TASK5_SAVE_WRITES__ += 1;
      return original.call(this, key, value);
    };
  });
}

async function startChoiceScene(page, sceneKey, nodeType, animation) {
  await page.evaluate(() => window.__ASHEN_QA__.startRun('exiled-knight', { seed: 20260716, skipVow: true }));
  await waitScene(page, 'MapScene');
  await page.evaluate((motionEnabled) => {
    const key = 'ashen-pilgrimage-settings-v1';
    const settings = JSON.parse(localStorage.getItem(key) ?? '{}');
    localStorage.setItem(key, JSON.stringify({ ...settings, sound: false, music: false, animation: motionEnabled }));
  }, animation);
  await forceScene(page, sceneKey, nodeType);
  await installSaveWriteCounter(page);
}

async function selectFirstChoice(page, sceneKey) {
  const target = await page.evaluate((key) => {
    const scene = window.__ASHEN_GAME__?.scene?.keys?.[key];
    const choice = scene?.choiceViews?.find(({ view }) => !view.disabled);
    return choice ? { x: choice.view.x, y: choice.view.y } : null;
  }, sceneKey);
  assert(target, `${sceneKey}: no enabled rendered choice`);
  await clickGame(page, target.x, target.y, 250);
  const neutral = await point(page, 120, 120);
  await page.mouse.move(neutral.x, neutral.y);
  await page.waitForTimeout(25);
}

async function captureChoiceFlow(browser, { sceneKey, nodeType, slug }, width, height, animation = true) {
  const { context, page } = await setupPage(browser, { width, height });
  const label = `${slug} ${width}x${height} ${animation ? 'motion' : 'still'}`;
  try {
    await startChoiceScene(page, sceneKey, nodeType, animation);
    const before = await runSnapshot(page);
    const initial = await choiceSceneSnapshot(page, sceneKey);
    assertChoiceLayout(initial, label, sceneKey);
    const confirmPosition = { x: initial.confirm.x, y: initial.confirm.y };

    await selectFirstChoice(page, sceneKey);
    const selected = await choiceSceneSnapshot(page, sceneKey);
    assertChoiceLayout(selected, label, sceneKey);
    assert(selected.controller.selectedId === selected.choices.find((choice) => choice.selected)?.id, `${label}: controller and rendered selection disagree`);
    assert(selected.choices.filter((choice) => choice.selected).length === 1, `${label}: expected one actual selected component`);
    assert(selected.confirm.disabled === false, `${label}: confirmation did not become enabled`);
    assert(selected.confirm.x === confirmPosition.x && selected.confirm.y === confirmPosition.y, `${label}: confirmation moved after selection`);
    assert(await runSnapshot(page) === before, `${label}: pointer selection mutated the run`);
    if (sceneKey === 'RewardScene') {
      const choice = selected.choices.find((item) => item.selected);
      assert(Math.abs(choice.y - (choice.baseY - 12)) < 0.25, `${label}: selected reward did not finish exactly 12 px above its base`);
      assert(Math.abs(choice.bounds.width - 148) < 0.25, `${label}: selected reward bounds do not match its rendered 132 px card plus 8 px focus frame`);
    }
    if (!animation) assert(selected.tweenCount === 0, `${label}: disabled animation owns ${selected.tweenCount} tweens`);
    await screenshot(page, `${slug}_selected_${width}x${height}${animation ? '' : '_still'}.png`, 0);

    await page.evaluate(() => { window.__TASK5_SAVE_WRITES__ = 0; });
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(35);
    const locked = await choiceSceneSnapshot(page, sceneKey);
    assert(locked.controller?.locked === true, `${label}: confirmation did not synchronously lock`);
    const confirmedChoice = locked.choices.find((choice) => choice.id === locked.controller?.confirmedId);
    assert(confirmedChoice?.confirmed === true, `${label}: confirmed selection is not rendered as confirmed`);
    assert(confirmedChoice?.textAlpha === 1, `${label}: confirmed selection remains visually muted after locking`);
    assert(locked.choices.every((choice) => choice.disabled), `${label}: a locked choice remains enabled`);
    assert(locked.confirm?.x === confirmPosition.x && locked.confirm?.y === confirmPosition.y, `${label}: confirmation moved while locked`);
    const writes = await page.evaluate(() => window.__TASK5_SAVE_WRITES__);
    assert(writes === 1, `${label}: duplicate confirmation produced ${writes} save settlements`);
    await screenshot(page, `${slug}_confirmed_${width}x${height}${animation ? '' : '_still'}.png`, 0);

    if (sceneKey === 'EventScene') await page.waitForTimeout(animation ? 230 : 0);
    report[`task5${slug}${width}x${height}${animation ? 'Motion' : 'Still'}`] = { selected, locked, writes };
  } finally {
    await context.close();
  }
}

async function verifyRewardSkipExactlyOnce(browser) {
  const { context, page } = await setupPage(browser);
  try {
    await startChoiceScene(page, 'RewardScene', 'battle', true);
    await page.evaluate(() => { window.__TASK5_SAVE_WRITES__ = 0; });
    const state = await page.evaluate(() => {
      const scene = window.__ASHEN_GAME__.scene.keys.RewardScene;
      scene.skipReward();
      scene.skipReward();
      return {
        writes: window.__TASK5_SAVE_WRITES__,
        locked: scene.choiceController.state.locked,
        skipConfirmed: scene.skipButton.confirmed
      };
    });
    assert(state.writes === 1, `reward skip produced ${state.writes} save settlements`);
    assert(state.locked && state.skipConfirmed, 'reward skip did not share the locked confirmed state');
    await screenshot(page, 'reward_skip_confirmed_1536x864.png', 0);
  } finally {
    await context.close();
  }
}

async function captureChoiceShutdown(browser, sceneKey, nodeType) {
  const { context, page } = await setupPage(browser);
  try {
    await startChoiceScene(page, sceneKey, nodeType, true);
    await page.evaluate((key) => {
      const scene = window.__ASHEN_GAME__.scene.keys[key];
      window.__TASK5_CONTROLLER_REF__ = scene.choiceController;
    }, sceneKey);
    await page.evaluate(() => window.__ASHEN_QA__.startScene('MapScene'));
    await waitScene(page, 'MapScene');
    const cleanup = await page.evaluate((key) => {
      const scene = window.__ASHEN_GAME__.scene.keys[key];
      return {
        destroyed: window.__TASK5_CONTROLLER_REF__?.destroyed,
        sceneControllerCleared: scene.choiceController === null,
        keyHandlerCleared: scene.choiceKeyHandler === null,
        timerCount: scene.time?.getAllEvents?.().length ?? 0
      };
    }, sceneKey);
    assert(cleanup.destroyed === true, `${sceneKey}: controller survived shutdown`);
    assert(cleanup.sceneControllerCleared && cleanup.keyHandlerCleared, `${sceneKey}: shutdown left choice listeners attached`);
    assert(cleanup.timerCount === 0, `${sceneKey}: shutdown left ${cleanup.timerCount} timers`);
  } finally {
    await context.close();
  }
}

async function captureMapUnlock(browser, width, height, animation) {
  const { context, page } = await setupPage(browser, { width, height });
  const label = `map ${width}x${height} ${animation ? 'motion' : 'still'}`;
  try {
    await page.evaluate(() => window.__ASHEN_QA__.startRun('exiled-knight', { seed: 20260716, skipVow: true }));
    await waitScene(page, 'MapScene');
    const topology = await page.evaluate((motionEnabled) => {
      const settingsKey = 'ashen-pilgrimage-settings-v1';
      const settings = JSON.parse(localStorage.getItem(settingsKey) ?? '{}');
      localStorage.setItem(settingsKey, JSON.stringify({ ...settings, sound: false, music: false, animation: motionEnabled }));
      const run = window.__ASHEN_GAME__.registry.get('run');
      const source = run.map.nodes.find((node) => run.map.available.includes(node.id));
      run.map.completed = [source.id];
      run.map.path = [source.id];
      run.map.available = [...source.links];
      run.map.activeNode = null;
      localStorage.setItem('ashen-pilgrimage-save-v1', JSON.stringify(run));
      const value = JSON.stringify(run.map);
      window.__ASHEN_QA__.startScene('MapScene');
      return value;
    }, animation);
    await waitScene(page, 'MapScene');
    await page.waitForTimeout(animation ? 270 : 20);
    const state = await page.evaluate(() => {
      const scene = window.__ASHEN_GAME__.scene.keys.MapScene;
      const effect = scene.children.getByName('map-unlock-path');
      const bounds = effect?.getBounds?.();
      return {
        map: JSON.stringify(window.__ASHEN_GAME__.registry.get('run').map),
        effect: effect ? {
          type: effect.type,
          childCount: effect.list?.length ?? 0,
          depth: effect.depth,
          alpha: effect.alpha,
          bounds: bounds ? { left: bounds.left, top: bounds.top, right: bounds.right, bottom: bounds.bottom, width: bounds.width, height: bounds.height } : null
        } : null,
        minNodeDepth: Math.min(...scene.nodeViews.map((node) => node.depth ?? Infinity)),
        tweenCount: scene.tweens.getTweens().length
      };
    });
    assert(state.map === topology, `${label}: map unlock rendering mutated topology or statuses`);
    assert(state.effect?.type === 'Container' && state.effect.childCount > 0, `${label}: unlock effect is not rendered path content`);
    assert(state.effect.bounds?.width > 0 && state.effect.bounds?.height > 0, `${label}: unlock effect lacks real rendered bounds`);
    assert(state.effect.depth < state.minNodeDepth, `${label}: unlock path can obstruct node labels`);
    assert(Math.abs(state.effect.alpha - 1) < 0.01, `${label}: unlock path did not reach its final highlighted state`);
    if (!animation) assert(state.tweenCount === 0, `${label}: disabled map animation owns ${state.tweenCount} tweens`);
    await screenshot(page, `map_unlock_${width}x${height}${animation ? '' : '_still'}.png`, 0);
    report[`task5Map${width}x${height}${animation ? 'Motion' : 'Still'}`] = state;
  } finally {
    await context.close();
  }
}

async function captureTask5Scenes(browser) {
  const scenes = [
    { sceneKey: 'RewardScene', nodeType: 'battle', slug: 'reward' },
    { sceneKey: 'EventScene', nodeType: 'event', slug: 'event' },
    { sceneKey: 'RestScene', nodeType: 'rest', slug: 'rest' }
  ];
  for (const viewport of [{ width: 1536, height: 864 }, { width: 1280, height: 720 }]) {
    for (const scene of scenes) await captureChoiceFlow(browser, scene, viewport.width, viewport.height, true);
    await captureMapUnlock(browser, viewport.width, viewport.height, true);
  }
  for (const scene of scenes) await captureChoiceFlow(browser, scene, 1280, 720, false);
  await captureMapUnlock(browser, 1280, 720, false);
  await verifyRewardSkipExactlyOnce(browser);
  for (const scene of scenes) await captureChoiceShutdown(browser, scene.sceneKey, scene.nodeType);
}

const RESULT_REGION_NAMES = ['result-figure', 'result-narrative', 'result-stats', 'result-deck', 'result-actions'];

function overlaps(a, b, gap = 0) {
  return !(
    a.right + gap <= b.left ||
    b.right + gap <= a.left ||
    a.bottom + gap <= b.top ||
    b.bottom + gap <= a.top
  );
}

async function resultLayoutSnapshot(page) {
  return page.evaluate((regionNames) => {
    const scene = window.__ASHEN_GAME__?.scene?.keys?.ResultScene;
    const regions = Object.fromEntries(regionNames.map((name) => {
      const region = scene?.children?.getByName(name);
      if (!region) return [name, null];
      const bounds = region.getBounds();
      const childBounds = (region.list ?? [])
        .filter((child) => child.visible !== false && typeof child.getBounds === 'function')
        .map((child) => child.getBounds())
        .filter((value) => Number.isFinite(value?.left) && value.width > 0 && value.height > 0);
      const contentBounds = childBounds.length ? {
        left: Math.min(...childBounds.map((value) => value.left)),
        top: Math.min(...childBounds.map((value) => value.top)),
        right: Math.max(...childBounds.map((value) => value.right)),
        bottom: Math.max(...childBounds.map((value) => value.bottom))
      } : null;
      return [name, {
        type: region.type,
        childCount: region.list?.length ?? 0,
        childNames: (region.list ?? []).map((child) => child.name).filter(Boolean),
        left: bounds.left,
        top: bounds.top,
        right: bounds.right,
        bottom: bounds.bottom,
        width: bounds.width,
        height: bounds.height,
        contentBounds
      }];
    }));
    const figure = scene?.children?.getByName('result-figure');
    const tombstone = figure?.getByName?.('defeat-tombstone-art') ?? scene?.children?.getByName('defeat-tombstone-art');
    return {
      regions,
      tombstone: tombstone ? {
        sourceWidth: tombstone.width,
        sourceHeight: tombstone.height,
        displayWidth: tombstone.displayWidth,
        displayHeight: tombstone.displayHeight
      } : null
    };
  }, RESULT_REGION_NAMES);
}

function assertResultLayout(snapshot, label, victory) {
  for (const name of RESULT_REGION_NAMES) {
    const region = snapshot.regions[name];
    assert(region, `${label}: missing named result region ${name}`);
    assert(region.type === 'Container', `${label}: ${name} is a detached ${region.type} instead of a rendered Container`);
    assert(region.childCount > 0, `${label}: ${name} has no rendered children`);
    assert(region.contentBounds, `${label}: ${name} has no measurable rendered content`);
    assert(region.width > 0 && region.height > 0, `${label}: ${name} must have stable dimensions`);
    assert(region.left >= 0 && region.top >= 0 && region.right <= 1536 && region.bottom <= 864, `${label}: ${name} escapes the game canvas`);
    for (const edge of ['left', 'top', 'right', 'bottom']) {
      assert(Math.abs(region[edge] - region.contentBounds[edge]) < 0.5, `${label}: ${name} ${edge} is not derived from rendered child bounds`);
    }
  }

  const figure = snapshot.regions['result-figure'];
  const narrative = snapshot.regions['result-narrative'];
  const stats = snapshot.regions['result-stats'];
  const deck = snapshot.regions['result-deck'];
  const actions = snapshot.regions['result-actions'];
  assert(!overlaps(figure, narrative), `${label}: figure overlaps narrative`);
  assert(!overlaps(figure, stats), `${label}: figure overlaps statistics`);
  assert(!overlaps(figure, deck), `${label}: figure overlaps deck`);
  assert(!overlaps(narrative, stats), `${label}: narrative overlaps statistics`);
  assert(!overlaps(narrative, deck), `${label}: narrative overlaps deck`);
  assert(!overlaps(stats, deck), `${label}: statistics overlaps deck`);
  assert(!overlaps(actions, stats), `${label}: actions overlaps statistics`);
  assert(!overlaps(actions, deck), `${label}: actions overlaps deck`);
  for (const childName of ['result-actions-rule', 'result-action-restart', 'result-action-menu']) {
    assert(actions.childNames.includes(childName), `${label}: actions region omits rendered child ${childName}`);
  }

  if (!victory) {
    assert(snapshot.tombstone, `${label}: defeat tombstone is not rendered`);
    const sourceRatio = snapshot.tombstone.sourceWidth / snapshot.tombstone.sourceHeight;
    const displayRatio = snapshot.tombstone.displayWidth / snapshot.tombstone.displayHeight;
    assert(Math.abs(sourceRatio - displayRatio) < 0.002, `${label}: defeat tombstone aspect ratio is distorted`);
  }
}

function inspectDefeatPalette(file) {
  const program = String.raw`
import json
import sys
from PIL import Image, ImageStat

image = Image.open(sys.argv[1]).convert("RGB")
pixels = list(image.getdata())
green = sum(1 for red, value, blue in pixels if value >= 48 and value > red * 1.18 and value > blue * 1.08)
luma = image.convert("L")
luma_pixels = list(luma.getdata())
stats = ImageStat.Stat(luma)
mean = stats.mean[0]
stddev = stats.stddev[0]
near_mean = sum(1 for value in luma_pixels if abs(value - mean) <= 4)
dark = sum(1 for value in luma_pixels if value <= 48)
bright = sum(1 for value in luma_pixels if value >= 220)
print(json.dumps({
  "pixels": len(pixels),
  "greenDominant": green,
  "ratio": green / max(1, len(pixels)),
  "lumaMean": mean,
  "lumaStdDev": stddev,
  "nearMeanRatio": near_mean / max(1, len(luma_pixels)),
  "darkRatio": dark / max(1, len(luma_pixels)),
  "brightRatio": bright / max(1, len(luma_pixels))
}))
`;
  const candidates = [
    { command: process.env.PYTHON ?? 'python', args: [] },
    { command: 'py', args: ['-3'] }
  ];
  const failures = [];
  for (const candidate of candidates) {
    const result = spawnSync(candidate.command, [...candidate.args, '-c', program, file], {
      encoding: 'utf8',
      windowsHide: true
    });
    if (!result.error && result.status === 0) return JSON.parse(result.stdout.trim());
    failures.push(result.error?.message ?? result.stderr.trim() ?? `exit ${result.status}`);
  }
  throw new Error(`unable to inspect defeat palette: ${failures.join('; ')}`);
}

async function startResult(page, victory, animation) {
  await page.evaluate(() => window.__ASHEN_QA__.startRun('exiled-knight', { seed: 20260710, skipVow: true }));
  await waitScene(page, 'MapScene');
  await page.evaluate(({ isVictory, motionEnabled }) => {
    const settingsKey = 'ashen-pilgrimage-settings-v1';
    const settings = JSON.parse(window.localStorage.getItem(settingsKey) ?? '{}');
    window.localStorage.setItem(settingsKey, JSON.stringify({ ...settings, sound: false, animation: motionEnabled }));
    const run = window.__ASHEN_GAME__.registry.get('run');
    run.id = `qa-result-${isVictory ? 'victory' : 'defeat'}-${motionEnabled ? 'motion' : 'still'}`;
    run.characterName = '流亡骑士';
    run.act = 3;
    run.floor = 12;
    run.highestFloor = 312;
    run.kills = 41;
    run.gold = 187;
    run.startTime = Date.now() - 734_000;
    run.endTime = Date.now();
    run.relics = ['iron-rosary', 'pilgrim-bell', 'wax-seal'];
    run.vows = ['vow-embers', 'vow-iron'];
    const cardIds = [
      'knight-cleave', 'knight-cleave', 'knight-cleave', 'knight-block', 'knight-rend',
      'common-bandage', 'common-crossbow', 'common-old-shield', 'common-torch-swing',
      'common-ash-dodge', 'common-field-ration', 'common-smoke-bomb', 'common-grave-salt'
    ];
    run.deck = cardIds.map((cardId, index) => ({
      uid: `qa-result-card-${index}`,
      cardId,
      upgraded: index === 2 || index === 8
    }));
    window.__ASHEN_QA__.startScene('ResultScene', { victory: isVictory, run });
  }, { isVictory: victory, motionEnabled: animation });
  await waitScene(page, 'ResultScene');
  await clickGame(page, 676, 682, 80);
  await page.evaluate(() => document.activeElement?.blur());
  await page.waitForTimeout(animation ? 850 : 120);
}

async function captureResultViewport(browser, victory, width, height, animation = true) {
  const { context, page } = await setupPage(browser, { width, height });
  const label = `${victory ? 'victory' : 'defeat'} ${width}x${height}`;
  try {
    await startResult(page, victory, animation);
    const snapshot = await resultLayoutSnapshot(page);
    assertResultLayout(snapshot, label, victory);
    const file = await screenshot(page, `result_${victory ? 'victory' : 'defeat'}_${width}x${height}.png`);
    const stability = inspectDefeatPalette(file);
    report[`resultStability${victory ? 'Victory' : 'Defeat'}${width}x${height}`] = stability;
    assert(stability.lumaStdDev >= 18, `${label}: screenshot is near-uniform or washed out (stddev ${stability.lumaStdDev})`);
    assert(stability.nearMeanRatio <= 0.85, `${label}: screenshot is dominated by a flat wash (${stability.nearMeanRatio})`);
    assert(stability.darkRatio >= 0.2, `${label}: screenshot lost its dark result composition (${stability.darkRatio})`);
    assert(stability.brightRatio <= 0.3, `${label}: screenshot is overexposed (${stability.brightRatio})`);
    if (!victory) {
      report[`defeatPalette${width}x${height}`] = stability;
      assert(stability.ratio <= 0.0005, `${label}: rendered palette contains ${stability.greenDominant} green-dominant pixels`);
    }
    if (!animation) {
      const motionState = await page.evaluate(() => {
        const scene = window.__ASHEN_GAME__?.scene?.keys?.ResultScene;
        return { enabled: scene?.motionEnabled, tweenCount: scene?.tweens?.getTweens()?.length ?? -1 };
      });
      assert(motionState.enabled === false, `${label}: result scene ignored the disabled animation setting`);
      assert(motionState.tweenCount === 0, `${label}: result scene owns active tweens while animation is disabled`);
    }
    return snapshot;
  } finally {
    await context.close();
  }
}

async function setupPage(browser, viewport = { width: 1536, height: 864 }) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  await context.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem(
      'ashen-pilgrimage-settings-v1',
      JSON.stringify({ sound: false, animation: true, fastMode: false, tutorialEnabled: true, tutorialSeen: true, storySeen: true })
    );
  });
  const page = await context.newPage();
  attachErrors(page);
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('canvas');
  await waitScene(page, 'MainMenuScene');
  return { context, page };
}

async function startCharacterSelect(page) {
  await page.evaluate(() => window.__ASHEN_QA__.startScene('CharacterSelectScene'));
  await waitScene(page, 'CharacterSelectScene');
}

async function startJourneyToMap(page, role = roles[0], vowScreenshot = null) {
  await page.evaluate(({ characterId }) => window.__ASHEN_QA__.startRun(characterId, { seed: 20260710, skipVow: false }), {
    characterId: role.id
  });
  await waitScene(page, 'VowScene');
  if (vowScreenshot) await screenshot(page, vowScreenshot);
  await page.evaluate(() => window.__ASHEN_QA__.chooseVow(0));
  await waitScene(page, 'MapScene');
}

async function firstSelectableNode(page) {
  return page.evaluate(() => {
    const scene = window.__ASHEN_GAME__?.scene?.keys?.MapScene;
    const node = scene?.nodeViews?.find((item) => item.selectable) ?? scene?.nodeViews?.[0];
    return node ? { x: node.x, y: node.y } : null;
  });
}

async function closeTutorialIfOpen(page) {
  const open = await page.evaluate(() => Boolean(window.__ASHEN_GAME__?.scene?.keys?.BattleScene?.tutorialPanel));
  if (open) {
    await clickGame(page, 854, 485, 260);
  }
}

async function startBattleFromMap(page) {
  const result = await page.evaluate(() => window.__ASHEN_QA__.enterNode());
  assert(result, 'no selectable map node found');
  await waitScene(page, 'BattleScene');
  await closeTutorialIfOpen(page);
}

async function forceScene(page, sceneKey, nodeType = null) {
  await page.evaluate(({ sceneKey: target, nodeType: type }) => window.__ASHEN_QA__.forceScene(target, type), {
    sceneKey,
    nodeType
  });
  await waitScene(page, sceneKey);
}

async function captureCoreScenes(browser) {
  const { context, page } = await setupPage(browser);
  try {
    await screenshot(page, '01_menu.png');
    await startCharacterSelect(page);
    await screenshot(page, '02_character_select.png');
    await startJourneyToMap(page, roles[0], '03_vow.png');
    await screenshot(page, '04_map.png');
    await startBattleFromMap(page);
    await screenshot(page, '05_battle.png');

    await forceScene(page, 'RewardScene', 'battle');
    await screenshot(page, '06_reward.png');
    await forceScene(page, 'ShopScene', 'shop');
    await screenshot(page, '07_shop.png');
    await forceScene(page, 'EventScene', 'event');
    await screenshot(page, '08_event.png');
    await forceScene(page, 'RestScene', 'rest');
    await screenshot(page, '09_rest.png');
    await forceScene(page, 'CodexScene');
    await screenshot(page, '10_codex.png');
    await forceScene(page, 'SettingsScene');
    await screenshot(page, '11_settings.png');
  } finally {
    await context.close();
  }
}

async function captureBattleViewport(browser, width, height) {
  const { context, page } = await setupPage(browser, { width, height });
  try {
    await startCharacterSelect(page);
    await startJourneyToMap(page, roles[0]);
    await startBattleFromMap(page);
    await screenshot(page, `battle_${width}x${height}.png`);
  } finally {
    await context.close();
  }
}

try {
  const browser = await chromium.launch({ headless: true });
  try {
    await captureTask5Scenes(browser);
    if (!TASK5_ONLY) {
      await captureCoreScenes(browser);
      await captureBattleViewport(browser, 1536, 864);
      await captureBattleViewport(browser, 1366, 768);
      await captureBattleViewport(browser, 1280, 720);
      const resultSnapshots = [
        await captureResultViewport(browser, true, 1536, 864),
        await captureResultViewport(browser, false, 1536, 864),
        await captureResultViewport(browser, true, 1280, 720),
        await captureResultViewport(browser, false, 1280, 720, false)
      ];
      const [reference, ...comparisons] = resultSnapshots;
      for (const snapshot of comparisons) {
        assert(snapshot.regions['result-actions'].left === reference.regions['result-actions'].left, 'result actions shift horizontally between outcomes or viewports');
        assert(snapshot.regions['result-actions'].top === reference.regions['result-actions'].top, 'result actions shift vertically between outcomes or viewports');
        assert(snapshot.regions['result-stats'].top === reference.regions['result-stats'].top, 'result statistics shift with outcome, viewport, or deck length');
      }
    }
  } finally {
    await browser.close();
  }

  assert(report.errors.length === 0, report.errors.join('\n'));
  assert(report.screenshots.length >= (TASK5_ONLY ? 20 : 38), 'expected Task 5 and release screenshots');
  fs.writeFileSync(path.join(root, 'qa', 'product-upgrade-scenes-report.json'), JSON.stringify(report, null, 2), 'utf8');
  console.log(JSON.stringify({ ok: true, screenshots: report.screenshots.length }, null, 2));
} catch (error) {
  report.errors.push(error.stack ?? error.message);
  fs.writeFileSync(path.join(root, 'qa', 'product-upgrade-scenes-report.json'), JSON.stringify(report, null, 2), 'utf8');
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
}
