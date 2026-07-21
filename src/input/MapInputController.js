import { createKeyboardEventGuard } from './KeyboardEventGuard.js';

const DIRECTION_VECTORS = Object.freeze({
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 }
});

export class MapInputController {
  constructor(nodes = [], options = {}) {
    this.nodes = nodes
      .filter((node) => node?.id != null && Number.isFinite(node.x) && Number.isFinite(node.y))
      .filter((node, index, list) => list.findIndex((candidate) => candidate.id === node.id) === index)
      .map((node) => ({ id: node.id, x: node.x, y: node.y }));
    this.selectedId = this.nodes.some((node) => node.id === options.selectedId)
      ? options.selectedId
      : (this.nodes[0]?.id ?? null);
    this.onSelect = typeof options.onSelect === 'function' ? options.onSelect : () => {};
    this.onConfirm = typeof options.onConfirm === 'function' ? options.onConfirm : () => {};
    this.keyboard = null;
    this.acceptKeyEvent = createKeyboardEventGuard();
    this.locked = false;
    this.destroyed = false;
    this.onKeyDown = (event) => {
      if (!this.acceptKeyEvent(event)) return;
      const handled = this.handleKey(event?.code || event?.key);
      if (handled) event?.preventDefault?.();
    };
  }

  install(keyboard) {
    if (this.destroyed || typeof keyboard?.on !== 'function') return this;
    if (this.keyboard === keyboard) return this;
    this.detachKeyboard();
    this.keyboard = keyboard;
    keyboard.on('keydown', this.onKeyDown);
    return this;
  }

  setSelected(id) {
    if (this.destroyed || this.locked || !this.nodes.some((node) => node.id === id)) return null;
    if (this.selectedId === id) return id;
    this.selectedId = id;
    this.onSelect(id);
    return id;
  }

  move(direction) {
    if (this.destroyed || this.locked) return null;
    const vector = DIRECTION_VECTORS[direction];
    const current = this.nodes.find((node) => node.id === this.selectedId) ?? this.nodes[0];
    if (!vector || !current) return null;
    const candidates = this.nodes
      .filter((node) => node.id !== current.id)
      .map((node, index) => {
        const dx = node.x - current.x;
        const dy = node.y - current.y;
        const perpendicular = Math.abs(dx * vector.y - dy * vector.x);
        return {
          node,
          index,
          projection: dx * vector.x + dy * vector.y,
          angleCost: perpendicular / Math.max(1, dx * vector.x + dy * vector.y),
          distance: Math.hypot(dx, dy)
        };
      })
      .filter((candidate) => candidate.projection > 0)
      .sort((a, b) => a.angleCost - b.angleCost || a.distance - b.distance || a.index - b.index);
    if (candidates.length === 0) return this.selectedId;
    return this.setSelected(candidates[0].node.id);
  }

  confirm() {
    if (this.selectedId == null || !this.lock()) return null;
    const selectedId = this.selectedId;
    try {
      if (this.onConfirm(selectedId) === false) {
        this.locked = false;
        return null;
      }
    } catch (error) {
      this.locked = false;
      throw error;
    }
    return selectedId;
  }

  lock() {
    if (this.destroyed || this.locked) return false;
    this.locked = true;
    return true;
  }

  handleKey(code) {
    const direction = {
      ArrowLeft: 'left', KeyA: 'left', a: 'left', A: 'left',
      ArrowRight: 'right', KeyD: 'right', d: 'right', D: 'right',
      ArrowUp: 'up', KeyW: 'up', w: 'up', W: 'up',
      ArrowDown: 'down', KeyS: 'down', s: 'down', S: 'down'
    }[code];
    if (direction) return this.move(direction) !== null;
    if (code === 'Enter' || code === 'NumpadEnter' || code === 'Space' || code === ' ') {
      return this.confirm() !== null;
    }
    return false;
  }

  destroy() {
    if (this.destroyed) return false;
    this.detachKeyboard();
    this.destroyed = true;
    return true;
  }

  detachKeyboard() {
    this.keyboard?.off?.('keydown', this.onKeyDown);
    this.keyboard = null;
  }
}
