# Task 5 implementer report

## Scope

- Finalized AudioContext unlock, one-shot pointer/keyboard gesture binding, BGM lifecycle pause/resume ownership, and reliable Phaser volume fades.
- Routed shared `SceneTransition` fades through the existing motion policy without changing explicit full-motion durations or payloads.
- Expanded real-browser audio QA and stabilized the v2.4 browser QA URL contract and target viewports.
- Preserved the existing v2.4 SFX gain, variance, shared cooldown, overlapping duck, and manual duck behavior.

## Red / green evidence

### Initial lifecycle and reduced-motion cycle

- RED: `node --test tests/audio-manager-polish.test.mjs tests/scene-transition.test.mjs` produced 6 expected failures out of 19 checks:
  - suspended context was not resumed;
  - resume failure still exposed unlocked state;
  - lifecycle methods were missing;
  - manual pause / disabled music ownership was missing;
  - keyboard shared unlock binding was missing;
  - reduced-motion SceneTransition still faded.
- GREEN: the same targeted command passed 19/19 after the minimal implementation.

### Browser-discovered Phaser fade regression

- RED: the first real `qa/audio-runtime.mjs` run measured BGM volume `1` against target `0.272`.
- RED unit reproduction: 2 new tests failed because a Phaser-like non-writable `volume` property remained at `1`, and a new BGM was not explicitly silenced before the fade.
- GREEN: `fadeSound` now tweens an independent numeric proxy and calls `setVolume`; new tracks call `setVolume(0)` before entry. The targeted suite then passed 22/22 and the browser measured `0.2720000148` against `0.272`.

### Listener de-duplication cycle

- RED: a focused SceneHelpers contract failed when an already-unlocked manager still installed another scene gesture binding.
- GREEN: the helper now removes any old binding and returns before installing new pointer/keyboard listeners when audio is already unlocked.

## Runtime and visual QA

- `node qa/audio-runtime.mjs --url http://127.0.0.1:4193/`: PASS; 58/58 assets decoded, keyboard unlock changed AudioContext `suspended -> running`, BGM target fade passed, UI hover cooldown and variance passed, BattleScene attack duck gain was `0.68`, lifecycle hide/resume and manual-disable checks passed, 0 page/console errors.
- `node scripts/qa-responsive-facing.mjs --url=http://127.0.0.1:4193/`: PASS at 1280x720, 1366x768, 1536x864, and 1920x1080; 0 errors.
- `node qa/character-select-polish.mjs --url=http://127.0.0.1:4193/`: PASS across the same four widths plus keyboard/lifecycle re-entry; all portraits remained 300px high, foot line 578, scale 1; 0 errors.
- `node scripts/qa-pixel-scenes.mjs --url=http://127.0.0.1:4193/`: PASS, 9 scenes, 0 errors.
- `node scripts/qa-role-matrix.mjs --url=http://127.0.0.1:4193/`: PASS, three roles and nine screenshots.
- Manual screenshot review: 1280 and 1920 character-select and battle captures retained canvas bounds, readable hierarchy, complete portraits/cards, and unobscured tutorial/actions.

## Final verification

- `pnpm test`: PASS, 215/215.
- `pnpm assets:verify`: PASS, 40/40 verified, 0 changed.
- `pnpm build`: PASS, 120 modules transformed.
- `git diff --check`: PASS.

## Self-review

- Lifecycle resume requires all four conditions: this lifecycle instance paused the same current BGM, audio remains unlocked, music remains enabled, and global mute remains off.
- `pagehide` and `visibilitychange` listeners are manager-owned and installed only once; scene gesture listeners remove both alternatives after the first gesture and clean up on shutdown.
- Context resume rejection keeps `unlocked` false and queues no BGM retry.
- Full-motion SceneTransition keeps caller-supplied durations (for example 460/520ms); reduced motion starts the destination immediately and restores input state.
- Existing duck/cooldown/variance tests were retained and passed unchanged.
- The pre-existing `qa/pause-menu-regression-report.json` worktree modification was not staged or altered for Task 5.
