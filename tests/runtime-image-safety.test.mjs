import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { runRuntimeImages } from '../scripts/build-runtime-images.mjs';
import { assertMatchingImageDimensions, inspectLosslessWebp } from '../scripts/runtime-image-container.mjs';
import { normalizeCatalogAssets, resolveCatalogAssetEntries } from '../scripts/runtime-image-paths.mjs';

const projectRoot = path.resolve(import.meta.dirname, '..');

function pngHeader(width, height) {
  const data = Buffer.alloc(24);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(data);
  data.write('IHDR', 12, 'ascii');
  data.writeUInt32BE(width, 16);
  data.writeUInt32BE(height, 20);
  return data;
}

function webpChunk(type, payload) {
  const paddedSize = payload.length + (payload.length % 2);
  const data = Buffer.alloc(12 + 8 + paddedSize);
  data.write('RIFF', 0, 'ascii');
  data.writeUInt32LE(data.length - 8, 4);
  data.write('WEBP', 8, 'ascii');
  data.write(type, 12, 'ascii');
  data.writeUInt32LE(payload.length, 16);
  payload.copy(data, 20);
  return data;
}

function losslessWebpHeader(width, height) {
  const payload = Buffer.alloc(5);
  payload[0] = 0x2f;
  payload.writeUInt32LE((width - 1) | ((height - 1) << 14), 1);
  return webpChunk('VP8L', payload);
}

function lossyWebpHeader(width, height) {
  const payload = Buffer.alloc(10);
  Buffer.from([0x9d, 0x01, 0x2a]).copy(payload, 3);
  payload.writeUInt16LE(width, 6);
  payload.writeUInt16LE(height, 8);
  return webpChunk('VP8 ', payload);
}

function discoverPython() {
  const candidates = [];
  if (process.env.PYTHON) candidates.push({ command: process.env.PYTHON, args: [] });
  candidates.push({ command: 'python', args: [] }, { command: 'py', args: ['-3'] });
  for (const candidate of candidates) {
    const result = spawnSync(candidate.command, [...candidate.args, '-c', 'from PIL import Image'], {
      encoding: 'utf8',
      windowsHide: true
    });
    if (!result.error && result.status === 0) return candidate;
  }
  throw new Error('Runtime image safety tests require Python 3 with Pillow/WebP support.');
}

test('container checks reject lossy VP8 and dimensions that differ from the PNG master', () => {
  assert.deepEqual(inspectLosslessWebp(losslessWebpHeader(17, 23), 'lossless.webp'), {
    chunkTypes: ['VP8L'],
    height: 23,
    width: 17
  });
  assert.throws(() => inspectLosslessWebp(lossyWebpHeader(17, 23), 'lossy.webp'), /VP8L lossless/);
  assert.throws(
    () => assertMatchingImageDimensions(pngHeader(17, 23), losslessWebpHeader(18, 23), 'wrong-size.webp'),
    /dimension mismatch/
  );
});

test('asset manifest and package scripts wire the committed lossless verification path', async () => {
  const manifestSource = await readFile(path.join(projectRoot, 'scripts', 'qa-asset-manifest.mjs'), 'utf8');
  assert.match(manifestSource, /assertMatchingImageDimensions/);
  assert.doesNotMatch(manifestSource, /type === 'VP8 '/);

  const packageJson = JSON.parse(await readFile(path.join(projectRoot, 'package.json'), 'utf8'));
  assert.equal(packageJson.scripts['assets:verify'], 'node scripts/build-runtime-images.mjs --verify');
});

test('catalog paths reject traversal, absolute, drive, backslash, malformed, and duplicate URLs', () => {
  assert.deepEqual(normalizeCatalogAssets([{ key: 'safe', url: 'assets/pixel/test/safe.webp' }]), [{
    key: 'safe',
    pngUrl: 'assets/pixel/test/safe.png',
    webpUrl: 'assets/pixel/test/safe.webp'
  }]);

  for (const url of [
    '../outside.webp',
    'assets/pixel/../outside.webp',
    '/assets/pixel/outside.webp',
    'C:/assets/pixel/outside.webp',
    'C:\\assets\\pixel\\outside.webp',
    'assets\\pixel\\outside.webp',
    './assets/pixel/outside.webp',
    'assets//pixel/outside.webp',
    'assets/pixel/outside.png',
    'assets/pixel/'
  ]) {
    assert.throws(() => normalizeCatalogAssets([{ key: 'unsafe', url }]), /unsafe runtime asset URL/i, url);
  }

  assert.throws(() => normalizeCatalogAssets([
    { key: 'one', url: 'assets/pixel/test/same.webp' },
    { key: 'two', url: 'assets/pixel/test/same.webp' }
  ]), /duplicate runtime asset URL/i);
});

test('resolved catalog paths reject source and runtime junction escapes', async (context) => {
  const temporaryRoot = await mkdtemp(path.join(tmpdir(), 'ashen-runtime-paths-'));
  context.after(() => rm(temporaryRoot, { recursive: true, force: true }));
  const outsideRoot = path.join(temporaryRoot, 'outside');
  const sourceRoot = path.join(temporaryRoot, 'masters');
  const runtimeRoot = path.join(temporaryRoot, 'public');
  await mkdir(path.join(sourceRoot, 'assets', 'pixel'), { recursive: true });
  await mkdir(path.join(runtimeRoot, 'assets', 'pixel'), { recursive: true });
  await mkdir(outsideRoot);
  await writeFile(path.join(outsideRoot, 'escape.png'), 'outside');

  try {
    await symlink(outsideRoot, path.join(sourceRoot, 'assets', 'pixel', 'escape'), 'junction');
  } catch (error) {
    if (error.code === 'EPERM') context.skip('junction creation is unavailable on this Windows host');
    throw error;
  }

  await assert.rejects(resolveCatalogAssetEntries({
    assets: [{ key: 'source-escape', url: 'assets/pixel/escape/escape.webp' }],
    runtimeRoot,
    sourceRoot
  }), /source path escapes/i);

  await rm(path.join(sourceRoot, 'assets', 'pixel', 'escape'), { force: true });
  await mkdir(path.join(sourceRoot, 'assets', 'pixel', 'escape'));
  await writeFile(path.join(sourceRoot, 'assets', 'pixel', 'escape', 'escape.png'), 'master');
  await symlink(outsideRoot, path.join(runtimeRoot, 'assets', 'pixel', 'escape'), 'junction');

  await assert.rejects(resolveCatalogAssetEntries({
    assets: [{ key: 'runtime-escape', url: 'assets/pixel/escape/escape.webp' }],
    runtimeRoot,
    sourceRoot
  }), /runtime path escapes/i);
});

async function createSemanticFixture(variant) {
  const temporaryRoot = await mkdtemp(path.join(tmpdir(), `ashen-runtime-${variant}-`));
  const sourceRoot = path.join(temporaryRoot, 'masters');
  const runtimeRoot = path.join(temporaryRoot, 'public');
  const sourceFile = path.join(sourceRoot, 'assets', 'pixel', 'test', 'fixture.png');
  const runtimeFile = path.join(runtimeRoot, 'assets', 'pixel', 'test', 'fixture.webp');
  await mkdir(path.dirname(sourceFile), { recursive: true });
  await mkdir(path.dirname(runtimeFile), { recursive: true });
  const python = discoverPython();
  const program = String.raw`
from PIL import Image
import sys

source_file, runtime_file, variant = sys.argv[1:]
source = Image.new("RGBA", (4, 4), (220, 40, 30, 255))
source.putpixel((0, 0), (12, 34, 56, 0))
source.save(source_file, format="PNG")

runtime = source.copy()
if variant == "wrong-pixels":
    runtime.putpixel((1, 1), (20, 80, 230, 255))
elif variant == "wrong-dimensions":
    runtime = Image.new("RGBA", (5, 4), (220, 40, 30, 255))
elif variant == "wrong-alpha":
    runtime = source.convert("RGB")

if variant == "lossy":
    runtime.convert("RGB").save(runtime_file, format="WEBP", lossless=False)
else:
    runtime.save(runtime_file, format="WEBP", lossless=True, method=6, exact=True)
`;
  const result = spawnSync(python.command, [...python.args, '-c', program, sourceFile, runtimeFile, variant], {
    encoding: 'utf8',
    env: { ...process.env, PYTHONUTF8: '1' },
    windowsHide: true
  });
  assert.equal(result.status, 0, result.stderr);
  return { runtimeRoot, sourceRoot, temporaryRoot };
}

test('read-only verification rejects lossy and semantically wrong WebP fixtures', async (context) => {
  const assets = [{ key: 'fixture', url: 'assets/pixel/test/fixture.webp' }];
  const correct = await createSemanticFixture('correct');
  context.after(() => rm(correct.temporaryRoot, { recursive: true, force: true }));
  const summary = await runRuntimeImages({ assets, mode: 'verify', runtimeRoot: correct.runtimeRoot, sourceRoot: correct.sourceRoot });
  assert.equal(summary.verified, 1);

  for (const [variant, expected] of [
    ['lossy', /VP8L lossless/],
    ['wrong-pixels', /visible pixel mismatch/],
    ['wrong-dimensions', /dimension mismatch/],
    ['wrong-alpha', /alpha presence mismatch/]
  ]) {
    const fixture = await createSemanticFixture(variant);
    context.after(() => rm(fixture.temporaryRoot, { recursive: true, force: true }));
    await assert.rejects(
      runRuntimeImages({ assets, mode: 'verify', runtimeRoot: fixture.runtimeRoot, sourceRoot: fixture.sourceRoot }),
      expected,
      variant
    );
  }
});
