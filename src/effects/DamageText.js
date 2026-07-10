import Phaser from 'phaser';

const FONT = 'Georgia, "Microsoft YaHei", serif';

export function spawnDamageText(scene, x, y, amount, kind = 'damage') {
  const color = {
    heal: '#8ee080',
    block: '#9bd1ff',
    status: '#f3bd67',
    damage: '#ffdf8b'
  }[kind] ?? '#ffdf8b';
  const prefix = kind === 'damage' ? '-' : kind === 'status' ? '+' : '+';
  const text = scene.add
    .text(x, y, `${prefix}${Math.abs(amount)}`, {
      fontFamily: FONT,
      fontSize: kind === 'damage' ? 34 : 28,
      fontStyle: 'bold',
      color,
      stroke: '#160c08',
      strokeThickness: 5
    })
    .setOrigin(0.5)
    .setDepth(820);
  scene.tweens.add({
    targets: text,
    y: y - 66,
    x: x + Phaser.Math.Between(-12, 12),
    alpha: 0,
    scale: 1.14,
    duration: 760,
    ease: 'Sine.Out',
    onComplete: () => text.destroy()
  });
}
