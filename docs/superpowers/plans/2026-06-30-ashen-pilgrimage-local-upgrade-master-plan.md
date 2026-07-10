# Ashen Pilgrimage Local Product Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current `v0.5.0-final-art-rescue` local Phaser Canvas build into a disciplined, locally validated product-grade upgrade path covering gameplay depth, content scale, story, visuals, UI, audio, animation, QA, and asset pipelines without deploying until local acceptance passes.

**Architecture:** Keep the current Phaser/Vite/localStorage architecture, but split oversized responsibilities into focused systems: design tokens, content schemas, animation event queues, asset manifests, audio mixer, scene-specific UI modules, and chapter-scoped data. The plan is intentionally phased so every phase produces locally runnable, testable software before the next phase expands scope.

**Tech Stack:** Phaser 3, Vite, JavaScript ES modules, localStorage, Web Audio API, SVG/bitmap art assets, Playwright-based local QA scripts, Superpowers skills, Product Design workflow, ImageGen for bitmap asset generation, Browser/in-app QA, optional Figma for editable design boards, Netlify only after local acceptance.

---

## 0. Non-Negotiable Execution Rules

- No deployment during this plan unless the user explicitly asks later.
- Every implementation phase must run locally first.
- Every visual phase must produce screenshots before being accepted.
- Every data/content phase must include schema validation.
- Every battle/rules phase must include deterministic tests or scripted QA.
- Every large file touched repeatedly should be split only when the split directly reduces risk for that phase.
- Keep current playable build intact at the end of every task.
- Do not add content by scattering hardcoded values in scenes. New content belongs in `src/data` or chapter data modules.
- Do not use reference images as full backgrounds. Use them only for direction.
- Do not claim commercial-grade art if assets are still generated placeholders.

## 1. Plugin And Tool Responsibility Matrix

| Workstream | Required plugin / skill / tool | When to use | Local output |
| --- | --- | --- | --- |
| Planning discipline | `superpowers:using-superpowers`, `superpowers:writing-plans` | Before execution and for every detailed task plan | `docs/superpowers/plans/*.md` |
| Implementation discipline | `superpowers:executing-plans` or `superpowers:subagent-driven-development` | When executing this plan | Step-by-step checked tasks |
| Test-first code work | `superpowers:test-driven-development` | Battle rules, schema validators, data transforms, save migration | Tests or validation scripts before implementation |
| Bug investigation | `superpowers:systematic-debugging` | Any repeated runtime, scene, animation, or QA failure | Root-cause notes before fixes |
| Completion gate | `superpowers:verification-before-completion` | Before saying a phase is done | Build + local QA evidence |
| Product/UX audit | `product-design:audit` | Reviewing current or new flows from screenshots | Audit notes and screenshot folder |
| Visual direction | `product-design:ideate` plus `imagegen` | Before replacing major art direction or generating hero/Boss/card concepts | 3 visual directions or selected asset brief |
| UI prototype / screen redesign | `product-design:prototype` or `image-to-code` | Only after a selected visual target exists | Local prototype or implementation target |
| Editable design board | Figma plugin | Only if user wants a Figma board or shareable design source | Figma file, optional |
| Local browser QA | Browser skill / Playwright scripts | All local scene and flow screenshots | `qa/screenshots/**` |
| Deployment | Netlify plugin | Explicitly not used in this local-only plan | Deferred until local sign-off |

## 2. Target File Structure

### New folders

- `src/design/`
  - Owns UI tokens, layout constants, text styles, state colors.
- `src/content/`
  - Owns schema validators and content index helpers.
- `src/audio/`
  - Owns music/ambience/sfx/ui mixer if `AudioManager` becomes too large.
- `src/animation/`
  - Owns combat animation event queue and reusable animation descriptors.
- `src/scenes/battle/`
  - Owns BattleScene submodules after splitting the current large `BattleScene.js`.
- `src/scenes/shared/`
  - Owns scene-level shared layout and panel helpers.
- `src/data/acts/act1/`
  - Owns first-act cards/enemies/events/encounters if content expands beyond current files.
- `src/data/acts/act2/`
  - Deferred until Phase 4.
- `src/data/acts/act3/`
  - Deferred until Phase 4.
- `public/assets/art/concepts/`
  - Stores local concept outputs or imported approved assets.
- `public/assets/audio/`
  - Stores local generated or sourced audio assets when added.
- `qa/screenshots/product_upgrade/`
  - Stores screenshots for this upgrade track.
- `docs/superpowers/specs/`
  - Stores focused design specs when a phase needs additional design approval.
- `docs/superpowers/plans/`
  - Stores focused implementation plans.

### Existing files likely modified

- `src/game/Theme.js`
- `src/game/constants.js`
- `src/game/AudioManager.js`
- `src/game/SaveManager.js`
- `src/game/Version.js`
- `src/scenes/BattleScene.js`
- `src/scenes/CharacterSelectScene.js`
- `src/scenes/MainMenuScene.js`
- `src/scenes/MapScene.js`
- `src/scenes/RewardScene.js`
- `src/scenes/ShopScene.js`
- `src/scenes/EventScene.js`
- `src/scenes/RestScene.js`
- `src/scenes/CodexScene.js`
- `src/scenes/SettingsScene.js`
- `src/ui/UICard.js`
- `src/ui/UIButton.js`
- `src/ui/UIPanel.js`
- `src/ui/UIFrame.js`
- `src/ui/UIHealthBar.js`
- `src/ui/UIIcon.js`
- `src/ui/UITooltip.js`
- `src/ui/UIToast.js`
- `src/systems/BattleSystem.js`
- `src/systems/EnemyAI.js`
- `src/systems/MapSystem.js`
- `src/systems/RewardSystem.js`
- `src/systems/EventSystem.js`
- `src/systems/RelicSystem.js`
- `src/data/cards.js`
- `src/data/relics.js`
- `src/data/enemies.js`
- `src/data/events.js`
- `src/data/story.js`
- `scripts/qa-final-art-rescue.mjs`
- `scripts/qa-release-flow.mjs`
- `scripts/qa-role-matrix.mjs`

## 3. Execution Milestones

| Milestone | Local deliverable | Success gate |
| --- | --- | --- |
| M0 Baseline | Existing v0.5 verified locally | Build + local smoke passes |
| M1 Design system | Ashen UI token system and component inventory | UI screenshot comparisons pass |
| M2 Content schema | Data validation pipeline | Invalid content fails validator |
| M3 Battle architecture | Battle animation/event split | Existing combat behavior unchanged |
| M4 Visual pipeline | Asset manifest + selected art direction | Screenshots show upgraded target scenes |
| M5 Audio/VFX | Audio mixer + animation events | No desync in combat QA |
| M6 First-act content | Deeper cards/relics/events/enemies | Three-role local flow still passes |
| M7 Full screen polish | Main menu, map, shop, reward, event, codex | Product upgrade screenshots pass |
| M8 Local release candidate | Local-only release candidate | Build + all QA scripts pass |

---

## Task 1: Baseline Snapshot And Safety Net

**Files:**
- Read: `README.md`
- Read: `docs/PRODUCT_DESIGN_OPTIMIZATION_PLAN.md`
- Read: `docs/FINAL_ART_RESCUE_REPORT.md`
- Modify: `docs/superpowers/plans/2026-06-30-ashen-pilgrimage-local-upgrade-master-plan.md`
- Create: `docs/LOCAL_UPGRADE_BASELINE.md`

**Plugins / skills:**
- `superpowers:verification-before-completion`
- Browser/Playwright local QA
- No Netlify

- [ ] **Step 1: Record current local baseline**

Create `docs/LOCAL_UPGRADE_BASELINE.md` with:

```md
# Local Upgrade Baseline

Version: `v0.5.0-final-art-rescue`

Baseline source:
- `docs/FINAL_ART_RESCUE_REPORT.md`
- `docs/PRODUCT_DESIGN_OPTIMIZATION_PLAN.md`
- `qa/screenshots/final_art_rescue/*.png`

Do not deploy during local upgrade execution.

Required commands before first code change:
- `pnpm install`
- `pnpm run build`
- `node scripts/qa-final-art-rescue.mjs --url=http://127.0.0.1:<local-port>/`
- `node scripts/qa-role-matrix.mjs --url=http://127.0.0.1:<local-port>/`
- `node scripts/qa-release-flow.mjs --url=http://127.0.0.1:<local-port>/`
```

- [ ] **Step 2: Run package install**

Run:

```powershell
$nodeDir='C:\Users\16224\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin'
$env:PATH="$nodeDir;$env:PATH"
$pnpm='C:\Users\16224\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\pnpm.cmd'
& $pnpm install
```

Expected:

```text
Lockfile is up to date
Done
```

- [ ] **Step 3: Run build**

Run:

```powershell
& $pnpm run build
```

Expected:

```text
✓ built
```

Acceptable warning:

```text
Some chunks are larger than 500 kB
```

- [ ] **Step 4: Start local preview**

Run:

```powershell
& $pnpm run preview -- --host 127.0.0.1 --port 4176
```

Expected:

```text
Local: http://127.0.0.1:4176/
```

- [ ] **Step 5: Capture baseline screenshots**

Run:

```powershell
& 'C:\Users\16224\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\qa-final-art-rescue.mjs --url=http://127.0.0.1:4176/
```

Expected:

```json
{ "ok": true }
```

- [ ] **Step 6: Commit or checkpoint**

If Git is available:

```powershell
git add docs/LOCAL_UPGRADE_BASELINE.md docs/superpowers/plans/2026-06-30-ashen-pilgrimage-local-upgrade-master-plan.md
git commit -m "docs: add local upgrade implementation plan"
```

If Git is not available, record:

```text
Git unavailable in local shell; checkpoint is file timestamp plus QA screenshots.
```

---

## Task 2: Create Ashen Design System Foundation

**Files:**
- Create: `src/design/tokens.js`
- Create: `src/design/layouts.js`
- Create: `src/design/textStyles.js`
- Create: `src/design/componentStates.js`
- Modify: `src/game/Theme.js`
- Test: `scripts/qa-design-tokens.mjs`

**Plugins / skills:**
- `superpowers:test-driven-development`
- Product Design audit for visual consistency
- Browser/Playwright local screenshots

- [ ] **Step 1: Write token validator script first**

Create `scripts/qa-design-tokens.mjs`:

```js
import { TOKENS } from '../src/design/tokens.js';
import { LAYOUTS } from '../src/design/layouts.js';
import { TEXT_STYLES } from '../src/design/textStyles.js';

function assert(value, message) {
  if (!value) throw new Error(message);
}

assert(TOKENS.colors.panel, 'missing panel color');
assert(TOKENS.colors.gold, 'missing gold color');
assert(TOKENS.colors.danger, 'missing danger color');
assert(TOKENS.spacing[8] === 8, 'spacing token 8 must equal 8');
assert(LAYOUTS.canvas.width === 1536, 'canvas width must be 1536');
assert(LAYOUTS.canvas.height === 864, 'canvas height must be 864');
assert(TEXT_STYLES.title.fontFamily, 'title font family missing');
assert(TEXT_STYLES.body.fontSize >= 16, 'body font too small');

console.log(JSON.stringify({ ok: true }, null, 2));
```

- [ ] **Step 2: Run validator and verify it fails**

Run:

```powershell
node scripts\qa-design-tokens.mjs
```

Expected:

```text
Cannot find module '../src/design/tokens.js'
```

- [ ] **Step 3: Create `src/design/tokens.js`**

Create:

```js
export const TOKENS = {
  colors: {
    canvasBg: 0x070604,
    night: 0x15101d,
    panel: 0x1b1110,
    panelRaised: 0x241613,
    iron: 0x20272b,
    ironLight: 0x2f393c,
    gold: 0xb88a3d,
    goldBright: 0xf2c86d,
    parchment: 0xd8bd83,
    parchmentDark: 0x9b7440,
    danger: 0xb6362e,
    blood: 0x7f2729,
    armor: 0x2f6682,
    poison: 0x5ca568,
    arcane: 0x7752b7,
    candle: 0xf2c86d,
    mutedText: 0xc7a96f,
    bodyText: 0xf6edd0
  },
  css: {
    body: '#f6edd0',
    primary: '#f4d89c',
    muted: '#c7a96f',
    dim: '#9b835a',
    danger: '#e16a58',
    armor: '#9fd0ec',
    poison: '#94d394'
  },
  spacing: {
    4: 4,
    8: 8,
    12: 12,
    16: 16,
    24: 24,
    32: 32,
    48: 48,
    64: 64
  },
  radius: {
    sm: 4,
    md: 7,
    lg: 10
  }
};
```

- [ ] **Step 4: Create `src/design/layouts.js`**

Create:

```js
export const LAYOUTS = {
  canvas: { width: 1536, height: 864 },
  statusBar: { x: 96, y: 28, w: 1344, h: 64 },
  battleStage: { x: 80, y: 120, w: 1000, h: 520, baseline: 548 },
  battleLog: { x: 1160, y: 150, w: 300, h: 500 },
  battleHand: { x: 170, y: 690, w: 980, h: 150 },
  endTurn: { x: 1210, y: 710, w: 220, h: 64 },
  characterCards: {
    width: 360,
    height: 594,
    y: 452,
    x: [348, 768, 1188]
  }
};
```

- [ ] **Step 5: Create `src/design/textStyles.js`**

Create:

```js
const FONT = 'Georgia, "Microsoft YaHei", serif';

export const TEXT_STYLES = {
  title: { fontFamily: FONT, fontSize: 42, color: '#f4d89c', stroke: '#120b08', strokeThickness: 5 },
  panelTitle: { fontFamily: FONT, fontSize: 22, color: '#f4d89c', stroke: '#120b08', strokeThickness: 3 },
  body: { fontFamily: FONT, fontSize: 18, color: '#f6edd0', stroke: '#120b08', strokeThickness: 2 },
  small: { fontFamily: FONT, fontSize: 14, color: '#c7a96f', stroke: '#120b08', strokeThickness: 2 },
  number: { fontFamily: FONT, fontSize: 18, color: '#fff4d8', stroke: '#120b08', strokeThickness: 3 }
};
```

- [ ] **Step 6: Create `src/design/componentStates.js`**

Create:

```js
export const COMPONENT_STATES = {
  button: {
    idle: { fill: 0x20292b, stroke: 0x9a7434, alpha: 0.94 },
    hover: { fill: 0x2b3636, stroke: 0xf2c86d, alpha: 1 },
    pressed: { fill: 0x141a1b, stroke: 0xf2c86d, alpha: 1 },
    disabled: { fill: 0x13100d, stroke: 0x4d3d23, alpha: 0.55 }
  },
  intent: {
    attack: 0xb6362e,
    defend: 0x2f6682,
    buff: 0xb88a3d,
    debuff: 0x7752b7,
    special: 0xd8bd83
  },
  rarity: {
    普通: 0xb88a3d,
    稀有: 0x8fb9d9,
    罕见: 0xb07ad8,
    诅咒: 0x30213d
  }
};
```

- [ ] **Step 7: Run token validator**

Run:

```powershell
node scripts\qa-design-tokens.mjs
```

Expected:

```json
{ "ok": true }
```

- [ ] **Step 8: Migrate `Theme.js` to import tokens without visual regression**

Modify `src/game/Theme.js` so existing exports continue to work:

```js
import { TOKENS } from '../design/tokens.js';

export const THEME = {
  colors: {
    panel: TOKENS.colors.panel,
    darkGold: TOKENS.colors.gold,
    candle: TOKENS.colors.candle
  },
  css: TOKENS.css
};
```

Preserve any existing fields used by scenes. Do not delete names until `rg "THEME\\." src` confirms no call sites break.

- [ ] **Step 9: Run syntax checks**

Run:

```powershell
node --check src\design\tokens.js
node --check src\design\layouts.js
node --check src\design\textStyles.js
node --check src\design\componentStates.js
node --check src\game\Theme.js
```

Expected: no output and exit code 0.

- [ ] **Step 10: Run build**

Run:

```powershell
pnpm run build
```

Expected: build passes.

---

## Task 3: Add Content Schema Validation

**Files:**
- Create: `src/content/schema.js`
- Create: `src/content/validateContent.js`
- Create: `scripts/qa-content-schema.mjs`
- Modify: `package.json`
- Read: `src/data/cards.js`
- Read: `src/data/relics.js`
- Read: `src/data/enemies.js`
- Read: `src/data/events.js`

**Plugins / skills:**
- `superpowers:test-driven-development`
- No visual plugin

- [ ] **Step 1: Create validation script before implementation**

Create `scripts/qa-content-schema.mjs`:

```js
import { cards } from '../src/data/cards.js';
import { relics } from '../src/data/relics.js';
import { enemies } from '../src/data/enemies.js';
import { events } from '../src/data/events.js';
import { validateAllContent } from '../src/content/validateContent.js';

const report = validateAllContent({ cards, relics, enemies, events });

if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(report, null, 2));
```

- [ ] **Step 2: Verify failure**

Run:

```powershell
node scripts\qa-content-schema.mjs
```

Expected:

```text
Cannot find module '../src/content/validateContent.js'
```

- [ ] **Step 3: Create `src/content/schema.js`**

Create:

```js
export const CARD_TYPES_ALLOWED = new Set(['攻击', '防御', '技能', '法术', '状态', '诅咒']);
export const RARITY_ALLOWED = new Set(['普通', '罕见', '稀有', '特殊', '诅咒']);
export const ENEMY_TYPES_ALLOWED = new Set(['normal', 'elite', 'boss']);
export const NODE_TYPES_ALLOWED = new Set(['battle', 'elite', 'event', 'shop', 'rest', 'chest', 'boss']);

export function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function hasNumber(value) {
  return Number.isFinite(value);
}

export function isArray(value) {
  return Array.isArray(value);
}
```

- [ ] **Step 4: Create `src/content/validateContent.js`**

Create:

```js
import { CARD_TYPES_ALLOWED, ENEMY_TYPES_ALLOWED, RARITY_ALLOWED, hasNumber, hasText, isArray } from './schema.js';

function issue(scope, id, message) {
  return { scope, id: id ?? 'unknown', message };
}

function validateCard(card) {
  const issues = [];
  if (!hasText(card.id)) issues.push(issue('card', card.id, 'missing id'));
  if (!hasText(card.name)) issues.push(issue('card', card.id, 'missing name'));
  if (!CARD_TYPES_ALLOWED.has(card.type)) issues.push(issue('card', card.id, `invalid type ${card.type}`));
  if (!RARITY_ALLOWED.has(card.rarity)) issues.push(issue('card', card.id, `invalid rarity ${card.rarity}`));
  if (!hasNumber(card.cost) && card.cost !== null) issues.push(issue('card', card.id, 'invalid cost'));
  if (!hasText(card.text)) issues.push(issue('card', card.id, 'missing text'));
  if (!isArray(card.effects)) issues.push(issue('card', card.id, 'effects must be array'));
  return issues;
}

function validateRelic(relic) {
  const issues = [];
  if (!hasText(relic.id)) issues.push(issue('relic', relic.id, 'missing id'));
  if (!hasText(relic.name)) issues.push(issue('relic', relic.id, 'missing name'));
  if (!hasText(relic.text)) issues.push(issue('relic', relic.id, 'missing text'));
  if (!hasText(relic.rarity)) issues.push(issue('relic', relic.id, 'missing rarity'));
  return issues;
}

function validateEnemy(enemy) {
  const issues = [];
  if (!hasText(enemy.id)) issues.push(issue('enemy', enemy.id, 'missing id'));
  if (!hasText(enemy.name)) issues.push(issue('enemy', enemy.id, 'missing name'));
  if (!ENEMY_TYPES_ALLOWED.has(enemy.type)) issues.push(issue('enemy', enemy.id, `invalid type ${enemy.type}`));
  if (!hasNumber(enemy.hp) || enemy.hp <= 0) issues.push(issue('enemy', enemy.id, 'invalid hp'));
  if (!isArray(enemy.actions) || enemy.actions.length === 0) issues.push(issue('enemy', enemy.id, 'missing actions'));
  return issues;
}

function validateEvent(event) {
  const issues = [];
  if (!hasText(event.id)) issues.push(issue('event', event.id, 'missing id'));
  if (!hasText(event.title ?? event.name)) issues.push(issue('event', event.id, 'missing title/name'));
  if (!isArray(event.options) || event.options.length === 0) issues.push(issue('event', event.id, 'missing options'));
  return issues;
}

function duplicates(items, scope) {
  const seen = new Set();
  const issues = [];
  for (const item of items) {
    if (!item?.id) continue;
    if (seen.has(item.id)) issues.push(issue(scope, item.id, 'duplicate id'));
    seen.add(item.id);
  }
  return issues;
}

export function validateAllContent({ cards, relics, enemies, events }) {
  const issues = [
    ...duplicates(cards, 'card'),
    ...duplicates(relics, 'relic'),
    ...duplicates(enemies, 'enemy'),
    ...duplicates(events, 'event'),
    ...cards.flatMap(validateCard),
    ...relics.flatMap(validateRelic),
    ...enemies.flatMap(validateEnemy),
    ...events.flatMap(validateEvent)
  ];
  return {
    ok: issues.length === 0,
    counts: {
      cards: cards.length,
      relics: relics.length,
      enemies: enemies.length,
      events: events.length
    },
    issues
  };
}
```

- [ ] **Step 5: Add script to `package.json`**

Add:

```json
"qa:content-schema": "node scripts/qa-content-schema.mjs"
```

- [ ] **Step 6: Run schema validator**

Run:

```powershell
pnpm run qa:content-schema
```

Expected:

```json
{ "ok": true }
```

If it fails because current data uses a different field name, update the validator to support the real field, not the data blindly.

---

## Task 4: Split BattleScene Into Focused Battle Modules

**Files:**
- Modify: `src/scenes/BattleScene.js`
- Create: `src/scenes/battle/BattleLayout.js`
- Create: `src/scenes/battle/BattleHud.js`
- Create: `src/scenes/battle/BattleUnits.js`
- Create: `src/scenes/battle/BattleHand.js`
- Create: `src/scenes/battle/BattleLogPanel.js`
- Create: `src/scenes/battle/BattleInputController.js`
- Test: `scripts/qa-battle-module-smoke.mjs`

**Plugins / skills:**
- `superpowers:test-driven-development`
- `superpowers:systematic-debugging` if click misalignment returns
- Browser/Playwright local QA

- [ ] **Step 1: Create module smoke test**

Create `scripts/qa-battle-module-smoke.mjs`:

```js
import { BATTLE_LAYOUT } from '../src/scenes/battle/BattleLayout.js';

function assert(value, message) {
  if (!value) throw new Error(message);
}

assert(BATTLE_LAYOUT.status.x === 96, 'status x changed unexpectedly');
assert(BATTLE_LAYOUT.stage.baseline === 548, 'battle baseline must be stable');
assert(BATTLE_LAYOUT.hand.w === 980, 'hand panel width must be stable');

console.log(JSON.stringify({ ok: true, layout: BATTLE_LAYOUT }, null, 2));
```

- [ ] **Step 2: Verify failure**

Run:

```powershell
node scripts\qa-battle-module-smoke.mjs
```

Expected:

```text
Cannot find module '../src/scenes/battle/BattleLayout.js'
```

- [ ] **Step 3: Extract layout**

Create `src/scenes/battle/BattleLayout.js`:

```js
export const BATTLE_LAYOUT = {
  status: { x: 96, y: 28, w: 1344, h: 64 },
  stage: { x: 80, y: 120, w: 1000, h: 520, baseline: 548 },
  player: { x: 280, y: 455 },
  enemySingle: { x: 760, y: 430 },
  enemyPair: [
    { x: 680, y: 430 },
    { x: 860, y: 430 }
  ],
  log: { x: 1160, y: 150, w: 300, h: 500 },
  endTurn: { x: 1210, y: 710, w: 220, h: 64 },
  hand: { x: 170, y: 690, w: 980, h: 150 }
};
```

- [ ] **Step 4: Replace local `LAYOUT` in `BattleScene.js`**

Modify import:

```js
import { BATTLE_LAYOUT as LAYOUT } from './battle/BattleLayout.js';
```

Delete the inline `const LAYOUT = { ... }`.

- [ ] **Step 5: Run module smoke test**

Run:

```powershell
node scripts\qa-battle-module-smoke.mjs
```

Expected:

```json
{ "ok": true }
```

- [ ] **Step 6: Extract HUD creation**

Create `src/scenes/battle/BattleHud.js` with functions:

```js
export function createBattleHud(scene, layout) {
  scene.drawStaticBattlefield();
  return {
    goldText: scene.goldText,
    nodeText: scene.nodeText,
    turnText: scene.turnText,
    relicText: scene.relicText,
    endTurnButton: scene.endTurnButton
  };
}

export function updateBattleHud(scene, run, battle) {
  scene.goldText.setText(`金币 ${run.gold}`);
  scene.nodeText.setText(`第 1 章 · 节点 ${Math.max(1, (run.floor ?? 0) + 1)}`);
  scene.turnText.setText(`第 ${battle.turn} 回合 · 能量 ${battle.player.energy}/${run.baseEnergy}`);
  scene.relicText.setText(`遗物 ${run.relics.length}`);
}
```

Then migrate logic carefully. Do not delete `drawStaticBattlefield()` until all references are gone.

- [ ] **Step 7: Extract unit rendering after HUD is stable**

Create `src/scenes/battle/BattleUnits.js` with public functions:

```js
export function enemyPosition(layout, aliveIndex, livingCount, enemy) {
  if (enemy.type === 'boss') return { x: 790, y: 414 };
  if (livingCount <= 1) return layout.enemySingle;
  if (livingCount === 2) return layout.enemyPair[Math.min(aliveIndex, 1)];
  return { x: 620 + aliveIndex * 160, y: 430 };
}
```

Move only pure positioning first. Move rendering only after screenshot parity passes.

- [ ] **Step 8: Run syntax and build**

Run:

```powershell
node --check src\scenes\BattleScene.js
node --check src\scenes\battle\BattleLayout.js
node --check src\scenes\battle\BattleHud.js
node --check src\scenes\battle\BattleUnits.js
pnpm run build
```

Expected: all pass.

- [ ] **Step 9: Run battle screenshots**

Run:

```powershell
node scripts\qa-final-art-rescue.mjs --url=http://127.0.0.1:4176/
```

Expected:

```json
{ "ok": true }
```

Manual visual check:

- `qa/screenshots/final_art_rescue/battle_knight_after.png`
- `qa/screenshots/final_art_rescue/battle_nun_after.png`
- `qa/screenshots/final_art_rescue/battle_alchemist_after.png`

No click offset, no overlapping cards, no missing HUD.

---

## Task 5: Build Combat Animation Event Queue

**Files:**
- Create: `src/animation/CombatAnimationQueue.js`
- Create: `src/animation/CombatAnimationEvents.js`
- Modify: `src/scenes/BattleScene.js`
- Modify: `src/systems/BattleSystem.js` only if event payloads need normalization
- Test: `scripts/qa-combat-animation-events.mjs`

**Plugins / skills:**
- `superpowers:test-driven-development`
- `superpowers:systematic-debugging` for desync
- Browser/Playwright local QA

- [ ] **Step 1: Create event normalizer test**

Create `scripts/qa-combat-animation-events.mjs`:

```js
import { normalizeCombatEvent } from '../src/animation/CombatAnimationEvents.js';

function assert(value, message) {
  if (!value) throw new Error(message);
}

const damage = normalizeCombatEvent({ type: 'enemyDamage', targetIndex: 0, amount: 6 });
assert(damage.kind === 'enemyDamage', 'enemyDamage kind mismatch');
assert(damage.targetIndex === 0, 'target index mismatch');
assert(damage.amount === 6, 'damage amount mismatch');

const block = normalizeCombatEvent({ type: 'block', amount: 5 });
assert(block.kind === 'block', 'block kind mismatch');

console.log(JSON.stringify({ ok: true }, null, 2));
```

- [ ] **Step 2: Verify failure**

Run:

```powershell
node scripts\qa-combat-animation-events.mjs
```

Expected: module not found.

- [ ] **Step 3: Create `CombatAnimationEvents.js`**

Create:

```js
export function normalizeCombatEvent(event) {
  if (!event || typeof event.type !== 'string') {
    return { kind: 'unknown', raw: event };
  }
  return {
    kind: event.type,
    targetIndex: event.targetIndex ?? null,
    enemyId: event.enemyId ?? null,
    amount: Number.isFinite(event.amount) ? event.amount : 0,
    cardId: event.cardId ?? null,
    raw: event
  };
}
```

- [ ] **Step 4: Create `CombatAnimationQueue.js`**

Create:

```js
import { normalizeCombatEvent } from './CombatAnimationEvents.js';

export class CombatAnimationQueue {
  constructor(scene) {
    this.scene = scene;
    this.queue = [];
    this.running = false;
  }

  enqueue(events, handler) {
    for (const event of events ?? []) {
      this.queue.push({ event: normalizeCombatEvent(event), handler });
    }
    if (!this.running) this.runNext();
  }

  runNext() {
    const item = this.queue.shift();
    if (!item) {
      this.running = false;
      return;
    }
    this.running = true;
    item.handler(item.event, () => this.runNext());
  }

  clear() {
    this.queue = [];
    this.running = false;
  }
}
```

- [ ] **Step 5: Run event tests**

Run:

```powershell
node scripts\qa-combat-animation-events.mjs
```

Expected:

```json
{ "ok": true }
```

- [ ] **Step 6: Integrate queue in `BattleScene.js`**

In `create()`:

```js
this.animationQueue = new CombatAnimationQueue(this);
```

Replace direct loop calls only after existing `applyVisualEvents()` remains callable. First safe integration:

```js
playVisualEvents(events, targetIndex = null, onComplete = () => {}) {
  const normalized = events ?? [];
  if (normalized.length === 0) {
    onComplete();
    return;
  }
  let remaining = normalized.length;
  this.applyVisualEvents(normalized, targetIndex);
  this.time.delayedCall(360, () => {
    remaining = 0;
    onComplete();
  });
}
```

Do not remove existing animation effects until screenshots prove parity.

- [ ] **Step 7: Add event payload IDs to `BattleSystem` only where missing**

When `BattleSystem.useCard()` creates events, include:

```js
{ type: 'enemyDamage', targetIndex, amount, cardId: card.id }
```

Do not change damage math in this task.

- [ ] **Step 8: Run role matrix**

Run:

```powershell
node scripts\qa-role-matrix.mjs --url=http://127.0.0.1:4176/
```

Expected:

```json
{ "ok": true }
```

---

## Task 6: Upgrade Audio Mixer Locally

**Files:**
- Modify: `src/game/AudioManager.js`
- Create: `src/audio/AudioBuses.js`
- Create: `src/audio/MusicDirector.js`
- Modify: `src/scenes/SettingsScene.js`
- Modify: `src/game/SaveManager.js`
- Test: `scripts/qa-audio-settings.mjs`

**Plugins / skills:**
- `superpowers:test-driven-development`
- No external audio plugin required initially
- Image/audio generation deferred until user approves asset direction

- [ ] **Step 1: Create audio settings validator**

Create `scripts/qa-audio-settings.mjs`:

```js
import { DEFAULT_AUDIO_SETTINGS, normalizeAudioSettings } from '../src/audio/AudioBuses.js';

function assert(value, message) {
  if (!value) throw new Error(message);
}

const normalized = normalizeAudioSettings({ master: 0.5, music: 0.2 });
assert(normalized.master === 0.5, 'master volume mismatch');
assert(normalized.music === 0.2, 'music volume mismatch');
assert(normalized.sfx === DEFAULT_AUDIO_SETTINGS.sfx, 'sfx default mismatch');
assert(normalizeAudioSettings({ master: 99 }).master === 1, 'master must clamp high');
assert(normalizeAudioSettings({ master: -5 }).master === 0, 'master must clamp low');

console.log(JSON.stringify({ ok: true }, null, 2));
```

- [ ] **Step 2: Create `AudioBuses.js`**

Create:

```js
export const DEFAULT_AUDIO_SETTINGS = {
  master: 1,
  music: 0.75,
  ambience: 0.7,
  sfx: 0.85,
  ui: 0.75
};

function clamp01(value, fallback) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(1, value));
}

export function normalizeAudioSettings(input = {}) {
  return {
    master: clamp01(input.master, DEFAULT_AUDIO_SETTINGS.master),
    music: clamp01(input.music, DEFAULT_AUDIO_SETTINGS.music),
    ambience: clamp01(input.ambience, DEFAULT_AUDIO_SETTINGS.ambience),
    sfx: clamp01(input.sfx, DEFAULT_AUDIO_SETTINGS.sfx),
    ui: clamp01(input.ui, DEFAULT_AUDIO_SETTINGS.ui)
  };
}
```

- [ ] **Step 3: Run validator**

Run:

```powershell
node scripts\qa-audio-settings.mjs
```

Expected:

```json
{ "ok": true }
```

- [ ] **Step 4: Extend `SaveManager` settings**

Add audio settings to default settings:

```js
audio: {
  master: 1,
  music: 0.75,
  ambience: 0.7,
  sfx: 0.85,
  ui: 0.75
}
```

Normalize older saves by merging with defaults.

- [ ] **Step 5: Extend `AudioManager` with bus gains**

Add fields:

```js
this.busVolumes = normalizeAudioSettings(settings.audio);
```

Route generated sounds:

- UI hover/click to `ui`.
- Card/battle/hit/shield to `sfx`.
- Future ambience to `ambience`.
- Future music to `music`.

- [ ] **Step 6: Update Settings scene**

Add sliders or stepped buttons for:

- Master
- Music
- Ambience
- SFX
- UI

Keep existing sound on/off switch as master mute.

- [ ] **Step 7: Run settings screenshot**

Use local browser QA to capture settings:

```powershell
node scripts\qa-final-art-rescue.mjs --url=http://127.0.0.1:4176/
```

Manual check:

- Settings text fits.
- Audio options are clear.
- No English internal keys visible.

---

## Task 7: Build Formal Asset Pipeline

**Files:**
- Modify: `src/art/FinalArtAssets.js`
- Modify: `scripts/generate-final-art-assets.mjs`
- Create: `src/art/AssetManifestValidator.js`
- Create: `scripts/qa-asset-manifest.mjs`
- Create: `docs/ART_PIPELINE.md`
- Create folders under `public/assets/art/concepts/`

**Plugins / skills:**
- Product Design ideate for visual directions
- `imagegen` for bitmap concept art after user approves direction
- Figma optional for editable art boards
- `superpowers:test-driven-development`

- [ ] **Step 1: Create asset manifest validator**

Create `scripts/qa-asset-manifest.mjs`:

```js
import fs from 'node:fs';
import path from 'node:path';
import { flattenFinalArtAssets } from '../src/art/FinalArtAssets.js';

const root = process.cwd();
const missing = [];

for (const asset of flattenFinalArtAssets()) {
  const localPath = path.join(root, asset.url.replace(/^\//, 'public/'));
  if (!fs.existsSync(localPath)) missing.push({ key: asset.key, path: localPath });
}

if (missing.length > 0) {
  console.error(JSON.stringify({ ok: false, missing }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, count: flattenFinalArtAssets().length }, null, 2));
```

- [ ] **Step 2: Run validator**

Run:

```powershell
node scripts\qa-asset-manifest.mjs
```

Expected:

```json
{ "ok": true }
```

- [ ] **Step 3: Document asset stages**

Create `docs/ART_PIPELINE.md`:

```md
# Art Pipeline

## Asset stages

- `placeholder-svg`: generated local SVG, acceptable only before final art.
- `concept-bitmap`: ImageGen or artist concept, not directly final.
- `production-bitmap`: approved PNG/WebP used in game.
- `spritesheet`: frame animation asset.
- `atlas`: packed UI or sprite atlas.

## Required metadata

- id
- path
- width
- height
- usage
- stage
- source
- approval status

## Local acceptance

Every visual replacement must have before/after screenshot evidence under `qa/screenshots/product_upgrade/`.
```

- [ ] **Step 4: Add concept folders**

Create:

```text
public/assets/art/concepts/heroes
public/assets/art/concepts/enemies
public/assets/art/concepts/bosses
public/assets/art/concepts/cards
public/assets/art/concepts/backgrounds
```

- [ ] **Step 5: Product Design visual direction gate**

Before generating production assets:

1. Use Product Design ideation.
2. Produce 3 visual directions:
   - Painterly dark medieval
   - Pixel-illustrated gothic
   - Hybrid hand-painted UI with pixel sprites
3. User chooses one.
4. Only then use `imagegen` for hero/Boss/card concepts.

No code asset replacement before direction selection.

---

## Task 8: Character Identity Rebuild

**Files:**
- Modify: `src/data/characters.js`
- Modify: `src/scenes/CharacterSelectScene.js`
- Modify: `src/art/PortraitFactory.js`
- Modify: `src/art/FinalArtAssets.js`
- Create: `docs/CHARACTER_ART_BRIEFS.md`
- Add assets under `public/assets/art/concepts/heroes/`

**Plugins / skills:**
- Product Design ideate
- `imagegen` for portrait concepts
- Browser QA for character select
- Superpowers writing-plans for each character if executed separately

- [ ] **Step 1: Write character art briefs**

Create `docs/CHARACTER_ART_BRIEFS.md` with sections:

```md
# Character Art Briefs

## 流亡骑士
- Silhouette: broad shoulders, broken black armor, short sword, cracked shield.
- Colors: black iron, faded red cloth, old gold, gray fire.
- Mood: exhausted discipline, guilt, restrained violence.
- Required poses: select idle, battle idle, attack, block, hit.

## 圣烛修女
- Silhouette: vertical candle staff, white coif, black robe, golden wax halo.
- Colors: black cloth, warm wax, pale gold, smoky white.
- Mood: calm faith under pressure, compassionate but severe.
- Required poses: select idle, battle idle, prayer, shield, candle burst.

## 灰血炼金师
- Silhouette: plague mask, lean body, leather coat, vial rack.
- Colors: brown leather, poison green, brass, sickly yellow.
- Mood: clever, dangerous, self-experimenting.
- Required poses: select idle, battle idle, throw vial, inject, hit.
```

- [ ] **Step 2: Generate or import selected concepts**

Use `imagegen` only after visual direction is approved. Required outputs:

- `public/assets/art/concepts/heroes/exiled-knight-select.png`
- `public/assets/art/concepts/heroes/candle-nun-select.png`
- `public/assets/art/concepts/heroes/ashblood-alchemist-select.png`

- [ ] **Step 3: Add asset registry entries**

In `FinalArtAssets.js`, add concept entries separately from current SVG:

```js
concepts: {
  heroes: {
    exiledKnightSelect: { key: 'concept-hero-exiled-knight-select', url: '/assets/art/concepts/heroes/exiled-knight-select.png', width: 512, height: 768 }
  }
}
```

Do not replace live art until screenshots prove fit.

- [ ] **Step 4: Character select staging mode**

Add a local-only flag in `CharacterSelectScene.js`:

```js
const USE_CONCEPT_HERO_ART = false;
```

During review, toggle to true locally for screenshot QA. Do not leave it true unless all three images exist and fit.

- [ ] **Step 5: Screenshot QA**

Run:

```powershell
node scripts\qa-final-art-rescue.mjs --url=http://127.0.0.1:4176/
```

Manual acceptance:

- Each hero reads as a distinct character at 1536x864.
- No important face/weapon cropped.
- Text does not overlap art.
- Start button remains accessible.

---

## Task 9: Combat UI And Card Feel Upgrade

**Files:**
- Modify: `src/ui/UICard.js`
- Modify: `src/ui/UIButton.js`
- Modify: `src/ui/UIPanel.js`
- Modify: `src/ui/UIHealthBar.js`
- Modify: `src/ui/UIStatusIcon.js`
- Modify: `src/scenes/BattleScene.js`
- Create: `src/ui/AshenPanel.js` only if existing `UIPanel` becomes overloaded
- Test: `scripts/qa-card-layout.mjs`

**Plugins / skills:**
- Product Design audit
- Browser/Playwright screenshots
- Superpowers TDD for layout helper math

- [ ] **Step 1: Add card layout validator**

Create `scripts/qa-card-layout.mjs`:

```js
import { LAYOUTS } from '../src/design/layouts.js';

function assert(value, message) {
  if (!value) throw new Error(message);
}

const card = { w: 132, h: 184 };
assert(card.w * 7 <= LAYOUTS.battleHand.w, 'seven cards must fit in hand panel before spacing');
assert(LAYOUTS.battleHand.y + card.h <= 874, 'card bottom must not exceed canvas area by more than hover allowance');

console.log(JSON.stringify({ ok: true }, null, 2));
```

- [ ] **Step 2: Run validator**

Run:

```powershell
node scripts\qa-card-layout.mjs
```

Expected: pass.

- [ ] **Step 3: Improve `UICard` rendering**

Target visual behavior:

- More parchment texture.
- Sharper cost orb.
- Larger art window.
- Description max 3 lines.
- Type/rarity never clipped.
- Disabled state dims but remains readable.

Implementation boundary:

- Keep `UICard` public constructor unchanged.
- Move card type color helpers into private functions inside `UICard.js`.
- Do not modify card data in this task.

- [ ] **Step 4: Improve hand arrangement**

In `BattleScene.renderHand()`:

- 1-5 cards: centered, no overlap.
- 6-7 cards: centered, no overlap.
- 8+ cards: overlap max 18 px or scale down to 0.92.
- Hover card always appears above adjacent cards.

Acceptance:

```text
No card title or cost orb hidden at 7 cards.
No card exits bottom canvas at hover.
```

- [ ] **Step 5: Screenshot QA**

Capture:

- `qa/screenshots/product_upgrade/card_hand_5.png`
- `qa/screenshots/product_upgrade/card_hand_7.png`
- `qa/screenshots/product_upgrade/card_hover.png`

If script support is missing, extend `scripts/qa-final-art-rescue.mjs` rather than manual-only acceptance.

---

## Task 10: Battle Rules Expansion Without Breaking Existing Roles

**Files:**
- Modify: `src/data/cards.js`
- Modify: `src/systems/BattleSystem.js`
- Modify: `src/systems/CardSystem.js`
- Modify: `src/systems/RelicSystem.js`
- Modify: `src/data/keywords.js`
- Test: `scripts/qa-role-matrix.mjs`
- Test: `scripts/qa-content-schema.mjs`
- Create: `scripts/qa-battle-mechanics.mjs`

**Plugins / skills:**
- `superpowers:test-driven-development`
- No visual plugins

- [ ] **Step 1: Add deterministic mechanics tests before adding cards**

Create `scripts/qa-battle-mechanics.mjs`:

```js
import { createNewRun } from '../src/game/GameState.js';
import { BattleSystem } from '../src/systems/BattleSystem.js';

function assert(value, message) {
  if (!value) throw new Error(message);
}

function firstCardById(battle, id) {
  return battle.player.hand.find((card) => card.id === id);
}

const run = createNewRun('exiled-knight');
const battle = BattleSystem.createBattle(run, 'battle');
const card = firstCardById(battle, 'knight-cleave');
assert(card, 'knight-cleave must be drawable in baseline battle');
assert(battle.player.energy === run.baseEnergy, 'energy must start at base energy');

console.log(JSON.stringify({ ok: true }, null, 2));
```

- [ ] **Step 2: Run current mechanics test**

Run:

```powershell
node scripts\qa-battle-mechanics.mjs
```

Expected: pass.

- [ ] **Step 3: Define build route taxonomy**

Add to `docs/BALANCE.md`:

```md
## Build Route Taxonomy

### 流亡骑士
- 伤痕爆发
- 盾卫反击
- 处决追猎
- 断誓高攻

### 圣烛修女
- 烛印延迟
- 防御祷文
- 虚弱控制
- 白烛回复

### 灰血炼金师
- 自伤爆发
- 腐蚀药剂
- 药剂槽循环
- 低血量收益
```

- [ ] **Step 4: Add cards in small batches**

Batch rule:

- Add at most 6 cards per batch.
- Run content schema.
- Run role matrix.
- Run build.

Command after each batch:

```powershell
pnpm run qa:content-schema
node scripts\qa-role-matrix.mjs --url=http://127.0.0.1:4176/
pnpm run build
```

- [ ] **Step 5: Add new mechanics only with tests**

For any new effect kind, first add a test case to `qa-battle-mechanics.mjs`.

Example for future `gainStance`:

```js
assert(typeof BattleSystem.applyEffectKind === 'function', 'effect dispatcher must be testable');
```

If `BattleSystem` has no testable dispatcher, split effect application into:

- `src/systems/battle/CardEffectResolver.js`
- `src/systems/battle/StatusResolver.js`

Do not add more `if` branches to a 500+ line system without a split plan.

---

## Task 11: First-Act Content Expansion

**Files:**
- Modify: `src/data/enemies.js`
- Modify: `src/data/events.js`
- Modify: `src/data/relics.js`
- Modify: `src/systems/EnemyAI.js`
- Modify: `src/systems/MapSystem.js`
- Create: `src/data/acts/act1/encounters.js`
- Create: `src/data/acts/act1/eventChains.js`
- Test: `scripts/qa-content-schema.mjs`
- Test: `scripts/qa-release-flow.mjs`

**Plugins / skills:**
- Superpowers TDD for data behavior
- Product Design audit for event/flow clarity

- [ ] **Step 1: Create act encounter file**

Create `src/data/acts/act1/encounters.js`:

```js
export const act1Encounters = {
  battle: [
    ['rotten-villager'],
    ['grave-skeleton'],
    ['black-hound'],
    ['plague-rats'],
    ['raven-messenger'],
    ['broken-militia']
  ],
  elite: [
    ['plague-doctor'],
    ['iron-maiden-nun'],
    ['fallen-paladin']
  ],
  boss: [['headless-grave-knight']]
};
```

- [ ] **Step 2: Wire encounters without changing battle math**

Modify `BattleSystem.createBattle()` to choose from `act1Encounters` when `run.act === 1` or no act exists.

Preserve current fallback behavior.

- [ ] **Step 3: Add event chains as data**

Create `src/data/acts/act1/eventChains.js`:

```js
export const act1EventChains = [
  {
    id: 'raven-letter-chain',
    title: '乌鸦送信',
    steps: ['raven-letter-1', 'raven-letter-2', 'raven-letter-3'],
    rewards: {
      rescue: { gold: 45 },
      bargain: { relicPool: 'common' },
      ignore: { curse: 'corruption' }
    }
  }
];
```

- [ ] **Step 4: Do not add chain UI until data validates**

Run:

```powershell
pnpm run qa:content-schema
pnpm run build
```

Expected: pass.

- [ ] **Step 5: Add first event chain UI**

Modify `EventSystem` and `EventScene`:

- Show chain step indicator, e.g. `乌鸦送信 1/3`.
- Save chain state in run.
- Do not block existing one-off events.

- [ ] **Step 6: Local flow QA**

Run:

```powershell
node scripts\qa-release-flow.mjs --url=http://127.0.0.1:4176/
```

Expected: pass.

---

## Task 12: Boss Battle Productization

**Files:**
- Modify: `src/data/enemies.js`
- Modify: `src/systems/EnemyAI.js`
- Modify: `src/scenes/BattleScene.js`
- Modify: `src/art/BossSpriteFactory.js`
- Modify: `src/effects/TurnBanner.js`
- Create: `src/effects/BossPhaseEffect.js`
- Test: `scripts/qa-boss-phases.mjs`

**Plugins / skills:**
- Product Design ideate for Boss visual phase direction
- `imagegen` for Boss concept only after direction approval
- Superpowers systematic debugging for phase bugs

- [ ] **Step 1: Create Boss phase QA script**

Create `scripts/qa-boss-phases.mjs`:

```js
import { enemies } from '../src/data/enemies.js';

function assert(value, message) {
  if (!value) throw new Error(message);
}

const boss = enemies.find((enemy) => enemy.id === 'headless-grave-knight');
assert(boss, 'headless-grave-knight missing');
assert(boss.type === 'boss', 'boss type mismatch');
assert(Array.isArray(boss.actions), 'boss actions must be array');
assert(boss.actions.length >= 3, 'boss needs at least three actions');

console.log(JSON.stringify({ ok: true, actions: boss.actions.length }, null, 2));
```

- [ ] **Step 2: Run Boss QA**

Run:

```powershell
node scripts\qa-boss-phases.mjs
```

Expected: pass.

- [ ] **Step 3: Define phase mechanics**

Update `docs/BALANCE.md`:

```md
## 无首守墓骑士 Phase Design

- Phase 1: tests basic defense, uses sword attacks and grave guard.
- Phase 2: summons grave pressure, adds vulnerable or curse pressure.
- Phase 3: low-health burst, clear telegraph, high danger but fair.
```

- [ ] **Step 4: Add visual phase effect**

Create `src/effects/BossPhaseEffect.js`:

```js
import { screenShake } from './ScreenShake.js';
import { showTurnBanner } from './TurnBanner.js';

export function bossPhaseEffect(scene, phase) {
  screenShake(scene, phase === 3 ? 0.011 : 0.008, 360);
  showTurnBanner(scene, `首领第 ${phase} 阶段`);
  scene.audio?.play('bossPhase');
}
```

- [ ] **Step 5: Replace inline Boss phase feedback**

In `BattleScene.checkBossPhaseFeedback()`, call:

```js
bossPhaseEffect(this, phase);
```

- [ ] **Step 6: Screenshot Boss stage locally**

Extend `scripts/qa-final-art-rescue.mjs` or create dedicated Boss QA capture.

Required screenshots:

- `qa/screenshots/product_upgrade/boss_phase_1.png`
- `qa/screenshots/product_upgrade/boss_phase_2.png`
- `qa/screenshots/product_upgrade/boss_phase_3.png`

---

## Task 13: Full Scene UI Upgrade Pass

**Files:**
- Modify: `src/scenes/MainMenuScene.js`
- Modify: `src/scenes/MapScene.js`
- Modify: `src/scenes/RewardScene.js`
- Modify: `src/scenes/ShopScene.js`
- Modify: `src/scenes/EventScene.js`
- Modify: `src/scenes/RestScene.js`
- Modify: `src/scenes/CodexScene.js`
- Modify: `src/scenes/SettingsScene.js`
- Modify: shared UI files in `src/ui/`
- Test: `scripts/qa-product-upgrade-scenes.mjs`

**Plugins / skills:**
- Product Design audit for each flow
- Browser/Playwright screenshots
- ImageGen only for approved screen assets

- [ ] **Step 1: Create scene QA script**

Create `scripts/qa-product-upgrade-scenes.mjs` based on `qa-final-art-rescue.mjs`, outputting:

```text
qa/screenshots/product_upgrade/01_menu.png
qa/screenshots/product_upgrade/02_character_select.png
qa/screenshots/product_upgrade/03_map.png
qa/screenshots/product_upgrade/04_battle.png
qa/screenshots/product_upgrade/05_reward.png
qa/screenshots/product_upgrade/06_shop.png
qa/screenshots/product_upgrade/07_event.png
qa/screenshots/product_upgrade/08_rest.png
qa/screenshots/product_upgrade/09_codex.png
qa/screenshots/product_upgrade/10_settings.png
```

- [ ] **Step 2: Add script to `package.json`**

Add:

```json
"qa:product-upgrade-scenes": "node scripts/qa-product-upgrade-scenes.mjs"
```

- [ ] **Step 3: Main menu upgrade**

Target:

- Continue journey shows save summary.
- Start new journey is primary.
- Secondary buttons grouped visually.
- Version stays visible but not noisy.

Modify:

- `MainMenuScene.js`
- Shared button styles only if needed.

- [ ] **Step 4: Map upgrade**

Target:

- Current route and available nodes visually clearer.
- Node legend uses “首领”, not `Boss`.
- Node hover tooltip has consequence text.
- Completed path has burn/ash trail.

Modify:

- `MapScene.js`
- `UIIcon.js`
- `MapSystem.js` only if state data required.

- [ ] **Step 5: Reward upgrade**

Target:

- Card reward comparison.
- Synergy tag: `伤痕协同`, `烛印协同`, `灰血协同`, `防御`, `抽牌`, `能量`.
- Skip reward remains clear.

Modify:

- `RewardScene.js`
- `RewardSystem.js`
- `UICard.js`

- [ ] **Step 6: Shop upgrade**

Target:

- Sections: cards, relics, remove, heal, special.
- Show current gold and after-purchase gold.
- Disabled purchases explain why.

Modify:

- `ShopScene.js`
- `RelicSystem.js` only for pricing helpers.

- [ ] **Step 7: Event upgrade**

Target:

- Every choice shows cost/reward/risk.
- Dangerous choice has visual warning.
- Event chain step visible when relevant.

Modify:

- `EventScene.js`
- `EventSystem.js`

- [ ] **Step 8: Codex upgrade**

Target:

- Use “灰烬手册” presentation.
- Better category list density.
- Larger detail preview.
- Enemy type uses `首领`.

Modify:

- `CodexScene.js`

- [ ] **Step 9: Run scene QA**

Run:

```powershell
pnpm run qa:product-upgrade-scenes -- --url=http://127.0.0.1:4176/
```

Expected:

```json
{ "ok": true }
```

Manual check:

- No English internal ids.
- No clipped Chinese text.
- No nested card-in-card visual mess.
- Canvas remains 16:9.

---

## Task 14: Accessibility And Settings Upgrade

**Files:**
- Modify: `src/game/SaveManager.js`
- Modify: `src/scenes/SettingsScene.js`
- Modify: `src/ui/UIButton.js`
- Modify: `src/ui/UICard.js`
- Modify: `src/scenes/BattleScene.js`
- Create: `src/design/accessibility.js`
- Test: `scripts/qa-accessibility-settings.mjs`

**Plugins / skills:**
- Product Design audit accessibility lens
- Browser QA

- [ ] **Step 1: Create accessibility settings module**

Create `src/design/accessibility.js`:

```js
export const DEFAULT_ACCESSIBILITY = {
  largeText: false,
  reduceMotion: false,
  reduceFlashes: false,
  highContrast: false,
  screenShake: true
};

export function normalizeAccessibility(input = {}) {
  return {
    largeText: Boolean(input.largeText),
    reduceMotion: Boolean(input.reduceMotion),
    reduceFlashes: Boolean(input.reduceFlashes),
    highContrast: Boolean(input.highContrast),
    screenShake: input.screenShake !== false
  };
}
```

- [ ] **Step 2: Create settings validator**

Create `scripts/qa-accessibility-settings.mjs`:

```js
import { normalizeAccessibility } from '../src/design/accessibility.js';

const settings = normalizeAccessibility({ largeText: 1, screenShake: false });
if (!settings.largeText) throw new Error('large text should normalize true');
if (settings.screenShake) throw new Error('screen shake should normalize false');

console.log(JSON.stringify({ ok: true }, null, 2));
```

- [ ] **Step 3: Run validator**

Run:

```powershell
node scripts\qa-accessibility-settings.mjs
```

Expected:

```json
{ "ok": true }
```

- [ ] **Step 4: Wire settings**

Add to default saved settings:

```js
accessibility: DEFAULT_ACCESSIBILITY
```

Merge older saves safely.

- [ ] **Step 5: Apply settings gradually**

Implementation order:

1. `reduceMotion` disables non-critical tweens.
2. `screenShake` disables `screenShake()`.
3. `largeText` increases UI body text by 2 px.
4. `highContrast` increases panel alpha and text contrast.
5. `reduceFlashes` lowers hit flash alpha.

- [ ] **Step 6: QA settings UI**

Capture:

- `qa/screenshots/product_upgrade/settings_accessibility.png`
- `qa/screenshots/product_upgrade/battle_reduce_motion.png`

Manual checks:

- Toggles fit.
- Labels are clear.
- No layout shift breaks buttons.

---

## Task 15: Content Scale Plan For Three Acts And Ending

**Files:**
- Create: `docs/CONTENT_EXPANSION_SPEC.md`
- Create: `src/data/acts/act2/README.md`
- Create: `src/data/acts/act3/README.md`
- Create: `src/data/acts/finale/README.md`
- Modify: `docs/CONTENT_MANIFEST.md`

**Plugins / skills:**
- Superpowers brainstorming for each act before implementation
- Product Design audit for story flow
- No code execution until act spec is approved

- [ ] **Step 1: Create content expansion spec**

Create `docs/CONTENT_EXPANSION_SPEC.md` with:

```md
# Content Expansion Spec

## Target content scale

- Cards: 150-185 playable cards.
- Relics: 120-140 visible relics.
- Events: 45+ events.
- Enemies: 40+ enemies.
- Structure: 3 acts + finale.

## Act 1

Theme: 暮鸦村与墓园.
Status: current local priority.

## Act 2

Theme: 灰烛修道院.
Boss: 白蜡圣母.
Primary mechanics: prayer, candlemark, silence, delayed punishment.

## Act 3

Theme: 旧王都外墙.
Boss: 空心王胄.
Primary mechanics: armor, counter, formation, siege danger.

## Finale

Theme: 灰白圣火源头.
Boss: 灰心之王 / 圣火心脏.
Primary mechanics: final build check, multi-ending choices.
```

- [ ] **Step 2: Create act README files**

Create:

```md
# Act 2 灰烛修道院

Do not implement content until Act 1 productization is accepted locally.
```

Repeat for Act 3 and Finale.

- [ ] **Step 3: Update `CONTENT_MANIFEST.md`**

Update version and add future target section without pretending it is implemented.

---

## Task 16: Local QA Expansion

**Files:**
- Create: `scripts/qa-product-upgrade-scenes.mjs`
- Create: `scripts/qa-content-schema.mjs`
- Create: `scripts/qa-design-tokens.mjs`
- Create: `scripts/qa-battle-mechanics.mjs`
- Create: `scripts/qa-asset-manifest.mjs`
- Modify: `package.json`
- Create: `docs/LOCAL_QA_CHECKLIST.md`

**Plugins / skills:**
- Browser/Playwright local QA
- Superpowers verification-before-completion

- [ ] **Step 1: Create QA checklist**

Create `docs/LOCAL_QA_CHECKLIST.md`:

```md
# Local QA Checklist

## Required before handoff

- `pnpm run build`
- `pnpm run qa:content-schema`
- `pnpm run qa:design-tokens`
- `pnpm run qa:asset-manifest`
- `node scripts/qa-role-matrix.mjs --url=http://127.0.0.1:<port>/`
- `node scripts/qa-release-flow.mjs --url=http://127.0.0.1:<port>/`
- `node scripts/qa-product-upgrade-scenes.mjs --url=http://127.0.0.1:<port>/`

## Visual acceptance

- No blank canvas.
- No English internal ids.
- No clipped Chinese text.
- No off-target clicking.
- No card overlap at 7 cards.
- Battle state visible without reading log.
- 16:9 preserved at 1536x864, 1366x768, 1280x720.
```

- [ ] **Step 2: Add scripts to `package.json`**

Add:

```json
"qa:content-schema": "node scripts/qa-content-schema.mjs",
"qa:design-tokens": "node scripts/qa-design-tokens.mjs",
"qa:asset-manifest": "node scripts/qa-asset-manifest.mjs",
"qa:battle-mechanics": "node scripts/qa-battle-mechanics.mjs",
"qa:product-upgrade-scenes": "node scripts/qa-product-upgrade-scenes.mjs"
```

- [ ] **Step 3: Add screenshot dimensions**

Every new QA screenshot script must capture:

- 1536x864
- 1366x768
- 1280x720

Minimum outputs:

```text
qa/screenshots/product_upgrade/battle_1536x864.png
qa/screenshots/product_upgrade/battle_1366x768.png
qa/screenshots/product_upgrade/battle_1280x720.png
```

- [ ] **Step 4: Final local QA command set**

Run:

```powershell
pnpm run build
pnpm run qa:content-schema
pnpm run qa:design-tokens
pnpm run qa:asset-manifest
pnpm run qa:battle-mechanics
node scripts\qa-role-matrix.mjs --url=http://127.0.0.1:4176/
node scripts\qa-release-flow.mjs --url=http://127.0.0.1:4176/
pnpm run qa:product-upgrade-scenes -- --url=http://127.0.0.1:4176/
```

Expected:

```text
all commands pass
```

---

## Task 17: Documentation And Review Gate

**Files:**
- Modify: `README.md`
- Modify: `docs/PRODUCT_DESIGN_OPTIMIZATION_PLAN.md`
- Create: `docs/LOCAL_PRODUCT_UPGRADE_REPORT.md`
- Modify: `docs/DEPLOYMENT.md` only to say deployment is deferred

**Plugins / skills:**
- Superpowers verification-before-completion
- Product Design audit if final screenshots show UX risk

- [ ] **Step 1: Create local upgrade report**

Create `docs/LOCAL_PRODUCT_UPGRADE_REPORT.md`:

```md
# Local Product Upgrade Report

Version target: local upgrade after `v0.5.0-final-art-rescue`

## Completed locally

- Design system: not started at report creation; update to passed/failed with evidence during execution.
- Content schema: not started at report creation; update to passed/failed with evidence during execution.
- Battle architecture: not started at report creation; update to passed/failed with evidence during execution.
- Visual pipeline: not started at report creation; update to passed/failed with evidence during execution.
- Audio/VFX: not started at report creation; update to passed/failed with evidence during execution.
- First-act content: not started at report creation; update to passed/failed with evidence during execution.
- Scene polish: not started at report creation; update to passed/failed with evidence during execution.
- QA: not started at report creation; update to passed/failed with command output and screenshot paths.

## Screenshots

- `qa/screenshots/product_upgrade/`

## Known limits

- Deployment intentionally not performed.
- External professional art may still be required.
- Bundle size warning remains tracked unless fixed.
```

- [ ] **Step 2: Update README local status**

Add section:

```md
## Local Upgrade Track

This branch is local-only until the local QA checklist passes.
```

- [ ] **Step 3: Update deployment doc**

Add:

```md
## Local Upgrade Deployment Status

Deployment is deferred. Do not deploy this upgrade until local QA and visual acceptance are complete.
```

- [ ] **Step 4: Verification before completion**

Run all required commands from `docs/LOCAL_QA_CHECKLIST.md`.

- [ ] **Step 5: Open Explorer to report**

Run:

```powershell
Start-Process explorer.exe -ArgumentList '/select,','C:\Users\16224\Desktop\灰烬圣途-重做\docs\LOCAL_PRODUCT_UPGRADE_REPORT.md'
```

---

## 4. Phase-Level Execution Order

Do not run these in parallel unless using `superpowers:subagent-driven-development` and each subagent owns a non-overlapping module.

1. Task 1: Baseline.
2. Task 2: Design tokens.
3. Task 3: Content schema.
4. Task 4: BattleScene split.
5. Task 5: Animation event queue.
6. Task 6: Audio mixer.
7. Task 16: QA expansion.
8. Task 9: Card and combat UI.
9. Task 13: Full scene UI pass.
10. Task 12: Boss productization.
11. Task 10: Battle rules expansion.
12. Task 11: First-act content expansion.
13. Task 7: Asset pipeline.
14. Task 8: Character identity rebuild.
15. Task 14: Accessibility.
16. Task 15: Three-act content spec.
17. Task 17: Final local report.

Reasoning:

- Tokens and schema first reduce later rework.
- Battle split before major combat changes reduces risk in `BattleScene.js`.
- QA expansion before polish prevents visual drift.
- Asset replacement waits until direction and registry are disciplined.
- Deployment remains out of scope.

## 5. Required Local Acceptance Checklist

- [ ] `pnpm run build` passes.
- [ ] `pnpm run qa:content-schema` passes.
- [ ] `pnpm run qa:design-tokens` passes.
- [ ] `pnpm run qa:asset-manifest` passes.
- [ ] `pnpm run qa:battle-mechanics` passes.
- [ ] `node scripts/qa-role-matrix.mjs --url=http://127.0.0.1:4176/` passes.
- [ ] `node scripts/qa-release-flow.mjs --url=http://127.0.0.1:4176/` passes.
- [ ] `pnpm run qa:product-upgrade-scenes -- --url=http://127.0.0.1:4176/` passes.
- [ ] Screenshots exist under `qa/screenshots/product_upgrade/`.
- [ ] Battle screenshots pass at 1536x864, 1366x768, 1280x720.
- [ ] No English internal ids in user-facing screenshots.
- [ ] No clipped Chinese text.
- [ ] No click misalignment in battle card/enemy/button interactions.
- [ ] No placeholder geometric character art in accepted final visual targets.
- [ ] `docs/LOCAL_PRODUCT_UPGRADE_REPORT.md` records done/not done honestly.

## 6. Explicit Non-Goals For This Local Plan

- No Netlify deployment.
- No mobile-specific full redesign yet.
- No multiplayer, accounts, cloud saves, leaderboards, achievements, or payment.
- No new framework migration.
- No DOM UI rewrite.
- No full professional art claim unless approved external assets replace generated placeholders.

## 7. Self-Review

Spec coverage:

- Gameplay depth: covered by Tasks 10, 11, 12, 15.
- Content expansion: covered by Tasks 11 and 15.
- Story expansion: covered by Task 15 and event chain work in Task 11.
- Visual upgrade: covered by Tasks 7, 8, 9, 12, 13.
- Audio/VFX: covered by Tasks 5 and 6.
- UI quality: covered by Tasks 2, 9, 13, 14.
- Quality-first local validation: covered by Tasks 1, 3, 16, 17.
- Plugin/module mapping: covered by sections 1, 2, and per-task plugin lists.

Placeholder scan:

- This plan intentionally defers actual Act 2/Act 3 content implementation until Act 1 productization passes; those deferrals are explicit non-goals, not missing implementation detail.
- No deployment steps are included except documentation stating deployment is deferred.

Type consistency:

- New modules use stable names: `TOKENS`, `LAYOUTS`, `TEXT_STYLES`, `COMPONENT_STATES`, `validateAllContent`, `CombatAnimationQueue`, `normalizeCombatEvent`.
- All scripts use `node scripts/<name>.mjs`.
- Local preview uses port `4176` consistently.

## 8. Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-30-ashen-pilgrimage-local-upgrade-master-plan.md`.

Two execution options:

1. **Subagent-Driven (recommended)** - Dispatch a fresh subagent per major task, review between tasks, fastest while keeping module boundaries clean.
2. **Inline Execution** - Execute tasks in this session using `superpowers:executing-plans`, with checkpoints after every task group.

Recommended first execution batch:

1. Task 1 Baseline Snapshot.
2. Task 2 Design System Foundation.
3. Task 3 Content Schema Validation.
4. Task 16 Local QA Expansion.

This first batch creates the safety rails before any risky visual/content expansion.
