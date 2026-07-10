const DEFERRED_IMAGES = [
  ['prologue-user-2', 'assets/generated/prologue-user/prologue-user-2.png'],
  ['prologue-user-3', 'assets/generated/prologue-user/prologue-user-3.png'],
  ['prologue-user-4', 'assets/generated/prologue-user/prologue-user-4.png'],
  ['generated-defeat-tombstone', 'assets/generated/defeat-tombstone-v2.png'],
  ['hp-bg-map', 'assets/handpainted/map-background.png'],
  ['hp-bg-battle', 'assets/handpainted/battle-background.png'],
  ['hp-heroes', 'assets/handpainted/heroes-atlas.png'],
  ['hp-hero-alchemist', 'assets/handpainted/alchemist-hero.png'],
  ['hp-enemies', 'assets/handpainted/enemies-atlas.png']
];

export function queueDeferredVisuals(scene) {
  let queued = 0;
  for (const [key, url] of DEFERRED_IMAGES) {
    if (scene.textures.exists(key)) continue;
    scene.load.image(key, url);
    queued += 1;
  }
  return queued;
}
