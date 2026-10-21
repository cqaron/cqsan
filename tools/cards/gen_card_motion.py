# Animated cards, HANDOFF §5.3–5.4 / gen_card_anim.py pattern.
# Each poster is redrawn from the same static layout as gen_posters.py, then ONE
# iconic element moves on a smooth sine loop (|offset| <= ~20px at 1500 wide).
# 12 frames, 110ms, loop forever. Writes 900x600 (full) and 600x400 (carousel).
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public' / 'assets'
FONTS = ROOT / 'public' / 'fonts'
W, H = 1500, 1000
BG = (10, 10, 10)
FG = (236, 238, 242)
DIM = (110, 114, 124)
FAINT = (52, 55, 62)
BLUE = (43, 91, 255)
FRAMES = 12

_fonts = {}


def font(size, bold=False):
    key = (size, bold)
    if key not in _fonts:
        name = 'JetBrainsMono-Bold.ttf' if bold else 'JetBrainsMono-Regular.ttf'
        _fonts[key] = ImageFont.truetype(str(FONTS / name), size)
    return _fonts[key]


def sin1(t, phase=0.0):
    return math.sin(2 * math.pi * t + phase)


def base():
    im = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(im, 'RGBA')
    for x in range(0, W, 60):
        d.line([(x, 0), (x, H)], fill=(255, 255, 255, 5))
    for y in range(0, H, 60):
        d.line([(0, y), (W, y)], fill=(255, 255, 255, 5))
    for cx, cy in [(40, 40), (W - 40, 40), (40, H - 40), (W - 40, H - 40)]:
        d.line([(cx - 10, cy), (cx + 10, cy)], fill=(*FAINT, 255), width=2)
        d.line([(cx, cy - 10), (cx, cy + 10)], fill=(*FAINT, 255), width=2)
    return im, d


def text(d, xy, s, size, fill=FG, bold=False, anchor='la', alpha=255):
    d.text(xy, s, font=font(size, bold), fill=(*fill, alpha), anchor=anchor)


def hatch(d, x0, y0, x1, y1, alpha=26, step=22):
    f = font(18)
    for y in range(int(y0), int(y1), step):
        for x in range(int(x0), int(x1), step):
            d.text((x, y), '·', font=f, fill=(*FG, alpha), anchor='mm')


def frame(d, label, title_lines, foot=None):
    text(d, (70, 76), label, 28, DIM, True)
    y = H - 100 - (len(title_lines) - 1) * 76
    for line in title_lines:
        text(d, (96, y), line, 58, FG, True)
        y += 76
    if foot:
        text(d, (W - 70, H - 78), foot, 24, DIM, anchor='ra')


def breathe(t, base_a=20, amp=8, phase=0.0):
    return int(base_a + amp * sin1(t, phase))


# ---------------------------------------------------------------- product
def s_landing(d, t):
    x0, y0, x1, y1 = 340, 190, 1160, 660
    d.rounded_rectangle([x0, y0, x1, y1], radius=16, outline=(*FG, 230), width=5)
    d.line([(x0, y0 + 54), (x1, y0 + 54)], fill=(*FAINT, 255), width=3)
    for k in range(3):
        d.ellipse([x0 + 26 + k * 28, y0 + 20, x0 + 40 + k * 28, y0 + 34], fill=(*FAINT, 255))
    d.rectangle([x0 + 40, y0 + 90, x1 - 40, y0 + 220], outline=(*FAINT, 255), width=3)
    for i, w in enumerate([420, 520, 380]):
        d.line([(x0 + 40, y0 + 270 + i * 34), (x0 + 40 + w, y0 + 270 + i * 34)], fill=(*FAINT, 255), width=9)
    # the CTA button is the iconic element: it gently rises and falls
    dy = 14 * sin1(t)
    d.rounded_rectangle([x0 + 40, y0 + 390 + dy, x0 + 260, y0 + 446 + dy], radius=28, fill=(*BLUE, 255))
    text(d, (x0 + 150, y0 + 419 + dy), 'DOWNLOAD', 22, (255, 255, 255), True, anchor='mm')
    hatch(d, 640, 500, 1140, 640, alpha=breathe(t, 26, 8))
    frame(d, 'PRODUCT', ['LANDING REDESIGN'], 'bounce 41% → 30%')


# ---------------------------------------------------------------- data
def s_retail(d, t):
    bars = [(1400, 'view  1,404,179', FG), (640, 'cart    32,934', FG), (300, 'buy      9,952', BLUE)]
    y = 240
    edges = []
    for i, (wpx, label, col) in enumerate(bars):
        # each bar drifts sideways with a phase offset: the funnel "breathes"
        dx = 12 * sin1(t, i * 0.9)
        x0 = (W - wpx) / 2 + dx
        d.rectangle([x0, y, x0 + wpx, y + 96], outline=(*col, 235), width=4)
        text(d, (W / 2 + dx, y + 48), label, 30, col, True, anchor='mm')
        hatch(d, x0 + 8, y + 8, x0 + wpx - 8, y + 88, alpha=20)
        edges.append(x0 + wpx)
        y += 150
    text(d, (edges[1] + 24, 363), '2.35%', 26, DIM, True, anchor='lm')
    text(d, (edges[2] + 24, 513), '30.22%', 26, BLUE, True, anchor='lm')
    frame(d, 'DATA', ['RETAILROCKET', 'GROWTH'], '2,756,101 events')


# ---------------------------------------------------------------- ai
def s_n8n(d, t):
    nodes = [('cron', 300, 380), ('fetch', 560, 380), ('check', 820, 380), ('LLM', 1080, 380), ('report', 940, 600)]
    for i in range(3):
        x = 300 + i * 260
        d.line([(x + 80, 380), (x + 180, 380)], fill=(*FAINT, 255), width=4)
        d.polygon([(x + 172, 372), (x + 172, 388), (x + 188, 380)], fill=(*FAINT, 255))
    d.line([(1080, 430), (1080, 520), (940, 520), (940, 560)], fill=(*FAINT, 255), width=4)
    for lb, x, y in nodes:
        col = BLUE if lb == 'LLM' else FG
        d.rounded_rectangle([x - 80, y - 40, x + 80, y + 40], radius=14, outline=(*col, 255), width=4)
        text(d, (x, y), lb, 24, col, True, anchor='mm')
    # iconic element: a data packet travels cron -> fetch -> check -> LLM -> report and loops
    path = [(300, 380), (560, 380), (820, 380), (1080, 380), (1080, 520), (940, 520), (940, 600)]
    seg = [math.dist(path[i], path[i + 1]) for i in range(len(path) - 1)]
    total = sum(seg)
    s = (t % 1.0) * total
    for i, L in enumerate(seg):
        if s <= L or i == len(seg) - 1:
            f = min(1.0, s / L) if L else 0
            px = path[i][0] + (path[i + 1][0] - path[i][0]) * f
            py = path[i][1] + (path[i + 1][1] - path[i][1]) * f
            break
        s -= L
    d.ellipse([px - 11, py - 11, px + 11, py + 11], fill=(*BLUE, 255))
    hatch(d, 260, 660, 1240, 760, alpha=breathe(t, 26, 6, 1.0))
    frame(d, 'AI · N8N', ['SITE AUDIT', 'WORKFLOW'], '10 langs · 80 pages weekly')


def s_skills(d, t):
    cx, cy, R = W // 2 + 40, H // 2 - 30, 320
    rot = math.radians(14 * sin1(t))  # the globe turns gently back and forth
    codes = [('DE', 42, -0.55), ('ES', 18, 0.75), ('ID', -6, -0.85), ('NL', -30, 0.35), ('PT', -52, -0.4), ('RU', 30, 0.05)]
    f_code = font(24, True)
    for lat in range(-78, 90, 12):
        r = R * math.cos(math.radians(lat))
        y = cy - R * math.sin(math.radians(lat))
        n = max(8, int(2 * math.pi * r / 34))
        for k in range(n):
            lon = 2 * math.pi * k / n + rot
            x = cx + r * math.sin(lon)
            z = math.cos(lon)
            a = int(60 + 165 * max(0.0, z))
            rr = 2.4 + 2.0 * max(0.0, z)
            d.ellipse([x - rr, y - rr, x + rr, y + rr], fill=(*FG, a))
    for c, lat, lon in codes:
        r = R * math.cos(math.radians(lat))
        x = cx + r * math.sin(lon + rot)
        y = cy - R * math.sin(math.radians(lat))
        col = BLUE if c in ('DE', 'PT') else FG
        d.text((x, y), c, font=f_code, fill=(*col, 255), anchor='mm')
    bbox = [cx - R - 100, cy - 78, cx + R + 100, cy + 78]
    d.arc(bbox, 0, 360, fill=(*FAINT, 255), width=2)
    ang = math.radians(-24)
    sx, sy = cx + (R + 100) * math.cos(ang), cy + 78 * math.sin(ang)
    d.rectangle([sx - 9, sy - 9, sx + 9, sy + 9], fill=(*BLUE, 255))
    frame(d, 'AI', ['LOCALIZATION', 'SKILLS'], '// one link in — six languages out')


def s_agent(d, t):
    x0, y0, x1, y1 = 180, 140, W - 180, H - 330
    d.rounded_rectangle([x0, y0, x1, y1], radius=18, outline=(*FAINT, 255), width=3)
    for k in range(3):
        c = BLUE if k == 2 else (90, 92, 100)
        d.ellipse([x0 + 28 + k * 30, y0 + 22, x0 + 42 + k * 30, y0 + 36], fill=(*c, 255))
    d.line([(x0, y0 + 56), (x1, y0 + 56)], fill=(*FAINT, 255), width=2)
    rows = ['task_07  modify_item', 'task_12  refund_order', 'task_19  exchange_item',
            'task_26  cancel_order', 'task_33  confirm_total']
    f_row = font(30)
    for i, name in enumerate(rows):
        y = y0 + 100 + i * 56
        d.text((x0 + 44, y), name, font=f_row, fill=(*FG, 220), anchor='lm')
        d.text((x0 + 44 + 470, y), '.' * 18, font=f_row, fill=(*FAINT, 255), anchor='lm')
        d.text((x1 - 44, y), '✓ PASS', font=font(30, True), fill=(*BLUE, 255), anchor='rm')
    text(d, (180, H - 216), '95.5%', 66, DIM, True)
    text(d, (560, H - 216), '→', 66, FAINT, True)
    # iconic element: the 100% result settles up and down
    text(d, (760, H - 224 + 10 * sin1(t)), '100%', 88, FG, True)
    text(d, (1120, H - 196), 'task pass rate', 24, DIM)
    frame(d, 'AI', ['AGENT EVALUATION'])


# ---------------------------------------------------------------- content
def s_content(d, t):
    text(d, (110, 170), 'CONTENT', 148, FG, True)
    f_ops = font(148, True)
    for dx in range(-2, 3):
        for dy in range(-2, 3):
            if dx * dx + dy * dy >= 2:
                d.text((110 + dx, 340 + dy), 'OPS', font=f_ops, fill=(*FG, 200))
    d.text((110, 340), 'OPS', font=f_ops, fill=(*BG, 255))
    for dx in range(-2, 3):
        for dy in range(-2, 3):
            if dx * dx + dy * dy >= 2:
                d.text((110 + dx, 340 + dy), 'OPS', font=f_ops, fill=(*FG, 200))
    # iconic element: the play triangle bobs
    tx, ty, ts = W - 360, 320 + 14 * sin1(t), 110
    d.polygon([(tx, ty - ts), (tx, ty + ts), (tx + ts * 1.6, ty)], outline=(*BLUE, 255), width=6)
    y = 640
    for wfrac, tag in [(0.62, 'EN'), (0.48, 'ES'), (0.55, 'ZH')]:
        d.rectangle([110, y, 110 + int(W * wfrac * 0.55), y + 14], fill=(*FAINT, 255))
        d.rectangle([110, y + 30, 110 + int(W * wfrac * 0.38), y + 44], fill=(70, 73, 82, 255))
        text(d, (W - 160, y + 20), f'[{tag}]', 30, BLUE if tag == 'ES' else DIM, True, anchor='rm')
        y += 110
    frame(d, 'CONTENT', [], '// published in EN · ES · ZH')


# ---------------------------------------------------------------- articles
def s_messaging(d, t):
    # grey bubble stays; the blue reply bubble floats
    d.rounded_rectangle([880, 210, 1280, 430], radius=40, outline=(*FG, 220), width=5)
    d.polygon([(940, 428), (940, 500), (1010, 430)], outline=(*FG, 220), width=5)
    for i in range(3):
        d.line([(930, 280 + i * 40), (1170 - i * 60, 280 + i * 40)], fill=(*FAINT, 255), width=8)
    dy = 14 * sin1(t, 0.6)
    d.rounded_rectangle([1020, 380 + dy, 1360, 560 + dy], radius=40, outline=(*BLUE, 255), width=5)
    d.polygon([(1300, 558 + dy), (1300, 630 + dy), (1230, 560 + dy)], outline=(*BLUE, 255), width=5)
    for i in range(2):
        d.line([(1070, 440 + i * 40 + dy), (1280 - i * 50, 440 + i * 40 + dy)], fill=(*BLUE, 140), width=8)
    frame(d, 'CONTENT · EN', ['MESSAGING APPS', 'AS WORKSPACES'], 'Programming Insider')
    text(d, (W - 70, 84), '[EN]', 26, BLUE, True, anchor='ra')


def s_interface(d, t):
    text(d, (900, 180), 'Aa', 200, FG, True)
    # iconic element: the two slider knobs glide along their tracks
    d.line([(880, 520), (1360, 520)], fill=(*FAINT, 255), width=6)
    d.line([(880, 590), (1360, 590)], fill=(*FAINT, 255), width=6)
    k1 = 1120 + 60 * sin1(t)
    k2 = 1080 + 70 * sin1(t, 2.0)
    d.ellipse([k1 - 16, 520 - 16, k1 + 16, 520 + 16], fill=(*FG, 255))
    d.ellipse([k2 - 16, 590 - 16, k2 + 16, 590 + 16], fill=(*BLUE, 255))
    frame(d, 'CONTENT · EN', ['SMALL INTERFACE', 'CHOICES MATTER'], 'FontMirror')
    text(d, (W - 70, 84), '[EN]', 26, BLUE, True, anchor='ra')


def s_offline(d, t):
    cx, cy, r = 1120, 400, 170
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(*FG, 220), width=5)
    d.arc([cx - r - 46, cy - r - 46, cx + r + 46, cy + r + 46], 200, 340, fill=(*FAINT, 255), width=3)
    dy = 18 * sin1(t)
    # iconic element: the download arrow bobs, as in link-download
    d.line([(cx, cy - 90 + dy), (cx, cy + 60 + dy)], fill=(*BLUE, 255), width=14)
    d.polygon([(cx - 44, cy + 20 + dy), (cx + 44, cy + 20 + dy), (cx, cy + 92 + dy)], fill=(*BLUE, 255))
    d.line([(cx - 70, cy + 120), (cx + 70, cy + 120)], fill=(*FG, 220), width=10)
    frame(d, 'CONTENT · ES', ['WHY OFFLINE ACCESS', 'STILL MATTERS'], 'TYN Magazine')
    text(d, (W - 70, 84), '[ES]', 26, BLUE, True, anchor='ra')


def s_coze(d, t):
    labels = ['PROMPT', 'IMAGE', 'VIDEO']
    xs = [830, 1080, 1330]
    for i, (x, lb) in enumerate(zip(xs, labels)):
        col = BLUE if i == 1 else FG
        dy = 10 * sin1(t) if i == 1 else 0  # the IMAGE step pulses
        d.rounded_rectangle([x - 95, 330 + dy, x + 95, 430 + dy], radius=16, outline=(*col, 255), width=4)
        d.text((x, 380 + dy), lb, font=font(24, True), fill=(*col, 255), anchor='mm')
        if i < 2:
            d.line([(x + 95, 380), (x + 155, 380)], fill=(*FAINT, 255), width=4)
            d.polygon([(x + 155, 372), (x + 155, 388), (x + 171, 380)], fill=(*FAINT, 255))
    d.line([(830, 520), (1330, 520)], fill=(*FAINT, 255), width=3)
    for x in xs:
        d.line([(x, 430), (x, 520)], fill=(*FAINT, 255), width=3)
    # a packet flows along the pipeline and loops
    px = 830 + 500 * (t % 1.0)
    d.ellipse([px - 9, 511, px + 9, 529], fill=(*BLUE, 255))
    frame(d, 'CONTENT · ZH', ['SHORT-VIDEO', 'PIPELINE'], 'WeChat Official Account')
    text(d, (W - 70, 84), '[ZH]', 26, BLUE, True, anchor='ra')


def s_policy(d, t):
    x0, y0, x1, y1 = 950, 180, 1300, 600
    d.rectangle([x0, y0, x1, y1], outline=(*FG, 220), width=5)
    d.polygon([(x1 - 70, y0), (x1, y0 + 70), (x1 - 70, y0 + 70)], outline=(*FG, 220), width=4)
    for i in range(6):
        w = 220 if i % 3 == 2 else 270
        d.line([(x0 + 36, y0 + 130 + i * 56), (x0 + 36 + w, y0 + 130 + i * 56)], fill=(*FAINT, 255), width=9)
    # iconic element: the magnifier drifts over the document in a small loop
    mx, my, mr = 1230 + 16 * math.cos(2 * math.pi * t), 500 + 16 * math.sin(2 * math.pi * t), 90
    d.ellipse([mx - mr, my - mr, mx + mr, my + mr], outline=(*BLUE, 255), width=7)
    d.line([(mx + mr - 20, my + mr - 20), (mx + mr + 66, my + mr + 66)], fill=(*BLUE, 255), width=10)
    frame(d, 'CONTENT · ZH', ['AI POLICY', 'TEARDOWN ×10'], 'WeChat Official Account')
    text(d, (W - 70, 84), '[ZH]', 26, BLUE, True, anchor='ra')


SCENES = {
    'landing': s_landing,
    'retail': s_retail,
    'n8n': s_n8n,
    'skills': s_skills,
    'agent': s_agent,
    'content': s_content,
    'messaging': s_messaging,
    'interface': s_interface,
    'offline': s_offline,
    'coze': s_coze,
    'policy': s_policy,
}


def render(scene, t):
    im, d = base()
    scene(d, t)
    return im


def build(cid, scene):
    frames = [render(scene, f / FRAMES) for f in range(FRAMES)]
    full = [f.resize((900, 600), Image.LANCZOS) for f in frames]
    small = [f.resize((600, 400), Image.LANCZOS) for f in frames]
    p_full = OUT / f'card-{cid}-anim.webp'
    p_small = OUT / f'card-{cid}-anim-sm.webp'
    full[0].save(p_full, save_all=True, append_images=full[1:], duration=110, loop=0, quality=80, method=6)
    small[0].save(p_small, save_all=True, append_images=small[1:], duration=110, loop=0, quality=80, method=6)
    return p_full.stat().st_size, p_small.stat().st_size


if __name__ == '__main__':
    for cid, scene in SCENES.items():
        a, b = build(cid, scene)
        print(f'{cid}: full {a/1024:.0f} KB, small {b/1024:.0f} KB')
