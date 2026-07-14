# 《灰烬圣途》发布级终局优化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有完整三章版本优化为首屏轻量、场景资源隔离、结果页统一像素风、非战斗反馈完整且可稳定发布的终局版本。

**Architecture:** 新增纯数据资源包目录与场景加载器，各场景在 `preload()` 声明依赖，Phaser 全局缓存负责复用。结果页和非战斗交互按独立组件/状态函数收敛，所有变化先由单元或浏览器回归测试定义，再修改生产代码。

**Tech Stack:** Phaser 3.90、Vite 7、Node test runner、Playwright 1.61、Pillow 无损 WebP、GitHub Actions / Pages。

## Global Constraints

- 不缩减章节、地图节点、敌人、卡牌和现有剧情内容。
- 不修改存档键名、角色 ID、敌人 ID、章节编号和卡牌 ID。
- 不重写已通过回归的战斗数值与结算逻辑。
- 所有敌人战斗资产保持左向，所有可玩角色战斗资产保持右向。
- 像素资产使用最近邻采样，不允许绿色失败墓地或写实剪贴图。
- 首屏编码传输量不超过 6 MB，初始资源请求不超过 24 个。
- 每个行为变更遵循 RED -> GREEN -> REFACTOR，并在提交前运行关联回归。

---

### Task 1: 场景资源包目录与幂等加载器

**Files:**
- Create: `src/game/AssetBundleCatalog.js`
- Create: `src/game/SceneAssetLoader.js`
- Create: `tests/asset-bundles.test.mjs`
- Modify: `src/game/AudioCatalog.js`
- Modify: `src/art/PixelArtSystem.js`

**Interfaces:**
- Produces: `getSceneBundleNames(sceneKey, context) -> string[]`
- Produces: `resolveAssetBundles(bundleNames) -> { images, audio }`
- Produces: `queueAssetBundles(scene, bundleNames) -> { queued, keys }`
- Produces: `installSceneLoadingView(scene, options) -> { destroy() }`

- [ ] **Step 1: Write the failing bundle-boundary tests**

```js
test('boot bundle excludes map, battle and act two assets', () => {
  const assets = resolveAssetBundles(getSceneBundleNames(SCENES.Preload, {}));
  const urls = [...assets.images, ...assets.audio].flatMap((asset) => asset.urls ?? [asset.url]);
  assert.equal(urls.some((url) => /map-act|battle-act|actor-/.test(url)), false);
});

test('act two battle bundle contains its background, hero and only act two enemies', () => {
  const assets = resolveAssetBundles(getSceneBundleNames(SCENES.Battle, {
    act: 2,
    characterId: 'candle-nun',
    battleType: 'battle'
  }));
  const keys = new Set(assets.images.map((asset) => asset.key));
  assert.equal(keys.has('pixel-bg-battle-2'), true);
  assert.equal(keys.has('pixel-actor-candle-nun'), true);
  assert.equal(keys.has('pixel-actor-wax-novice'), true);
  assert.equal(keys.has('pixel-actor-rotting-villager'), false);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/asset-bundles.test.mjs`

Expected: FAIL because `AssetBundleCatalog.js` does not exist.

- [ ] **Step 3: Implement declarative bundles and cache-aware queueing**

```js
export function queueAssetBundles(scene, bundleNames) {
  const assets = resolveAssetBundles(bundleNames);
  const keys = [];
  for (const image of assets.images) {
    if (scene.textures.exists(image.key)) continue;
    scene.load.image(image.key, image.url);
    keys.push(image.key);
  }
  for (const audio of assets.audio) {
    if (scene.cache.audio.exists(audio.key)) continue;
    scene.load.audio(audio.key, audio.urls);
    keys.push(audio.key);
  }
  return { queued: keys.length, keys };
}
```

The catalog must derive act enemy IDs from `ENCOUNTER_POOLS`, resolve aliases through `resolvePixelActorAsset`, and de-duplicate descriptors by key.

- [ ] **Step 4: Run focused and full unit tests**

Run: `node --test tests/asset-bundles.test.mjs tests/audio-routing.test.mjs tests/production-assets.test.mjs`

Expected: PASS with no duplicate keys or cross-act resources.

- [ ] **Step 5: Commit**

```bash
git add src/game/AssetBundleCatalog.js src/game/SceneAssetLoader.js src/game/AudioCatalog.js src/art/PixelArtSystem.js tests/asset-bundles.test.mjs
git commit -m "perf: add scene-scoped asset bundles"
```

### Task 2: 接入所有场景并删除全量延迟预载

**Files:**
- Modify: `src/scenes/PreloadScene.js`
- Modify: `src/scenes/SceneHelpers.js`
- Modify: `src/scenes/MainMenuScene.js`
- Modify: `src/scenes/GuideScene.js`
- Modify: `src/scenes/CharacterSelectScene.js`
- Modify: `src/scenes/VowScene.js`
- Modify: `src/scenes/PrologueScene.js`
- Modify: `src/scenes/BossIntroScene.js`
- Modify: `src/scenes/ActClearScene.js`
- Modify: `src/scenes/MapScene.js`
- Modify: `src/scenes/BattleScene.js`
- Modify: `src/scenes/RewardScene.js`
- Modify: `src/scenes/ShopScene.js`
- Modify: `src/scenes/EventScene.js`
- Modify: `src/scenes/RestScene.js`
- Modify: `src/scenes/ChestScene.js`
- Modify: `src/scenes/CodexScene.js`
- Modify: `src/scenes/SettingsScene.js`
- Modify: `src/scenes/ResultScene.js`
- Create: `scripts/qa-resource-budget.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `getSceneBundleNames`, `queueAssetBundles`, `installSceneLoadingView`
- Produces: every scene has a deterministic `preload()` dependency declaration.

- [ ] **Step 1: Write the failing browser resource-budget QA**

```js
assert.ok(initialEntries.length <= 24, `initial requests: ${initialEntries.length}`);
assert.ok(encodedBytes <= 6 * 1024 * 1024, `initial bytes: ${encodedBytes}`);
assert.equal(initialEntries.some((entry) => /battle-act-[123]|map-act-[123]/.test(entry.name)), false);
assert.equal(initialEntries.some((entry) => /pale-wax-matron|hollow-crown-regent/.test(entry.name)), false);
```

- [ ] **Step 2: Run against the current production build and verify RED**

Run: `pnpm build && node scripts/qa-resource-budget.mjs --local`

Expected: FAIL with roughly 98 resources and more than 30 MB encoded transfer.

- [ ] **Step 3: Add `preload()` to each scene and remove `ensureDeferredAssets`**

```js
preload() {
  preloadSceneAssets(this, SCENES.Map, {
    act: this.registry.get('run')?.act ?? 1,
    title: '展开旅途地图'
  });
}
```

Battle preloading must include current hero, act background, act encounter pool, combat SFX and either act BGM or boss BGM. Result preloading must include the current hero or tombstone plus its result BGM/SFX. `attachSceneServices` must no longer start a global deferred loader.

- [ ] **Step 4: Verify scene entry, missing-asset recovery and budget GREEN**

Run: `pnpm test && pnpm qa:asset-manifest && pnpm qa:full-flow && pnpm qa:resource-budget`

Expected: all tests PASS; no scene logs `BGM asset missing`; menu meets both budgets.

- [ ] **Step 5: Commit**

```bash
git add src/scenes src/game/SceneHelpers.js scripts/qa-resource-budget.mjs package.json
git commit -m "perf: load assets by scene and chapter"
```

### Task 3: 无损 WebP 运行时资源

**Files:**
- Create: `scripts/build-runtime-images.mjs`
- Create: `tests/runtime-image-catalog.test.mjs`
- Modify: `src/art/PixelAssetCatalog.js`
- Modify: `scripts/qa-asset-manifest.mjs`
- Modify: `package.json`
- Create: `public/assets/pixel/**/*.webp`

**Interfaces:**
- Produces: `pnpm assets:runtime` performs deterministic PNG -> lossless WebP conversion.
- Produces: catalog URLs point only to runtime `.webp` files.

- [ ] **Step 1: Write the failing catalog test**

```js
test('runtime pixel catalog uses lossless webp while source png files remain available', async () => {
  for (const asset of PIXEL_TEXTURE_ASSETS) {
    assert.match(asset.url, /\.webp$/);
    await access(join('public', asset.url));
  }
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test tests/runtime-image-catalog.test.mjs`

Expected: FAIL because catalog URLs still end in `.png`.

- [ ] **Step 3: Implement deterministic conversion and update catalog**

The script must preserve dimensions and alpha, write only when content changes, and print original/runtime byte totals. It must use the bundled Python/Pillow runtime discovered through workspace dependencies; no lossy quality flag is allowed.

- [ ] **Step 4: Verify dimensions, alpha, build size and visual bindings**

Run: `pnpm assets:runtime && node --test tests/runtime-image-catalog.test.mjs tests/production-assets.test.mjs && pnpm qa:asset-manifest && pnpm build`

Expected: PASS; production `dist` contains referenced WebP files and no duplicate referenced PNG runtime copies.

- [ ] **Step 5: Commit**

```bash
git add scripts/build-runtime-images.mjs tests/runtime-image-catalog.test.mjs src/art/PixelAssetCatalog.js scripts/qa-asset-manifest.mjs package.json public/assets/pixel
git commit -m "perf: ship lossless webp pixel assets"
```

### Task 4: 重做胜负结果页与墓碑资产

**Files:**
- Create: `src/game/ResultSummary.js`
- Create: `tests/result-summary.test.mjs`
- Modify: `src/scenes/ResultScene.js`
- Modify: `src/art/PixelAssetCatalog.js`
- Replace: `public/assets/pixel/ui/defeat-tombstone.png`
- Modify: `scripts/qa-product-upgrade-scenes.mjs`

**Interfaces:**
- Produces: `buildResultSummary(run) -> { progress, kills, elapsed, relics, vows, gold, deckGroups }`
- Produces: result scene regions named `result-figure`, `result-narrative`, `result-stats`, `result-deck`, `result-actions` for QA.

- [ ] **Step 1: Write failing summary/idempotency tests**

```js
test('result summary groups upgraded cards without long unbounded lines', () => {
  const summary = buildResultSummary(runFixture);
  assert.deepEqual(summary.deckGroups[0], { name: '锈剑劈砍', upgraded: false, count: 2 });
  assert.ok(summary.deckGroups.length <= 10);
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test tests/result-summary.test.mjs`

Expected: FAIL because `ResultSummary.js` does not exist.

- [ ] **Step 3: Generate and validate the formal tombstone asset**

Use the image generation tool with this production brief: transparent background, 16/32-bit pixel art, front-left three-quarter stone, broken pilgrim cross, extinguished candle wax, ash and two dark-red cloth fragments, no grass, no green, no text, no frame, no realistic photo texture. Normalize to the existing runtime bounding box and preserve transparency.

- [ ] **Step 4: Implement asymmetric victory/defeat compositions**

Split the old monolithic result render into `drawResultFigure`, `drawNarrativePanel`, `drawStatistics`, `drawDeckSummary`, and `drawActions`. Victory uses hero/flame focus; defeat uses tombstone/storm focus. Buttons must remain at fixed positions and statistics must not shift with deck length.

- [ ] **Step 5: Run unit and screenshot QA**

Run: `node --test tests/result-summary.test.mjs tests/result-progress.test.mjs tests/ending-system.test.mjs tests/production-assets.test.mjs && pnpm qa:product-upgrade-scenes`

Expected: PASS; victory and defeat screenshots contain all five named regions with no overlap or green pixels in the defeat background palette.

- [ ] **Step 6: Commit**

```bash
git add src/game/ResultSummary.js tests/result-summary.test.mjs src/scenes/ResultScene.js src/art/PixelAssetCatalog.js public/assets/pixel/ui/defeat-tombstone.png scripts/qa-product-upgrade-scenes.mjs
git commit -m "feat: rebuild pixel result presentation"
```

### Task 5: 奖励、事件、休息与地图反馈深化

**Files:**
- Create: `src/ui/SceneChoiceController.js`
- Create: `tests/scene-choice-controller.test.mjs`
- Modify: `src/scenes/RewardScene.js`
- Modify: `src/scenes/EventScene.js`
- Modify: `src/scenes/RestScene.js`
- Modify: `src/scenes/MapScene.js`
- Modify: `src/ui/UIButton.js`
- Modify: `src/ui/UICard.js`
- Modify: `scripts/qa-product-upgrade-scenes.mjs`
- Modify: `scripts/qa-map-migration.mjs`

**Interfaces:**
- Produces: `SceneChoiceController.select(id)`, `.confirm()`, `.lock()`, `.destroy()`.
- Produces: stable selected/disabled/confirmed states without changing reward or event business rules.

- [ ] **Step 1: Write failing controller tests**

```js
test('choice confirmation locks duplicate input before asynchronous feedback', () => {
  const controller = new SceneChoiceController(['rest', 'upgrade']);
  controller.select('rest');
  assert.equal(controller.confirm(), 'rest');
  assert.equal(controller.confirm(), null);
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test tests/scene-choice-controller.test.mjs`

Expected: FAIL because the controller does not exist.

- [ ] **Step 3: Implement stable state and 150-300 ms purposeful transitions**

Reward cards gain a selected border and rise 12 px before confirmation. Event choices use a brief ember sweep and then reveal the result. Rest choices select first and confirm with warm healing light or forge sparks. Map node completion animates only the newly opened path, while reduced/disabled animation applies states immediately.

- [ ] **Step 4: Run interaction, map and screenshot QA**

Run: `node --test tests/scene-choice-controller.test.mjs && pnpm qa:map-migration && pnpm qa:product-upgrade-scenes && pnpm qa:responsive-facing`

Expected: PASS; no double settlement, layout shift, route obstruction or disabled-animation regression.

- [ ] **Step 5: Commit**

```bash
git add src/ui/SceneChoiceController.js tests/scene-choice-controller.test.mjs src/scenes/RewardScene.js src/scenes/EventScene.js src/scenes/RestScene.js src/scenes/MapScene.js src/ui/UIButton.js src/ui/UICard.js scripts/qa-product-upgrade-scenes.mjs scripts/qa-map-migration.mjs
git commit -m "feat: deepen non-combat scene feedback"
```

### Task 6: 全量回归、发布与线上验证

**Files:**
- Modify: `README.md`
- Modify: `docs/PRODUCTION_VERIFICATION.md`
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/pages.yml`

**Interfaces:**
- Consumes: all prior tasks.
- Produces: traceable local and live release evidence.

- [ ] **Step 1: Run deterministic code/content gates**

Run: `pnpm test && pnpm qa:design-tokens && pnpm qa:content-schema && pnpm qa:asset-manifest && pnpm qa:visual-bindings && pnpm qa:battle-mechanics && pnpm qa:actor-roster && pnpm qa:progression && pnpm qa:chapter-transition`

Expected: every command exits 0.

- [ ] **Step 2: Run simulation and complete-flow gates**

Run: `pnpm qa:simulation && pnpm qa:role-matrix && pnpm qa:full-flow && pnpm qa:release-flow`

Expected: all deterministic simulations and three chapters complete without a locked map or duplicate settlement.

- [ ] **Step 3: Run visual and performance gates**

Run: `pnpm qa:product-upgrade-scenes && pnpm qa:pixel-scenes && pnpm qa:responsive-facing && pnpm qa:resource-budget`

Expected: no console error, text overlap, blank canvas, wrong facing, result mismatch or budget overrun.

- [ ] **Step 4: Build, preview and smoke test**

Run: `pnpm build && pnpm preview --host 127.0.0.1`

In another process run: `pnpm qa:deploy-smoke -- http://127.0.0.1:<preview-port>/`

Expected: HTTP 200, playable menu, correct release version, no missing resource.

- [ ] **Step 5: Update release evidence and commit**

```bash
git add README.md docs/PRODUCTION_VERIFICATION.md .github/workflows/ci.yml .github/workflows/pages.yml
git commit -m "chore: finalize release verification"
```

- [ ] **Step 6: Push and verify GitHub Pages**

Run: `git push origin main`

Then wait for both Actions workflows and run: `pnpm qa:deploy-smoke -- https://niuniumi.github.io/ashen-pilgrimage/`

Expected: workflow success; live version and commit match local release; online first-load budget and full-flow smoke pass.

