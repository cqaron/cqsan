# Animated pilot for the link-download card — same layout as card-link.jpg,
# the blue arrow bobs gently and the hatch breathes. 12 frames, loops forever.
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

S = 0.6                       # 900x600 canvas
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
    # address bar
    x0, y0, x1, y1 = sc(300), sc(300), sc(1200), sc(392)
    d.rounded_rectangle([x0, y0, x1, y1], radius=sc(46), outline=(*FG, 230), width=3)
    d.ellipse([x0 + sc(34), y0 + sc(34), x0 + sc(58), y0 + sc(58)], outline=(*FAINT, 255), width=3)
    d.text((x0 + sc(92), y0 + sc(44)), 't.me/channel/12345', font=font(int(34 * S)), fill=(*FG, 255))
    # tray line
    d.line([(sc(600), sc(730)), (sc(900), sc(730))], fill=(*FG, 230), width=int(sc(12)))
    # frame text
    d.text((sc(70), sc(76)), 'PRODUCT', font=font(int(28 * S), True), fill=(*DIM, 255))
    d.text((sc(96), sc(1000 - 100 - 76)), 'LINK DOWNLOAD', font=font(int(58 * S), True), fill=(*FG, 255))
    d.text((sc(1500 - 70), sc(1000 - 82)), '// paste — parse — download', font=font(int(24 * S)), fill=(*DIM, 255), anchor='ra')
    return im

def draw_frame(f):
    im = draw_base()
    d = ImageDraw.Draw(im, 'RGBA')
    t = f / FRAMES
    bob = math.sin(t * 2 * math.pi) * sc(16)
    ax, ay = sc(750), sc(520) + bob
    # hatch, breathing alpha
    alpha = int(20 + 10 * math.sin(t * 2 * math.pi + 1.2))
    fh = font(int(18 * S))
    for y in range(int(sc(660)), int(sc(780)), int(sc(22))):
        for x in range(int(sc(320)), int(sc(1180)), int(sc(22))):
            d.text((x, y), '·', font=fh, fill=(*FG, alpha), anchor='mm')
    # arrow
    d.line([(ax, ay - sc(60)), (ax, ay + sc(110))], fill=(*BLUE, 255), width=int(sc(18)))
    d.polygon([(ax - sc(58), ay + sc(46)), (ax + sc(58), ay + sc(46)), (ax, ay + sc(150))], fill=(*BLUE, 255))
    return im

frames = [draw_frame(f) for f in range(FRAMES)]
frames[0].save(
    str(Path(__file__).resolve().parents[2] / 'public' / 'assets' / 'card-link-anim.webp'),
    save_all=True, append_images=frames[1:], duration=110, loop=0, quality=82, method=6,
)
print('frames:', FRAMES)
