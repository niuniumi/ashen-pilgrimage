import { SCENES } from './constants.js';
import { createNewRun } from './GameState.js';
import { SaveManager } from './SaveManager.js';
import { MapSystem } from '../systems/MapSystem.js';
import { VowSystem } from '../systems/VowSystem.js';

const NODE_SCENES = {
  battle: SCENES.Battle,
  elite: SCENES.Battle,
  boss: SCENES.Battle,
  event: SCENES.Event,
  shop: SCENES.Shop,
  rest: SCENES.Rest,
  chest: SCENES.Chest
};

export class QABridge {
  constructor(game, options = {}) {
    this.game = game;
    this.saveRun = options.saveRun ?? ((run) => SaveManager.saveRun(run));
  }

  startRun(characterId = 'exiled-knight', options = {}) {
    const run = createNewRun(characterId, { seed: options.seed ?? 20260710 });
    this.game.registry.set('run', run);
    if (options.skipVow) {
      if (options.applyVow !== false) {
        const vow = VowSystem.getOffer(run, 1)[0];
        if (vow) VowSystem.apply(run, vow.id);
      }
      this.saveRun(run);
      this.startScene(SCENES.Map);
    } else {
      run.pendingScene = 'vow';
      this.saveRun(run);
      this.startScene(SCENES.Vow);
    }
    return this.runSummary(run);
  }

  chooseVow(index = 0) {
    const run = this.game.registry.get('run');
    if (!run) return null;
    const offer = VowSystem.getOffer(run, run.act ?? 1);
    const vow = offer[index] ?? offer[0];
    if (vow) VowSystem.apply(run, vow.id);
    delete run.pendingScene;
    this.saveRun(run);
    this.startScene(SCENES.Map);
    return vow?.id ?? null;
  }

  enterNode(nodeId = null) {
    const run = this.game.registry.get('run');
    if (!run) return null;
    const targetId = nodeId ?? run.map.available?.[0];
    const node = MapSystem.startNode(run, targetId);
    if (!node) return null;
    run.pendingScene = node.type === 'boss' ? 'boss-intro' : node.type;
    run.pendingBattleType = node.type === 'elite' ? 'elite' : node.type === 'boss' ? 'boss' : 'battle';
    this.saveRun(run);
    const sceneKey = NODE_SCENES[node.type] ?? SCENES.Map;
    const data = ['battle', 'elite', 'boss'].includes(node.type)
      ? { battleType: node.type === 'boss' ? 'boss' : node.type }
      : {};
    this.startScene(sceneKey, data);
    return { nodeId: node.id, nodeType: node.type, sceneKey };
  }

  forceScene(sceneKey, nodeType = null) {
    const run = this.game.registry.get('run');
    if (run && nodeType) {
      const id = `qa-${nodeType}-${Date.now()}`;
      run.map.nodes.push({ id, row: 99, column: 0, x: 575, type: nodeType, links: [] });
      run.map.activeNode = id;
      run.pendingScene = nodeType === 'boss' ? 'boss-intro' : nodeType;
      run.pendingBattleType = nodeType === 'elite' ? 'elite' : nodeType === 'boss' ? 'boss' : 'battle';
      this.saveRun(run);
    }
    const data = sceneKey === SCENES.Battle && nodeType
      ? { battleType: nodeType === 'boss' ? 'boss' : nodeType }
      : {};
    this.startScene(sceneKey, data);
    return this.snapshot();
  }

  startScene(sceneKey, data = {}) {
    for (const scene of this.game.scene.getScenes(true)) {
      if (scene.scene.key !== sceneKey) this.game.scene.stop(scene.scene.key);
    }
    this.game.scene.start(sceneKey, data);
  }

  snapshot() {
    const run = this.game.registry.get('run');
    return {
      scene: this.game.scene.getScenes(true)[0]?.scene?.key ?? null,
      run: run ? this.runSummary(run) : null
    };
  }

  runSummary(run) {
    return {
      id: run.id,
      seed: run.seed,
      rngCursor: run.rngState?.cursor ?? 0,
      characterId: run.characterId,
      act: run.act,
      floor: run.floor,
      hp: run.hp,
      maxHp: run.maxHp,
      gold: run.gold,
      vows: [...(run.vows ?? [])],
      activeNode: run.map?.activeNode ?? null,
      availableNodes: [...(run.map?.available ?? [])]
    };
  }
}

export function installQABridge(game) {
  return new QABridge(game);
}
