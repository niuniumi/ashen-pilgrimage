import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const ATLAS_SIZE = 1024;
const CELL_SIZE = 256;
const OUTPUT = path.resolve('public/assets/pixel/actors/gothic-enemies-atlas-v2.png');
const SOURCE_DIR = path.resolve('public/assets/pixel/actors/sprites');

const enemyOrder = [
  'rotting-villager',
  'plague-rat-swarm',
  'crow-messenger',
  'armor-broken-militia',
  'fallen-paladin',
  'wax-novice',
  'cinder-acolyte',
  'bell-tower-sentry',
  'choir-exorcist',
  'ash-veiled-prioress',
  'hollow-spearman',
  'ashen-banneret',
  'crownless-hound',
  'gate-iron-vicar',
  'royal-pyre-knight',
  'clockwork-confessor'
];

const sourceNames = [
  'broken-militia',
  'reliquary-jailer',
  'candle-monk',
  'candle-nun',
  'black-hound',
  'exiled-knight',
  'plague-doctor',
  'scripture-moth-swarm'
];

const spriteSources = Object.fromEntries(await Promise.all(sourceNames.map(async (name) => {
  const bytes = await fs.readFile(path.join(SOURCE_DIR, `${name}.png`));
  return [name, `data:image/png;base64,${bytes.toString('base64')}`];
})));

await fs.mkdir(path.dirname(OUTPUT), { recursive: true });

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: ATLAS_SIZE, height: ATLAS_SIZE }, deviceScaleFactor: 1 });
  await page.setContent(`<canvas id="atlas" width="${ATLAS_SIZE}" height="${ATLAS_SIZE}"></canvas>`);

  const result = await page.evaluate(async ({ spriteSources, enemyOrder, cellSize }) => {
    const canvas = document.querySelector('#atlas');
    const c = canvas.getContext('2d', { alpha: true, willReadFrequently: true });
    c.imageSmoothingEnabled = false;

    const P = {
      outline: '#08090d', nearBlack: '#12151a', coal: '#1d2026', iron: '#343b43',
      steel: '#69747d', ash: '#8a8276', bone: '#d2c3a2', parchment: '#bda574',
      gold: '#d0a24f', oldGold: '#8f682f', wax: '#e6c46c', blood: '#8e2f3b',
      bloodDark: '#4f1c25', ember: '#d45a31', flame: '#ffd36a', moss: '#68734d',
      plague: '#7e8755', teal: '#396f6a', violet: '#695681', flesh: '#9b6f65'
    };

    let ox = 0;
    let oy = 0;
    const images = {};
    await Promise.all(Object.entries(spriteSources).map(([name, source]) => new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        images[name] = image;
        resolve();
      };
      image.onerror = reject;
      image.src = source;
    })));

    const px = (x, y, w = 1, h = 1, color = P.outline) => {
      c.fillStyle = color;
      c.fillRect(ox + Math.round(x), oy + Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
    };

    const clear = (x, y, w, h) => c.clearRect(ox + Math.round(x), oy + Math.round(y), Math.round(w), Math.round(h));

    const line = (x0, y0, x1, y1, color, size = 1) => {
      let x = Math.round(x0);
      let y = Math.round(y0);
      const tx = Math.round(x1);
      const ty = Math.round(y1);
      const dx = Math.abs(tx - x);
      const sx = x < tx ? 1 : -1;
      const dy = -Math.abs(ty - y);
      const sy = y < ty ? 1 : -1;
      let err = dx + dy;
      while (true) {
        px(x - Math.floor(size / 2), y - Math.floor(size / 2), size, size, color);
        if (x === tx && y === ty) break;
        const e2 = err * 2;
        if (e2 >= dy) { err += dy; x += sx; }
        if (e2 <= dx) { err += dx; y += sy; }
      }
    };

    const ellipse = (cx, cy, rx, ry, color) => {
      for (let y = -ry; y <= ry; y += 1) {
        const half = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
        px(cx - half, cy + y, half * 2 + 1, 1, color);
      }
    };

    const tintCell = (color, alpha) => {
      c.save();
      c.globalCompositeOperation = 'source-atop';
      c.globalAlpha = alpha;
      c.fillStyle = color;
      c.fillRect(ox + 5, oy + 5, cellSize - 10, cellSize - 10);
      c.restore();
    };

    const drawBase = (name, options = {}) => {
      const image = images[name];
      const sourceX = options.cropLeft ?? 0;
      const sourceY = options.cropTop ?? 0;
      const sourceWidth = image.width - sourceX - (options.cropRight ?? 0);
      const sourceHeight = image.height - sourceY - (options.cropBottom ?? 0);
      const maxWidth = options.maxWidth ?? 220;
      const maxHeight = options.maxHeight ?? 222;
      const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
      const width = Math.max(1, Math.round(sourceWidth * scale));
      const height = Math.max(1, Math.round(sourceHeight * scale));
      const x = Math.round((cellSize - width) / 2 + (options.dx ?? 0));
      const y = Math.round(238 - height + (options.dy ?? 0));
      c.save();
      c.beginPath();
      c.rect(ox + 5, oy + 5, cellSize - 10, cellSize - 10);
      c.clip();
      if (options.flipX) {
        c.translate(ox + x + width, oy + y);
        c.scale(-1, 1);
        c.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
      } else {
        c.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, ox + x, oy + y, width, height);
      }
      c.restore();
      if (options.tint) tintCell(options.tint, options.tintAlpha ?? 0.08);
      return { x, y, width, height };
    };

    const scatter = (seed, colors, count, bounds = [36, 28, 184, 178]) => {
      const [x, y, w, h] = bounds;
      for (let i = 0; i < count; i += 1) {
        const sx = x + ((seed * 37 + i * 61) % w);
        const sy = y + ((seed * 23 + i * 43) % h);
        const color = colors[i % colors.length];
        px(sx, sy, i % 4 === 0 ? 2 : 1, i % 5 === 0 ? 3 : 2, color);
      }
    };

    const runeCross = (x, y, color, dark = P.outline) => {
      px(x + 5, y, 4, 18, dark);
      px(x, y + 6, 14, 4, dark);
      px(x + 6, y + 2, 2, 14, color);
      px(x + 2, y + 7, 10, 2, color);
    };

    const drawRustAxeHead = (x, y) => {
      const rows = [6, 11, 16, 19, 17, 12, 7];
      rows.forEach((width, index) => {
        px(x - width, y + index * 2, width, 2, P.outline);
        if (index > 0 && index < rows.length - 1) px(x - width + 2, y + index * 2, width - 3, 1, index % 2 ? P.iron : P.steel);
      });
      px(x - 10, y + 4, 2, 2, P.ember);
      px(x - 15, y + 8, 3, 1, P.oldGold);
    };

    const drawBook = (x, y) => {
      px(x - 2, y - 2, 44, 28, P.outline);
      px(x, y, 19, 23, '#a99367');
      px(x + 21, y, 19, 23, P.parchment);
      px(x + 19, y + 1, 3, 22, P.oldGold);
      for (let i = 0; i < 4; i += 1) {
        px(x + 4, y + 5 + i * 4, 11 - (i % 2) * 3, 1, P.bloodDark);
        px(x + 25, y + 5 + i * 4, 10 + (i % 2) * 3, 1, P.bloodDark);
      }
      px(x + 3, y + 22, 14, 2, P.bone);
      px(x + 24, y + 22, 13, 2, P.bone);
    };

    const drawScroll = (x, y) => {
      px(x - 2, y + 2, 38, 20, P.outline);
      px(x, y + 4, 34, 16, P.parchment);
      px(x + 2, y + 2, 5, 20, P.bone);
      px(x + 29, y + 2, 5, 20, '#9f875d');
      px(x + 7, y + 7, 19, 1, P.oldGold);
      px(x + 8, y + 11, 15, 1, P.bloodDark);
      px(x + 8, y + 15, 18, 1, P.oldGold);
      px(x + 16, y + 2, 5, 20, P.bloodDark);
      px(x + 17, y + 4, 3, 16, P.blood);
      ellipse(x + 18, y + 12, 4, 4, P.outline);
      ellipse(x + 18, y + 12, 3, 3, P.oldGold);
      px(x + 17, y + 11, 3, 3, P.gold);
    };

    const drawBell = (x, y) => {
      px(x + 10, y, 8, 3, P.outline);
      px(x + 8, y + 3, 12, 3, P.oldGold);
      const widths = [14, 18, 22, 26, 28, 30];
      widths.forEach((width, index) => {
        px(x + 14 - width / 2, y + 6 + index * 3, width, 3, P.outline);
        px(x + 16 - width / 2, y + 7 + index * 3, width - 4, 1, index % 2 ? P.oldGold : P.gold);
      });
      px(x - 3, y + 24, 34, 4, P.outline);
      px(x, y + 25, 28, 2, P.gold);
      px(x + 12, y + 28, 5, 7, P.outline);
      px(x + 13, y + 29, 3, 5, P.bone);
    };

    const drawBanner = (x, y) => {
      line(x, y - 14, x, y + 102, P.outline, 3);
      line(x + 1, y - 13, x + 1, y + 101, P.bone, 1);
      px(x - 2, y - 16, 7, 4, P.oldGold);
      for (let row = 0; row < 35; row += 1) {
        const left = x + 4;
        const right = x + 47 - Math.floor(row / 10) * 3 - (row % 9 === 7 ? 6 : 0);
        const color = row % 5 === 0 ? '#6d2730' : row % 3 === 0 ? P.blood : P.bloodDark;
        px(left, y + row * 2, Math.max(5, right - left), 2, color);
        if (row % 6 === 3) px(right - 9, y + row * 2, 5, 2, P.outline);
      }
      runeCross(x + 18, y + 22, P.gold, P.bloodDark);
      px(x + 9, y + 9, 2, 2, P.gold);
      px(x + 35, y + 50, 2, 3, P.ember);
      clear(x + 38, y + 62, 8, 5);
      clear(x + 26, y + 68, 7, 4);
    };

    const drawGear = (x, y, radius, color = P.oldGold) => {
      ellipse(x, y, radius + 2, radius + 2, P.outline);
      ellipse(x, y, radius, radius, color);
      ellipse(x, y, Math.max(2, radius - 4), Math.max(2, radius - 4), P.outline);
      ellipse(x, y, 2, 2, P.gold);
      for (let i = 0; i < 8; i += 1) {
        const angle = i * Math.PI / 4;
        px(x + Math.round(Math.cos(angle) * (radius + 2)) - 1, y + Math.round(Math.sin(angle) * (radius + 2)) - 1, 3, 3, color);
      }
    };

    const drawRat = (x, y, variant = 0) => {
      const fur = variant % 3 === 0 ? '#555b4b' : variant % 3 === 1 ? '#696855' : '#454d4d';
      const light = variant % 2 ? '#9b9471' : '#858b6c';
      line(x + 36, y + 12, x + 51, y + 13 + (variant % 3), P.outline, 3);
      line(x + 50, y + 14, x + 60, y + 8 + (variant % 2) * 5, P.flesh, 2);
      line(x + 58, y + 9 + (variant % 2) * 5, x + 65, y + 13, '#b58879', 1);
      ellipse(x + 27, y + 11, 18, 9, P.outline);
      ellipse(x + 27, y + 10, 16, 7, fur);
      ellipse(x + 9, y + 10, 9, 8, P.outline);
      ellipse(x + 9, y + 10, 7, 6, fur);
      px(x + 8, y + 1, 7, 7, P.outline);
      px(x + 9, y + 2, 5, 5, '#806b61');
      c.save();
      c.globalCompositeOperation = 'source-atop';
      c.globalAlpha = 0.32;
      c.drawImage(images['black-hound'], ox + x - 7, oy + y - 11, 72, 53);
      c.restore();
      px(x + 1, y + 9, 4, 4, '#a97e70');
      px(x + 6, y + 7, 2, 2, P.blood);
      px(x + 7, y + 7, 1, 1, '#ff8260');
      line(x + 1, y + 11, x - 6, y + 8, P.ash, 1);
      line(x + 2, y + 13, x - 7, y + 14, P.ash, 1);
      line(x + 18, y + 18, x + 14, y + 23, P.flesh, 2);
      line(x + 34, y + 18, x + 39, y + 22, P.flesh, 2);
      px(x + 16, y + 8, 8, 2, light);
      px(x + 25, y + 5, 6, 2, light);
      px(x + 31, y + 12, 7, 2, P.nearBlack);
      px(x + 22, y + 15, 4, 2, light);
      px(x + 13 + (variant % 4) * 4, y + 11, 3, 1, '#b0a27c');
      px(x + 27 + (variant % 3) * 3, y + 8, 2, 1, '#c1b38a');
      px(x + 34, y + 15, 3, 1, P.flesh);
    };

    const drawRatSwarm = () => {
      const rats = [
        [30, 76], [92, 72], [153, 80],
        [18, 116], [73, 110], [129, 118], [182, 111],
        [38, 157], [101, 151], [162, 160]
      ];
      rats.forEach(([x, y], index) => drawRat(x, y, index));
      scatter(11, [P.plague, P.moss, P.ash], 22, [28, 62, 190, 132]);
      [51, 112, 176].forEach((x, i) => px(x, 188 - i * 2, 8, 2, '#3a342d'));
    };

    const drawCrowMessenger = () => {
      const feather = (x0, y0, x1, y1, width, index) => {
        line(x0, y0, x1, y1, P.outline, width + 3);
        line(x0, y0, x1, y1, index % 3 === 0 ? '#4f5f70' : index % 2 ? '#202a35' : '#344351', width);
        line(x0 + 2, y0, x1 + 1, y1, index % 2 ? '#718394' : '#4e6071', 1);
        px(x1 - 1, y1 - 1, 3, 3, P.outline);
      };
      const raisedWing = [
        [104, 105, 126, 43, 8], [107, 104, 142, 35, 9], [110, 105, 159, 38, 10],
        [112, 107, 176, 45, 10], [114, 109, 191, 57, 9], [115, 111, 204, 73, 8],
        [116, 113, 211, 91, 7], [116, 115, 207, 107, 6]
      ];
      const loweredWing = [
        [110, 118, 138, 169, 8], [113, 118, 153, 181, 9], [116, 118, 169, 188, 10],
        [119, 117, 184, 187, 10], [121, 116, 198, 176, 9], [122, 115, 207, 160, 8],
        [122, 113, 211, 143, 7]
      ];
      raisedWing.forEach((args, index) => feather(...args, index));
      loweredWing.forEach((args, index) => feather(...args, index + 3));
      for (let i = 0; i < 6; i += 1) feather(126, 120 + i, 181 + i * 7, 123 + i * 5, 5 - Math.floor(i / 3), i + 8);
      ellipse(111, 115, 35, 24, P.outline);
      ellipse(108, 113, 31, 20, '#1d2730');
      for (let i = 0; i < 15; i += 1) {
        px(83 + ((i * 17) % 50), 98 + ((i * 11) % 32), 2 + (i % 3), 2, i % 2 ? '#465a6b' : '#728493');
      }
      ellipse(72, 104, 18, 17, P.outline);
      ellipse(71, 103, 15, 14, '#24303a');
      c.save();
      c.globalCompositeOperation = 'source-atop';
      c.globalAlpha = 0.34;
      c.drawImage(images['scripture-moth-swarm'], ox + 32, oy + 26, 194, 184);
      c.restore();
      c.save();
      c.globalCompositeOperation = 'source-atop';
      c.globalAlpha = 0.16;
      c.fillStyle = '#173142';
      c.fillRect(ox + 35, oy + 27, 194, 184);
      c.restore();
      px(55, 99, 16, 11, P.outline);
      px(39, 103, 18, 5, P.oldGold);
      px(47, 101, 15, 3, '#d7b05a');
      px(63, 98, 3, 3, P.flame);
      px(64, 99, 1, 1, '#fff3b0');
      px(76, 92, 5, 4, '#607282');
      px(82, 111, 15, 3, '#4f6271');
      line(96, 131, 91, 154, P.oldGold, 2);
      line(115, 132, 121, 155, P.oldGold, 2);
      line(91, 153, 84, 157, P.bone, 1);
      line(121, 153, 129, 157, P.bone, 1);
      drawScroll(89, 160);
      scatter(5, ['#728493', '#344351', P.oldGold], 24, [39, 35, 177, 151]);
    };

    const drawFlame = (x, y, height, seed = 0) => {
      for (let i = 0; i < height; i += 2) {
        const width = Math.max(1, Math.round((height - i) / 7));
        const wobble = ((seed + i) % 5) - 2;
        px(x + wobble - width, y - i, width * 2 + 1, 2, i > height * 0.58 ? P.flame : i > height * 0.28 ? P.ember : P.blood);
      }
      px(x, y - height + 3, 2, 3, '#fff1a8');
    };

    const drawRottingVillager = () => {
      drawBase('candle-monk', {
        maxWidth: 202,
        maxHeight: 218,
        tint: P.moss,
        tintAlpha: 0.22,
        dx: 3,
        dy: 6,
        cropTop: 4,
        cropBottom: 5
      });

      c.save();
      c.globalCompositeOperation = 'source-atop';
      c.globalAlpha = 0.23;
      c.fillStyle = '#182218';
      c.fillRect(ox + 45, oy + 38, 166, 190);
      c.restore();

      line(81, 145, 51, 215, P.outline, 5);
      line(80, 144, 51, 213, '#80613d', 2);
      px(33, 200, 24, 21, P.outline);
      px(35, 202, 20, 17, P.iron);
      px(37, 204, 16, 5, P.steel);
      px(33, 201, 6, 9, '#713827');
      px(49, 217, 9, 4, P.oldGold);

      px(104, 119, 52, 6, P.outline);
      px(108, 120, 44, 3, '#59412f');
      px(121, 118, 5, 9, P.oldGold);
      px(83, 137, 11, 15, '#352e27');
      px(86, 140, 6, 8, P.bone);
      px(145, 146, 14, 10, '#54262a');
      px(149, 149, 9, 5, P.blood);
      px(97, 174, 13, 8, '#262820');
      px(135, 185, 15, 9, '#2d2e24');
      scatter(59, [P.moss, P.bloodDark, '#7a7556', P.bone], 26, [66, 48, 126, 164]);
    };

    const painters = [
      drawRottingVillager,
      drawRatSwarm,
      drawCrowMessenger,
      () => {
        drawBase('broken-militia', { tint: '#65533f', tintAlpha: 0.055 });
        scatter(4, [P.steel, P.oldGold, P.bloodDark], 14, [75, 62, 105, 146]);
        px(135, 121, 12, 2, P.outline);
        px(139, 120, 3, 3, P.ash);
      },
      () => {
        drawBase('exiled-knight', { tint: P.blood, tintAlpha: 0.12, dy: 1 });
        line(92, 35, 119, 25, P.oldGold, 2);
        line(126, 24, 150, 31, P.oldGold, 2);
        px(120, 24, 4, 3, P.ember);
        runeCross(122, 106, P.gold, P.bloodDark);
        scatter(7, [P.blood, P.ember, P.oldGold], 18, [60, 48, 139, 165]);
      },
      () => {
        drawBase('candle-monk', { maxWidth: 195, maxHeight: 210, tint: P.wax, tintAlpha: 0.09, dy: 8 });
        [91, 112, 145, 163].forEach((x, index) => {
          px(x, 64 + index * 5, 2, 8 + index, P.bone);
          px(x + 1, 70 + index * 5, 1, 3, P.wax);
        });
        scatter(13, [P.wax, P.bone, P.flame], 14, [75, 43, 110, 173]);
      },
      () => {
        drawBase('candle-monk', { tint: P.ember, tintAlpha: 0.14 });
        scatter(17, [P.ember, P.flame, P.bloodDark], 28, [60, 42, 146, 178]);
        line(80, 118, 66, 184, P.oldGold, 2);
        line(66, 184, 78, 205, P.iron, 2);
        drawFlame(76, 205, 22, 4);
      },
      () => {
        drawBase('reliquary-jailer', { tint: P.oldGold, tintAlpha: 0.12, dx: -2 });
        drawBell(58, 111);
        line(194, 75, 210, 62, P.gold, 1);
        line(194, 86, 214, 86, P.oldGold, 1);
        line(194, 97, 209, 109, P.gold, 1);
        scatter(19, [P.steel, P.oldGold], 13, [73, 38, 122, 172]);
      },
      () => {
        drawBase('candle-monk', { tint: P.bone, tintAlpha: 0.09, dx: 3 });
        drawBook(104, 127);
        runeCross(122, 95, P.blood, P.bone);
        line(189, 92, 203, 72, P.gold, 2);
        scatter(23, [P.flame, P.bone, P.gold], 16, [52, 40, 151, 166]);
      },
      () => {
        drawBase('candle-nun', { tint: P.ash, tintAlpha: 0.13, dx: 2, cropLeft: 14, cropBottom: 10 });
        line(67, 88, 45, 202, P.outline, 4);
        line(67, 88, 46, 199, P.bone, 2);
        px(39, 177, 22, 4, P.oldGold);
        [88, 108, 128, 148].forEach((x, index) => {
          px(x, 28 - (index % 2) * 5, 2, 11, P.oldGold);
          px(x, 24 - (index % 2) * 5, 2, 4, P.flame);
        });
        scatter(29, [P.ash, P.violet, P.bone], 18, [58, 43, 143, 180]);
      },
      () => {
        drawBase('broken-militia', { tint: P.nearBlack, tintAlpha: 0.24 });
        c.save();
        c.globalCompositeOperation = 'source-atop';
        c.globalAlpha = 0.62;
        c.fillStyle = '#020304';
        c.fillRect(ox + 116, oy + 51, 17, 17);
        c.restore();
        px(119, 59, 2, 2, P.violet);
        px(128, 58, 2, 2, P.violet);
        line(115, 69, 123, 76, P.iron, 1);
        scatter(31, [P.iron, P.violet, P.nearBlack], 20, [72, 43, 118, 177]);
      },
      () => {
        drawBase('broken-militia', { tint: P.ash, tintAlpha: 0.08, dx: 7 });
        drawBanner(178, 51);
        scatter(37, [P.ash, P.bloodDark, P.oldGold], 14, [92, 50, 99, 164]);
      },
      () => {
        drawBase('black-hound', { maxWidth: 228, maxHeight: 190, tint: P.violet, tintAlpha: 0.12, dy: -7, flipX: true });
        line(61, 121, 111, 116, P.oldGold, 3);
        line(62, 124, 111, 119, P.bone, 1);
        [73, 88, 103].forEach((x, index) => {
          px(x, 105 - (index % 2) * 4, 4, 9, P.oldGold);
          px(x - 3, 104 - (index % 2) * 4, 10, 2, P.gold);
        });
        scatter(41, [P.bone, P.violet, P.blood], 16, [48, 71, 166, 116]);
      },
      () => {
        drawBase('reliquary-jailer', { tint: P.iron, tintAlpha: 0.12 });
        for (let i = 0; i < 5; i += 1) {
          px(102 + i * 9, 32 + Math.abs(2 - i) * 3, 4, 14, P.outline);
          px(103 + i * 9, 33 + Math.abs(2 - i) * 3, 2, 11, i === 2 ? P.gold : P.steel);
        }
        line(97, 46, 145, 46, P.oldGold, 2);
        scatter(43, [P.steel, P.gold, P.iron], 17, [58, 35, 144, 182]);
      },
      () => {
        drawBase('exiled-knight', { tint: P.ember, tintAlpha: 0.16 });
        [56, 67, 77].forEach((x, index) => drawFlame(x, 185 - index * 22, 22 + index * 4, index));
        [112, 129, 146].forEach((x, index) => drawFlame(x, 153, 15 + index * 3, index + 7));
        runeCross(123, 101, P.flame, P.bloodDark);
        scatter(47, [P.ember, P.flame, P.blood], 26, [49, 42, 158, 181]);
      },
      () => {
        drawBase('plague-doctor', { tint: P.oldGold, tintAlpha: 0.12, cropBottom: 22 });
        drawGear(80, 139, 10);
        drawGear(177, 152, 8, P.steel);
        drawGear(148, 110, 6, P.gold);
        line(76, 150, 62, 199, P.steel, 3);
        line(179, 159, 193, 202, P.oldGold, 3);
        px(110, 84, 24, 3, P.oldGold);
        px(115, 88, 14, 2, P.gold);
        scatter(53, [P.oldGold, P.steel, P.teal], 18, [57, 42, 143, 177]);
      }
    ];

    painters.forEach((paint, index) => {
      ox = (index % 4) * cellSize;
      oy = Math.floor(index / 4) * cellSize;
      c.clearRect(ox, oy, cellSize, cellSize);
      paint();
    });

    const pixels = c.getImageData(0, 0, canvas.width, canvas.height).data;
    const report = enemyOrder.map((enemyId, index) => {
      const cellX = (index % 4) * cellSize;
      const cellY = Math.floor(index / 4) * cellSize;
      let opaque = 0;
      let minX = cellSize;
      let minY = cellSize;
      let maxX = -1;
      let maxY = -1;
      let edgePixels = 0;
      const colors = new Set();
      for (let y = 0; y < cellSize; y += 1) {
        for (let x = 0; x < cellSize; x += 1) {
          const offset = ((cellY + y) * canvas.width + cellX + x) * 4;
          const alpha = pixels[offset + 3];
          if (alpha < 16) continue;
          opaque += 1;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
          if (x < 4 || y < 4 || x >= cellSize - 4 || y >= cellSize - 4) edgePixels += 1;
          if (alpha > 220) colors.add(`${pixels[offset]},${pixels[offset + 1]},${pixels[offset + 2]}`);
        }
      }
      return {
        enemyId,
        facing: 'left',
        opaque,
        coverage: Number((opaque / (cellSize * cellSize)).toFixed(3)),
        colors: colors.size,
        bounds: [minX, minY, maxX, maxY],
        edgePixels
      };
    });

    const failures = report.filter((item) => (
      item.opaque < 1400
      || item.coverage > 0.55
      || item.colors < 12
      || item.edgePixels !== 0
      || item.bounds[0] < 4
      || item.bounds[1] < 4
      || item.bounds[2] > cellSize - 5
      || item.bounds[3] > cellSize - 5
    ));
    if (failures.length) throw new Error(`Atlas validation failed: ${JSON.stringify(failures)}`);

    return { dataUrl: canvas.toDataURL('image/png'), report };
  }, { spriteSources, enemyOrder, cellSize: CELL_SIZE });

  const png = Buffer.from(result.dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64');
  await fs.writeFile(OUTPUT, png);
  console.log(`Generated ${OUTPUT}`);
  console.log(`Atlas: ${ATLAS_SIZE}x${ATLAS_SIZE}, cells: ${enemyOrder.length}, bytes: ${png.length}`);
  console.table(result.report);
} finally {
  await browser.close();
}
