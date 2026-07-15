import json
from pathlib import Path
import sys

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'qa' / 'source-art' / 'enemy-facing-source-v1'
LEGACY_OUTPUT = ROOT / 'public' / 'assets' / 'pixel' / 'actors' / 'sprites'
RUNTIME_OUTPUT = ROOT / 'qa' / 'source-art' / 'runtime-masters' / 'assets' / 'pixel' / 'actors' / 'sprites'

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
RUNTIME_MASTER_FILES = {
    'black-hound.png',
    'plague-rat-swarm-v2.png',
    'scripture-moth-swarm.png',
    'crownless-hound.png'
}


def output_path(name):
    root = RUNTIME_OUTPUT if name in RUNTIME_MASTER_FILES else LEGACY_OUTPUT
    return root / name


def output_contract():
    return {
        'runtimeMasters': [output_path(name).relative_to(ROOT).as_posix() for name in ENEMY_FILES if name in RUNTIME_MASTER_FILES],
        'legacyPublic': [output_path(name).relative_to(ROOT).as_posix() for name in ENEMY_FILES if name not in RUNTIME_MASTER_FILES]
    }


def main():
    missing = [name for name in ENEMY_FILES if not (SOURCE / name).exists()]
    if missing:
        raise FileNotFoundError(f'Missing canonical enemy sources: {missing}')

    LEGACY_OUTPUT.mkdir(parents=True, exist_ok=True)
    RUNTIME_OUTPUT.mkdir(parents=True, exist_ok=True)
    for name in ENEMY_FILES:
        image = Image.open(SOURCE / name).convert('RGBA')
        if name not in SOURCE_LEFT:
            image = image.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        image.save(output_path(name), optimize=True)

    print(f'Normalized {len(ENEMY_FILES)} enemy PNGs to face screen-left.')


if __name__ == '__main__':
    if '--list-outputs' in sys.argv:
        print(json.dumps(output_contract(), separators=(',', ':')))
    else:
        main()
