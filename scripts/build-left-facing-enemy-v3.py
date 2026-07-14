from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'qa' / 'source-art' / 'generated-enemies-v3'
OUTPUT = ROOT / 'public' / 'assets' / 'pixel' / 'actors' / 'sprites'

BATCHES = {
    'batch-01-alpha.png': {
        'rotting-villager': (35, 95, 455, 780),
        'grave-skeleton': (410, 70, 925, 785),
        'armor-broken-militia': (845, 75, 1335, 785),
        'candle-monk': (1270, 70, 1765, 790),
    },
    'batch-02-alpha.png': {
        'pointed-witch': (15, 55, 500, 790),
        'plague-doctor': (430, 65, 950, 790),
        'iron-maiden-nun': (870, 40, 1280, 790),
        'fallen-paladin': (1170, 65, 1760, 795),
    },
    'batch-03-alpha.png': {
        'headless-grave-knight': (15, 35, 620, 800),
        'wax-novice': (540, 45, 980, 800),
        'cinder-acolyte': (900, 35, 1370, 800),
        'bell-tower-sentry': (1280, 40, 1765, 800),
    },
    'batch-04-alpha.png': {
        'reliquary-jailer': (390, 55, 885, 800),
        'ash-veiled-prioress': (820, 40, 1260, 800),
        'pale-wax-matron': (1160, 30, 1770, 815),
    },
    'batch-05-alpha.png': {
        'hollow-spearman': (0, 35, 520, 810),
        'ashen-banneret': (390, 25, 930, 810),
        'gutter-fire-archer': (835, 80, 1370, 810),
        'gate-iron-vicar': (1260, 75, 1770, 810),
    },
    'batch-06-alpha.png': {
        'clockwork-confessor': (420, 60, 970, 805),
        'hollow-crown-regent': (835, 25, 1430, 810),
        'crow-messenger': (1320, 360, 1770, 815),
    },
    'batch-corrections-alpha.png': {
        'choir-exorcist': (20, 40, 850, 815),
        'royal-pyre-knight': (730, 35, 1765, 820),
    },
}


def keep_largest_component(image):
    rgba = image.convert('RGBA')
    alpha = rgba.getchannel('A')
    visible = {(x, y) for y in range(rgba.height) for x in range(rgba.width) if alpha.getpixel((x, y)) > 24}
    components = []
    while visible:
        seed = visible.pop()
        component = {seed}
        frontier = [seed]
        while frontier:
            x, y = frontier.pop()
            for ny in range(max(0, y - 1), min(rgba.height, y + 2)):
                for nx in range(max(0, x - 1), min(rgba.width, x + 2)):
                    point = (nx, ny)
                    if point in visible:
                        visible.remove(point)
                        component.add(point)
                        frontier.append(point)
        components.append(component)
    if not components:
        raise ValueError('Asset crop contains no visible pixels')
    keep = max(components, key=len)
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            if (x, y) not in keep:
                red, green, blue, _ = pixels[x, y]
                pixels[x, y] = (red, green, blue, 0)
    return rgba


def trim_and_pad(image, padding=12):
    alpha = image.getchannel('A')
    bbox = alpha.getbbox()
    if not bbox:
        raise ValueError('Asset crop contains no visible pixels')
    cropped = image.crop(bbox)
    padded = Image.new('RGBA', (cropped.width + padding * 2, cropped.height + padding * 2), (0, 0, 0, 0))
    padded.alpha_composite(cropped, (padding, padding))
    return padded


def save_sprite(source, name, box):
    sprite = trim_and_pad(keep_largest_component(source.crop(box)))
    if sprite.height > 700:
        width = round(sprite.width * 700 / sprite.height)
        sprite = sprite.resize((width, 700), Image.Resampling.NEAREST)
    sprite.save(OUTPUT / f'{name}-v3.png', optimize=True)


def main():
    missing = [file for file in BATCHES if not (SOURCE / file).exists()]
    if missing:
        raise FileNotFoundError(f'Missing generated enemy sheets: {missing}')
    OUTPUT.mkdir(parents=True, exist_ok=True)
    count = 0
    for file, sprites in BATCHES.items():
        source = Image.open(SOURCE / file).convert('RGBA')
        for name, box in sprites.items():
            save_sprite(source, name, box)
            count += 1
    print(f'Built {count} explicit left-facing enemy PNGs.')


if __name__ == '__main__':
    main()
