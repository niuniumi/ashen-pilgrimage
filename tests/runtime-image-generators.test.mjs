import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { PIXEL_ACTORS, PIXEL_DECORATIONS } from '../src/art/PixelAssetCatalog.js';

const projectRoot = path.resolve(import.meta.dirname, '..');
const producerScripts = [
  'build-left-facing-enemy-v3.py',
  'build-curated-actor-assets.py',
  'normalize-enemy-facing.py',
  'build-defeat-tombstone.py'
];

function discoverPython() {
  const candidates = [];
  if (process.env.PYTHON) candidates.push({ command: process.env.PYTHON, args: [] });
  candidates.push({ command: 'python', args: [] }, { command: 'py', args: ['-3'] });
  for (const candidate of candidates) {
    const result = spawnSync(candidate.command, [...candidate.args, '--version'], {
      encoding: 'utf8',
      windowsHide: true
    });
    if (!result.error && result.status === 0) return candidate;
  }
  throw new Error('Generator contract tests require a discoverable Python 3 runtime.');
}

function expectedMasterPath(url) {
  return `qa/source-art/runtime-masters/${url.replace(/\.webp$/, '.png')}`;
}

test('actor and tombstone producers declare safe master outputs without public PNG duplicates', async (context) => {
  const python = discoverPython();
  const temporaryRoot = await mkdtemp(path.join(tmpdir(), 'ashen-runtime-generators-'));
  context.after(() => rm(temporaryRoot, { recursive: true, force: true }));
  await mkdir(path.join(temporaryRoot, 'scripts'));

  const declaredMasters = new Set();
  const forbiddenPublic = new Set([
    ...Object.values(PIXEL_ACTORS),
    PIXEL_DECORATIONS.defeatTombstone
  ].map((asset) => `public/${asset.url.replace(/\.webp$/, '.png')}`));

  for (const script of producerScripts) {
    const source = path.join(projectRoot, 'scripts', script);
    const copied = path.join(temporaryRoot, 'scripts', script);
    await copyFile(source, copied);
    const result = spawnSync(python.command, [...python.args, copied, '--list-outputs'], {
      cwd: temporaryRoot,
      encoding: 'utf8',
      env: { ...process.env, PYTHONUTF8: '1' },
      windowsHide: true
    });
    assert.equal(result.status, 0, `${script} output contract failed:\n${result.stderr}`);
    const contract = JSON.parse(result.stdout.trim());
    assert.ok(Array.isArray(contract.runtimeMasters), `${script} must list runtimeMasters`);
    assert.ok(Array.isArray(contract.legacyPublic), `${script} must list legacyPublic`);

    for (const output of contract.runtimeMasters) {
      assert.match(output, /^qa\/source-art\/runtime-masters\/assets\/pixel\/.+\.png$/);
      declaredMasters.add(output);
    }
    for (const output of contract.legacyPublic) {
      assert.match(output, /^public\/assets\/pixel\/.+\.png$/);
      assert.equal(forbiddenPublic.has(output), false, `${script} restores public duplicate ${output}`);
    }
    if (script === 'build-curated-actor-assets.py' || script === 'normalize-enemy-facing.py') {
      assert.ok(contract.legacyPublic.length > 0, `${script} must preserve its intentional legacy outputs`);
    }
  }

  const expectedMasters = new Set([
    ...Object.values(PIXEL_ACTORS),
    PIXEL_DECORATIONS.defeatTombstone
  ].map((asset) => expectedMasterPath(asset.url)));
  assert.deepEqual(declaredMasters, expectedMasters);
});

test('documented actor and tombstone rebuilds immediately refresh runtime WebP', async () => {
  const documentation = await readFile(path.join(projectRoot, 'docs', 'PIXEL_ASSET_MANIFEST.md'), 'utf8');
  for (const script of producerScripts) {
    const escaped = script.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.match(
      documentation,
      new RegExp(`python scripts/${escaped}\\s+pnpm assets:runtime`),
      `${script} documentation must run assets:runtime immediately afterward`
    );
  }

  for (const relativeReadme of [
    'qa/source-art/generated-enemies-v3/README.md',
    'qa/source-art/curated-actors/README.md'
  ]) {
    const readme = await readFile(path.join(projectRoot, relativeReadme), 'utf8');
    assert.match(readme, /python scripts\/.+\.py\s+pnpm assets:runtime/);
  }

  const releasePlan = await readFile(
    path.join(projectRoot, 'docs', 'superpowers', 'plans', '2026-07-14-release-grade-final-optimization.md'),
    'utf8'
  );
  assert.doesNotMatch(releasePlan, /public\/assets\/pixel\/ui\/defeat-tombstone\.png/);
  assert.match(releasePlan, /qa\/source-art\/runtime-masters\/assets\/pixel\/ui\/defeat-tombstone\.png/);
});
