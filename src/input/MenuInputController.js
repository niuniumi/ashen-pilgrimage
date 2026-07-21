export class MenuInputController {
  constructor(items = [], options = {}) {
    this.items = items;
    this.announce = options.announce;
    this.onSelection = options.onSelection;
    this.selectedIndex = Math.max(0, items.findIndex((item) => !item.disabled));
    this.select(this.selectedIndex);
  }

  currentIndex() {
    const renderedIndex = this.items.findIndex((item) => !item.disabled && item.button?.selected);
    if (renderedIndex >= 0) this.selectedIndex = renderedIndex;
    return this.selectedIndex;
  }

  select(index) {
    if (this.items.length === 0) return false;
    const next = (index + this.items.length) % this.items.length;
    if (this.items[next]?.disabled) return false;
    this.selectedIndex = next;
    this.items.forEach((item, itemIndex) => item.button?.setSelected(itemIndex === next));
    this.onSelection?.(next);
    this.announce?.(this.items[next].label);
    return true;
  }

  move(direction) {
    let next = this.currentIndex();
    for (let attempts = 0; attempts < this.items.length; attempts += 1) {
      next = (next + direction + this.items.length) % this.items.length;
      if (!this.items[next].disabled) return this.select(next);
    }
    return false;
  }

  handleKey(event) {
    const code = event?.code || event?.key;
    let handled = false;
    if (code === 'ArrowDown' || code === 'KeyS' || code === 's' || code === 'S') handled = this.move(1);
    else if (code === 'ArrowUp' || code === 'KeyW' || code === 'w' || code === 'W') handled = this.move(-1);
    else if (code === 'Enter' || code === 'NumpadEnter' || code === 'Space' || code === ' ') {
      this.items[this.currentIndex()]?.action?.();
      handled = true;
    }
    if (handled) event?.preventDefault?.();
    return handled;
  }
}

export function bindMenuInput(keyboard, items, options = {}) {
  const controller = new MenuInputController(items, options);
  const onKeyDown = (event) => controller.handleKey(event);
  let active = true;
  keyboard?.on?.('keydown', onKeyDown);
  return {
    controller,
    cleanup() {
      if (!active) return;
      active = false;
      keyboard?.off?.('keydown', onKeyDown);
    }
  };
}
