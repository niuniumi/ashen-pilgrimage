export function screenShake(scene, intensity = 0.006, duration = 220) {
  scene.cameras.main.shake(duration, intensity);
}
