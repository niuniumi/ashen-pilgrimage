# Deployment

## Production

- Platform: GitHub Pages
- Site: <https://niuniumi.github.io/ashen-pilgrimage/>
- Repository: <https://github.com/niuniumi/ashen-pilgrimage>
- Source: `main` branch through `.github/workflows/pages.yml`
- Version: `v2.0.0-pixel-rebuild`
- Vite base path: `/ashen-pilgrimage/`

Netlify is not the production target. The historical Netlify site reached its account usage limit, so the canonical release now uses GitHub Pages and GitHub Actions.

## Release Gate

Run from a clean dependency install:

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm run qa:content-schema
pnpm run qa:asset-manifest
pnpm run qa:visual-bindings
pnpm run qa:battle-mechanics
pnpm run qa:simulation
pnpm run build
```

Start the production preview, then run browser regressions:

```bash
pnpm run preview -- --host 127.0.0.1 --port 4173
pnpm run qa:map-migration
pnpm run qa:progression
pnpm run qa:resume-stages
pnpm run qa:pixel-scenes
pnpm run qa:role-matrix
pnpm run qa:release-flow
```

## Automated Publish

Pushing `main` starts two workflows:

1. `CI` runs unit, content, asset and browser persistence regressions.
2. `Deploy GitHub Pages` repeats the core release gate, builds with the repository base path and publishes `dist/`.

After both workflows pass, verify production with:

```bash
pnpm run qa:deploy-smoke -- --url=https://niuniumi.github.io/ashen-pilgrimage/
```

The smoke check must confirm the v2.0 version label, main menu, character selection, map, battle and pause flow without browser console errors.

## Bundle Note

Phaser is shipped in the main JavaScript bundle, so Vite currently reports a non-blocking chunk-size warning. Production images and audio were reduced from the previous mixed-asset build, and obsolete hand-painted, SVG and generated runtime directories are no longer published.
