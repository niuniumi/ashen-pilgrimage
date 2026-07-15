export class SceneChoiceController {
  constructor(ids, options = {}) {
    this.ids = [...new Set(ids ?? [])];
    const enabled = options.enabledIds ?? this.ids;
    this.enabledIds = this.ids.filter((id) => enabled.includes(id));
    this.selectedId = null;
    this.confirmedId = null;
    this.locked = false;
    this.destroyed = false;
    this.listeners = new Set();
  }

  get state() {
    return {
      enabledIds: [...this.enabledIds],
      selectedId: this.selectedId,
      confirmedId: this.confirmedId,
      locked: this.locked,
      destroyed: this.destroyed
    };
  }

  subscribe(listener) {
    if (this.destroyed || typeof listener !== 'function') return () => {};
    this.listeners.add(listener);
    let active = true;
    return () => {
      if (!active) return false;
      active = false;
      return this.listeners.delete(listener);
    };
  }

  setEnabledIds(ids) {
    if (this.destroyed || this.locked) return false;
    const requested = ids ?? [];
    this.enabledIds = this.ids.filter((id) => requested.includes(id));
    if (!this.enabledIds.includes(this.selectedId)) this.selectedId = null;
    this.notify();
    return true;
  }

  select(id) {
    if (this.destroyed || this.locked || !this.enabledIds.includes(id)) return false;
    if (this.selectedId === id) return true;
    this.selectedId = id;
    this.notify();
    return true;
  }

  clear() {
    if (this.destroyed || this.locked || this.selectedId === null) return false;
    this.selectedId = null;
    this.notify();
    return true;
  }

  next() {
    return this.move(1);
  }

  previous() {
    return this.move(-1);
  }

  move(direction) {
    if (this.destroyed || this.locked || this.enabledIds.length === 0) return null;
    const current = this.enabledIds.indexOf(this.selectedId);
    const start = current < 0 ? (direction > 0 ? -1 : 0) : current;
    const index = (start + direction + this.enabledIds.length) % this.enabledIds.length;
    const selected = this.enabledIds[index];
    this.select(selected);
    return selected;
  }

  confirm() {
    if (this.destroyed || this.locked || this.selectedId === null) return null;
    const selected = this.selectedId;
    this.locked = true;
    this.confirmedId = selected;
    this.notify();
    return selected;
  }

  lock() {
    if (this.destroyed || this.locked) return false;
    this.locked = true;
    this.notify();
    return true;
  }

  handleKey(code) {
    if (this.destroyed || this.locked) return false;
    if (code === 'ArrowRight' || code === 'ArrowDown') return this.next() !== null;
    if (code === 'ArrowLeft' || code === 'ArrowUp') return this.previous() !== null;
    if (code === 'Enter' || code === 'NumpadEnter' || code === 'Space' || code === ' ') return this.confirm() !== null;
    if (code === 'Escape') return this.clear();
    return false;
  }

  destroy() {
    if (this.destroyed) return false;
    this.destroyed = true;
    this.listeners.clear();
    return true;
  }

  notify() {
    const state = this.state;
    for (const listener of this.listeners) listener(state);
  }
}
