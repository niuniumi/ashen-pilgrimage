import { createKeyboardEventGuard } from './KeyboardEventGuard.js';

const sceneBindings = new WeakMap();

export function bindPauseMenuEscape(scene, menu) {
  sceneBindings.get(scene)?.();
  const keyboard = scene?.input?.keyboard;
  if (typeof keyboard?.on !== 'function' || typeof menu?.toggle !== 'function') return () => {};

  const acceptKeyEvent = createKeyboardEventGuard();
  let active = true;
  const onEscape = (event) => {
    if (active && acceptKeyEvent(event)) menu.toggle();
  };
  const cleanup = () => {
    if (!active) return;
    active = false;
    keyboard.off?.('keydown-ESC', onEscape);
    scene.events?.off?.('shutdown', cleanup);
    if (sceneBindings.get(scene) === cleanup) sceneBindings.delete(scene);
  };

  sceneBindings.set(scene, cleanup);
  keyboard.on('keydown-ESC', onEscape);
  scene.events?.once?.('shutdown', cleanup);
  return cleanup;
}
