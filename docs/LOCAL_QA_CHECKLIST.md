# Local QA Checklist

## Required Before Handoff

- `pnpm run build`
- `pnpm run qa:content-schema`
- `pnpm run qa:design-tokens`
- `pnpm run qa:asset-manifest`
- `pnpm run qa:battle-mechanics`
- `node scripts/qa-role-matrix.mjs --url=http://127.0.0.1:<port>/`
- `node scripts/qa-release-flow.mjs --url=http://127.0.0.1:<port>/`
- `node scripts/qa-product-upgrade-scenes.mjs --url=http://127.0.0.1:<port>/`

## Visual Acceptance

- No blank canvas.
- No English internal ids.
- No clipped Chinese text.
- No off-target clicking.
- No card overlap at 7 cards.
- Battle state visible without reading log.
- 16:9 preserved at 1536x864, 1366x768, and 1280x720.
- Top bar text does not touch panel edges.
- Player and enemy health bars stay centered on their units.
- Battle log does not cover enemies.
- End-turn button remains visible.

## Local-Only Policy

- Do not deploy during this upgrade track.
- Deployment requires explicit user approval after local review.
