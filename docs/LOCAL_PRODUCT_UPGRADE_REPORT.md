# Local Product Upgrade Report

Status: local-only review build

Preview URL:
- `http://127.0.0.1:4176/`

Deployment:
- Not deployed.
- Deployment remains deferred until user approval.

## Completed In This Local Pass

- Added a local upgrade baseline: `docs/LOCAL_UPGRADE_BASELINE.md`.
- Added design system foundation:
  - `src/design/tokens.js`
  - `src/design/layouts.js`
  - `src/design/textStyles.js`
  - `src/design/componentStates.js`
  - `scripts/qa-design-tokens.mjs`
- Migrated `src/game/Theme.js` to import design tokens while preserving existing public fields.
- Added content schema validation:
  - `src/content/schema.js`
  - `src/content/validateContent.js`
  - `scripts/qa-content-schema.mjs`
- Added local QA expansion:
  - `scripts/qa-asset-manifest.mjs`
  - `scripts/qa-battle-mechanics.mjs`
  - `scripts/qa-product-upgrade-scenes.mjs`
  - `docs/LOCAL_QA_CHECKLIST.md`
- Improved BattleScene local polish:
  - Battle log rows now have visual hierarchy instead of floating text.
  - Hand panel has explicit title and separated prompt copy.
  - Hand card rail separates playable cards from pile controls.
  - Pile counters are framed as small deck UI instead of a vague placeholder area.
  - Card fly animation ghost is non-interactive.
  - `UICard` and `UIButton` hit zones now update size, rotation, and input hit area while scaled or animated.

## QA Evidence

Passed:
- `pnpm install`
- `pnpm run build`
- `pnpm run qa:design-tokens`
- `pnpm run qa:content-schema`
- `pnpm run qa:asset-manifest`
- `pnpm run qa:battle-mechanics`
- `node scripts/qa-final-art-rescue.mjs --url=http://127.0.0.1:4176/`
- `node scripts/qa-role-matrix.mjs --url=http://127.0.0.1:4176/`
- `node scripts/qa-release-flow.mjs --url=http://127.0.0.1:4176/`
- `pnpm run qa:product-upgrade-scenes -- --url=http://127.0.0.1:4176/`

Generated product-upgrade screenshots:
- `qa/screenshots/product_upgrade/01_menu.png`
- `qa/screenshots/product_upgrade/02_character_select.png`
- `qa/screenshots/product_upgrade/03_map.png`
- `qa/screenshots/product_upgrade/04_battle.png`
- `qa/screenshots/product_upgrade/05_reward.png`
- `qa/screenshots/product_upgrade/06_shop.png`
- `qa/screenshots/product_upgrade/07_event.png`
- `qa/screenshots/product_upgrade/08_rest.png`
- `qa/screenshots/product_upgrade/09_codex.png`
- `qa/screenshots/product_upgrade/10_settings.png`
- `qa/screenshots/product_upgrade/battle_1536x864.png`
- `qa/screenshots/product_upgrade/battle_1366x768.png`
- `qa/screenshots/product_upgrade/battle_1280x720.png`

## Known Limits

- This pass establishes the local upgrade rail and improves BattleScene UI/interaction, but it is not the full cross-act content/art/audio expansion yet.
- Current art remains local SVG/vector art, not external professional hand-painted production assets.
- Vite still reports the existing chunk-size warning; build succeeds.
- `git` is not available in the current shell, so no git commit or worktree checkpoint was created.
