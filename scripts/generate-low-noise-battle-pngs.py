from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public" / "assets"
OUT = ASSETS / "generated" / "battle-low-noise"

HEROES = ["exiled-knight", "candle-nun", "ashblood-alchemist"]

ENEMY_IDS = [
    "rotting-villager",
    "graveyard-skeleton",
    "black-hound",
    "plague-rat-swarm",
    "crow-messenger",
    "armor-broken-militia",
    "candle-monk",
    "pointed-witch",
    "plague-doctor",
    "iron-maiden-nun",
    "fallen-paladin",
    "headless-grave-knight",
    "wax-novice",
    "cinder-acolyte",
    "bell-tower-sentry",
    "scripture-moth-swarm",
    "choir-exorcist",
    "reliquary-jailer",
    "ash-veiled-prioress",
    "pale-wax-matron",
    "hollow-spearman",
    "ashen-banneret",
    "gutter-fire-archer",
    "crownless-hound",
    "gate-iron-vicar",
    "royal-pyre-knight",
    "clockwork-confessor",
    "hollow-crown-regent",
]

ENEMY_BASE_FRAME = {
    "rotting-villager": 0,
    "graveyard-skeleton": 1,
    "black-hound": 0,
    "plague-rat-swarm": 0,
    "crow-messenger": 4,
    "armor-broken-militia": 2,
    "candle-monk": 3,
    "pointed-witch": 4,
    "plague-doctor": 4,
    "iron-maiden-nun": 3,
    "fallen-paladin": 5,
    "headless-grave-knight": 5,
    "wax-novice": 3,
    "cinder-acolyte": 3,
    "bell-tower-sentry": 2,
    "scripture-moth-swarm": 4,
    "choir-exorcist": 3,
    "reliquary-jailer": 2,
    "ash-veiled-prioress": 3,
    "pale-wax-matron": 3,
    "hollow-spearman": 2,
    "ashen-banneret": 5,
    "gutter-fire-archer": 4,
    "crownless-hound": 0,
    "gate-iron-vicar": 2,
    "royal-pyre-knight": 5,
    "clockwork-confessor": 4,
    "hollow-crown-regent": 5,
}

ENEMY_TINTS = {
    "rotting-villager": (0.88, 1.02, 0.82),
    "graveyard-skeleton": (1.10, 1.03, 0.84),
    "black-hound": (0.58, 0.58, 0.58),
    "plague-rat-swarm": (0.72, 0.86, 0.56),
    "crow-messenger": (0.58, 0.60, 0.72),
    "armor-broken-militia": (0.88, 0.80, 0.72),
    "candle-monk": (1.02, 0.88, 0.62),
    "pointed-witch": (0.80, 0.62, 1.08),
    "plague-doctor": (0.62, 0.78, 0.60),
    "iron-maiden-nun": (0.82, 0.80, 0.86),
    "fallen-paladin": (0.72, 0.66, 0.62),
    "headless-grave-knight": (0.70, 0.72, 0.76),
    "wax-novice": (1.16, 1.00, 0.74),
    "cinder-acolyte": (0.92, 0.62, 0.44),
    "bell-tower-sentry": (0.72, 0.78, 0.82),
    "scripture-moth-swarm": (1.10, 1.02, 0.74),
    "choir-exorcist": (1.08, 1.00, 0.86),
    "reliquary-jailer": (0.80, 0.66, 0.52),
    "ash-veiled-prioress": (0.88, 0.84, 0.72),
    "pale-wax-matron": (1.22, 1.10, 0.90),
    "hollow-spearman": (0.70, 0.76, 0.78),
    "ashen-banneret": (0.78, 0.70, 0.62),
    "gutter-fire-archer": (0.96, 0.64, 0.42),
    "crownless-hound": (0.52, 0.50, 0.46),
    "gate-iron-vicar": (0.68, 0.70, 0.72),
    "royal-pyre-knight": (0.92, 0.72, 0.48),
    "clockwork-confessor": (0.86, 0.74, 0.58),
    "hollow-crown-regent": (0.72, 0.66, 0.60),
}


def ensure_dirs() -> None:
    (OUT / "heroes").mkdir(parents=True, exist_ok=True)
    (OUT / "enemies").mkdir(parents=True, exist_ok=True)


def load_rgba(path: Path) -> Image.Image:
    return Image.open(path).convert("RGBA")


def crop_frame(sheet: Image.Image, index: int, count: int) -> Image.Image:
    frame_w = sheet.width / count
    left = int(round(index * frame_w))
    right = int(round((index + 1) * frame_w))
    return sheet.crop((left, 0, right, sheet.height))


def trim_alpha(img: Image.Image, margin: int = 18) -> Image.Image:
    bbox = img.getchannel("A").getbbox()
    if not bbox:
        return img
    left = max(0, bbox[0] - margin)
    top = max(0, bbox[1] - margin)
    right = min(img.width, bbox[2] + margin)
    bottom = min(img.height, bbox[3] + margin)
    return img.crop((left, top, right, bottom))


def denoise_rgba(img: Image.Image, strength: float = 0.56) -> Image.Image:
    alpha = img.getchannel("A")
    rgb = img.convert("RGB")
    smooth = rgb.filter(ImageFilter.MedianFilter(3)).filter(ImageFilter.SMOOTH)
    soft = rgb.filter(ImageFilter.GaussianBlur(0.35))
    blended = Image.blend(rgb, smooth, strength)
    blended = Image.blend(blended, soft, min(0.24, strength * 0.32))
    blended = ImageEnhance.Contrast(blended).enhance(0.94)
    blended = ImageEnhance.Sharpness(blended).enhance(0.92)
    out = blended.convert("RGBA")
    out.putalpha(alpha.filter(ImageFilter.MedianFilter(3)))
    return out


def tint_rgba(img: Image.Image, factors: tuple[float, float, float]) -> Image.Image:
    r, g, b, a = img.split()
    r = r.point(lambda v: max(0, min(255, int(v * factors[0]))))
    g = g.point(lambda v: max(0, min(255, int(v * factors[1]))))
    b = b.point(lambda v: max(0, min(255, int(v * factors[2]))))
    return Image.merge("RGBA", (r, g, b, a))


def fit_canvas(img: Image.Image, size: tuple[int, int], bottom_pad: int = 8) -> Image.Image:
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    contained = ImageOps.contain(img, (size[0] - 18, size[1] - bottom_pad - 8), Image.Resampling.LANCZOS)
    x = (size[0] - contained.width) // 2
    y = size[1] - bottom_pad - contained.height
    canvas.alpha_composite(contained, (x, max(0, y)))
    return canvas


def add_painterly_marks(img: Image.Image, seed: str, accent: tuple[int, int, int], amount: int = 11) -> Image.Image:
    rng = random.Random(seed)
    draw = ImageDraw.Draw(img, "RGBA")
    alpha = img.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        return img
    left, top, right, bottom = bbox
    for _ in range(amount):
        x = rng.randint(left, max(left, right - 8))
        y = rng.randint(top, max(top, bottom - 8))
        length = rng.randint(8, 34)
        wobble = rng.randint(-7, 7)
        width = rng.choice([1, 1, 2])
        color = (*accent, rng.randint(36, 72))
        draw.line([(x, y), (x + length, y + wobble)], fill=color, width=width)
    return img


def enemy_accent(enemy_id: str) -> tuple[int, int, int]:
    if "hound" in enemy_id:
        return (178, 70, 52)
    if "wax" in enemy_id or "candle" in enemy_id:
        return (210, 162, 80)
    if "cinder" in enemy_id or "fire" in enemy_id or "pyre" in enemy_id:
        return (210, 102, 50)
    if "crown" in enemy_id or "royal" in enemy_id:
        return (202, 164, 76)
    if "plague" in enemy_id:
        return (102, 142, 84)
    if "clockwork" in enemy_id:
        return (150, 122, 190)
    return (188, 150, 88)


def pose_transform(img: Image.Image, pose: str, enemy: bool = False) -> Image.Image:
    if pose == "attack":
        rotated = img.rotate(-5 if enemy else -4, resample=Image.Resampling.BICUBIC, expand=True)
        return ImageEnhance.Contrast(rotated).enhance(1.03)
    if pose == "hit":
        red = Image.new("RGBA", img.size, (210, 54, 46, 0))
        red.putalpha(img.getchannel("A").point(lambda v: int(v * 0.2)))
        base = Image.alpha_composite(img, red)
        return base.rotate(4 if enemy else 3, resample=Image.Resampling.BICUBIC, expand=True)
    if pose == "defend":
        blue = Image.new("RGBA", img.size, (120, 170, 190, 0))
        blue.putalpha(img.getchannel("A").point(lambda v: int(v * 0.16)))
        return Image.alpha_composite(img, blue)
    return img


def generate_heroes() -> None:
    idle_sheet = load_rgba(ASSETS / "generated" / "battle-hero-idle-sheet.png")
    action_sheets = {
        "exiled-knight": load_rgba(ASSETS / "generated" / "battle-knight-action-sheet.png"),
        "candle-nun": load_rgba(ASSETS / "generated" / "battle-nun-action-sheet.png"),
        "ashblood-alchemist": load_rgba(ASSETS / "generated" / "battle-alchemist-action-sheet.png"),
    }
    for idx, hero_id in enumerate(HEROES):
        idle = trim_alpha(crop_frame(idle_sheet, idx, 3), 24)
        idle = denoise_rgba(idle, 0.64)
        poses = {
            "idle": idle,
            "attack": crop_frame(action_sheets[hero_id], 1, 4),
            "defend": crop_frame(action_sheets[hero_id], 2, 4),
            "hit": crop_frame(action_sheets[hero_id], 3, 4),
        }
        for pose, img in poses.items():
            art = denoise_rgba(trim_alpha(img, 24), 0.64)
            art = pose_transform(art, pose)
            art = fit_canvas(art, (360, 420), 4)
            art.save(OUT / "heroes" / f"{hero_id}-{pose}.png")


def generate_enemies() -> None:
    sheets = {
        "idle": load_rgba(ASSETS / "generated" / "battle-enemy-idle-sheet.png"),
        "attack": load_rgba(ASSETS / "generated" / "battle-enemy-attack-sheet.png"),
        "hit": load_rgba(ASSETS / "generated" / "battle-enemy-hit-sheet.png"),
    }
    for enemy_id in ENEMY_IDS:
        frame_index = ENEMY_BASE_FRAME[enemy_id]
        tint = ENEMY_TINTS[enemy_id]
        for pose, sheet in sheets.items():
            source_pose = pose
            frame = trim_alpha(crop_frame(sheet, frame_index, 6), 24)
            frame = denoise_rgba(frame, 0.68)
            frame = tint_rgba(frame, tint)
            frame = add_painterly_marks(frame, f"{enemy_id}-{pose}", enemy_accent(enemy_id), amount=16 if enemy_id in {"pale-wax-matron", "hollow-crown-regent", "headless-grave-knight"} else 10)
            frame = pose_transform(frame, source_pose, enemy=True)
            size = (390, 430) if enemy_id in {"headless-grave-knight", "pale-wax-matron", "hollow-crown-regent"} else (320, 360)
            frame = fit_canvas(frame, size, 4)
            frame.save(OUT / "enemies" / f"{enemy_id}-{pose}.png")


def soften_display_png(source: Path, fallback_source: Path | None = None, strength: float = 0.42) -> None:
    if fallback_source and fallback_source.exists():
        img = load_rgba(fallback_source)
    elif source.exists():
        backup = source.with_name(f"{source.stem}-pre-low-noise{source.suffix}")
        if not backup.exists():
            source.replace(backup)
        img = load_rgba(backup)
    else:
        return
    denoise_rgba(img, strength).save(source)


def soften_scene_textures() -> None:
    generated = ASSETS / "generated"
    handpainted = ASSETS / "handpainted"
    for name in [
        "battle-hero-idle-sheet.png",
        "battle-knight-action-sheet.png",
        "battle-nun-action-sheet.png",
        "battle-alchemist-action-sheet.png",
        "battle-enemy-idle-sheet.png",
        "battle-enemy-attack-sheet.png",
        "battle-enemy-hit-sheet.png",
        "defeat-tombstone.png",
        "character-card-faces-atlas.png",
    ]:
        soften_display_png(generated / name, generated / name.replace(".png", "-source.png"), 0.50)
    for name in [
        "menu-background-journey-v2.png",
        "menu-background-journey.png",
        "menu-background.png",
        "battle-background.png",
        "map-background.png",
        "folio-background.png",
        "heroes-atlas.png",
        "alchemist-hero.png",
        "enemies-atlas.png",
        "ui-atlas.png",
        "vfx-atlas.png",
    ]:
        soften_display_png(handpainted / name, None, 0.34 if "background" in name else 0.46)


def main() -> None:
    ensure_dirs()
    generate_heroes()
    generate_enemies()
    soften_scene_textures()
    print("low-noise battle PNG assets regenerated")


if __name__ == "__main__":
    main()
