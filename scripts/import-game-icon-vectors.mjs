import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { CARD_ART_ENTRIES } from '../src/art/CardAssetCatalog.js';
import { UI_ICON_ENTRIES } from '../src/art/UIIconAssetCatalog.js';

const projectRoot = path.resolve(import.meta.dirname, '..');
const sourceRoot = path.resolve(
  process.env.GAME_ICONS_SOURCE
    ?? process.argv.find((argument) => argument.startsWith('--source='))?.slice('--source='.length)
    ?? path.join(process.env.TEMP ?? '', 'ashen-game-icons')
);
const outputRoot = path.join(projectRoot, 'qa', 'source-art', 'icon-vectors', 'game-icons');

async function findSvgFiles(directory) {
  const files = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (entry.name === '.git') continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await findSvgFiles(target));
    else if (entry.isFile() && entry.name.endsWith('.svg')) files.push(target);
  }
  return files;
}

const requested = new Set([
  ...CARD_ART_ENTRIES.map((entry) => entry.icon),
  ...UI_ICON_ENTRIES.map((entry) => entry.icon)
]);
const sourceFiles = await findSvgFiles(sourceRoot);
const bySlug = new Map(sourceFiles.map((file) => [path.basename(file, '.svg'), file]));
const missing = [...requested].filter((slug) => !bySlug.has(slug));
if (missing.length > 0) throw new Error(`Missing Game-icons vectors: ${missing.join(', ')}`);

const manifest = {};
for (const slug of [...requested].sort()) {
  const source = bySlug.get(slug);
  const author = path.basename(path.dirname(source));
  const outputDirectory = path.join(outputRoot, author);
  const output = path.join(outputDirectory, `${slug}.svg`);
  await fs.mkdir(outputDirectory, { recursive: true });
  await fs.copyFile(source, output);
  manifest[slug] = {
    author,
    file: path.relative(projectRoot, output).replaceAll('\\', '/')
  };
}

await fs.mkdir(outputRoot, { recursive: true });
await fs.writeFile(
  path.join(outputRoot, 'manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
  'utf8'
);

console.log(JSON.stringify({ imported: requested.size, outputRoot }, null, 2));
