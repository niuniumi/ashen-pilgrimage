import { createKeyboardEventGuard } from './KeyboardEventGuard.js';

export class CharacterSelectInputController {
  constructor(ids, options = {}) {
    this.ids = [...new Set(ids ?? [])];
    this.selectedId = this.ids.includes(options.selectedId) ? options.selectedId : (this.ids[0] ?? null);
    this.onSelect = typeof options.onSelect === 'function' ? options.onSelect : () => {};
    this.onConfirm = typeof options.onConfirm === 'function' ? options.onConfirm : () => {};
    this.onBack = typeof options.onBack === 'function' ? options.onBack : () => {};
    this.locked = false;
    this.destroyed = false;
    this.keyboard = null;
    this.acceptKeyEvent = createKeyboardEventGuard();
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
    this.keyboard.on('keydown', this.onKeyDown);
    return this;
  }

  setSelected(id) {
    if (this.destroyed || this.locked || !this.ids.includes(id)) return false;
    if (this.selectedId === id) return true;
    this.selectedId = id;
    this.onSelect(id, this.ids.indexOf(id));
    return true;
  }

  move(direction) {
    if (this.destroyed || this.locked || this.ids.length === 0) return false;
    const currentIndex = this.ids.indexOf(this.selectedId);
    const startIndex = currentIndex < 0 ? (direction > 0 ? -1 : 0) : currentIndex;
    const nextIndex = (startIndex + direction + this.ids.length) % this.ids.length;
    return this.setSelected(this.ids[nextIndex]);
  }

  confirm() {
    if (this.selectedId === null || !this.lock()) return false;
    this.onConfirm(this.selectedId);
    return true;
  }

  back() {
    if (!this.lock()) return false;
    this.onBack();
    return true;
  }

  lock() {
    if (this.destroyed || this.locked) return false;
    this.locked = true;
    return true;
  }

  handleKey(code) {
    if (this.destroyed || this.locked) return false;

    if (code === 'ArrowRight' || code === 'KeyD' || code === 'd' || code === 'D') return this.move(1);
    if (code === 'ArrowLeft' || code === 'KeyA' || code === 'a' || code === 'A') return this.move(-1);

    const digit = /^(?:Digit|Numpad)([1-3])$/.exec(code)?.[1] ?? (/^[1-3]$/.test(code) ? code : null);
    if (digit) {
      const id = this.ids[Number(digit) - 1];
      return id === undefined ? false : this.setSelected(id);
    }

    if (code === 'Enter' || code === 'NumpadEnter' || code === 'Space' || code === ' ') return this.confirm();
    if (code === 'Escape') return this.back();
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
