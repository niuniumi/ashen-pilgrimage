# Visual Layout Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the latest visual direction across cards, main menu, character select, map, battle layout, and gilded details without expanding gameplay.

**Architecture:** Keep all UI in Phaser Canvas. Prefer existing scene/component patterns, generated bitmap assets only where the current asset itself is the problem, and shared ornament helpers for gilding. No DOM UI or new gameplay systems.

**Tech Stack:** Phaser 3, Vite, local PNG assets, existing QA scripts with Playwright.

---

### Task 1: Card Grade Color System

**Files:**
- Modify: `src/art/CardArtFactory.js`
- Modify: `src/ui/UICard.js`

- [ ] Replace rarity color usage from outline-only treatment to parchment face tint.
- [ ] Remove the blue/purple/red rarity stroke from hand-painted cards.
- [ ] Keep selected-card glow gold and separate from rarity.
- [ ] Verify card descriptions and hit zones are unchanged.

### Task 2: Main Menu Composition

**Files:**
- Create/replace: `public/assets/handpainted/menu-background-journey-v2.png`
- Modify: `src/scenes/PreloadScene.js`
- Modify: `src/art/RebuiltVisualFactory.js`
- Modify: `src/scenes/MainMenuScene.js`

- [ ] Generate a refined hand-painted medieval fantasy main-menu background with corrected campfire placement.
- [ ] Load the v2 background before falling back to the old one.
- [ ] Move title/subtitle closer to center and keep them readable on parchment.
- [ ] Enlarge the main menu buttons and raise the menu slightly.
- [ ] Remove distracting campfire overlay if the new background already contains fire correctly.

### Task 3: Character Select Layout

**Files:**
- Modify: `src/scenes/CharacterSelectScene.js`

- [ ] Rebuild the page around three tall illustrated character cards plus a right-side description panel.
- [ ] Show faction crest/mark before hover, then reveal the full clean character illustration and details on hover/selection.
- [ ] Use a hand-painted parchment/card language, not flat blocks.
- [ ] Replace the rectangular back button with the same arrow treatment used by the map.
- [ ] Remove character-card idle floating; keep only hover/selection emphasis.

### Task 4: Map Route Scale And Back Arrow

**Files:**
- Modify: `src/scenes/MapScene.js`
- Modify: `src/ui/UIOrnament.js`

- [ ] Enlarge the central route bounds so nodes occupy more of the map parchment.
- [ ] Integrate route lines with sketchy ink/gold strokes and softer labels.
- [ ] Replace map back button with the same large hand-painted arrow style used on character select.
- [ ] Add subtle gilded map-edge ornamentation.

### Task 5: Battle Layout Refinement

**Files:**
- Modify: `src/scenes/BattleScene.js`
- Modify: `src/ui/UIPanel.js`

- [ ] Adjust battle layout toward the supplied schematic while preserving actual art scene quality.
- [ ] Keep top status bar stable and pause/settings on the right.
- [ ] Make deck/pile area, hand area, right log, and end-turn button visually connected and not cramped.
- [ ] Preserve action-frame combat feedback already added.
- [ ] Add restrained gilding to status/log/hand panels.

### Task 6: Global Gilding

**Files:**
- Modify: `src/ui/UIFrame.js`
- Modify: `src/ui/UIPanel.js`
- Modify: `src/ui/UIOrnament.js`
- Modify: scene files where hand-drawn map/card borders need extra treatment

- [ ] Add reusable gilded corner/edge strokes with imperfect hand-drawn texture.
- [ ] Apply to manuscript map edges, card borders, major panels, and selected character cards.
- [ ] Keep the effect subtle and warm; avoid bright neon outlines.

### Task 7: Verification

**Files:**
- Update: `docs/QA_REPORT.md`
- Screenshots: `qa/screenshots/product_upgrade/*.png`

- [ ] Run `node --check` on changed JS files.
- [ ] Run `pnpm run build`.
- [ ] Run `pnpm run qa:product-upgrade-scenes -- --url=http://127.0.0.1:4176/`.
- [ ] Inspect main menu, character select, map, battle, and responsive battle screenshots.
- [ ] Run battle/click regression scripts after visual checks.
