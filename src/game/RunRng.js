const DEFAULT_SEED = 0x6d2b79f5;
const STEP = 0x6d2b79f5;

export function createRngState(seed = Date.now()) {
  const normalized = Number(seed) >>> 0;
  return {
    seed: normalized || DEFAULT_SEED,
    cursor: 0
  };
}

export function normalizeRngState(state, fallbackSeed = Date.now()) {
  if (!state || !Number.isFinite(state.seed) || !Number.isFinite(state.cursor)) {
    return createRngState(fallbackSeed);
  }
  return {
    seed: Number(state.seed) >>> 0 || DEFAULT_SEED,
    cursor: Math.max(0, Math.floor(state.cursor))
  };
}

export function nextFloat(input) {
  const state = normalizeRngState(input, DEFAULT_SEED);
  let value = (state.seed + Math.imul(state.cursor + 1, STEP)) >>> 0;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return {
    value: ((value ^ (value >>> 14)) >>> 0) / 4294967296,
    state: { seed: state.seed, cursor: state.cursor + 1 }
  };
}

export function randomInt(input, min, max) {
  const lower = Math.ceil(Number(min));
  const upper = Math.floor(Number(max));
  if (!Number.isFinite(lower) || !Number.isFinite(upper) || upper < lower) {
    return { value: Number.isFinite(lower) ? lower : 0, state: normalizeRngState(input, DEFAULT_SEED) };
  }
  const next = nextFloat(input);
  return {
    value: Math.floor(next.value * (upper - lower + 1)) + lower,
    state: next.state
  };
}

export function choice(input, items) {
  const state = normalizeRngState(input, DEFAULT_SEED);
  if (!Array.isArray(items) || items.length === 0) return { value: null, state };
  const picked = randomInt(state, 0, items.length - 1);
  return { value: items[picked.value], state: picked.state };
}

export function shuffle(input, items) {
  let state = normalizeRngState(input, DEFAULT_SEED);
  const value = Array.isArray(items) ? [...items] : [];
  for (let index = value.length - 1; index > 0; index -= 1) {
    const picked = randomInt(state, 0, index);
    state = picked.state;
    [value[index], value[picked.value]] = [value[picked.value], value[index]];
  }
  return { value, state };
}

export function pickMany(input, items, count) {
  const shuffled = shuffle(input, items);
  const size = Math.max(0, Math.min(shuffled.value.length, Math.floor(Number(count) || 0)));
  return { value: shuffled.value.slice(0, size), state: shuffled.state };
}
