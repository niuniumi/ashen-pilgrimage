import { getActDefinition } from '../data/acts.js';
import { NODE_LABELS } from '../game/constants.js';
import { createRngState, normalizeRngState, shuffle } from '../game/RunRng.js';

const SOURCE_X_MIN = 300;
const SOURCE_X_MAX = 850;

const MAP_PATTERNS = {
  1: [
    ['battle'],
    ['battle', 'event'],
    ['shop', 'battle', 'chest'],
    ['battle', 'event'],
    ['rest', 'shop'],
    ['battle', 'elite', 'event'],
    ['battle', 'chest'],
    ['event', 'battle', 'elite'],
    ['battle', 'shop', 'chest'],
    ['rest', 'event'],
    ['battle', 'elite'],
    ['boss']
  ],
  2: [
    ['battle'],
    ['event', 'battle'],
    ['battle', 'shop', 'battle'],
    ['chest', 'battle'],
    ['rest', 'shop'],
    ['chest', 'elite', 'event'],
    ['battle', 'event'],
    ['rest', 'battle', 'elite'],
    ['shop', 'battle', 'chest'],
    ['rest', 'event'],
    ['elite', 'battle'],
    ['boss']
  ],
  3: [
    ['battle'],
    ['battle', 'event'],
    ['elite', 'battle', 'shop'],
    ['battle', 'event'],
    ['rest', 'shop'],
    ['battle', 'chest', 'event'],
    ['battle', 'elite'],
    ['shop', 'battle', 'event'],
    ['battle', 'chest', 'elite'],
    ['rest', 'shop'],
    ['elite', 'battle'],
    ['boss']
  ]
};

function rowXs(count, row) {
  if (count <= 1) return [575];
  const span = SOURCE_X_MAX - SOURCE_X_MIN;
  const step = span / (count + 1);
  const drift = row % 2 === 0 ? -14 : 14;
  return Array.from({ length: count }, (_, index) => Math.round(SOURCE_X_MIN + step * (index + 1) + drift));
}

function linkRows(rows) {
  for (let row = 0; row < rows.length - 1; row += 1) {
    const current = rows[row];
    const next = rows[row + 1];

    for (const node of current) {
      const nearest = [...next].sort((a, b) => Math.abs(a.x - node.x) - Math.abs(b.x - node.x));
      node.links = nearest[0] ? [nearest[0].id] : [];
    }

    for (const target of next) {
      if (current.some((node) => node.links.includes(target.id))) continue;
      const source = [...current]
        .filter((node) => node.links.length < 2)
        .sort((a, b) => Math.abs(a.x - target.x) - Math.abs(b.x - target.x))[0];
      if (source) source.links.push(target.id);
    }

    if (next.length > 1) {
      current.forEach((node, index) => {
        if (node.links.length >= 2) return;
        const primary = next.findIndex((target) => target.id === node.links[0]);
        const direction = (row + index) % 2 === 0 ? 1 : -1;
        const alternate = next[primary + direction] ?? next[primary - direction];
        if (alternate && !node.links.includes(alternate.id)) node.links.push(alternate.id);
      });
    }
  }
}

function createNodesForAct(act, rngState) {
  const pattern = MAP_PATTERNS[act] ?? MAP_PATTERNS[1];
  let state = normalizeRngState(rngState, act * 1009);
  let id = 0;
  const rows = pattern.map((baseTypes, row) => {
    let types = [...baseTypes];
    if (row > 0 && row < pattern.length - 1 && types.length > 1) {
      const shuffled = shuffle(state, types);
      types = shuffled.value;
      state = shuffled.state;
    }
    const xs = rowXs(types.length, row);
    return types.map((type, index) => ({
      id: `n${id++}`,
      row,
      column: index,
      x: xs[index],
      type,
      links: []
    }));
  });
  linkRows(rows);
  return { nodes: rows.flat(), state };
}

export class MapSystem {
  static createSeededMap(act = 1, rngState = createRngState(act * 1009)) {
    const chapter = getActDefinition(act);
    const generated = createNodesForAct(chapter.number, rngState);
    return {
      map: {
        act: chapter.number,
        title: chapter.title,
        subtitle: chapter.mapCaption,
        bossId: chapter.bossId,
        nodes: generated.nodes,
        completed: [],
        available: ['n0'],
        activeNode: null,
        path: []
      },
      state: generated.state
    };
  }

  static createMap(act = 1) {
    return this.createSeededMap(act).map;
  }

  static getNode(run, nodeId) {
    return run?.map?.nodes?.find((node) => node.id === nodeId) ?? null;
  }

  static canSelect(run, nodeId) {
    if (!run?.map || run.map.activeNode) return false;
    return run.map.available.includes(nodeId);
  }

  static startNode(run, nodeId) {
    const node = this.getNode(run, nodeId);
    if (!node || !this.canSelect(run, nodeId)) return null;
    run.map.activeNode = nodeId;
    run.map.path.push(nodeId);
    run.floor = Math.max(run.floor, node.row + 1);
    run.highestFloor = Math.max(run.highestFloor ?? 0, (run.act ?? 1) * 100 + run.floor);
    run.rewardClaimed = false;
    return node;
  }

  static finishActiveNode(run) {
    const nodeId = run?.map?.activeNode;
    const node = this.getNode(run, nodeId);
    if (!node) return null;
    if (!run.map.completed.includes(nodeId)) run.map.completed.push(nodeId);
    run.map.available = node.links.length > 0 ? [...node.links] : [];
    run.map.activeNode = null;
    return node;
  }

  static cancelActiveNode(run) {
    const nodeId = run?.map?.activeNode;
    const node = this.getNode(run, nodeId);
    if (!node) return null;
    const completed = run.map.completed.includes(nodeId);
    if (!completed) {
      const index = Array.isArray(run.map.path) ? run.map.path.lastIndexOf(nodeId) : -1;
      if (index >= 0) run.map.path.splice(index, 1);
      if (!run.map.available.includes(nodeId)) run.map.available = [nodeId, ...run.map.available];
      delete run.pendingReward;
      run.rewardClaimed = false;
      const completedFloor = run.map.completed.reduce((floor, id) => {
        const completedNode = this.getNode(run, id);
        return Math.max(floor, Number.isFinite(completedNode?.row) ? completedNode.row + 1 : 0);
      }, 0);
      run.floor = completedFloor;
    }
    run.map.activeNode = null;
    return node;
  }

  static getNodeLabel(type) {
    return NODE_LABELS[type] ?? '未知';
  }
}
