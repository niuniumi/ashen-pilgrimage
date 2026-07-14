from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = ROOT / 'qa' / 'source-art' / 'curated-actors'
CONTACT = SOURCE_ROOT / 'generated-actor-contact.png'
CROW = SOURCE_ROOT / 'smithy-crow-cc0.png'
PLAYABLES = SOURCE_ROOT / 'generated-playable-lineup-v3-alpha.png'
RATS = SOURCE_ROOT / 'generated-plague-rats-v2-alpha.png'
ATLAS = ROOT / 'public' / 'assets' / 'pixel' / 'actors' / 'gothic-enemies-atlas-v2.png'
LEGACY_NUN = ROOT / 'public' / 'assets' / 'pixel' / 'actors' / 'sprites' / 'candle-nun.png'
OUTPUT = ROOT / 'public' / 'assets' / 'pixel' / 'actors' / 'sprites'


def remove_green(image):
    rgba = image.convert('RGBA')
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            red, green, blue, alpha = pixels[x, y]
            key_strength = green - max(red, blue)
            if green > 130 and key_strength > 45:
                matte = max(0, min(255, int((95 - key_strength) * 5.1)))
                alpha = min(alpha, matte)
                green = min(green, max(red, blue) + 14)
            pixels[x, y] = (red, green, blue, alpha)
    return rgba


def trim_and_pad(image, padding=8):
    alpha = image.getchannel('A')
    bbox = alpha.getbbox()
    if not bbox:
        raise ValueError('Asset crop contains no visible pixels')
    cropped = image.crop(bbox)
    padded = Image.new('RGBA', (cropped.width + padding * 2, cropped.height + padding * 2), (0, 0, 0, 0))
    padded.alpha_composite(cropped, (padding, padding))
    return padded


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
        return rgba
    keep = max(components, key=len)
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            if (x, y) not in keep:
                red, green, blue, _ = pixels[x, y]
                pixels[x, y] = (red, green, blue, 0)
    return rgba


def save_contact_crop(name, box, padding=8):
    source = Image.open(CONTACT)
    image = trim_and_pad(keep_largest_component(remove_green(source.crop(box))), padding)
    image.save(OUTPUT / f'{name}.png', optimize=True)


def save_atlas_frame(name, frame_index):
    source = Image.open(ATLAS).convert('RGBA')
    frame_width = source.width // 4
    frame_height = source.height // 4
    column = frame_index % 4
    row = frame_index // 4
    frame = source.crop((column * frame_width, row * frame_height, (column + 1) * frame_width, (row + 1) * frame_height))
    trim_and_pad(frame, 8).save(OUTPUT / f'{name}.png', optimize=True)


def save_existing_sprite(source_path, name, crop_left=0):
    image = Image.open(source_path).convert('RGBA')
    if crop_left:
        image = image.crop((crop_left, 0, image.width, image.height))
    trim_and_pad(image, 8).save(OUTPUT / f'{name}.png', optimize=True)


def save_crow():
    source = Image.open(CROW).convert('RGBA')
    frame = source.crop((0, 0, 48, 48))
    trim_and_pad(frame, 4).save(OUTPUT / 'crow-messenger.png', optimize=True)


def save_playable(name, box):
    source = Image.open(PLAYABLES).convert('RGBA')
    frame = keep_largest_component(source.crop(box))
    sprite = trim_and_pad(frame, 12)
    if sprite.height > 660:
        width = round(sprite.width * 660 / sprite.height)
        sprite = sprite.resize((width, 660), Image.Resampling.NEAREST)
    sprite.save(OUTPUT / f'{name}-v3.png', optimize=True)


def save_rat_swarm():
    source = Image.open(RATS).convert('RGBA')
    sprite = trim_and_pad(source, 12)
    if sprite.width > 900:
        height = round(sprite.height * 900 / sprite.width)
        sprite = sprite.resize((900, height), Image.Resampling.NEAREST)
    sprite.save(OUTPUT / 'plague-rat-swarm-v2.png', optimize=True)


def main():
    missing = [path for path in (CONTACT, CROW, PLAYABLES, RATS, ATLAS, LEGACY_NUN) if not path.exists()]
    if missing:
        raise FileNotFoundError(f'Missing source assets: {missing}')
    OUTPUT.mkdir(parents=True, exist_ok=True)

    crops = {
        'candle-nun-v2': (459, 289, 554, 438),
        'rotting-villager': (18, 43, 90, 151),
        'armor-broken-militia': (142, 24, 210, 166),
        'fallen-paladin': (364, 18, 430, 168),
        'wax-novice': (205, 18, 273, 168),
        'cinder-acolyte': (635, 15, 701, 178),
        'bell-tower-sentry': (450, 18, 522, 178),
        'choir-exorcist': (704, 24, 771, 170),
        'hollow-spearman': (522, 32, 583, 170),
        'ashen-banneret': (756, 28, 818, 170),
        'gate-iron-vicar': (584, 28, 647, 170),
        'royal-pyre-knight': (16, 540, 108, 731),
        'clockwork-confessor': (307, 18, 374, 170)
    }
    for name, box in crops.items():
        save_contact_crop(name, box)

    playable_crops = {
        'exiled-knight': (8, 42, 720, 842),
        'candle-nun': (688, 42, 1142, 842),
        'ashblood-alchemist': (1174, 42, 1748, 842)
    }
    for name, box in playable_crops.items():
        save_playable(name, box)

    save_crow()
    save_rat_swarm()
    save_existing_sprite(LEGACY_NUN, 'ash-veiled-prioress', crop_left=16)
    save_atlas_frame('crownless-hound', 12)


if __name__ == '__main__':
    main()
