from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'qa' / 'source-art' / 'enemy-facing-source-v1'
OUTPUT = ROOT / 'public' / 'assets' / 'pixel' / 'actors' / 'sprites'

ENEMY_FILES = (
    'rotting-villager.png',
    'grave-skeleton.png',
    'black-hound.png',
    'plague-rat-swarm-v2.png',
    'crow-messenger.png',
    'armor-broken-militia.png',
    'candle-monk.png',
    'pointed-witch.png',
    'plague-doctor.png',
    'iron-maiden-nun.png',
    'fallen-paladin.png',
    'headless-grave-knight.png',
    'wax-novice.png',
    'cinder-acolyte.png',
    'bell-tower-sentry.png',
    'scripture-moth-swarm.png',
    'choir-exorcist.png',
    'reliquary-jailer.png',
    'ash-veiled-prioress.png',
    'pale-wax-matron.png',
    'hollow-spearman.png',
    'ashen-banneret.png',
    'gutter-fire-archer.png',
    'crownless-hound.png',
    'gate-iron-vicar.png',
    'royal-pyre-knight.png',
    'clockwork-confessor.png',
    'hollow-crown-regent.png',
)

# These canonical sources were already authored facing screen-left.
SOURCE_LEFT = {'plague-rat-swarm-v2.png', 'crownless-hound.png'}


def main():
    missing = [name for name in ENEMY_FILES if not (SOURCE / name).exists()]
    if missing:
        raise FileNotFoundError(f'Missing canonical enemy sources: {missing}')

    OUTPUT.mkdir(parents=True, exist_ok=True)
    for name in ENEMY_FILES:
        image = Image.open(SOURCE / name).convert('RGBA')
        if name not in SOURCE_LEFT:
            image = image.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        image.save(OUTPUT / name, optimize=True)

    print(f'Normalized {len(ENEMY_FILES)} enemy PNGs to face screen-left.')


if __name__ == '__main__':
    main()
