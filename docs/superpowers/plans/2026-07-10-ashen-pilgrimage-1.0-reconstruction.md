# 灰烬圣途 1.0 重铸实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在保留现有 Phaser 3、世界观和高质量资产的前提下，完成确定性三幕旅途、可恢复战斗、三角色专属资源、差异化首领、统一视听和稳定自动化 QA。

**Architecture:** 规则层保持纯数据和可序列化状态，由 `BattleSystem` 编排新的随机数、角色资源、编制和首领阶段模块。Phaser 场景退化为生命周期外壳，输入、视图、动画和测试桥接各自独立；所有持久化使用 v2 存档和幂等结算 id。

**Tech Stack:** Phaser 3.90、Vite 7、JavaScript ES modules、Node `node:test`、Playwright 1.61、现有 PNG/SVG/OGG/MP3 资产。

## Global Constraints

- 目标单局 45 至 60 分钟，每幕 8 个普通决策层加 1 个首领层。
- 保留 70 张现有卡牌基础，不用批量同质卡填充体量。
- 正式遗物目标 30 件；9 件旧版遗物只允许迁移读取。
- Canvas 基准分辨率 1536x864，并验证 1280x720、1366x768、1536x864、1920x1080。
- 所有随机结果必须来自保存在 run 中的确定性随机状态。
- 任意玩家回合刷新后恢复相同手牌、能量、敌人生命和意图。
- 不增加后端、多人、云存档和新运行时依赖。
- 当前目录不是 Git 仓库，因此计划中的每个“检查点”使用测试与文件清单代替 Git commit。

---

## 文件结构

新增核心文件：

- `src/game/RunRng.js`：确定性随机状态和抽样接口。
- `src/game/RunMigration.js`：v1 -> v2 存档迁移。
- `src/game/BattleCheckpoint.js`：战斗检查点创建、恢复和回滚。
- `src/systems/HeroResourceSystem.js`：战势、祷火、灰血规则。
- `src/systems/EncounterDirector.js`：幕次与职责约束下的敌人编制。
- `src/systems/BossPhaseSystem.js`：三名首领阶段规则和阶段事件。
- `src/systems/VowSystem.js`：旅途誓约候选与效果查询。
- `src/scenes/battle/BattleView.js`：战斗视图创建和刷新。
- `src/scenes/battle/BattleInputController.js`：鼠标、键盘和目标选择。
- `src/scenes/battle/BattleAnimationDirector.js`：结构化规则事件的顺序播放。
- `src/game/QABridge.js`：稳定场景测试接口。
- `src/accessibility/LiveAnnouncer.js`：DOM 文本播报。
- `tests/*.test.mjs`：Node 单元和模拟测试。

现有兼容入口：

- `src/systems/BattleSystem.js` 保持主要公共 API。
- `src/art/RebuiltVisualFactory.js` 保持现有导出，逐步委托给细分模块。
- `src/scenes/BattleScene.js` 保持 Phaser scene key，内部改为组合新组件。

---

### Task 1: 确定性随机底座

**Files:**
- Create: `src/game/RunRng.js`
- Modify: `src/game/GameState.js`
- Modify: `src/game/random.js`
- Create: `tests/run-rng.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `createRngState(seed)`, `nextFloat(state)`, `randomInt(state,min,max)`, `choice(state,items)`, `shuffle(state,items)`, `pickMany(state,items,count)`。
- `nextFloat` returns `{ value: number, state: { seed:number, cursor:number } }`，调用者必须把新 state 写回 run。

- [ ] **Step 1: 写失败测试**

```js
test('same seed produces the same sequence and serializes cursor', () => {
  let a = createRngState(20260710);
  let b = createRngState(20260710);
  const valuesA = Array.from({ length: 6 }, () => (({ value, state: a } = nextFloat(a)), value));
  const valuesB = Array.from({ length: 6 }, () => (({ value, state: b } = nextFloat(b)), value));
  assert.deepEqual(valuesA, valuesB);
  assert.equal(a.cursor, 6);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test tests/run-rng.test.mjs`

Expected: FAIL，模块 `src/game/RunRng.js` 不存在。

- [ ] **Step 3: 实现最小确定性接口**

```js
export function createRngState(seed = Date.now()) {
  return { seed: (Number(seed) >>> 0) || 0x6d2b79f5, cursor: 0 };
}

export function nextFloat(input) {
  let t = (input.seed + Math.imul(input.cursor + 1, 0x6d2b79f5)) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return {
    value: ((t ^ (t >>> 14)) >>> 0) / 4294967296,
    state: { seed: input.seed, cursor: input.cursor + 1 }
  };
}
```

- [ ] **Step 4: 为 run 写入 `seed` 与 `rngState`，保留 `random.js` 的无状态兼容导出**

```js
const seed = Date.now() >>> 0;
return { version: 2, seed, rngState: createRngState(seed), ...runFields };
```

- [ ] **Step 5: 添加测试命令并验证**

Run: `pnpm test && pnpm run build`

Expected: RNG tests PASS；Vite build PASS。

---

### Task 2: v2 存档、战斗检查点与恢复

**Files:**
- Create: `src/game/RunMigration.js`
- Create: `src/game/BattleCheckpoint.js`
- Modify: `src/game/SaveManager.js`
- Modify: `src/game/GameState.js`
- Modify: `src/scenes/MainMenuScene.js`
- Modify: `src/scenes/BattleScene.js`
- Modify: `src/scenes/SceneHelpers.js`
- Create: `tests/run-migration.test.mjs`
- Create: `tests/battle-checkpoint.test.mjs`

**Interfaces:**
- `migrateRun(raw): RunV2 | null`
- `createBattleCheckpoint(run,battle,sceneKey): Checkpoint`
- `restoreBattleCheckpoint(run): { battle, sceneKey } | null`
- `clearBattleCheckpoint(run, settlementId)`
- `rollbackActiveNode(run): RunV2`

- [ ] **Step 1: 写 v1 迁移和刷新恢复失败测试**

```js
test('migrates v1 run and rolls back orphaned active node', () => {
  const next = migrateRun(v1RunWithActiveNode);
  assert.equal(next.version, 2);
  assert.equal(next.map.activeNode, null);
  assert.ok(next.map.available.includes('n0'));
});

test('battle checkpoint round-trips hand, energy, hp and intent', () => {
  const checkpoint = createBattleCheckpoint(run, battle, 'BattleScene');
  const restored = restoreBattleCheckpoint({ ...run, checkpoint });
  assert.deepEqual(restored.battle.deck.hand, battle.deck.hand);
  assert.equal(restored.battle.player.energy, battle.player.energy);
  assert.equal(restored.battle.enemies[0].currentAction.name, battle.enemies[0].currentAction.name);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test tests/run-migration.test.mjs tests/battle-checkpoint.test.mjs`

Expected: FAIL，迁移和检查点接口未定义。

- [ ] **Step 3: 实现迁移和检查点深拷贝**

```js
export function createBattleCheckpoint(run, battle, sceneKey = 'BattleScene') {
  return {
    id: `checkpoint-${run.id}-${run.map.activeNode}-${battle.turn}`,
    sceneKey,
    activeNode: run.map.activeNode,
    rngState: structuredClone(run.rngState),
    battle: structuredClone(battle),
    savedAt: Date.now()
  };
}
```

- [ ] **Step 4: 继续旅途按 checkpoint 路由；损坏 checkpoint 回滚节点**

```js
const checkpoint = restoreBattleCheckpoint(run);
if (checkpoint) this.scene.start(checkpoint.sceneKey, { restoredBattle: checkpoint.battle });
else this.scene.start(SCENES.Map);
```

- [ ] **Step 5: 在打牌、结束回合和战斗结算前保存；奖励使用 `settlementId` 幂等保护**

- [ ] **Step 6: 验证**

Run: `pnpm test && pnpm run qa:battle-mechanics && pnpm run build`

Expected: migration/checkpoint tests PASS；现有 battle mechanics PASS。

---

### Task 3: 正式内容池与文档真值

**Files:**
- Modify: `src/data/relics.js`
- Modify: `src/systems/RewardSystem.js`
- Modify: `src/systems/RelicSystem.js`
- Modify: `src/content/validateContent.js`
- Create: `tests/reward-pool.test.mjs`

**Interfaces:**
- `isLegacyRelic(relic): boolean`
- `getProductionRelics(): Relic[]`
- 所有新局奖励、事件和商店只消费 `getProductionRelics()`。

- [ ] **Step 1: 写旧版遗物不得进入新局的失败测试**

```js
test('production rewards never return legacy relics', () => {
  const ids = new Set(Array.from({ length: 200 }, () => RewardSystem.randomRelicCandidate(run)?.id));
  assert.equal([...ids].some((id) => getRelic(id).legacy), false);
});
```

- [ ] **Step 2: 标记 9 件兼容遗物为 `legacy: true`，实现正式池函数并替换抽取入口**

- [ ] **Step 3: 内容校验分别报告 `productionRelics: 24` 与 `legacyRelics: 9`**

- [ ] **Step 4: 验证**

Run: `pnpm test && pnpm run qa:content-schema`

Expected: reward pool PASS；schema 无 issues。

---

### Task 4: 三角色专属资源

**Files:**
- Create: `src/systems/HeroResourceSystem.js`
- Modify: `src/systems/BattleSystem.js`
- Modify: `src/data/cards.js`
- Modify: `src/data/characters.js`
- Modify: `src/data/keywords.js`
- Create: `tests/hero-resources.test.mjs`

**Interfaces:**
- `initialize(characterId): { momentum?:0, prayerFire?:0, ashblood?:0 }`
- `beforeCard(run,battle,card): BattleEvent[]`
- `afterCard(run,battle,card,context): BattleEvent[]`
- `onActiveSelfDamage(run,battle,amount): BattleEvent[]`
- `resourceSummary(battle): { key,label,value,max,stateLabel }`

- [ ] **Step 1: 写三角色失败测试**

```js
test('knight reaches breakthrough after three attack cards', () => {
  const battle = battleFor('exiled-knight');
  playThreeAttacks(run, battle);
  assert.equal(battle.player.resources.momentum, 3);
  assert.equal(battle.player.status.breakthrough, 1);
});

test('nun prayer cards generate fire and miracles spend it', () => {
  playTaggedCard(run, battle, 'prayer');
  assert.equal(battle.player.resources.prayerFire, 1);
  playTaggedCard(run, battle, 'miracle');
  assert.ok(battle.player.resources.prayerFire < 1);
});

test('alchemist overload cannot kill and resets ashblood to five', () => {
  battle.player.hp = 3;
  HeroResourceSystem.onActiveSelfDamage(run, battle, 10);
  assert.equal(battle.player.hp, 1);
  assert.equal(battle.player.resources.ashblood, 5);
});
```

- [ ] **Step 2: 为牌添加 `tags`，不改变 card id**

标签集合固定为：`combo`、`finisher`、`prayer`、`ignite`、`miracle`、`selfDamage`、`vent`、`potion`。

- [ ] **Step 3: 实现资源状态机并接入 `BattleSystem.useCard` 与主动自伤入口**

- [ ] **Step 4: 更新卡牌 text/upgradedText，使实际规则、显示和图鉴一致**

- [ ] **Step 5: 验证**

Run: `pnpm test && pnpm run qa:battle-mechanics && pnpm run qa:role-matrix -- --url=http://127.0.0.1:4173/`

Expected: 资源测试与角色规则测试 PASS。

---

### Task 5: 敌人编制与首领阶段规则

**Files:**
- Create: `src/systems/EncounterDirector.js`
- Create: `src/systems/BossPhaseSystem.js`
- Modify: `src/data/enemies.js`
- Modify: `src/data/encounters.js`
- Modify: `src/systems/EnemyAI.js`
- Modify: `src/systems/BattleSystem.js`
- Create: `tests/encounter-director.test.mjs`
- Create: `tests/boss-phases.test.mjs`

**Interfaces:**
- `createEncounter(run,battleType): EnemyDefinition[]`
- `phaseFor(enemy): 1|2|3`
- `transition(run,battle,enemy,from,to): BattleEvent[]`
- `modifyAction(run,battle,enemy,action): EnemyAction`

- [ ] **Step 1: 写职责兼容与首领名称失败测试**

```js
test('normal encounter has no more than one summoner and always has a damage source', () => {
  const encounter = EncounterDirector.createEncounter(runAtAct(2), 'battle');
  assert.ok(encounter.filter((e) => e.roles.includes('summoner')).length <= 1);
  assert.ok(encounter.some((e) => e.roles.includes('pressure')));
});

test('phase event uses the actual boss name', () => {
  const events = BossPhaseSystem.transition(run, battle, waxMatron, 1, 2);
  assert.ok(events.some((event) => event.text.includes('白蜡圣母')));
});
```

- [ ] **Step 2: 为 28 个敌人添加 `roles` 和必要的行动条件**

- [ ] **Step 3: 以 run RNG 从幕次编制表抽取，删除 `BattleSystem.pickEnemies` 中的 `Math.random`**

- [ ] **Step 4: 实现三首领阶段规则：召唤护墓、蜡封牌槽、空冠倒计时/模仿牌型**

- [ ] **Step 5: 验证**

Run: `pnpm test && pnpm run qa:battle-mechanics && pnpm run build`

Expected: encounter/boss tests PASS，无硬编码错误名称。

---

### Task 6: 种子地图与旅途誓约

**Files:**
- Create: `src/systems/VowSystem.js`
- Create: `src/data/vows.js`
- Modify: `src/systems/MapSystem.js`
- Modify: `src/game/GameState.js`
- Modify: `src/scenes/CharacterSelectScene.js`
- Modify: `src/scenes/ActClearScene.js`
- Modify: `src/scenes/MapScene.js`
- Create: `tests/map-generation.test.mjs`
- Create: `tests/vows.test.mjs`

**Interfaces:**
- `MapSystem.createMap(act,rngState): { map,rngState }`
- `VowSystem.candidates(run): Vow[]`
- `VowSystem.select(run,vowId): Run`
- `VowSystem.value(run,hook): number`

- [ ] **Step 1: 写地图不变量测试**

```js
test('each act has eight decision rows and one boss row with a safe pre-boss option', () => {
  const { map } = MapSystem.createMap(1, createRngState(7));
  assert.equal(new Set(map.nodes.map((n) => n.row)).size, 9);
  assert.equal(map.nodes.filter((n) => n.type === 'boss').length, 1);
  assert.ok(map.nodes.some((n) => n.row === 7 && ['rest', 'shop'].includes(n.type)));
});
```

- [ ] **Step 2: 实现有种子的 2 至 3 主脉络拓扑和节点分布约束**

- [ ] **Step 3: 添加九份誓约并让收益/代价进入生命、奖励、敌人生命、商店与休息计算**

- [ ] **Step 4: 角色选择后和章节通关时显示三选一誓约，不新建独立主菜单场景**

- [ ] **Step 5: 验证**

Run: `pnpm test && pnpm run qa:content-schema && pnpm run build`

Expected: map/vow tests PASS；地图节点无重叠。

---

### Task 7: 事件、叙事与角色结局

**Files:**
- Modify: `src/data/events.js`
- Modify: `src/data/story.js`
- Modify: `src/data/acts.js`
- Modify: `src/systems/EventSystem.js`
- Modify: `src/scenes/PrologueScene.js`
- Modify: `src/scenes/BossIntroScene.js`
- Modify: `src/scenes/ActClearScene.js`
- Modify: `src/scenes/ResultScene.js`
- Create: `tests/story-events.test.mjs`

**Interfaces:**
- `getEventsForRun(run): EventDefinition[]`
- `getBossIntro(act,characterId): string[]`
- `getActClearStory(act,characterId): string[]`
- `getEnding(characterId): string[]`

- [ ] **Step 1: 写每幕/每角色内容覆盖失败测试**

```js
test('all acts and heroes have boss intro, clear text and endings', () => {
  for (const act of [1, 2, 3]) {
    for (const hero of ['exiled-knight', 'candle-nun', 'ashblood-alchemist']) {
      assert.equal(getBossIntro(act, hero).length, 4);
      assert.equal(getActClearStory(act, hero).length, 4);
    }
  }
  for (const hero of ['exiled-knight', 'candle-nun', 'ashblood-alchemist']) {
    assert.ok(getEnding(hero).length >= 3);
  }
  assert.equal(events.length, 18);
});
```

- [ ] **Step 2: 为 15 个事件添加 `acts`，新增 3 个角色专属事件并保持所有 effect kind 可执行**

- [ ] **Step 3: 添加首领前角色短句、三幕通关变体和三份结局**

- [ ] **Step 4: 事件结果面板显示实际获得/失去项目列表**

- [ ] **Step 5: 验证**

Run: `pnpm test && pnpm run qa:content-schema && pnpm run qa:release-flow -- --url=http://127.0.0.1:4173/`

Expected: 18 events；三幕和三角色故事矩阵完整。

---

### Task 8: 场景音乐与战斗声音

**Files:**
- Modify: `src/game/AudioManager.js`
- Modify: `src/scenes/PreloadScene.js`
- Modify: `src/scenes/BattleScene.js`
- Create: `tests/audio-routing.test.mjs`

**Interfaces:**
- `resolveBgmKey(profile): 'bgm-menu'|'bgm-map'|'bgm-battle'|'bgm-boss'`
- `playBgm(profile,{fadeMs=800})`
- `duckBgm(amount,durationMs)`

- [ ] **Step 1: 写独立 BGM 路由失败测试**

```js
assert.equal(resolveBgmKey('menu'), 'bgm-menu');
assert.equal(resolveBgmKey('map'), 'bgm-map');
assert.equal(resolveBgmKey('battle'), 'bgm-battle');
assert.equal(resolveBgmKey('boss'), 'bgm-boss');
```

- [ ] **Step 2: 修正 BGM 映射并保留 `bgm-shared` 作为缺失资源 fallback**

- [ ] **Step 3: 场景切换交叉淡化 800ms；首领阶段 duck 45% 持续 650ms**

- [ ] **Step 4: 将角色资源满值、炼金过载和首领阶段映射到现有 SFX 组合**

- [ ] **Step 5: 验证**

Run: `pnpm test && pnpm run qa:asset-manifest && pnpm run build`

Expected: audio routing PASS；所有 key 存在。

---

### Task 9: 战斗场景拆分与交互重构

**Files:**
- Create: `src/scenes/battle/BattleView.js`
- Create: `src/scenes/battle/BattleInputController.js`
- Create: `src/scenes/battle/BattleAnimationDirector.js`
- Modify: `src/scenes/BattleScene.js`
- Modify: `src/ui/UICard.js`
- Modify: `src/ui/UIStatusIcon.js`
- Modify: `src/ui/UITooltip.js`
- Modify: `src/systems/BattleLayout.js`
- Modify: `src/design/layouts.js`

**Interfaces:**
- `new BattleView(scene,{run,battle})` with `render()`, `renderResources()`, `setPrompt(message)`, `destroy()`。
- `new BattleInputController(scene,{onCard,onTarget,onEndTurn,onPause})` with `bind()`, `lock()`, `unlock()`, `destroy()`。
- `new BattleAnimationDirector(scene)` with `play(events): Promise<void>`。

- [ ] **Step 1: 写战斗布局回归，断言资源 HUD、日志三行上限和 1280x720 卡牌边界**

```js
test('battle layout keeps cards and resource meter inside safe bounds', () => {
  const layout = battleLayoutForViewport(1280, 720);
  assert.equal(layout.log.maxRows, 3);
  assert.ok(layout.resourceBar.x >= 0 && layout.resourceBar.right <= 1280);
  assert.ok(layout.cards.every((card) => card.bottom <= 720 && card.left >= 0 && card.right <= 1280));
  assert.ok(layout.endTurn.width >= 44 && layout.endTurn.height >= 44);
});
```

- [ ] **Step 2: 提取新组件，`BattleScene.create` 只负责编排 run、battle、view、input、director**

```js
this.view = new BattleView(this, { run: this.run, battle: this.battle });
this.inputController = new BattleInputController(this, handlers).bind();
this.animationDirector = new BattleAnimationDirector(this);
```

- [ ] **Step 3: 删除 `drawBattleBackdrop()` 早退后的不可达绘制代码和重复旧 UI 路径**

- [ ] **Step 4: 添加键盘快捷键：1-9、Tab、Enter、E、Esc；动画期间统一输入锁**

- [ ] **Step 5: 验证**

Run: `pnpm run qa:battle-layout && pnpm run qa:battle-mechanics && pnpm run build`

Expected: layout/mechanics PASS；BattleScene 显著缩小且无不可达旧代码。

---

### Task 10: 视觉重构与章节资产

**Files:**
- Add: `public/assets/handpainted/battle-background-act2.png`
- Add: `public/assets/handpainted/battle-background-act3.png`
- Modify: `src/art/HandPaintedAssets.js`
- Modify: `src/art/RebuiltVisualFactory.js`
- Modify: `src/scenes/CharacterSelectScene.js`
- Modify: `src/scenes/MapScene.js`
- Modify: `src/scenes/RewardScene.js`
- Modify: `src/scenes/ShopScene.js`
- Modify: `src/scenes/EventScene.js`
- Modify: `src/scenes/RestScene.js`
- Modify: `src/scenes/CodexScene.js`
- Modify: `src/scenes/SettingsScene.js`

**Interfaces:**
- `battleBackgroundKeyForAct(act)` returns act-specific texture key with act 1 fallback。
- Shared scene header and panel bounds remain in `src/design/layouts.js`。

- [ ] **Step 1: 生成并检查第二、三幕 1536x864 手绘战斗背景，保持现有透视和角色安全区**

- [ ] **Step 2: 角色选择卡下移，统一标题基线，默认显示玩法与起始牌组，移除常驻操作说明**

- [ ] **Step 3: 地图改为 2 至 3 条清晰脉络，弱化未连接线，图例可收起**

- [ ] **Step 4: 战斗 HUD、卡牌、日志和资源在四种分辨率无裁切；设置页文字对比度达到 4.5:1**

- [ ] **Step 5: 奖励、商店、事件、休息按场景更换焦点装饰和色彩，不复制新页面**

- [ ] **Step 6: 验证**

Run: `pnpm run qa:design-tokens && pnpm run qa:visual-bindings && pnpm run qa:product-upgrade-scenes -- --url=http://127.0.0.1:4173/`

Expected: scene QA PASS，13+ screenshots generated。

---

### Task 11: 稳定 QA 桥接与全流程脚本

**Files:**
- Create: `src/game/QABridge.js`
- Modify: `src/main.js`
- Modify: `scripts/qa-role-matrix.mjs`
- Modify: `scripts/qa-release-flow.mjs`
- Modify: `scripts/qa-product-upgrade-scenes.mjs`
- Create: `tests/qa-bridge.test.mjs`

**Interfaces:**
- `window.__ASHEN_QA__.startNewJourney({storySeen})`
- `window.__ASHEN_QA__.selectCharacter(characterId)`
- `window.__ASHEN_QA__.enterFirstAvailableNode()`
- `window.__ASHEN_QA__.startScene(sceneKey,data)`
- `window.__ASHEN_QA__.snapshot()`

- [ ] **Step 1: 写桥接接口结构测试**

```js
test('QA bridge exposes stable commands without canvas coordinates', () => {
  const bridge = createQABridge(fakeGame);
  assert.deepEqual(
    Object.keys(bridge).sort(),
    ['enterFirstAvailableNode', 'selectCharacter', 'snapshot', 'startNewJourney', 'startScene'].sort()
  );
  assert.equal(Object.values(bridge).every((value) => typeof value === 'function'), true);
});
```

- [ ] **Step 2: 仅在 `?qa=1` 或开发模式挂载桥接，生产正常入口不暴露修改接口**

- [ ] **Step 3: 将固定坐标菜单/角色/地图步骤替换为桥接调用；视觉悬停仍使用实际 pointer**

- [ ] **Step 4: QA 失败时记录当前 active scene、run checkpoint 和截图**

- [ ] **Step 5: 验证**

Run: `pnpm run qa:role-matrix -- --url=http://127.0.0.1:4173/?qa=1 && pnpm run qa:release-flow -- --url=http://127.0.0.1:4173/?qa=1`

Expected: role matrix 与 release flow 均 PASS，不依赖菜单坐标。

---

### Task 12: 模拟、无障碍、文档与最终验收

**Files:**
- Create: `src/accessibility/LiveAnnouncer.js`
- Modify: `index.html`
- Create: `scripts/qa-seeded-combat-sim.mjs`
- Modify: `package.json`
- Modify: `README.md`
- Modify: `docs/GDD.md`
- Modify: `docs/BALANCE.md`
- Modify: `docs/CONTENT_MANIFEST.md`
- Modify: `docs/LOCAL_PRODUCT_UPGRADE_REPORT.md`
- Modify: `src/game/Version.js`

**Interfaces:**
- `announce(message,politeness='polite')` updates `#game-live-region`。
- Simulator outputs JSON `{ hero, seeds, wins, losses, maxTurns, invalidStates, errors }`。

- [ ] **Step 1: 增加 DOM `aria-live` 区并将回合、伤害、选择结果和错误写入播报层**

- [ ] **Step 2: 编写每角色 300 场种子化自动战斗模拟，回合上限 80**

- [ ] **Step 3: 模拟断言无 NaN、负能量、无效目标、重复结算和超过上限的未结束战斗**

- [ ] **Step 4: 更新版本为 `v1.0.0-reconstruction`，同步 README/GDD/平衡/内容清单**

- [ ] **Step 5: 运行完整静态验证**

Run:

```powershell
pnpm test
pnpm run build
pnpm run qa:design-tokens
pnpm run qa:content-schema
pnpm run qa:asset-manifest
pnpm run qa:visual-bindings
pnpm run qa:battle-mechanics
pnpm run qa:battle-layout
pnpm run qa:seeded-sim
```

Expected: 全部 exit 0；build 仅允许现有 Phaser chunk-size warning。

- [ ] **Step 6: 运行完整浏览器验证**

Run:

```powershell
node scripts/qa-role-matrix.mjs --url=http://127.0.0.1:4173/?qa=1
node scripts/qa-release-flow.mjs --url=http://127.0.0.1:4173/?qa=1
node scripts/qa-product-upgrade-scenes.mjs --url=http://127.0.0.1:4173/?qa=1
```

Expected: 三份报告 `ok: true` 或无 errors；四种分辨率截图无裁切、重叠和空白画布。

- [ ] **Step 7: 在浏览器手动完成新旅途 -> 誓约 -> 地图 -> 战斗 -> 刷新恢复 -> 奖励 -> 第二/三幕 -> 最终结局**

- [ ] **Step 8: 记录最终文件清单、测试结果、剩余风险和本地试玩地址**

---

## 最终检查点

完成后必须满足：

- `package.json` 的所有 QA 命令可在 bundled Node 环境运行。
- 旧存档迁移、新存档恢复和奖励幂等均有自动测试。
- 三角色资源在规则、HUD、卡牌文案、图鉴和自动模拟中一致。
- 三幕地图、敌人编制、首领阶段、背景和 BGM 明确区分。
- 视觉截图来自最终本地构建，不使用旧缓存结果。
- 本地预览服务器保持运行，并向用户提供最终试玩 URL。
