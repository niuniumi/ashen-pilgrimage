# Local Upgrade Baseline

Version: `v0.5.0-final-art-rescue`

Baseline source:
- `docs/FINAL_ART_RESCUE_REPORT.md`
- `docs/PRODUCT_DESIGN_OPTIMIZATION_PLAN.md`
- `qa/screenshots/final_art_rescue/*.png`

Execution policy:
- Do not deploy during local upgrade execution.
- User review is required before deployment.
- Current shell does not expose `git`; local checkpoint is file timestamp plus QA screenshots until git becomes available.

Baseline commands completed before first upgrade code change:
- `pnpm install` - passed, already up to date.
- `pnpm run build` - passed with existing Vite chunk-size warning.

Required local commands for the upgrade track:
- `pnpm run build`
- `pnpm run qa:content-schema`
- `pnpm run qa:design-tokens`
- `pnpm run qa:asset-manifest`
- `pnpm run qa:battle-mechanics`
- `node scripts/qa-final-art-rescue.mjs --url=http://127.0.0.1:<local-port>/`
- `node scripts/qa-role-matrix.mjs --url=http://127.0.0.1:<local-port>/`
- `node scripts/qa-release-flow.mjs --url=http://127.0.0.1:<local-port>/`
- `node scripts/qa-product-upgrade-scenes.mjs --url=http://127.0.0.1:<local-port>/`
