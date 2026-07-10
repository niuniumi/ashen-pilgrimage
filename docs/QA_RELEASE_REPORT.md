# QA Release Report

Version: `v0.3.0-release-candidate`

Generated: 2026-06-30 Asia/Shanghai

## Scope

This pass upgrades the project from a Phaser vertical-slice prototype toward a shareable release candidate. It focuses on stability, real content binding, full flow coverage, story scenes, map expansion, battle feedback, codex coverage, local build, Netlify deployment, and online smoke testing.

## Fixed Areas

- Added and wired `v0.3.0-release-candidate` version display.
- Expanded content to 56 playable cards, 24 release relics, 15 events, 8 normal enemies, 3 elites, and 1 three-phase boss.
- Reworked BattleSystem effect binding for new card effects, relic hooks, energy discounts, kill bonuses, low-HP logic, self-damage, weak immunity, candlemark, mark, and boss start relics.
- Expanded map to 12 layers and adjusted node sizing to prevent overlap.
- Added PrologueScene, BossIntroScene, ActClearScene, StoryDialog, and SceneTransition.
- Routed main menu new journey through Prologue unless story has been seen.
- Routed boss map node through BossIntroScene.
- Routed boss victory through ActClearScene before ResultScene.
- Added keyword codex tab and paginated codex lists.
- Added distinct procedural silhouettes for new enemies in battle and codex.
- Added missing release audio keys for story, dialog, reward, chest, buff, debuff, and turn events.
- Added release QA script and updated deploy smoke script for the new prologue flow.
- Deployed to Netlify and verified the online version.

## Local Validation

- `node --check` passed for all `src/**/*.js` files and QA scripts.
- Data smoke passed:
  - playable cards: 56
  - knight cards: 15
  - nun cards: 15
  - alchemist cards: 15
  - common cards: 11
  - events: 15
  - normal enemies: 8
  - elite enemies: 3
  - map layers: 12
- `pnpm run build` passed after adding bundled Node to PATH.
- Vite build warning remains: bundled chunk is larger than 500 kB.

## Release Flow Screenshots

Directory: `qa/screenshots/release/`

- `menu.png`
- `prologue.png`
- `character_select.png`
- `map.png`
- `battle_knight.png`
- `battle_nun.png`
- `battle_alchemist.png`
- `reward.png`
- `shop.png`
- `event.png`
- `rest.png`
- `chest.png`
- `boss_intro.png`
- `boss_battle.png`
- `act_clear.png`
- `result_victory.png`
- `result_defeat.png`
- `pause_menu.png`
- `codex.png`
- `responsive_1920x1080_map.png`
- `responsive_1920x1080_battle.png`
- `responsive_1536x864_map.png`
- `responsive_1536x864_battle.png`
- `responsive_1366x768_map.png`
- `responsive_1366x768_battle.png`
- `responsive_1280x720_map.png`
- `responsive_1280x720_battle.png`

## Online Smoke Screenshots

Directory: `qa/screenshots/`

- `deploy_release_menu.png`
- `deploy_release_prologue.png`
- `deploy_release_character_select.png`
- `deploy_release_map.png`
- `deploy_release_battle.png`
- `deploy_release_pause.png`
- `deploy_nun_battle.png`
- `deploy_alchemist_battle.png`

## Deploy Result

- Netlify project: `ashen-pilgrimage-stage2`
- Site URL: <https://ashen-pilgrimage-stage2.netlify.app/>
- Deploy id: `6a429f04ad2a5438aef8ba21`
- Build id: `6a429f03ad2a5438aef8ba1f`
- Online smoke: passed

## Known Issues

- Art is still procedural pixel silhouette art, not final hand-painted or sliced production assets.
- The Vite bundle is larger than 500 kB because Phaser and all scenes ship in one chunk.
- Mobile touch ergonomics have not received a dedicated pass.
- The current release is one complete first-act route, not a multi-act commercial content volume.
