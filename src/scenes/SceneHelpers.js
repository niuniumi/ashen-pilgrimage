import { COLORS, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../game/constants.js';
import { SaveManager } from '../game/SaveManager.js';
import { sanitizeRunNumbers } from '../game/GameState.js';
import { MapSystem } from '../systems/MapSystem.js';
import { UIButton } from '../ui/UIButton.js';
import { UIToast } from '../ui/UIToast.js';
import { drawBackArrowButton } from '../ui/UIOrnament.js';
import { addHandPaintedBackground, HANDPAINTED_KEYS } from '../art/HandPaintedAssets.js';
import { getSceneBundleNames } from '../game/AssetBundleCatalog.js';
import { installSceneLoadingView, queueAssetBundles } from '../game/SceneAssetLoader.js';
import { FONT } from '../design/textStyles.js';

const ASSET_LOAD_FAILED = '__sceneAssetLoadFailed';

export function areSceneAssetsReady(scene) {
  return scene?.[ASSET_LOAD_FAILED] !== true;
}

export function preloadSceneAssets(scene, sceneKey, options = {}) {
  scene[ASSET_LOAD_FAILED] = false;
  const { title, run: providedRun, restartData = {}, ...context } = options;
  const run = providedRun ?? scene.registry.get('run') ?? SaveManager.loadRun();
  const bundleNames = getSceneBundleNames(sceneKey, {
    act: run?.act ?? run?.map?.act ?? 1,
    characterId: run?.characterId,
    ...context
  });
  const result = queueAssetBundles(scene, bundleNames);
  if (result.queued === 0) return result;

  const view = installSceneLoadingView(scene, { title });
  const failedKeys = new Set();
  const recoveryObjects = [];
  const suspendedPointerInputs = new Map();
  let keyboardSuspended = false;
  let previousKeyboardEnabled = true;

  const suspendPointerInput = () => {
    const visited = new Set();
    const suspend = (object) => {
      if (!object || visited.has(object)) return;
      visited.add(object);
      if (object.input) {
        const enabled = object.input.enabled;
        suspendedPointerInputs.set(object, enabled);
        object.input.enabled = false;
      }
      if (Array.isArray(object.list)) object.list.forEach(suspend);
    };
    scene.children?.list?.forEach(suspend);
  };
  const restoreInput = () => {
    for (const [object, enabled] of suspendedPointerInputs) {
      if (object.input) object.input.enabled = enabled;
    }
    suspendedPointerInputs.clear();
    if (!keyboardSuspended) return;
    if (scene.input?.keyboard) scene.input.keyboard.enabled = previousKeyboardEnabled;
    keyboardSuspended = false;
  };

  const cleanup = () => {
    scene.load.off('loaderror', onLoadError);
    scene.load.off('complete', onComplete);
    scene.events.off('create', showRecovery);
    scene.events.off('shutdown', cleanup);
    restoreInput();
    recoveryObjects.splice(0).forEach((object) => object.destroy?.());
  };
  const leaveLoadingView = (action) => {
    view.destroy();
    cleanup();
    action();
  };
  const showRecovery = () => {
    if (recoveryObjects.length > 0) return;
    const depth = 21000;
    suspendPointerInput();
    if (scene.input?.keyboard) {
      previousKeyboardEnabled = scene.input.keyboard.enabled;
      scene.input.keyboard.enabled = false;
      keyboardSuspended = true;
    }
    const veil = scene.add.graphics().setDepth(depth);
    veil.fillStyle(0x08090d, 0.97);
    veil.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    const message = scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 92, `以下资源加载失败：\n${[...failedKeys].join(', ')}`, {
        fontFamily: FONT,
        fontSize: 20,
        color: '#f4e7c5',
        align: 'center',
        wordWrap: { width: 920 }
      })
      .setOrigin(0.5)
      .setDepth(depth + 1);
    const blocker = scene.add
      .zone(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT)
      .setInteractive()
      .setDepth(depth + 3);
    blocker.setName('scene-loading-recovery-blocker');
    const retry = new UIButton(scene, GAME_WIDTH / 2 - 126, GAME_HEIGHT / 2 + 62, 220, 52, '重试加载', () => {
      leaveLoadingView(() => scene.scene.restart(restartData));
    }, { fontSize: 20, hitDepth: depth + 5 }).setDepth(depth + 4);
    const safeReturn = new UIButton(scene, GAME_WIDTH / 2 + 126, GAME_HEIGHT / 2 + 62, 220, 52, '安全返回', () => {
      leaveLoadingView(() => {
        if (sceneKey === SCENES.MainMenu) return;
        scene.scene.start(SCENES.MainMenu);
      });
    }, { fontSize: 20, hitDepth: depth + 5 }).setDepth(depth + 4);
    recoveryObjects.push(veil, message, blocker, retry, safeReturn);
  };
  const onLoadError = (file) => {
    scene[ASSET_LOAD_FAILED] = true;
    failedKeys.add(file?.key ?? 'unknown');
  };
  const onComplete = () => {
    if (failedKeys.size === 0) {
      cleanup();
      return;
    }
    scene.events.once('create', showRecovery);
  };

  scene.load.on('loaderror', onLoadError);
  scene.load.once('complete', onComplete);
  scene.events.once('shutdown', cleanup);
  return result;
}

export function attachSceneServices(scene) {
  scene.audio = scene.registry.get('audio');
  scene.accessibility = scene.registry.get('accessibility');
  scene.audio?.attachScene?.(scene);
  scene.input?.once?.('pointerdown', () => scene.audio?.unlock?.());
}

export function addToast(scene, message, kind = 'info') {
  return new UIToast(scene, GAME_WIDTH / 2, 118, message, kind);
}

export function addBackButton(scene, target = SCENES.MainMenu) {
  return drawBackArrowButton(scene, 112, 54, '', () => scene.scene.start(target), {
    width: 148,
    height: 42,
    depth: 100
  });
}

export function addSceneTitle(scene, title, subtitle = '') {
  scene.add
    .text(GAME_WIDTH / 2, 58, title, {
      fontFamily: FONT,
      fontSize: 44,
      color: '#f4d89c',
      align: 'center',
      stroke: '#1b120e',
      strokeThickness: 5
    })
    .setOrigin(0.5);
  if (subtitle) {
    scene.add
      .text(GAME_WIDTH / 2, 100, subtitle, {
        fontFamily: FONT,
        fontSize: 21,
        color: '#e2c68c',
        align: 'center'
      })
      .setOrigin(0.5);
  }
}

export function drawGameBackdrop(scene, variant = 'menu') {
  const key = variant === 'map' ? HANDPAINTED_KEYS.mapBg : variant === 'battle' ? HANDPAINTED_KEYS.battleBg : HANDPAINTED_KEYS.folioBg;
  const painted = addHandPaintedBackground(scene, key, { depth: 0 });
  if (painted) return painted;
  const g = scene.add.graphics();
  g.fillGradientStyle(0x1c1725, 0x1c1725, 0x4d2d25, 0x1a100c, 1);
  g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  if (variant === 'parchment') {
    g.fillStyle(0x7d5b36, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    g.fillStyle(COLORS.parchment, 0.95);
    g.fillRoundedRect(72, 54, GAME_WIDTH - 144, GAME_HEIGHT - 108, 12);
    for (let i = 0; i < 120; i += 1) {
      g.fillStyle(0x5d3d22, 0.06);
      g.fillCircle(100 + Math.random() * 1328, 70 + Math.random() * 724, 1 + Math.random() * 4);
    }
    return g;
  }

  g.fillStyle(0x2c2832, 0.8);
  g.fillTriangle(0, 585, 360, 290, 760, 585);
  g.fillTriangle(390, 590, 900, 250, 1300, 590);
  g.fillStyle(0x181517, 0.92);
  g.fillRect(0, 625, GAME_WIDTH, 239);
  g.fillStyle(0x111013, 1);
  g.fillRect(1060, 355, 210, 270);
  g.fillTriangle(1040, 355, 1165, 230, 1290, 355);
  g.fillRect(1135, 230, 60, 140);
  g.fillTriangle(1115, 230, 1165, 150, 1215, 230);
  g.fillStyle(COLORS.ember, 0.52);
  g.fillCircle(302, 708, 80);
  g.fillStyle(COLORS.candle, 0.9);
  g.fillTriangle(284, 717, 302, 650, 324, 719);
  g.fillStyle(0xcf4e31, 0.8);
  g.fillTriangle(295, 718, 311, 668, 332, 719);

  for (let i = 0; i < 90; i += 1) {
    g.fillStyle(i % 3 === 0 ? COLORS.candle : 0x7c5639, 0.08 + (i % 5) * 0.025);
    g.fillCircle(20 + ((i * 137) % (GAME_WIDTH - 40)), 50 + ((i * 79) % (GAME_HEIGHT - 100)), 1 + (i % 4));
  }
  return g;
}

export function drawPixelCharacter(scene, x, y, character, scale = 1) {
  const container = scene.add.container(x, y);
  const g = scene.add.graphics();
  const [base, accent, glow] = character.palette ?? [COLORS.iron, COLORS.red, COLORS.gold];
  g.fillStyle(0x000000, 0.28);
  g.fillEllipse(0, 90 * scale, 140 * scale, 24 * scale);
  g.fillStyle(base, 1);
  g.fillRect(-28 * scale, -48 * scale, 56 * scale, 92 * scale);
  g.fillStyle(base, 0.9);
  g.fillCircle(0, -72 * scale, 27 * scale);
  g.fillStyle(accent, 0.95);
  g.fillRect(-42 * scale, -24 * scale, 20 * scale, 78 * scale);
  g.fillRect(24 * scale, -18 * scale, 18 * scale, 74 * scale);
  g.fillStyle(glow, 0.85);
  if (character.id === 'exiled-knight') {
    g.fillRect(-84 * scale, -58 * scale, 8 * scale, 150 * scale);
    g.fillTriangle(-84 * scale, -74 * scale, -76 * scale, -88 * scale, -68 * scale, -74 * scale);
    g.fillStyle(accent, 0.9);
    g.fillRect(-36 * scale, 14 * scale, 72 * scale, 12 * scale);
    g.lineStyle(5 * scale, glow, 0.88);
    g.strokeCircle(70 * scale, 5 * scale, 30 * scale);
  } else if (character.id === 'candle-nun') {
    g.fillRect(70 * scale, -84 * scale, 9 * scale, 150 * scale);
    g.fillStyle(glow, 0.9);
    g.fillTriangle(60 * scale, -82 * scale, 76 * scale, -122 * scale, 92 * scale, -82 * scale);
    g.fillStyle(0xf0e7d2, 0.95);
    g.fillRect(-36 * scale, -78 * scale, 72 * scale, 28 * scale);
  } else {
    g.fillStyle(0xd8c38b, 0.9);
    g.fillTriangle(6 * scale, -72 * scale, 78 * scale, -54 * scale, 6 * scale, -42 * scale);
    g.fillStyle(glow, 0.78);
    g.fillCircle(-70 * scale, 8 * scale, 18 * scale);
    g.fillCircle(74 * scale, 42 * scale, 13 * scale);
  }
  g.lineStyle(3 * scale, COLORS.gold, 0.55);
  g.strokeRect(-28 * scale, -48 * scale, 56 * scale, 92 * scale);
  container.add(g);
  return container;
}

export function drawEnemyFigure(scene, x, y, enemy, scale = 1) {
  const container = scene.add.container(x, y);
  const g = scene.add.graphics();
  const [base, accent, glow] = enemy.palette ?? [COLORS.iron, COLORS.red, COLORS.gold];
  g.fillStyle(0x000000, 0.32);
  g.fillEllipse(0, 92 * scale, 150 * scale, 26 * scale);
  g.fillStyle(base, 1);
  if (enemy.type === 'boss') {
    g.fillRect(-44 * scale, -82 * scale, 88 * scale, 132 * scale);
    g.fillStyle(accent, 0.86);
    g.fillRect(-58 * scale, -50 * scale, 22 * scale, 120 * scale);
    g.fillRect(38 * scale, -44 * scale, 22 * scale, 118 * scale);
    g.lineStyle(8 * scale, glow, 0.86);
    g.lineBetween(-106 * scale, -88 * scale, 90 * scale, 84 * scale);
    g.fillStyle(0x15100c, 0.95);
    g.fillCircle(0, -99 * scale, 22 * scale);
  } else if (enemy.id === 'black-hound') {
    g.fillEllipse(0, 6 * scale, 110 * scale, 58 * scale);
    g.fillCircle(54 * scale, -18 * scale, 26 * scale);
    g.fillStyle(accent, 0.9);
    g.fillCircle(62 * scale, -22 * scale, 4 * scale);
  } else {
    g.fillRect(-30 * scale, -50 * scale, 60 * scale, 96 * scale);
    g.fillCircle(0, -75 * scale, 27 * scale);
    g.fillStyle(accent, 0.9);
    g.fillRect(26 * scale, -30 * scale, 18 * scale, 78 * scale);
    g.lineStyle(4 * scale, glow, 0.72);
    g.lineBetween(-64 * scale, -50 * scale, 58 * scale, 48 * scale);
  }
  container.add(g);
  return container;
}

export function addSmallLabel(scene, x, y, text, size = 20) {
  return scene.add
    .text(x, y, text, {
      fontFamily: FONT,
      fontSize: size,
      color: '#f6edd0',
      align: 'center'
    })
    .setOrigin(0.5);
}

export function getActiveRun(scene) {
  let run = scene.registry.get('run');
  if (!run) {
    run = SaveManager.loadRun();
    if (run) scene.registry.set('run', run);
  }
  if (!run) {
    addToast(scene, '没有可用旅途，请先开始新旅程。', 'error');
    scene.time.delayedCall(650, () => scene.scene.start(SCENES.MainMenu));
    return null;
  }
  if (!Number.isFinite(run.act)) run.act = run.map?.act ?? 1;
  if (!Number.isFinite(run.actPage)) run.actPage = 0;
  if (!run.map?.nodes?.length) {
    const generated = MapSystem.createSeededMap(run.act, run.rngState);
    run.map = generated.map;
    run.rngState = generated.state;
  } else if (!Number.isFinite(run.map.act)) {
    run.map.act = run.act;
  }
  return sanitizeRunNumbers(run);
}

export function saveActiveRun(scene, run) {
  sanitizeRunNumbers(run);
  scene.registry.set('run', run);
  const saved = SaveManager.saveRun(run);
  if (!saved && scene?.sys?.isActive?.()) {
    console.error('Run save failed. Progress remains in memory only.');
    addToast(scene, '存档写入失败，请检查浏览器存储权限。', 'error');
  }
  return saved;
}
