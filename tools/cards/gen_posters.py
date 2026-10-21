# Unified card posters for the portfolio — near-black bg, JetBrains Mono,
# Klein blue accent, ASCII/dot-matrix flavour. NO baked-in index numbers.
import math, random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

W, H = 1500, 1000
BG = (10, 10, 10)
FG = (236, 238, 242)
DIM = (110, 114, 124)
FAINT = (52, 55, 62)
BLUE = (43, 91, 255)
OUT = str(Path(__file__).resolve().parents[2] / 'public' / 'assets')

def font(size, bold=False):
    return ImageFont.truetype(str(Path(__file__).resolve().parents[2] / 'public' / 'fonts' / f'JetBrainsMono-{"Bold" if bold else "Regular"}.ttf'), size)

def base(seed=7):
    random.seed(seed)
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

def ascii_hatch(d, x0, y0, x1, y1, ch='·', step=22, alpha=26):
    """faint ascii texture fill inside a rect"""
    f = font(18)
    for y in range(int(y0), int(y1), step):
        for x in range(int(x0), int(x1), step):
            d.text((x, y), ch, font=f, fill=(*FG, alpha), anchor='mm')

def frame(d, label, title_lines, foot=None):
    text(d, (70, 76), label, 28, DIM, True)
    y = H - 100 - (len(title_lines) - 1) * 76
    for line in title_lines:
        text(d, (96, y), line, 58, FG, True)
        y += 76
    if foot:
        text(d, (W - 70, H - 78), foot, 24, DIM, anchor='ra')

# ---------------------------------------------------------------- product
def card_link():
    im, d = base(3)
    # address bar with mono url
    x0, y0, x1, y1 = 300, 300, 1200, 392
    d.rounded_rectangle([x0, y0, x1, y1], radius=46, outline=(*FG, 230), width=5)
    d.ellipse([x0 + 34, y0 + 34, x0 + 58, y0 + 58], outline=(*FAINT, 255), width=4)
    text(d, (x0 + 92, y0 + 47), 't.me/channel/12345', 34, FG)
    # download arrow (blue) into tray
    ax, ay = 750, 520
    d.line([(ax, ay - 60), (ax, ay + 110)], fill=(*BLUE, 255), width=18)
    d.polygon([(ax - 58, ay + 46), (ax + 58, ay + 46), (ax, ay + 150)], fill=(*BLUE, 255))
    d.line([(ax - 150, ay + 210), (ax + 150, ay + 210)], fill=(*FG, 230), width=12)
    ascii_hatch(d, 320, 660, 1180, 780)
    frame(d, 'PRODUCT', ['LINK DOWNLOAD'], '// paste — parse — download')
    im.save(f'{OUT}/card-link.jpg', quality=90)

def card_landing():
    im, d = base(5)
    x0, y0, x1, y1 = 340, 190, 1160, 660
    d.rounded_rectangle([x0, y0, x1, y1], radius=16, outline=(*FG, 230), width=5)
    d.line([(x0, y0 + 54), (x1, y0 + 54)], fill=(*FAINT, 255), width=3)
    for k in range(3):
        d.ellipse([x0 + 26 + k * 28, y0 + 20, x0 + 40 + k * 28, y0 + 34], fill=(*FAINT, 255))
    # hero block + copy lines + blue CTA
    d.rectangle([x0 + 40, y0 + 90, x1 - 40, y0 + 220], outline=(*FAINT, 255), width=3)
    for i, w in enumerate([420, 520, 380]):
        d.line([(x0 + 40, y0 + 270 + i * 34), (x0 + 40 + w, y0 + 270 + i * 34)], fill=(*FAINT, 255), width=9)
    d.rounded_rectangle([x0 + 40, y0 + 390, x0 + 260, y0 + 446], radius=28, fill=(*BLUE, 255))
    text(d, (x0 + 150, y0 + 419), 'DOWNLOAD', 22, (255, 255, 255), True, anchor='mm')
    ascii_hatch(d, 640, 500, 1140, 640)
    frame(d, 'PRODUCT', ['LANDING REDESIGN'], 'bounce 41% → 30%')
    im.save(f'{OUT}/card-landing.jpg', quality=90)

# ---------------------------------------------------------------- data
def card_retail():
    im, d = base(9)
    bars = [(1400, 'view  1,404,179', FG), (640, 'cart    32,934', FG), (300, 'buy      9,952', BLUE)]
    y = 240
    edges = []
    for wpx, label, col in bars:
        x0 = (W - wpx) / 2
        d.rectangle([x0, y, x0 + wpx, y + 96], outline=(*col, 235), width=4)
        text(d, (W / 2, y + 48), label, 30, col, True, anchor='mm')
        ascii_hatch(d, x0 + 8, y + 8, x0 + wpx - 8, y + 88, alpha=20)
        edges.append(x0 + wpx)
        y += 150
    text(d, (edges[1] + 24, 363), '2.35%', 26, DIM, True, anchor='lm')
    text(d, (edges[2] + 24, 513), '30.22%', 26, BLUE, True, anchor='lm')
    frame(d, 'DATA', ['RETAILROCKET', 'GROWTH'], '2,756,101 events')
    im.save(f'{OUT}/card-retail.jpg', quality=90)

# ---------------------------------------------------------------- ai
def card_n8n():
    im, d = base(13)
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
    ascii_hatch(d, 260, 660, 1240, 760)
    frame(d, 'AI · N8N', ['SITE AUDIT', 'WORKFLOW'], '10 langs · 80 pages weekly')
    im.save(f'{OUT}/card-n8n.jpg', quality=90)

def card_skills():
    im, d = base(11)
    cx, cy, R = W // 2 + 40, H // 2 - 30, 320
    codes = ['DE', 'ES', 'ID', 'NL', 'PT', 'RU']
    code_pos = {}
    for c, (lat, lon) in zip(codes, [(42, -0.55), (18, 0.75), (-6, -0.85), (-30, 0.35), (-52, -0.4), (30, 0.05)]):
        r = R * math.cos(math.radians(lat))
        n = max(8, int(2 * math.pi * r / 34))
        k = round(n * lon / (2 * math.pi))
        code_pos[(int(cx + r * math.sin(2 * math.pi * k / n)), int(cy - R * math.sin(math.radians(lat))))] = c
    f_code = font(24, True)
    for lat in range(-78, 90, 12):
        r = R * math.cos(math.radians(lat))
        y = cy - R * math.sin(math.radians(lat))
        n = max(8, int(2 * math.pi * r / 34))
        for k in range(n):
            lon = 2 * math.pi * k / n
            x = cx + r * math.sin(lon)
            z = math.cos(lon)
            a = int(60 + 165 * max(0.0, z))
            key = (int(x), int(y))
            if key in code_pos:
                c = code_pos[key]
                col = BLUE if c in ('DE', 'PT') else FG
                d.text((x, y), c, font=f_code, fill=(*col, 255), anchor='mm')
            else:
                rr = 2.4 + 2.0 * max(0.0, z)
                d.ellipse([x - rr, y - rr, x + rr, y + rr], fill=(*FG, a))
    bbox = [cx - R - 100, cy - 78, cx + R + 100, cy + 78]
    d.arc(bbox, 0, 360, fill=(*FAINT, 255), width=2)
    ang = math.radians(-24)
    sx, sy = cx + (R + 100) * math.cos(ang), cy + 78 * math.sin(ang)
    d.rectangle([sx - 9, sy - 9, sx + 9, sy + 9], fill=(*BLUE, 255))
    frame(d, 'AI', ['LOCALIZATION', 'SKILLS'], '// one link in — six languages out')
    im.save(f'{OUT}/card-skills.jpg', quality=90)

def card_agent():
    im, d = base(23)
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
    text(d, (760, H - 224), '100%', 88, FG, True)
    text(d, (1120, H - 196), 'task pass rate', 24, DIM)
    frame(d, 'AI', ['AGENT EVALUATION'])
    im.save(f'{OUT}/card-agent.jpg', quality=90)

# ---------------------------------------------------------------- content
def card_content():
    im, d = base(31)
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
    tx, ty, ts = W - 360, 320, 110
    d.polygon([(tx, ty - ts), (tx, ty + ts), (tx + ts * 1.6, ty)], outline=(*BLUE, 255), width=6)
    y = 640
    for wfrac, tag in [(0.62, 'EN'), (0.48, 'ES'), (0.55, 'ZH')]:
        d.rectangle([110, y, 110 + int(W * wfrac * 0.55), y + 14], fill=(*FAINT, 255))
        d.rectangle([110, y + 30, 110 + int(W * wfrac * 0.38), y + 44], fill=(70, 73, 82, 255))
        text(d, (W - 160, y + 20), f'[{tag}]', 30, BLUE if tag == 'ES' else DIM, True, anchor='rm')
        y += 110
    frame(d, 'CONTENT', [], '// published in EN · ES · ZH')
    im.save(f'{OUT}/card-content.jpg', quality=90)

# ------------------------------------------------- article series
def article(fname, label, title_lines, tag, pub, motif):
    im, d = base(40 + len(fname))
    motif(d)
    frame(d, label, title_lines, pub)
    text(d, (W - 70, 84), f'[{tag}]', 26, BLUE, True, anchor='ra')
    im.save(f'{OUT}/{fname}', quality=90)

def m_bubbles(d):
    d.rounded_rectangle([880, 210, 1280, 430], radius=40, outline=(*FG, 220), width=5)
    d.polygon([(940, 428), (940, 500), (1010, 430)], outline=(*FG, 220), width=5)
    d.rounded_rectangle([1020, 380, 1360, 560], radius=40, outline=(*BLUE, 255), width=5)
    d.polygon([(1300, 558), (1300, 630), (1230, 560)], outline=(*BLUE, 255), width=5)
    for i in range(3):
        d.line([(930, 280 + i * 40), (1170 - i * 60, 280 + i * 40)], fill=(*FAINT, 255), width=8)
    for i in range(2):
        d.line([(1070, 440 + i * 40), (1280 - i * 50, 440 + i * 40)], fill=(*BLUE, 140), width=8)

def m_interface(d):
    text(d, (900, 180), 'Aa', 200, FG, True)
    for y, knob, col in [(520, 1180, FG), (590, 1010, BLUE)]:
        d.line([(880, y), (1360, y)], fill=(*FAINT, 255), width=6)
        d.ellipse([knob - 16, y - 16, knob + 16, y + 16], fill=(*col, 255))

def m_offline(d):
    cx, cy, r = 1120, 400, 170
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(*FG, 220), width=5)
    d.arc([cx - r - 46, cy - r - 46, cx + r + 46, cy + r + 46], 200, 340, fill=(*FAINT, 255), width=3)
    d.line([(cx, cy - 90), (cx, cy + 60)], fill=(*BLUE, 255), width=14)
    d.polygon([(cx - 44, cy + 20), (cx + 44, cy + 20), (cx, cy + 92)], fill=(*BLUE, 255))
    d.line([(cx - 70, cy + 120), (cx + 70, cy + 120)], fill=(*FG, 220), width=10)

def m_pipeline(d):
    labels = ['PROMPT', 'IMAGE', 'VIDEO']
    xs = [830, 1080, 1330]
    for i, (x, lb) in enumerate(zip(xs, labels)):
        col = BLUE if i == 1 else FG
        d.rounded_rectangle([x - 95, 330, x + 95, 430], radius=16, outline=(*col, 255), width=4)
        d.text((x, 380), lb, font=font(24, True), fill=(*col, 255), anchor='mm')
        if i < 2:
            d.line([(x + 95, 380), (x + 155, 380)], fill=(*FAINT, 255), width=4)
            d.polygon([(x + 155, 372), (x + 155, 388), (x + 171, 380)], fill=(*FAINT, 255))
    d.line([(830, 520), (1330, 520)], fill=(*FAINT, 255), width=3)
    for x in xs:
        d.line([(x, 430), (x, 520)], fill=(*FAINT, 255), width=3)
    d.rectangle([1072, 512, 1088, 528], fill=(*BLUE, 255))

def m_policy(d):
    x0, y0, x1, y1 = 950, 180, 1300, 600
    d.rectangle([x0, y0, x1, y1], outline=(*FG, 220), width=5)
    d.polygon([(x1 - 70, y0), (x1, y0 + 70), (x1 - 70, y0 + 70)], outline=(*FG, 220), width=4)
    for i in range(6):
        w = 220 if i % 3 == 2 else 270
        d.line([(x0 + 36, y0 + 130 + i * 56), (x0 + 36 + w, y0 + 130 + i * 56)], fill=(*FAINT, 255), width=9)
    mx, my, mr = 1230, 500, 90
    d.ellipse([mx - mr, my - mr, mx + mr, my + mr], outline=(*BLUE, 255), width=7)
    d.line([(mx + mr - 20, my + mr - 20), (mx + mr + 66, my + mr + 66)], fill=(*BLUE, 255), width=10)

card_link(); card_landing(); card_retail(); card_n8n()
card_skills(); card_agent(); card_content()
article('card-messaging.jpg', 'CONTENT · EN', ['MESSAGING APPS', 'AS WORKSPACES'], 'EN', 'Programming Insider', m_bubbles)
article('card-interface.jpg', 'CONTENT · EN', ['SMALL INTERFACE', 'CHOICES MATTER'], 'EN', 'FontMirror', m_interface)
article('card-offline.jpg', 'CONTENT · ES', ['WHY OFFLINE ACCESS', 'STILL MATTERS'], 'ES', 'TYN Magazine', m_offline)
article('card-coze.jpg', 'CONTENT · ZH', ['SHORT-VIDEO', 'PIPELINE'], 'ZH', 'WeChat Official Account', m_pipeline)
article('card-policy.jpg', 'CONTENT · ZH', ['AI POLICY', 'TEARDOWN ×10'], 'ZH', 'WeChat Official Account', m_policy)

files = ['card-link.jpg', 'card-landing.jpg', 'card-retail.jpg', 'card-n8n.jpg',
         'card-skills.jpg', 'card-agent.jpg', 'card-content.jpg',
         'card-messaging.jpg', 'card-interface.jpg', 'card-offline.jpg',
         'card-coze.jpg', 'card-policy.jpg']
sheet = Image.new('RGB', (W, H * len(files)), BG)
for i, f in enumerate(files):
    sheet.paste(Image.open(f'{OUT}/{f}'), (0, i * H))
sheet.thumbnail((560, 9999))
sheet.save('preview/posters.jpg', quality=80)
print('done')
