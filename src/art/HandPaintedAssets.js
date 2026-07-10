import { GAME_HEIGHT, GAME_WIDTH } from '../game/constants.js';

export const HANDPAINTED_KEYS = {
  menuJourneyBgV2: 'hp-bg-menu-journey-v2',
  menuJourneyBg: 'hp-bg-menu-journey',
  menuBg: 'hp-bg-menu',
  battleBg: 'hp-bg-battle',
  mapBg: 'hp-bg-map',
  folioBg: 'hp-bg-folio',
  heroes: 'hp-heroes',
  alchemistHero: 'hp-hero-alchemist',
  enemies: 'hp-enemies',
  ui: 'hp-ui',
  vfx: 'hp-vfx'
};

export const HERO_FRAMES = {
  'exiled-knight': { x: 0, y: 0, w: 512, h: 1024 },
  'candle-nun': { x: 512, y: 0, w: 512, h: 1024 },
  'ashblood-alchemist': { x: 1024, y: 0, w: 512, h: 1024 }
};

export const ENEMY_FRAMES = {
  'rotting-villager': { x: 0, y: 0, w: 384, h: 512 },
  'black-hound': { x: 384, y: 0, w: 384, h: 512 },
  'plague-rat-swarm': { x: 768, y: 0, w: 384, h: 512 },
  'crow-messenger': { x: 1152, y: 0, w: 384, h: 512 },
  'graveyard-skeleton': { x: 0, y: 512, w: 384, h: 512 },
  'armor-broken-militia': { x: 384, y: 512, w: 384, h: 512 },
  'candle-monk': { x: 768, y: 512, w: 384, h: 512 },
  'pointed-witch': { x: 768, y: 512, w: 384, h: 512 },
  'plague-doctor': { x: 768, y: 512, w: 384, h: 512 },
  'iron-maiden-nun': { x: 1152, y: 512, w: 384, h: 512 },
  'fallen-paladin': { x: 1152, y: 512, w: 384, h: 512 },
  'headless-grave-knight': { x: 1152, y: 512, w: 384, h: 512 },
  'wax-novice': { x: 768, y: 512, w: 384, h: 512 },
  'cinder-acolyte': { x: 768, y: 512, w: 384, h: 512 },
  'bell-tower-sentry': { x: 384, y: 512, w: 384, h: 512 },
  'scripture-moth-swarm': { x: 1152, y: 0, w: 384, h: 512 },
  'choir-exorcist': { x: 1152, y: 512, w: 384, h: 512 },
  'reliquary-jailer': { x: 384, y: 512, w: 384, h: 512 },
  'ash-veiled-prioress': { x: 1152, y: 512, w: 384, h: 512 },
  'pale-wax-matron': { x: 1152, y: 512, w: 384, h: 512 },
  'hollow-spearman': { x: 384, y: 512, w: 384, h: 512 },
  'ashen-banneret': { x: 1152, y: 512, w: 384, h: 512 },
  'gutter-fire-archer': { x: 1152, y: 0, w: 384, h: 512 },
  'crownless-hound': { x: 384, y: 0, w: 384, h: 512 },
  'gate-iron-vicar': { x: 384, y: 512, w: 384, h: 512 },
  'royal-pyre-knight': { x: 1152, y: 512, w: 384, h: 512 },
  'clockwork-confessor': { x: 768, y: 512, w: 384, h: 512 },
  'hollow-crown-regent': { x: 1152, y: 512, w: 384, h: 512 }
};

export const UI_FRAMES = {
  largePanel: { x: 24, y: 26, w: 780, h: 392 },
  sidePanel: { x: 840, y: 28, w: 248, h: 420 },
  widePanel: { x: 1122, y: 124, w: 390, h: 275 },
  button: { x: 45, y: 462, w: 618, h: 86 },
  buttonDisabled: { x: 45, y: 578, w: 618, h: 86 },
  buttonGlow: { x: 46, y: 694, w: 618, h: 86 },
  cardAttack: { x: 695, y: 486, w: 255, h: 300 },
  cardDefense: { x: 979, y: 486, w: 255, h: 300 },
  cardSkill: { x: 1262, y: 486, w: 245, h: 300 },
  divider: { x: 245, y: 930, w: 385, h: 42 },
  waxSeal: { x: 754, y: 918, w: 106, h: 92 },
  ribbon: { x: 920, y: 914, w: 420, h: 76 },
  coin: { x: 45, y: 800, w: 103, h: 103 },
  relic: { x: 172, y: 800, w: 102, h: 103 },
  settings: { x: 298, y: 800, w: 103, h: 103 },
  pause: { x: 424, y: 800, w: 101, h: 102 },
  map: { x: 550, y: 800, w: 104, h: 102 },
  attackIcon: { x: 678, y: 800, w: 103, h: 103 },
  camp: { x: 805, y: 801, w: 103, h: 102 },
  shop: { x: 932, y: 802, w: 103, h: 103 },
  scroll: { x: 1059, y: 803, w: 103, h: 102 },
  chest: { x: 1187, y: 803, w: 103, h: 103 },
  skull: { x: 1315, y: 803, w: 103, h: 103 }
};

export const VFX_FRAMES = {
  slashA: { x: 0, y: 0, w: 280, h: 224 },
  slashB: { x: 280, y: 0, w: 280, h: 224 },
  slashC: { x: 560, y: 0, w: 280, h: 224 },
  slashD: { x: 840, y: 0, w: 280, h: 224 },
  slashE: { x: 1120, y: 0, w: 280, h: 224 },
  shieldA: { x: 0, y: 224, w: 280, h: 224 },
  shieldB: { x: 280, y: 224, w: 280, h: 224 },
  shieldC: { x: 560, y: 224, w: 280, h: 224 },
  shieldD: { x: 840, y: 224, w: 280, h: 224 },
  shieldE: { x: 1120, y: 224, w: 280, h: 224 },
  impactA: { x: 0, y: 448, w: 280, h: 224 },
  impactB: { x: 280, y: 448, w: 280, h: 224 },
  impactC: { x: 560, y: 448, w: 280, h: 224 },
  impactD: { x: 840, y: 448, w: 280, h: 224 },
  impactE: { x: 1120, y: 448, w: 280, h: 224 },
  blessingA: { x: 0, y: 672, w: 280, h: 224 },
  blessingB: { x: 280, y: 672, w: 280, h: 224 },
  blessingC: { x: 560, y: 672, w: 280, h: 224 },
  blessingD: { x: 840, y: 672, w: 280, h: 224 },
  blessingE: { x: 1120, y: 672, w: 280, h: 224 },
  dustA: { x: 0, y: 896, w: 280, h: 226 },
  dustB: { x: 280, y: 896, w: 280, h: 226 },
  dustC: { x: 560, y: 896, w: 280, h: 226 },
  dustD: { x: 840, y: 896, w: 280, h: 226 },
  dustE: { x: 1120, y: 896, w: 280, h: 226 }
};

export function hasTexture(scene, key) {
  return Boolean(scene?.textures?.exists?.(key));
}

export function addHandPaintedBackground(scene, key, options = {}) {
  if (!hasTexture(scene, key)) return null;
  const depth = options.depth ?? 0;
  const image = scene.add
    .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, key)
    .setOrigin(0.5)
    .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
    .setAlpha(options.alpha ?? 1)
    .setDepth(depth);
  if (options.smoothWash !== false) {
    scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, options.washColor ?? 0xf4dfb9, options.washAlpha ?? 0.055)
      .setDepth(depth + 0.01);
  }
  return image;
}

export function ensureFrame(scene, textureKey, frameName, rect) {
  if (!rect || !hasTexture(scene, textureKey)) return null;
  const texture = scene.textures.get(textureKey);
  if (!texture.has(frameName)) {
    texture.add(frameName, 0, rect.x, rect.y, rect.w, rect.h);
  }
  return frameName;
}

export function addAtlasImage(scene, textureKey, frameName, rect, x, y, options = {}) {
  const frame = ensureFrame(scene, textureKey, frameName, rect);
  if (!frame) return null;
  const image = scene.add.image(x, y, textureKey, frame).setOrigin(options.originX ?? 0.5, options.originY ?? 0.5);
  if (Number.isFinite(options.depth)) image.setDepth(options.depth);
  if (Number.isFinite(options.alpha)) image.setAlpha(options.alpha);
  if (Number.isFinite(options.displayWidth) && Number.isFinite(options.displayHeight)) {
    image.setDisplaySize(options.displayWidth, options.displayHeight);
  } else if (Number.isFinite(options.displayHeight)) {
    const ratio = rect.w / rect.h;
    image.setDisplaySize(options.displayHeight * ratio, options.displayHeight);
  } else if (Number.isFinite(options.displayWidth)) {
    const ratio = rect.h / rect.w;
    image.setDisplaySize(options.displayWidth, options.displayWidth * ratio);
  } else if (Number.isFinite(options.scale)) {
    image.setScale(options.scale);
  }
  return image;
}

export function addHandPaintedHero(scene, container, characterId, scale = 1, options = {}) {
  if (characterId === 'ashblood-alchemist' && hasTexture(scene, HANDPAINTED_KEYS.alchemistHero)) {
    const standaloneHeight = options.displayHeight ?? (options.artPortrait ? 354 : 290) * scale;
    const standalone = scene.add
      .image(options.offsetX ?? 0, (options.artPortrait ? options.generatedBottom ?? 94 : options.bottom ?? 118 * scale) + (options.offsetY ?? 0), HANDPAINTED_KEYS.alchemistHero)
      .setOrigin(0.5, 1)
      .setDisplaySize((standaloneHeight * 1024) / 1536, standaloneHeight)
      .setAlpha(options.alpha ?? 1);
    standalone.setData('handPaintedAsset', true);
    container.add(standalone);
    return standalone;
  }
  const rect = HERO_FRAMES[characterId] ?? HERO_FRAMES['exiled-knight'];
  if (!hasTexture(scene, HANDPAINTED_KEYS.heroes)) return null;
  const baseHeight = options.artPortrait ? 354 : 270;
  const displayHeight = options.displayHeight ?? (options.generatedHeight ? options.generatedHeight : baseHeight * scale);
  const y = options.artPortrait ? options.generatedBottom ?? 94 : options.bottom ?? 118 * scale;
  const image = addAtlasImage(
    scene,
    HANDPAINTED_KEYS.heroes,
    `hero-${characterId}`,
    rect,
    options.offsetX ?? 0,
    y + (options.offsetY ?? 0),
    {
      originY: 1,
      displayHeight,
      alpha: options.alpha ?? 1
    }
  );
  if (!image) return null;
  if (characterId === 'exiled-knight') image.setFlipX(true);
  image.setData('handPaintedAsset', true);
  container.add(image);
  return image;
}

export function addHandPaintedEnemy(scene, container, enemyId, scale = 1, options = {}) {
  const rect = ENEMY_FRAMES[enemyId] ?? ENEMY_FRAMES['rotting-villager'];
  if (!hasTexture(scene, HANDPAINTED_KEYS.enemies)) return null;
  const boss = options.type === 'boss' || enemyId === 'headless-grave-knight';
  const displayHeight =
    options.displayHeight ??
    (enemyId === 'black-hound' ? 150 : enemyId === 'plague-rat-swarm' ? 120 : enemyId === 'crow-messenger' ? 160 : boss ? 230 : 198) * scale;
  const image = addAtlasImage(scene, HANDPAINTED_KEYS.enemies, `enemy-${enemyId}`, rect, options.offsetX ?? 0, options.bottom ?? 118 * scale, {
    originY: 1,
    displayHeight,
    alpha: options.alpha ?? 1
  });
  if (!image) return null;
  image.setData('handPaintedAsset', true);
  container.add(image);
  return image;
}

export function addUiAsset(scene, frameKey, x, y, options = {}) {
  return addAtlasImage(scene, HANDPAINTED_KEYS.ui, `ui-${frameKey}`, UI_FRAMES[frameKey], x, y, options);
}

export function addVfxAsset(scene, frameKey, x, y, options = {}) {
  return addAtlasImage(scene, HANDPAINTED_KEYS.vfx, `vfx-${frameKey}`, VFX_FRAMES[frameKey], x, y, options);
}

export function choosePanelFrame(width, height) {
  const ratio = width / Math.max(1, height);
  if (ratio > 2.2) return 'button';
  if (ratio > 1.55) return 'widePanel';
  if (ratio < 0.85) return 'sidePanel';
  return 'largePanel';
}

export function chooseCardFrame(card) {
  if (card?.type === '防御' || card?.type === '技能') return card.type === '防御' ? 'cardDefense' : 'cardSkill';
  if (String(card?.type ?? '').toLowerCase().includes('defense')) return 'cardDefense';
  if (String(card?.type ?? '').toLowerCase().includes('skill')) return 'cardSkill';
  return 'cardAttack';
}

export function chooseCardVfx(card) {
  const type = String(card?.type ?? '').toLowerCase();
  const text = `${card?.name ?? ''} ${card?.text ?? ''} ${card?.activeText ?? ''}`.toLowerCase();
  if (type.includes('防') || type.includes('defense') || text.includes('护甲') || text.includes('防')) return 'shieldB';
  if (type.includes('技') || type.includes('skill') || text.includes('抽') || text.includes('祈')) return 'blessingC';
  if (type.includes('法') || type.includes('spell')) return 'blessingD';
  if (type.includes('诅') || type.includes('curse')) return 'impactD';
  return 'slashC';
}

export function playVfxSequence(scene, x, y, frameKeys, options = {}) {
  const images = frameKeys
    .map((frameKey, index) =>
      addVfxAsset(scene, frameKey, x + (options.offsetX ?? 0), y + (options.offsetY ?? 0), {
        displayWidth: options.displayWidth,
        displayHeight: options.displayHeight,
        displayHeight: options.displayHeight ?? options.size,
        scale: options.scale,
        alpha: index === 0 ? options.alpha ?? 1 : 0,
        depth: options.depth ?? 80
      })
    )
    .filter(Boolean);
  if (!images.length) return [];
  images.forEach((image, index) => {
    image.setAngle((options.angle ?? 0) + (index % 2 ? 3 : -3));
    scene.tweens.add({
      targets: image,
      alpha: index === 0 ? 0 : options.alpha ?? 1,
      scaleX: image.scaleX * (options.scalePulse ?? 1.1),
      scaleY: image.scaleY * (options.scalePulse ?? 1.1),
      delay: index * (options.stepDelay ?? 45),
      duration: options.frameDuration ?? 120,
      yoyo: true,
      ease: 'Sine.Out',
      onComplete: () => image.destroy()
    });
  });
  return images;
}
