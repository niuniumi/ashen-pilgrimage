import assert from 'node:assert/strict';
import { chromium } from 'playwright';

import { BGM_TRACKS, SFX_POOLS, createBgmAsset, createSfxPoolAssets } from '../src/game/AudioCatalog.js';

const inlineUrl = process.argv.find((argument) => argument.startsWith('--url='))?.slice('--url='.length);
const urlFlagIndex = process.argv.indexOf('--url');
const url = process.env.QA_URL
  ?? inlineUrl
  ?? (urlFlagIndex >= 0 ? process.argv[urlFlagIndex + 1] : null)
  ?? 'http://127.0.0.1:4193/';
const assets = [
  ...BGM_TRACKS.map((name) => ({ kind: 'bgm', key: `bgm-${name}`, path: createBgmAsset(name).urls[0] })),
  ...Object.entries(SFX_POOLS).flatMap(([name, count]) => createSfxPoolAssets(name, count).map((asset) => ({
    kind: 'sfx',
    key: asset.key,
    path: asset.urls[0]
  })))
];

const browser = await chromium.launch({ headless: true });
let results;
let behavior;
const errors = [];
try {
  const context = await browser.newContext({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1 });
  await context.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('ashen-pilgrimage-settings-v1', JSON.stringify({
      sound: true,
      music: true,
      muted: false,
      bgmVolume: 0.4,
      sfxVolume: 0.62,
      animation: false,
      fastMode: true,
      tutorialEnabled: false,
      tutorialSeen: true,
      storySeen: true
    }));
  });
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForSelector('canvas');
  await page.waitForFunction(() => {
    const game = window.__ASHEN_GAME__;
    return Boolean(game?.registry?.get('audio') && game?.scene?.keys?.MainMenuScene?.scene?.isActive());
  });
  results = await page.evaluate(async (pending) => {
    const context = new AudioContext();
    const decoded = [];
    try {
      for (const asset of pending) {
        const response = await fetch(asset.path);
        if (!response.ok) throw new Error(`${asset.key}: HTTP ${response.status}`);
        const buffer = await context.decodeAudioData(await response.arrayBuffer());
        decoded.push({
          ...asset,
          duration: buffer.duration,
          sampleRate: buffer.sampleRate,
          channels: buffer.numberOfChannels
        });
      }
    } finally {
      await context.close();
    }
    return decoded;
  }, assets);

  const beforeUnlock = await page.evaluate(() => {
    const game = window.__ASHEN_GAME__;
    const manager = game.registry.get('audio');
    const scene = game.scene.keys.MainMenuScene;
    const originalUnlock = manager.unlock.bind(manager);
    manager.__qaUnlockCalls = 0;
    manager.unlock = (...args) => {
      manager.__qaUnlockCalls += 1;
      return originalUnlock(...args);
    };
    return {
      unlocked: manager.unlocked,
      contextState: manager.getAudioContext()?.state ?? null,
      pointerListeners: scene.input.listenerCount('pointerdown'),
      keyboardListeners: scene.input.keyboard.listenerCount('keydown')
    };
  });
  assert.equal(beforeUnlock.unlocked, false, 'audio should wait for the first user gesture');

  await page.keyboard.press('KeyU');
  await page.waitForFunction(() => window.__ASHEN_GAME__.registry.get('audio').unlocked === true);
  await page.waitForFunction(() => Boolean(window.__ASHEN_GAME__.registry.get('audio').currentBgm?.isPlaying));
  await page.waitForTimeout(950);
  const unlockState = await page.evaluate(() => {
    const game = window.__ASHEN_GAME__;
    const manager = game.registry.get('audio');
    const scene = game.scene.keys.MainMenuScene;
    scene.input.emit('pointerdown', { x: -100, y: -100 });
    return {
      unlocked: manager.unlocked,
      unlockCalls: manager.__qaUnlockCalls,
      contextState: manager.getAudioContext()?.state ?? null,
      pointerListeners: scene.input.listenerCount('pointerdown'),
      keyboardListeners: scene.input.keyboard.listenerCount('keydown'),
      bgmKey: manager.currentBgmKey,
      bgmPlaying: manager.currentBgm?.isPlaying ?? false,
      bgmVolume: manager.currentBgm?.volume ?? null,
      targetBgmVolume: manager.targetBgmVolume()
    };
  });
  assert.equal(unlockState.unlockCalls, 1, 'keyboard and pointer must share one unlock binding');
  assert.equal(unlockState.unlocked, true);
  assert.notEqual(unlockState.contextState, 'suspended', 'keyboard unlock did not resume AudioContext');
  assert.equal(unlockState.bgmKey, 'bgm-menu');
  assert.equal(unlockState.bgmPlaying, true);
  assert.ok(
    Math.abs(unlockState.bgmVolume - unlockState.targetBgmVolume) < 0.03,
    `BGM did not fade to its configured target (${unlockState.bgmVolume} vs ${unlockState.targetBgmVolume})`
  );

  await page.evaluate(() => window.__ASHEN_QA__.startRun('exiled-knight', { seed: 20260722, skipVow: true }));
  await page.waitForFunction(() => window.__ASHEN_GAME__?.scene?.keys?.MapScene?.scene?.isActive());
  await page.evaluate(() => window.__ASHEN_QA__.startScene('BattleScene', { battleType: 'battle' }));
  await page.waitForFunction(() => {
    const game = window.__ASHEN_GAME__;
    return game?.scene?.keys?.BattleScene?.scene?.isActive()
      && game.registry.get('audio')?.currentBgmKey === 'bgm-battle-act-1'
      && game.cache.audio.exists('sfx-attack-1');
  });
  await page.waitForTimeout(950);

  const mixState = await page.evaluate(() => {
    const game = window.__ASHEN_GAME__;
    const manager = game.registry.get('audio');
    const scene = game.scene.keys.BattleScene;
    const originalPlay = scene.sound.play.bind(scene.sound);
    const records = [];
    let now = 10_000;
    scene.sound.play = (key, config) => {
      records.push({ key, ...config });
      return originalPlay(key, config);
    };
    manager.now = () => now;
    manager.random = () => 1;
    manager.lastPlayed.clear();
    manager.poolCursor.clear();
    const baselineBgmTarget = manager.targetBgmVolume();
    manager.play('uiHover');
    manager.play('cardHover');
    now += 120;
    manager.play('cardHover');
    manager.play('swordHit', { cooldown: 0 });
    return {
      records,
      hoverCooldownStamp: manager.lastPlayed.get('hover'),
      baselineBgmTarget,
      transientDuckGain: manager.transientDuckGain,
      targetDuringDuck: manager.targetBgmVolume()
    };
  });
  const hoverRecords = mixState.records.filter(({ key }) => key.startsWith('sfx-ui-hover-'));
  assert.equal(hoverRecords.length, 2, 'shared hover cooldown did not suppress the rapid second sound');
  assert.ok(hoverRecords.every(({ rate }) => rate > 1 && rate <= 1.04), 'SFX pitch variance left the subtle range');
  assert.ok(hoverRecords.every(({ volume }) => volume > 0 && volume < 0.3), 'UI SFX mix volume is outside the intended layer');
  assert.ok(
    mixState.transientDuckGain < 1,
    `heavy impact did not duck BGM (${JSON.stringify(mixState)})`
  );
  assert.ok(mixState.targetDuringDuck < mixState.baselineBgmTarget, 'ducked BGM target was not reduced');
  await page.waitForFunction(() => window.__ASHEN_GAME__.registry.get('audio').transientDuckGain === 1);

  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  await page.waitForFunction(() => window.__ASHEN_GAME__.registry.get('audio').currentBgm?.isPaused === true);
  const hiddenState = await page.evaluate(() => {
    const manager = window.__ASHEN_GAME__.registry.get('audio');
    return {
      lifecycleHidden: manager.lifecycleHidden,
      lifecycleOwnsPause: manager.lifecyclePausedBgm === manager.currentBgm,
      paused: manager.currentBgm?.isPaused ?? false
    };
  });
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await page.waitForFunction(() => window.__ASHEN_GAME__.registry.get('audio').currentBgm?.isPlaying === true);
  await page.waitForTimeout(320);
  const resumedState = await page.evaluate(() => {
    const manager = window.__ASHEN_GAME__.registry.get('audio');
    return {
      lifecycleHidden: manager.lifecycleHidden,
      lifecycleOwnsPause: Boolean(manager.lifecyclePausedBgm),
      playing: manager.currentBgm?.isPlaying ?? false,
      volume: manager.currentBgm?.volume ?? null,
      target: manager.targetBgmVolume()
    };
  });
  assert.deepEqual(hiddenState, { lifecycleHidden: true, lifecycleOwnsPause: true, paused: true });
  assert.equal(resumedState.lifecycleHidden, false);
  assert.equal(resumedState.lifecycleOwnsPause, false);
  assert.equal(resumedState.playing, true);
  assert.ok(Math.abs(resumedState.volume - resumedState.target) < 0.03, 'lifecycle resume did not fade to target');

  const manualDisableState = await page.evaluate(async () => {
    const manager = window.__ASHEN_GAME__.registry.get('audio');
    await manager.handleVisibilityChange(true);
    const settings = JSON.parse(localStorage.getItem('ashen-pilgrimage-settings-v1'));
    settings.music = false;
    localStorage.setItem('ashen-pilgrimage-settings-v1', JSON.stringify(settings));
    const sound = manager.currentBgm;
    await manager.handleVisibilityChange(false);
    return {
      remainedPaused: sound?.isPaused ?? false,
      lifecycleOwnsPause: Boolean(manager.lifecyclePausedBgm)
    };
  });
  assert.deepEqual(manualDisableState, { remainedPaused: true, lifecycleOwnsPause: false });

  behavior = {
    beforeUnlock,
    unlockState,
    mix: {
      played: mixState.records.map(({ key, volume, rate }) => ({ key, volume, rate })),
      hoverSharedCooldown: true,
      duckGain: mixState.transientDuckGain
    },
    lifecycle: { hiddenState, resumedState, manualDisableState }
  };
  await context.close();
} finally {
  await browser.close();
}

assert.equal(results.length, assets.length);
for (const asset of results) {
  assert.ok(Number.isFinite(asset.duration) && asset.duration > 0, `${asset.key} has no decoded duration`);
  assert.ok(asset.sampleRate >= 22050, `${asset.key} sample rate is too low`);
  assert.ok(asset.channels >= 1, `${asset.key} has no audio channels`);
  if (asset.kind === 'bgm') assert.ok(asset.duration >= 20, `${asset.key} is too short for looping music`);
  else assert.ok(asset.duration <= 8, `${asset.key} is too long for a sound effect`);
}
assert.deepEqual(errors, []);

console.log(JSON.stringify({
  ok: true,
  url,
  decoded: results.length,
  bgm: results.filter((asset) => asset.kind === 'bgm').length,
  sfx: results.filter((asset) => asset.kind === 'sfx').length,
  bgmDurations: Object.fromEntries(results.filter((asset) => asset.kind === 'bgm').map((asset) => [asset.key, Number(asset.duration.toFixed(2))])),
  behavior,
  errors
}, null, 2));
