import {
  choice as seededChoice,
  normalizeRngState,
  pickMany as seededPickMany,
  randomInt as seededRandomInt,
  shuffle as seededShuffle
} from './RunRng.js';

function stateFor(run) {
  return normalizeRngState(run?.rngState, run?.seed);
}

function commit(run, result) {
  if (run) run.rngState = result.state;
  return result.value;
}

export function runChoice(run, items) {
  return commit(run, seededChoice(stateFor(run), items));
}

export function runRandomInt(run, min, max) {
  return commit(run, seededRandomInt(stateFor(run), min, max));
}

export function runChance(run, probability) {
  const roll = seededRandomInt(stateFor(run), 0, 999_999);
  if (run) run.rngState = roll.state;
  return roll.value < Math.max(0, Math.min(1, Number(probability) || 0)) * 1_000_000;
}

export function runShuffle(run, items) {
  return commit(run, seededShuffle(stateFor(run), items));
}

export function runPickMany(run, items, count) {
  return commit(run, seededPickMany(stateFor(run), items, count));
}
