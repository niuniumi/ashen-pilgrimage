export const COMPONENT_STATES = {
  button: {
    idle: { fill: 0x20292b, stroke: 0x9a7434, alpha: 0.94 },
    hover: { fill: 0x2b3636, stroke: 0xf2c86d, alpha: 1 },
    pressed: { fill: 0x141a1b, stroke: 0xf2c86d, alpha: 1 },
    disabled: { fill: 0x13100d, stroke: 0x4d3d23, alpha: 0.55 }
  },
  card: {
    playable: { alpha: 1, tint: 0xffffff },
    unaffordable: { alpha: 0.58, tint: 0x7b7468 },
    selected: { glow: 0xf2c86d, scale: 1.12 },
    hover: { glow: 0xf2c86d, scale: 1.08, lift: 24 }
  },
  intent: {
    attack: 0xb6362e,
    defend: 0x2f6484,
    buff: 0xb88a3d,
    debuff: 0x6e4cb0,
    special: 0xd8bd8a
  },
  rarity: {
    common: 0xb88a3d,
    rare: 0x8fb9d9,
    epic: 0xb07ad8,
    legendary: 0xf2c86d,
    curse: 0x30213d
  }
};
