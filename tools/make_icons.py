"""Render app icons + splash sources. Usage: python tools/make_icons.py

Writes:
  www/icon-*.png        PWA icons
  assets/*.png          sources for `npx capacitor-assets generate` (native icons + splash screens)
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
WWW = ROOT / "www"
ASSETS = ROOT / "assets"
BG = "#0b0d17"
S = 1024  # supersampled canvas


def draw_mark(size, bg=BG, scale=1.0):
    """The Loopback mark: cyan loop, two faint echoes, white player orb."""
    im = Image.new("RGBA", (size, size), bg if bg else (0, 0, 0, 0))
    k = size / S * scale
    c = size / 2

    def box(cx, cy, r):
        return [c + (cx - S / 2) * k - r * k, c + (cy - S / 2) * k - r * k,
                c + (cx - S / 2) * k + r * k, c + (cy - S / 2) * k + r * k]

    d = ImageDraw.Draw(im)
    d.arc(box(S / 2, S / 2, 300), start=-60, end=-60 + 290, fill="#5ef2ff", width=max(1, int(56 * k)))
    for (x, y, col) in [(352, 392, (255, 122, 217, 140)), (660, 636, (255, 176, 94, 140))]:
        layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        ImageDraw.Draw(layer).ellipse(box(x, y, 68), fill=col)
        im = Image.alpha_composite(im, layer)
    d = ImageDraw.Draw(im)
    d.ellipse(box(S / 2, S / 2, 92), fill="#e8ecff")
    d.ellipse(box(S / 2, S / 2, 40), fill="#5ef2ff")
    return im


# PWA icons (full-bleed so they also work as maskable).
base = draw_mark(S).convert("RGB")
for size in (180, 192, 512, 1024):
    base.resize((size, size), Image.LANCZOS).save(WWW / f"icon-{size}.png")

# Capacitor assets sources.
ASSETS.mkdir(exist_ok=True)
draw_mark(1024).convert("RGB").save(ASSETS / "icon-only.png")
# Android adaptive icon: foreground must sit inside the safe zone (~66%), background is a flat color.
draw_mark(1024, bg=None, scale=0.62).save(ASSETS / "icon-foreground.png")
Image.new("RGB", (1024, 1024), BG).save(ASSETS / "icon-background.png")
# Splash: small centred mark on the game background.
splash = Image.new("RGB", (2732, 2732), BG)
mark = draw_mark(700, bg=None)
splash.paste(mark, ((2732 - 700) // 2, (2732 - 700) // 2), mark)
splash.save(ASSETS / "splash.png")
splash.save(ASSETS / "splash-dark.png")
print("icons written to", WWW, "and", ASSETS)
