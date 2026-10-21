"""About card for the HOME page (no text): orbit rings + a travelling blue node.

Same spec as the other animated cards (HANDOFF.md §5.3-5.4):
900x600, 12 frames, 100ms, loop forever, WEBP quality 80 method 6.
Static layer: black ground, faint dot grid, four corner crosses, centre ring.
Animated layer (one): the blue node travels one orbit with a smooth periodic
motion, so the loop closes seamlessly (t = f / FRAMES).

Usage (from the project root):
    python tools/cards/gen_card_about_home.py            # writes to tools/cards/out/
    python tools/cards/gen_card_about_home.py --write    # overwrites public/assets (only after review)

Also writes the -sm variant (450x300).
"""
import math
import sys
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = Path(__file__).resolve().parent / "out"
ASSETS = ROOT / "public" / "assets"

W, H = 900, 600
BG = (10, 10, 10)
FG = (236, 238, 242)
DIM = (110, 114, 124)
FAINT = (52, 55, 62)
BLUE = (43, 91, 255)
FRAMES = 12
DURATION = 100
CX, CY = 450, 300

# three tilted orbits: (rx, ry, rotation in degrees, centre x offset)
ORBITS = [
    (272, 104, -12, -4),
    (172, 46, -4, 0),
    (276, 100, 14, 22),
]
DOTS = 180


def rot(x, y, deg):
    a = math.radians(deg)
    return x * math.cos(a) - y * math.sin(a), x * math.sin(a) + y * math.cos(a)


def orbit_point(rx, ry, deg, dx, th):
    x, y = rx * math.cos(th), ry * math.sin(th)
    x, y = rot(x, y, deg)
    return CX + dx + x, CY + y


def base(scale: float) -> Image.Image:
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im, "RGBA")
    step = 60
    for gx in range(0, W, step):
        for gy in range(0, H, step):
            d.point((gx, gy), fill=(255, 255, 255, 14))
    for cx, cy in [(24, 24), (W - 24, 24), (24, H - 24), (W - 24, H - 24)]:
        d.line([(cx - 8, cy), (cx + 8, cy)], fill=(*FAINT, 255), width=2)
        d.line([(cx, cy - 8), (cx, cy + 8)], fill=(*FAINT, 255), width=2)
    return im


def draw_frame(f: int, scale: float = 1.0) -> Image.Image:
    im = base(scale)
    d = ImageDraw.Draw(im, "RGBA")
    t = f / FRAMES

    for i, (rx, ry, deg, dx) in enumerate(ORBITS):
        for k in range(DOTS):
            th = 2 * math.pi * k / DOTS
            x, y = orbit_point(rx, ry, deg, dx, th)
            alpha = 150 if i != 1 else 110
            d.rectangle([x - 1, y - 1, x + 1, y + 1], fill=(*FG, alpha))

    # centre ring
    r = 12
    d.ellipse([CX - r, CY - r, CX + r, CY + r], outline=(*FG, 255), width=4)

    # the single moving node on the first orbit (periodic, closes at f = FRAMES)
    th = 2 * math.pi * t
    nx, ny = orbit_point(*ORBITS[0], th)
    glow = 5 + 1 * math.sin(2 * math.pi * t)
    d.rectangle([nx - glow, ny - glow, nx + glow, ny + glow], fill=(*BLUE, 255))
    return im


def render(scale: float, out: Path) -> None:
    frames = []
    for f in range(FRAMES):
        frame = draw_frame(f)
        if scale != 1.0:
            frame = frame.resize((round(W * scale), round(H * scale)), Image.LANCZOS)
        frames.append(frame.convert("RGB"))
    frames[0].save(
        out,
        save_all=True,
        append_images=frames[1:],
        duration=DURATION,
        loop=0,
        quality=80,
        method=6,
    )


def main() -> None:
    write = "--write" in sys.argv
    target = ASSETS if write else OUT_DIR
    target.mkdir(parents=True, exist_ok=True)
    render(1.0, target / "card-about-home-anim.webp")
    render(0.5, target / "card-about-home-anim-sm.webp")
    print(f"written to {target}")


if __name__ == "__main__":
    main()
