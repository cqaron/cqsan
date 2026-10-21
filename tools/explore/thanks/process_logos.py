"""Normalise the thanks-row logos: pure white, transparent, one shared height.

Some lockups are split (icon / wordmark), processed separately, then
reassembled so the mark and the type sit at a matched visual height.

Run:  python tools/explore/thanks/process_logos.py
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / "public" / "assets" / "thanks"
SRC = Path(r"C:\Users\CQ\.cursor\projects\q-handdrawn-portfolio-v5\assets")
PFX = "c__Users_CQ_AppData_Roaming_Cursor_User_workspaceStorage_4135934a0bb10a2351ebbce1035ef66a_images_"
H = 72  # master height; shown at ~20 CSS px

SOURCES = {
    "kimi": "Kimi_Logo_-_White_-_6042x2048_-_zonalogo.com-c312f8c7-ec77-4b53-bff5-e1a4aa86f4b7.png",
    "chatgpt": "ChatGPT_Logo_-_White_-_zonalogo.com-13e7e872-315e-4f81-a5bf-53a4cf74ea36.png",
    "github": "GitHub_Logo_-_White_-_zonalogo.com-01f0e5bb-6924-45ee-a653-82317bdf5d0e.png",
    "cursor": "Cursor_Logo_-_Light_-_zonalogo.com-2a7906ca-fa08-4fd6-b388-2dbfec7101a1.png",
    "qwen": "image-ca7cbb92-35f7-477e-b162-15bde49d7bd2.png",
    "grok": "Grok_xAI_Logo_-_White_-_zonalogo.com-65e14dea-b2bf-4635-b65c-b70ad2514ff0.png",
    "reactbits": "image-fe04d78b-51fd-4c06-845c-9a9ffbda4b6d.png",
    "aceternity": "image-b2b3b4fc-84ed-460e-8d61-457e296e0181.png",
    "tencentcloud": "image-8bcd5451-ed40-41e4-b141-f177b02b2688.png",
}

# light = keep bright pixels (white plate + white type, knock out dark marks)
# ink   = keep dark pixels  (dark plate / dark type become white; light marks become holes)
MODE = {"kimi": "light", "grok": "light"}

# split these into icon + wordmark, restyle each, then reassemble
# word_ratio: wordmark height as a fraction of the icon height
SPLIT = {
    "aceternity": {"icon": "ink", "text": "ink", "word_ratio": 0.70},
    "chatgpt":    {"icon": "light", "text": "light", "word_ratio": 0.78},
}


def to_white(img: Image.Image, mode: str | None = None) -> Image.Image:
    img = img.convert("RGBA")
    w, h = img.size
    src = img.tobytes()
    n = w * h
    alpha_bytes = bytearray(n)
    transparent = 0
    for i in range(n):
        if src[i * 4 + 3] < 250:
            transparent += 1
    cut_out = transparent / n > 0.02
    for i in range(n):
        r, g, b, a = src[i * 4], src[i * 4 + 1], src[i * 4 + 2], src[i * 4 + 3]
        if mode == "ink":
            alpha_bytes[i] = (255 - min(r, g, b)) * a // 255
        elif mode == "light":
            alpha_bytes[i] = max(r, g, b) * a // 255
        elif cut_out:
            alpha_bytes[i] = a
        else:
            alpha_bytes[i] = min(255, int((255 - min(r, g, b)) * 1.2))
    alpha = Image.frombytes("L", (w, h), bytes(alpha_bytes))
    box = alpha.getbbox()
    if not box:
        return Image.new("RGBA", (1, 1), (255, 255, 255, 0))
    alpha = alpha.crop(box)
    out = Image.new("RGBA", alpha.size, (255, 255, 255, 0))
    out.putalpha(alpha)
    return out


def col_mass(img: Image.Image) -> list[int]:
    w, h = img.size
    src = img.tobytes()
    mass = [0] * w
    for x in range(w):
        s = 0
        for y in range(h):
            i = (y * w + x) * 4
            s += src[i + 3]
        mass[x] = s
    return mass


def split_xy(img: Image.Image) -> tuple[Image.Image, Image.Image]:
    """Cut the first large empty column-gap: left = icon, right = wordmark."""
    mass = col_mass(img)
    thresh = max(mass) * 0.02
    w = img.size[0]
    # skip leading empty, then the icon, then the gap
    x = 0
    while x < w and mass[x] <= thresh:
        x += 1
    icon_l = x
    while x < w and mass[x] > thresh:
        x += 1
    icon_r = x
    while x < w and mass[x] <= thresh:
        x += 1
    text_l = x
    return img.crop((icon_l, 0, icon_r, img.size[1])), img.crop((text_l, 0, w, img.size[1]))


def fit_h(img: Image.Image, height: int) -> Image.Image:
    if img.height == height:
        return img
    w = max(1, round(img.width * height / img.height))
    return img.resize((w, height), Image.LANCZOS)


def compose(icon: Image.Image, word: Image.Image, height: int, gap: int) -> Image.Image:
    canvas = Image.new("RGBA", (icon.width + gap + word.width, height), (255, 255, 255, 0))
    canvas.alpha_composite(icon, (0, 0))
    wy = (height - word.height) // 2
    canvas.alpha_composite(word, (icon.width + gap, wy))
    return canvas


def process(name: str, src: Image.Image) -> Image.Image:
    spec = SPLIT.get(name)
    if spec:
        icon_src, word_src = split_xy(src)
        icon = to_white(icon_src, spec["icon"])
        word = to_white(word_src, spec["text"])
        icon = fit_h(icon, H)
        word = fit_h(word, max(1, round(H * spec["word_ratio"])))
        gap = max(8, round(H * 0.16))
        return compose(icon, word, H, gap)
    img = to_white(src, MODE.get(name))
    return fit_h(img, H)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, fname in SOURCES.items():
        img = process(name, Image.open(SRC / (PFX + fname)))
        dst = OUT / f"{name}.webp"
        img.save(dst, "WEBP", lossless=True)
        print(f"{name:13s} {img.size[0]}x{img.size[1]}  {dst.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
