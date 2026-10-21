# About card — same spec as the work cards (gen_card_anim.py):
# black poster, JetBrains Mono only, the five-colour palette, corner crosshairs,
# 900x600, 12 frames x 110ms, looping WEBP. One animated layer: a typed line
# with a klein-blue block cursor (character-jump style, allowed by HANDOFF 5.5).
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

S = 0.6
W, H = int(1500 * S), int(1000 * S)
BG = (10, 10, 10)
FG = (236, 238, 242)
DIM = (110, 114, 124)
FAINT = (52, 55, 62)
BLUE = (43, 91, 255)
FRAMES = 12

def font(size, bold=False):
    return ImageFont.truetype(str(Path(__file__).resolve().parents[2] / 'public' / 'fonts' / f'JetBrainsMono-{"Bold" if bold else "Regular"}.ttf'), size)

def sc(v):
    return v * S

def draw_base():
    im = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(im, 'RGBA')
    for x in range(0, W, int(60 * S)):
        d.line([(x, 0), (x, H)], fill=(255, 255, 255, 5))
    for y in range(0, H, int(60 * S)):
        d.line([(0, y), (W, y)], fill=(255, 255, 255, 5))
    for cx, cy in [(40, 40), (1500 - 40, 40), (40, 1000 - 40), (1500 - 40, 1000 - 40)]:
        cx, cy = sc(cx), sc(cy)
        d.line([(cx - sc(10), cy), (cx + sc(10), cy)], fill=(*FAINT, 255), width=2)
        d.line([(cx, cy - sc(10)), (cx, cy + sc(10))], fill=(*FAINT, 255), width=2)
    d.text((sc(70), sc(76)), 'ABOUT', font=font(int(28 * S), True), fill=(*DIM, 255))
    d.text((sc(96), sc(1000 - 100 - 76)), 'QUINCY', font=font(int(58 * S), True), fill=(*FG, 255))
    d.text((sc(1500 - 70), sc(1000 - 82)), '// reaching everywhere', font=font(int(24 * S)), fill=(*DIM, 255), anchor='ra')
    return im

TYPED = '> hello.'
TYPE_FRAMES = 6  # characters land one by one over the first half of the loop

def draw_frame(f):
    im = draw_base()
    d = ImageDraw.Draw(im, 'RGBA')
    t = f / FRAMES
    # typing: reveal one more character every frame until fully typed, then hold
    n = min(len(TYPED), round(len(TYPED) * min(1.0, f / TYPE_FRAMES)))
    fb = font(int(64 * S), True)
    x, y = sc(300), sc(430)
    d.text((x, y), TYPED[:n], font=fb, fill=(*FG, 255))
    # blue block cursor: a square-wave-ish blink (sine threshold), always after the text
    cursor_on = math.sin(t * 2 * math.pi) > -0.2
    if cursor_on:
        advance = d.textlength(TYPED[:n], font=fb)
        cw = sc(30)
        ch = sc(58)
        cx0 = x + advance + sc(6)
        d.rectangle([cx0, y + sc(6), cx0 + cw, y + sc(6) + ch], fill=(*BLUE, 255))
    return im

frames = [draw_frame(f) for f in range(FRAMES)]
frames[0].save(
    str(Path(__file__).resolve().parents[2] / 'public' / 'assets' / 'card-about-anim.webp'),
    save_all=True, append_images=frames[1:], duration=110, loop=0, quality=82, method=6,
)
print('frames:', FRAMES)
