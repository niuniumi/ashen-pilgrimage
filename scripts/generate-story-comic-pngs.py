from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "assets" / "generated" / "story-comic"
OUT.mkdir(parents=True, exist_ok=True)

W, H = 860, 320

SOURCES = [
    ("menu-background-journey-v2.png", "圣火守城", "Eldermark 曾由圣火庇护。"),
    ("battle-background.png", "灰雾逼近", "钟声之后，灰雾越过旧城墙。"),
    ("map-background.png", "余烬启程", "三名行者沿手稿地图踏上旅途。"),
]


def cover_crop(image: Image.Image, width: int, height: int, x_bias: float = 0.5, y_bias: float = 0.5) -> Image.Image:
    image = image.convert("RGB")
    src_w, src_h = image.size
    scale = max(width / src_w, height / src_h)
    resized = image.resize((int(src_w * scale), int(src_h * scale)), Image.Resampling.LANCZOS)
    left = int((resized.width - width) * x_bias)
    top = int((resized.height - height) * y_bias)
    return resized.crop((left, top, left + width, top + height))


def font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        Path("C:/Windows/Fonts/msyh.ttc"),
        Path("C:/Windows/Fonts/simkai.ttf"),
        Path("C:/Windows/Fonts/simsun.ttc"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


def parchment_base() -> Image.Image:
    base = Image.new("RGB", (W, H), (235, 215, 176))
    draw = ImageDraw.Draw(base, "RGBA")
    for y in range(H):
        tone = int(20 * (y / H))
        draw.line((0, y, W, y), fill=(255 - tone, 238 - tone, 196 - tone, 180))
    for i in range(42):
        x = (i * 67 + 29) % W
        y = (i * 43 + 17) % H
        draw.ellipse((x - 46, y - 18, x + 68, y + 35), fill=(112, 78, 42, 12))
    return base


def inkify(source: Image.Image) -> Image.Image:
    gray = ImageOps.grayscale(source)
    gray = ImageEnhance.Contrast(gray).enhance(1.12)
    gray = gray.filter(ImageFilter.SMOOTH_MORE).filter(ImageFilter.MedianFilter(5))
    contour = gray.filter(ImageFilter.CONTOUR)
    contour = ImageEnhance.Contrast(contour).enhance(1.42)
    ink = ImageOps.invert(contour)
    ink = ImageOps.autocontrast(ink, cutoff=9)
    ink_alpha = ImageOps.invert(ink).point(lambda value: 0 if value < 62 else min(145, int(value * 0.92)))
    ink_alpha = ink_alpha.filter(ImageFilter.MedianFilter(3)).filter(ImageFilter.GaussianBlur(0.25))
    sepia = Image.new("RGBA", (W, H), (86, 67, 42, 0))
    sepia.putalpha(ink_alpha.filter(ImageFilter.GaussianBlur(0.35)))
    return sepia


def soft_wash(source: Image.Image) -> Image.Image:
    wash = source.convert("RGB").filter(ImageFilter.GaussianBlur(0.9))
    wash = ImageOps.grayscale(wash)
    wash = ImageOps.colorize(wash, black="#4d382a", white="#f9e4ba")
    wash = ImageEnhance.Color(wash).enhance(0.62)
    wash = ImageEnhance.Contrast(wash).enhance(0.96)
    wash = ImageEnhance.Brightness(wash).enhance(1.0)
    wash.putalpha(188)
    return wash.convert("RGBA")


def add_hand_frame(draw: ImageDraw.ImageDraw) -> None:
    ink = (107, 78, 45, 135)
    gold = (181, 137, 55, 95)
    draw.line((26, 27, 826, 22), fill=ink, width=2)
    draw.line((30, 292, 824, 286), fill=ink, width=2)
    draw.line((49, 54, 802, 42, 786, 267, 61, 278, 49, 54), fill=gold, width=2)
    draw.line((64, 71, 783, 60, 770, 251, 82, 261, 64, 71), fill=(122, 92, 54, 60), width=1)
    for x, y in [(57, 55), (793, 45), (71, 269), (774, 258)]:
        draw.line((x - 13, y, x + 13, y), fill=gold, width=2)
        draw.line((x, y - 13, x, y + 13), fill=gold, width=2)


def add_story_accents(draw: ImageDraw.ImageDraw, index: int) -> None:
    gold = (181, 137, 55, 70)
    ink = (93, 69, 50, 45)
    if index == 1:
        for y in (112, 146, 182):
            draw.arc((98, y, 810, y + 74), 185, 355, fill=ink, width=3)
    if index == 2:
        draw.line((128, 214, 240, 186, 388, 210, 520, 178, 714, 204), fill=gold, width=2)
        for x, y in [(240, 186), (388, 210), (520, 178)]:
            draw.line((x - 9, y, x + 9, y), fill=gold, width=2)
            draw.line((x, y - 9, x, y + 9), fill=gold, width=2)


def create_panel(source_name: str, title: str, caption: str, index: int) -> None:
    source_path = ROOT / "public" / "assets" / "handpainted" / source_name
    source = Image.open(source_path)
    bias = [(0.47, 0.48), (0.5, 0.52), (0.5, 0.48)][index]
    crop = cover_crop(source, W, H, *bias)
    panel = parchment_base().convert("RGBA")
    panel.alpha_composite(soft_wash(crop))
    draw = ImageDraw.Draw(panel, "RGBA")
    add_hand_frame(draw)
    add_story_accents(draw, index)
    draw.text((72, 238), title, font=font(26), fill=(91, 63, 35, 235), stroke_width=1, stroke_fill=(248, 231, 190, 170))
    draw.text((72, 273), caption, font=font(17), fill=(108, 82, 51, 210))
    panel = panel.filter(ImageFilter.UnsharpMask(radius=0.7, percent=82, threshold=4))
    panel.save(OUT / f"prologue-page-{index + 1}.png", optimize=True)


for idx, item in enumerate(SOURCES):
    create_panel(*item, idx)

print("story comic PNGs regenerated")
