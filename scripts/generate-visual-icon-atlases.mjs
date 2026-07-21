import fs from 'node:fs/promises';
import path from 'node:path';

import { chromium } from 'playwright';

import { CARD_ART_ATLAS, CARD_ART_ENTRIES } from '../src/art/CardAssetCatalog.js';
import { UI_ICON_ATLAS, UI_ICON_ENTRIES } from '../src/art/UIIconAssetCatalog.js';
import { cards } from '../src/data/cards.js';

const projectRoot = path.resolve(import.meta.dirname, '..');
const vectorRoot = path.join(projectRoot, 'qa', 'source-art', 'icon-vectors', 'game-icons');
const outputRoot = path.join(projectRoot, 'qa', 'source-art', 'runtime-masters', 'assets', 'pixel');
const manifest = JSON.parse(await fs.readFile(path.join(vectorRoot, 'manifest.json'), 'utf8'));
const cardsById = new Map(cards.map((card) => [card.id, card]));

function escapeSvg(svg, color) {
  const transparent = svg
    .replace(/<path d="M0 0h512v512H0z"\s*\/>/, '')
    .replaceAll('fill="#fff"', `fill="${color}"`);
  return `data:image/svg+xml;base64,${Buffer.from(transparent).toString('base64')}`;
}

async function atlasItems(entries, getTone) {
  return Promise.all(entries.map(async (entry) => {
    const source = manifest[entry.icon];
    if (!source) throw new Error(`No imported vector for ${entry.icon}`);
    const svg = await fs.readFile(path.join(projectRoot, source.file), 'utf8');
    const tone = getTone(entry);
    return { ...entry, ...tone, svg: escapeSvg(svg, tone.iconColor) };
  }));
}

function cardTone(entry) {
  const card = cardsById.get(entry.id);
  if (!card) throw new Error(`Unknown card id: ${entry.id}`);
  if (entry.id.startsWith('knight-')) return { family: 'knight', accent: '#9f3436', dark: '#32161b', iconColor: '#f2d59a' };
  if (entry.id.startsWith('nun-')) return { family: 'nun', accent: '#d6a842', dark: '#3a2b16', iconColor: '#fff0bd' };
  if (entry.id.startsWith('alc-')) return { family: 'alchemist', accent: '#47a79d', dark: '#12312f', iconColor: '#c8fff1' };
  if (entry.id.startsWith('curse-')) return { family: 'curse', accent: '#8950a8', dark: '#24142c', iconColor: '#e6c8ff' };
  if (entry.id.startsWith('status-')) return { family: 'status', accent: '#8d8371', dark: '#292621', iconColor: '#eadcc4' };
  return { family: 'common', accent: '#b6874e', dark: '#30251b', iconColor: '#f1dfbd' };
}

const uiPalette = {
  battle: '#db584a', elite: '#c84d5e', boss: '#ee6b3d', event: '#d3b465', shop: '#e2b849', coin: '#e2b849',
  rest: '#e07b3d', flame: '#ed7b36', chest: '#bd8845', relic: '#b998df', pause: '#d5c5a8', map: '#d3b465',
  settings: '#aeb7c4', heart: '#d75357', moon: '#c2cbe8', attack: '#d95b4b', sword: '#d9c59d', defense: '#6f9cbd',
  block: '#6f9cbd', shield: '#6f9cbd'
};

const cardItems = await atlasItems(CARD_ART_ENTRIES, cardTone);
const uiItems = await atlasItems(UI_ICON_ENTRIES, (entry) => ({
  accent: uiPalette[entry.type] ?? '#d3b465',
  dark: '#12151b',
  iconColor: '#f7e8c4'
}));

await fs.mkdir(path.join(outputRoot, 'cards'), { recursive: true });
await fs.mkdir(path.join(outputRoot, 'ui'), { recursive: true });

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
  await page.setContent('<style>*{box-sizing:border-box}html,body{margin:0;background:transparent}canvas{display:block}</style><canvas id="cards"></canvas><canvas id="ui"></canvas>');
  await page.evaluate(async ({ cardItems, uiItems, cardAtlas, uiAtlas }) => {
    const hash = (value) => [...value].reduce((total, char) => ((total * 33) ^ char.charCodeAt(0)) >>> 0, 2166136261);
    const loadImage = (source) => new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = source;
    });
    const drawPixelIcon = (ctx, image, x, y, lowSize, displaySize) => {
      const low = document.createElement('canvas');
      low.width = lowSize;
      low.height = lowSize;
      const lowCtx = low.getContext('2d');
      lowCtx.clearRect(0, 0, lowSize, lowSize);
      lowCtx.drawImage(image, 1, 1, lowSize - 2, lowSize - 2);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(low, x, y, displaySize, displaySize);
    };

    const cardCanvas = document.querySelector('#cards');
    cardCanvas.width = cardAtlas.columns * cardAtlas.frameWidth;
    cardCanvas.height = Math.ceil(cardItems.length / cardAtlas.columns) * cardAtlas.frameHeight;
    const cardCtx = cardCanvas.getContext('2d');
    for (const item of cardItems) {
      const x = (item.index % cardAtlas.columns) * cardAtlas.frameWidth;
      const y = Math.floor(item.index / cardAtlas.columns) * cardAtlas.frameHeight;
      const seed = hash(item.id);
      cardCtx.fillStyle = '#090a0e';
      cardCtx.fillRect(x, y, cardAtlas.frameWidth, cardAtlas.frameHeight);
      cardCtx.fillStyle = item.dark;
      cardCtx.fillRect(x + 2, y + 2, cardAtlas.frameWidth - 4, cardAtlas.frameHeight - 4);
      cardCtx.fillStyle = '#171a20';
      cardCtx.fillRect(x + 5, y + 5, cardAtlas.frameWidth - 10, cardAtlas.frameHeight - 10);
      cardCtx.globalAlpha = 0.34;
      cardCtx.fillStyle = item.accent;
      cardCtx.fillRect(x + 6, y + 6, 20 + (seed % 28), 3);
      cardCtx.fillRect(x + cardAtlas.frameWidth - 10, y + 12, 4, 34);
      for (let p = 0; p < 9; p += 1) {
        const px = x + 8 + ((seed + p * 19) % (cardAtlas.frameWidth - 16));
        const py = y + 10 + (((seed >>> 3) + p * 13) % (cardAtlas.frameHeight - 20));
        cardCtx.fillRect(px, py, p % 3 === 0 ? 3 : 2, 2);
      }
      cardCtx.globalAlpha = 1;
      const image = await loadImage(item.svg);
      cardCtx.globalAlpha = 0.72;
      cardCtx.fillStyle = '#000';
      cardCtx.fillRect(x + 23, y + 8, 54, 50);
      cardCtx.globalAlpha = 1;
      drawPixelIcon(cardCtx, image, x + 23, y + 4, 28, 52);
      cardCtx.fillStyle = item.accent;
      cardCtx.fillRect(x + 7, y + cardAtlas.frameHeight - 7, cardAtlas.frameWidth - 14, 2);
      cardCtx.fillStyle = '#f4dfb5';
      cardCtx.fillRect(x + 5, y + 5, 2, 8);
      cardCtx.fillRect(x + cardAtlas.frameWidth - 7, y + cardAtlas.frameHeight - 13, 2, 8);
    }

    const uiCanvas = document.querySelector('#ui');
    uiCanvas.width = uiAtlas.columns * uiAtlas.frameWidth;
    uiCanvas.height = Math.ceil(uiItems.length / uiAtlas.columns) * uiAtlas.frameHeight;
    const uiCtx = uiCanvas.getContext('2d');
    for (const item of uiItems) {
      const x = (item.index % uiAtlas.columns) * uiAtlas.frameWidth;
      const y = Math.floor(item.index / uiAtlas.columns) * uiAtlas.frameHeight;
      uiCtx.fillStyle = '#0a0b0f';
      uiCtx.fillRect(x, y, uiAtlas.frameWidth, uiAtlas.frameHeight);
      uiCtx.fillStyle = '#7a5229';
      uiCtx.fillRect(x + 2, y + 2, 60, 60);
      uiCtx.fillStyle = item.dark;
      uiCtx.fillRect(x + 6, y + 6, 52, 52);
      uiCtx.globalAlpha = 0.28;
      uiCtx.fillStyle = item.accent;
      uiCtx.fillRect(x + 9, y + 9, 46, 4);
      uiCtx.fillRect(x + 9, y + 51, 46, 4);
      uiCtx.globalAlpha = 1;
      const image = await loadImage(item.svg);
      drawPixelIcon(uiCtx, image, x + 10, y + 10, 22, 44);
      uiCtx.fillStyle = item.accent;
      uiCtx.fillRect(x + 4, y + 4, 8, 3);
      uiCtx.fillRect(x + 52, y + 57, 8, 3);
    }
  }, { cardItems, uiItems, cardAtlas: CARD_ART_ATLAS, uiAtlas: UI_ICON_ATLAS });

  await page.locator('#cards').screenshot({ path: path.join(outputRoot, 'cards', 'card-art-atlas.png') });
  await page.locator('#ui').screenshot({ path: path.join(outputRoot, 'ui', 'ui-icon-atlas.png') });
} finally {
  await browser.close();
}

console.log(JSON.stringify({ cards: CARD_ART_ENTRIES.length, uiIcons: UI_ICON_ENTRIES.length }, null, 2));
