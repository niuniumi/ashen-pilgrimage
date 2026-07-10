# Deployment

Version: `v0.5.0-final-art-rescue`

## Platform

Netlify

## Site

- Project name: `ashen-pilgrimage-stage2`
- Site id: `83e14dfc-0695-481f-b80f-2bb7ab18d467`
- Site URL: <https://ashen-pilgrimage-stage2.netlify.app/>
- Netlify project page: <https://app.netlify.com/projects/ashen-pilgrimage-stage2>

## Local Build

Commands:

```bash
pnpm install
pnpm run build
```

Result:

- `pnpm install`: passed, lockfile unchanged.
- `pnpm run build`: passed.
- Warning: Vite chunk size exceeds 500 kB after minification. This is recorded as a non-blocking bundle-size warning.
- Preview used for QA: <http://127.0.0.1:4175/>

Publish directory:

```text
dist
```

## QA Before Deploy

Commands:

```bash
node scripts/qa-final-art-rescue.mjs --url=http://127.0.0.1:4175/
node scripts/qa-role-matrix.mjs --url=http://127.0.0.1:4175/
node scripts/qa-release-flow.mjs --url=http://127.0.0.1:4175/
```

Results:

- Final art rescue QA: passed, 17 screenshots.
- Role matrix QA: passed, 9 screenshots.
- Release flow QA: passed, 26 steps and 27 screenshots.

Reports:

- `docs/FINAL_ART_RESCUE_QA.md`
- `docs/FINAL_ART_RESCUE_REPORT.md`
- `qa/final-art-rescue-report.json`
- `qa/role-matrix-report.json`
- `qa/release-flow-report.json`

## Deploy

Deployment was triggered through the Netlify MCP upload command returned for the existing site.

- Deploy id: `6a435324415b73a0ca63421e`
- Build id: `6a435323415b73a0ca63421c`
- Deploy state: ready
- Site URL: <https://ashen-pilgrimage-stage2.netlify.app/>
- Deploy permalink: <https://6a435324415b73a0ca63421e--ashen-pilgrimage-stage2.netlify.app/>

## Online Smoke

Commands:

```bash
node scripts/qa-final-art-rescue.mjs --url=https://ashen-pilgrimage-stage2.netlify.app/ --deploy
node scripts/qa-deploy-smoke.mjs --url=https://ashen-pilgrimage-stage2.netlify.app/
```

Results:

- Final art rescue deploy QA: passed, 4 screenshots.
- Deploy smoke: passed, 8 screenshots.
- Confirmed main menu shows `v0.5.0-final-art-rescue`.
- Confirmed character select, map, battle, pause, nun battle, and alchemist battle open online.
- Confirmed no white screen and no browser console errors in smoke script.

Required online screenshots:

- `qa/screenshots/final_art_rescue/deploy_menu.png`
- `qa/screenshots/final_art_rescue/deploy_character_select.png`
- `qa/screenshots/final_art_rescue/deploy_battle.png`
- `qa/screenshots/final_art_rescue/deploy_map.png`

Additional online screenshots:

- `qa/screenshots/deploy_art_final_menu.png`
- `qa/screenshots/deploy_release_prologue.png`
- `qa/screenshots/deploy_art_final_character.png`
- `qa/screenshots/deploy_art_final_map.png`
- `qa/screenshots/deploy_art_final_battle.png`
- `qa/screenshots/deploy_art_final_pause.png`
- `qa/screenshots/deploy_nun_battle.png`
- `qa/screenshots/deploy_alchemist_battle.png`

## Known Issues

- Current art is local generated SVG texture art, not professional hand-drawn or animated frame art.
- Phaser/Vite single bundle still exceeds 500 kB after minification.
- Mobile touch and low-end device long-run performance were not part of this final art rescue pass.
