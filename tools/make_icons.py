"""Render PNG app icons (mirrors www/icon.svg). Usage: python tools/make_icons.py"""
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "www"
S = 1024  # supersampled canvas


def draw():
    im = Image.new("RGBA", (S, S), "#0b0d17")  # full-bleed so it works as maskable
    d = ImageDraw.Draw(im)
    c = S // 2
    r = 300
    d.arc([c - r, c - r, c + r, c + r], start=-60, end=-60 + 290, fill="#5ef2ff", width=56)
    for (x, y, col) in [(352, 392, (255, 122, 217, 140)), (660, 636, (255, 176, 94, 140))]:
        layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        ImageDraw.Draw(layer).ellipse([x - 68, y - 68, x + 68, y + 68], fill=col)
        im = Image.alpha_composite(im, layer)
    d = ImageDraw.Draw(im)
    d.ellipse([c - 92, c - 92, c + 92, c + 92], fill="#e8ecff")
    d.ellipse([c - 40, c - 40, c + 40, c + 40], fill="#5ef2ff")
    return im.convert("RGB")


base = draw()
for size in (180, 192, 512, 1024):
    base.resize((size, size), Image.LANCZOS).save(OUT / f"icon-{size}.png")
print("icons written to", OUT)
