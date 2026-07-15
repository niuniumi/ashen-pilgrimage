import { realpath } from 'node:fs/promises';
import path from 'node:path';

function assertInside(root, candidate, label) {
  const relative = path.relative(root, candidate);
  if (relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))) return;
  throw new Error(`${label} escapes its intended root: ${candidate}`);
}

function validateRuntimeUrl(url) {
  const invalid = typeof url !== 'string'
    || url.includes('\\')
    || path.posix.isAbsolute(url)
    || path.win32.isAbsolute(url)
    || path.posix.normalize(url) !== url
    || !url.startsWith('assets/pixel/')
    || !url.endsWith('.webp')
    || url.split('/').some((segment) => !segment || segment === '.' || segment === '..')
    || url.includes('?')
    || url.includes('#');
  if (invalid) throw new Error(`Unsafe runtime asset URL: ${url}`);
}

export function normalizeCatalogAssets(assets) {
  if (!Array.isArray(assets)) throw new TypeError('Runtime assets must be an array.');
  const keys = new Set();
  const urls = new Set();
  return assets.map((asset) => {
    if (!asset?.key || typeof asset.key !== 'string') throw new Error(`Invalid runtime asset key: ${asset?.key}`);
    validateRuntimeUrl(asset.url);
    if (keys.has(asset.key)) throw new Error(`Duplicate runtime asset key: ${asset.key}`);
    if (urls.has(asset.url)) throw new Error(`Duplicate runtime asset URL: ${asset.url}`);
    keys.add(asset.key);
    urls.add(asset.url);
    return {
      key: asset.key,
      pngUrl: `${asset.url.slice(0, -5)}.png`,
      webpUrl: asset.url
    };
  });
}

async function resolvePotentialPath(candidate) {
  const suffix = [];
  let current = candidate;
  while (true) {
    try {
      const resolved = await realpath(current);
      return path.resolve(resolved, ...suffix);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      const parent = path.dirname(current);
      if (parent === current) throw error;
      suffix.unshift(path.basename(current));
      current = parent;
    }
  }
}

export async function resolveCatalogAssetEntries({ assets, runtimeRoot, sourceRoot }) {
  const normalized = normalizeCatalogAssets(assets);
  const sourceRootReal = await realpath(sourceRoot);
  const runtimeRootReal = await realpath(runtimeRoot);
  const entries = [];

  for (const asset of normalized) {
    const sourceCandidate = path.resolve(sourceRootReal, ...asset.pngUrl.split('/'));
    const runtimeCandidate = path.resolve(runtimeRootReal, ...asset.webpUrl.split('/'));
    assertInside(sourceRootReal, sourceCandidate, 'Source path');
    assertInside(runtimeRootReal, runtimeCandidate, 'Runtime path');

    const sourcePath = await realpath(sourceCandidate);
    const runtimePath = await resolvePotentialPath(runtimeCandidate);
    assertInside(sourceRootReal, sourcePath, 'Source path');
    assertInside(runtimeRootReal, runtimePath, 'Runtime path');
    entries.push({ ...asset, runtimePath, sourcePath });
  }

  return { entries, runtimeRoot: runtimeRootReal, sourceRoot: sourceRootReal };
}
