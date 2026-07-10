import { SaveManager } from '../game/SaveManager.js';

export class BattleAnimationDirector {
  constructor(scene) {
    this.scene = scene;
  }

  playActorPose(holder, pose, options = {}) {
    const art = holder?.artContainer;
    if (!art?.setBattlePose) return;
    const scene = this.scene;
    const animationEnabled = SaveManager.readSettings().animation !== false;
    const baseX = holder.getData?.('motionBaseX') ?? holder.x;
    const baseY = holder.getData?.('motionBaseY') ?? holder.y;
    holder.setData?.('motionBaseX', baseX);
    holder.setData?.('motionBaseY', baseY);
    scene.tweens.killTweensOf(holder);
    holder.setPosition(baseX, baseY);
    holder.setScale(1);
    holder.setAngle(0);
    art.setBattlePose(pose);
    const duration = options.duration ?? 360;
    if (!animationEnabled) {
      scene.time.delayedCall(duration, () => {
        if (art?.scene && art.setBattlePose) art.setBattlePose('idle');
      });
      return;
    }

    const runFrames = (frames, done) => {
      const next = (index) => {
        if (!holder?.scene || index >= frames.length) {
          done?.();
          return;
        }
        const frame = frames[index];
        frame.onStart?.();
        scene.tweens.add({
          targets: holder,
          x: baseX + (frame.x ?? 0),
          y: baseY + (frame.y ?? 0),
          scale: frame.scale ?? 1,
          angle: frame.angle ?? 0,
          duration: frame.duration ?? 80,
          ease: frame.ease ?? 'Sine.Out',
          onComplete: () => next(index + 1)
        });
      };
      next(0);
    };

    const finish = () => {
      if (art?.scene && art.setBattlePose) art.setBattlePose('idle');
    };
    if (pose === 'attack') {
      const lunge = options.lungeX ?? 22;
      const sign = Math.sign(lunge || 1);
      runFrames([
        { x: -sign * 10, y: 2, scale: 0.985, duration: 70, ease: 'Sine.In' },
        { x: lunge, y: -2, scale: 1.045, angle: sign * 1.6, duration: options.motionDuration ?? 110, ease: 'Cubic.Out' },
        { x: lunge * 0.72, y: -1, scale: 1.025, angle: sign * 0.8, duration: 52, ease: 'Linear' },
        { x: 0, y: 0, scale: 1, angle: 0, duration: 150, ease: 'Sine.Out' }
      ], finish);
      return;
    }
    if (pose === 'hit') {
      const knock = options.knockX ?? 16;
      const sign = Math.sign(knock || 1);
      runFrames([
        { x: knock, y: 0, scale: 1.01, angle: sign * 2.6, duration: 58, ease: 'Quad.Out' },
        { x: -sign * 7, y: 1, scale: 0.995, angle: -sign * 1.2, duration: 72, ease: 'Sine.InOut' },
        { x: 0, y: 0, scale: 1, angle: 0, duration: 130, ease: 'Sine.Out' }
      ], finish);
      return;
    }
    if (pose === 'defend') {
      runFrames([
        { x: -4, y: 1, scale: 1.018, duration: 86, ease: 'Sine.Out' },
        { x: -2, y: 0, scale: 1.04, duration: 96, ease: 'Sine.InOut' },
        { x: 0, y: 0, scale: 1, duration: 190, ease: 'Sine.Out' }
      ], finish);
      return;
    }
    scene.time.delayedCall(duration, finish);
  }
}
