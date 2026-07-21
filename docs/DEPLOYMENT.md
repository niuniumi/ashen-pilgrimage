# Deployment

## Production

- Platform: GitHub Pages
- Site: <https://niuniumi.github.io/ashen-pilgrimage/>
- Repository: <https://github.com/niuniumi/ashen-pilgrimage>
- Source: `main` branch through `.github/workflows/pages.yml`
- Version: `v2.4.0`
- Vite base path: `/ashen-pilgrimage/`

Netlify is not the production target. The historical Netlify site reached its account usage limit, so the canonical release now uses GitHub Pages and GitHub Actions.

## Release Gate

Run from a clean dependency install:

```bash
pnpm install --frozen-lockfile
pnpm run assets:verify
pnpm test
pnpm run qa:design-tokens
pnpm run qa:content-schema
pnpm run qa:asset-manifest
pnpm run qa:visual-bindings
pnpm run qa:battle-mechanics
pnpm run qa:battle-layout
pnpm run qa:simulation
pnpm build
pnpm exec vite build --base=/ashen-pilgrimage/
```

Start the production preview, then run browser regressions:

```bash
pnpm exec playwright install chromium
pnpm run preview -- --host 127.0.0.1 --port=4173
pnpm run qa:map-migration -- --url=http://127.0.0.1:4173/
pnpm run qa:accessibility-responsive -- --url=http://127.0.0.1:4173/
pnpm run qa:prologue-layout -- --url=http://127.0.0.1:4173/
pnpm run qa:character-select -- --url=http://127.0.0.1:4173/
pnpm run qa:audio-runtime -- --url=http://127.0.0.1:4173/
pnpm run qa:progression -- --url=http://127.0.0.1:4173/
pnpm run qa:chapter-transition -- --url=http://127.0.0.1:4173/
pnpm run qa:resume-stages -- --url=http://127.0.0.1:4173/
pnpm run qa:role-matrix -- --url=http://127.0.0.1:4173/
pnpm run qa:full-flow -- --url=http://127.0.0.1:4173/
pnpm run qa:release-flow -- --url=http://127.0.0.1:4173/
pnpm run qa:product-upgrade-scenes -- --url=http://127.0.0.1:4173/
pnpm run qa:pixel-scenes -- --url=http://127.0.0.1:4173/
pnpm run qa:actor-roster -- --url=http://127.0.0.1:4173/
pnpm run qa:pause-menu -- --url=http://127.0.0.1:4173/
pnpm exec node scripts/qa-resource-budget.mjs --url=http://127.0.0.1:4173/
```

`qa:responsive-facing` 只读取 `QA_URL`；本地运行前将它设为 `http://127.0.0.1:4173/`。CI 会导出同一个 `QA_URL`，因此四项新增浏览器门禁与其余脚本共享严格占用的 4173 preview。

## Automated Publish

Pushing `main` starts two workflows:

1. `CI` runs assets, 224+ Node tests, static contracts, deterministic simulation, production build and the full 4173 browser release gate. The browser gate includes accessibility/mobile, prologue layout, character selection and audio runtime coverage.
2. `Deploy GitHub Pages` only accepts a successful same-repository `main` push CI head, rejects stale heads, builds that exact SHA with the repository base path and publishes `dist/`.

After both workflows pass, verify production with:

```bash
pnpm run qa:deploy-smoke -- --url=https://niuniumi.github.io/ashen-pilgrimage/
```

The smoke check must confirm the v2.4.0 version label, main menu, prologue, character selection, map, battle and pause flow without browser console errors.

## Bundle Note

Phaser is shipped in the main JavaScript bundle, so Vite currently reports a non-blocking chunk-size warning. Production images and audio were reduced from the previous mixed-asset build, and obsolete hand-painted, SVG and generated runtime directories are no longer published.
