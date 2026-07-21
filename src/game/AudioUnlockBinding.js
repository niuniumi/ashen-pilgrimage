const sceneBindings = new WeakMap();

export function installAudioUnlockGestures(scene, audio = scene?.audio) {
  sceneBindings.get(scene)?.();
  if (!scene?.input || audio?.unlocked) return null;

  let active = true;
  let inFlight = false;

  const removeGestures = () => {
    scene.input?.off?.('pointerdown', attemptUnlock);
    scene.input?.keyboard?.off?.('keydown', attemptUnlock);
  };
  const cleanup = () => {
    if (!active) return;
    active = false;
    removeGestures();
    scene.events?.off?.('shutdown', cleanup);
    if (sceneBindings.get(scene) === cleanup) sceneBindings.delete(scene);
  };
  const installGestures = () => {
    if (!active || inFlight || audio?.unlocked) return;
    scene.input?.once?.('pointerdown', attemptUnlock);
    scene.input?.keyboard?.once?.('keydown', attemptUnlock);
  };
  async function attemptUnlock() {
    if (!active || inFlight) return;
    inFlight = true;
    removeGestures();
    let succeeded = false;
    try {
      const result = await audio?.unlock?.();
      succeeded = result === true || audio?.unlocked === true;
    } catch {
      succeeded = false;
    } finally {
      inFlight = false;
      if (!active) return;
      if (succeeded) cleanup();
      else installGestures();
    }
  }

  sceneBindings.set(scene, cleanup);
  scene.events?.once?.('shutdown', cleanup);
  installGestures();
  return cleanup;
}
