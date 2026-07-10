export class BattleInputController {
  constructor(scene) {
    this.scene = scene;
    this.onKeyDown = (event) => this.handleKey(event.code || event.key);
  }

  install() {
    this.scene.input?.keyboard?.on?.('keydown', this.onKeyDown);
    return this;
  }

  destroy() {
    this.scene.input?.keyboard?.off?.('keydown', this.onKeyDown);
  }

  handleKey(code) {
    const scene = this.scene;
    if (!scene?.battle || scene.uiPaused || scene.inputLocked || scene.battle.ended) return false;

    const digit = /^(?:Digit|Numpad)([1-9])$/.exec(code)?.[1] ?? (/^[1-9]$/.test(code) ? code : null);
    if (digit) {
      const instance = scene.battle.deck.hand[Number(digit) - 1];
      if (instance) scene.selectCard(instance.uid);
      return Boolean(instance);
    }

    if (code === 'ArrowLeft' || code === 'ArrowRight') {
      return this.cycleTarget(code === 'ArrowRight' ? 1 : -1);
    }

    if (code === 'Enter' || code === 'NumpadEnter' || code === 'Space' || code === ' ') {
      if (!scene.selectedUid) return false;
      const target = this.ensureTarget();
      if (target === null) return false;
      scene.tryUseSelectedOnEnemy(target);
      return true;
    }

    if (code === 'KeyE' || code === 'e' || code === 'E') {
      scene.endTurn();
      return true;
    }

    if (code === 'Escape' && scene.selectedUid) {
      scene.cancelCardSelection();
      return true;
    }

    return false;
  }

  livingTargets() {
    return this.scene.battle.enemies
      .map((enemy, index) => (enemy?.hp > 0 ? index : null))
      .filter((index) => index !== null);
  }

  ensureTarget() {
    const living = this.livingTargets();
    if (living.length === 0) return null;
    if (!living.includes(this.scene.keyboardTargetIndex)) this.scene.keyboardTargetIndex = living[0];
    return this.scene.keyboardTargetIndex;
  }

  cycleTarget(direction) {
    if (!this.scene.selectedUid) return false;
    const living = this.livingTargets();
    if (living.length === 0) return false;
    const current = living.indexOf(this.scene.keyboardTargetIndex);
    const next = current < 0 ? 0 : (current + direction + living.length) % living.length;
    this.scene.keyboardTargetIndex = living[next];
    this.scene.setPrompt?.(`已瞄准第 ${next + 1} 个存活目标。`);
    this.scene.renderBattle?.();
    return true;
  }
}
