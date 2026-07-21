import { motionDuration } from '../game/MotionPolicy.js';
import { SaveManager } from '../game/SaveManager.js';

export class SceneTransition {
  static fadeTo(scene, targetScene, data = {}, duration = 420) {
    if (scene.transitioning) return;
    scene.transitioning = true;
    scene.input.enabled = false;
    const effectiveDuration = motionDuration(SaveManager.readSettings(), duration);
    const finish = () => {
      scene.transitioning = false;
      scene.input.enabled = true;
      scene.scene.start(targetScene, data);
    };
    if (effectiveDuration === 0) {
      finish();
      return;
    }
    scene.cameras.main.fadeOut(effectiveDuration, 0, 0, 0);
    scene.time.delayedCall(effectiveDuration + 20, finish);
  }
}
