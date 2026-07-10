export class SceneTransition {
  static fadeTo(scene, targetScene, data = {}, duration = 420) {
    if (scene.transitioning) return;
    scene.transitioning = true;
    scene.input.enabled = false;
    scene.cameras.main.fadeOut(duration, 0, 0, 0);
    scene.time.delayedCall(duration + 20, () => {
      scene.transitioning = false;
      scene.input.enabled = true;
      scene.scene.start(targetScene, data);
    });
  }
}
