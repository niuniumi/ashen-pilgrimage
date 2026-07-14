from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'qa' / 'source-art' / 'defeat-tombstone-source.png'
OUTPUT = ROOT / 'public' / 'assets' / 'pixel' / 'ui' / 'defeat-tombstone.png'


def remove_green_screen(image):
    rgba = image.convert('RGBA')
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            red, green, blue, alpha = pixels[x, y]
            key_strength = green - max(red, blue)
            if green > 105 and key_strength > 28:
                edge_alpha = max(0, min(255, int((72 - key_strength) * 5.8)))
                alpha = min(alpha, edge_alpha)
            if alpha > 0 and green > max(red, blue) + 8:
                green = max(red, blue) + 8
            pixels[x, y] = (red, green, blue, alpha)
    return rgba


def main():
    if not SOURCE.exists():
        raise FileNotFoundError(SOURCE)
    image = remove_green_screen(Image.open(SOURCE))
    bbox = image.getchannel('A').getbbox()
    if not bbox:
        raise ValueError('Tombstone source became fully transparent')
    image = image.crop(bbox)
    image.thumbnail((384, 384), Image.Resampling.LANCZOS)
    image = image.quantize(colors=96, method=Image.Quantize.FASTOCTREE).convert('RGBA')
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    image.save(OUTPUT, optimize=True)


if __name__ == '__main__':
    main()
