export class AccessibilityBridge {
  constructor(documentRef = globalThis.document) {
    this.document = documentRef;
    this.revision = 0;
    this.root = this.document.createElement('section');
    this.root.id = 'ashen-accessibility';
    this.root.setAttribute('aria-label', '灰烬圣途辅助操作');

    this.liveRegion = this.document.createElement('div');
    this.liveRegion.id = 'ashen-live-region';
    this.liveRegion.setAttribute('class', 'visually-hidden');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');

    this.actions = this.document.createElement('div');
    this.actions.id = 'ashen-scene-actions';
    this.actions.setAttribute('class', 'visually-hidden-focusable');
    this.actions.setAttribute('aria-label', '当前场景操作');
    this.root.append(this.liveRegion, this.actions);
    this.document.body.append(this.root);
  }

  announce(message) {
    this.liveRegion.textContent = String(message ?? '');
  }

  setActions(sceneKey, actions = []) {
    const revision = ++this.revision;
    const buttons = actions.map((action) => {
      const button = this.document.createElement('button');
      button.setAttribute('type', 'button');
      button.setAttribute('data-scene', sceneKey);
      button.textContent = action.label;
      button.disabled = Boolean(action.disabled);
      button.addEventListener('click', () => {
        if (!button.disabled) action.onActivate?.();
      });
      return button;
    });
    this.actions.replaceChildren(...buttons);
    return () => {
      if (this.revision !== revision) return;
      this.actions.replaceChildren();
    };
  }

  destroy() {
    this.revision += 1;
    this.root.remove();
  }
}
