"""Phone mockups (transparent PNG) of the app screens, for the PowerPoint.
python3 deck/scripts/phones.py  ->  deck/export/phones/<name>.png
"""
import pathlib, subprocess
from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'export' / 'phones'
OUT.mkdir(parents=True, exist_ok=True)
SCREENS = ROOT / 'public' / 'screens'
VIDEO = ROOT / 'public' / 'video'

def rounded(size, r):
    m = Image.new('L', size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], r, fill=255)
    return m

def phone(screen: Image.Image, name: str):
    sw, sh = 780, 1688
    screen = screen.convert('RGB').resize((sw, sh))
    edge, bezel = 14, 26
    W, H = sw + 2 * (edge + bezel), sh + 2 * (edge + bezel)
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    # Titanium edge: a horizontal metallic gradient.
    metal = Image.new('RGBA', (W, H))
    stops = [(0, (119, 117, 111)), (0.03, (217, 214, 207)), (0.09, (161, 158, 151)), (0.5, (138, 135, 128)), (0.91, (161, 158, 151)), (0.97, (217, 214, 207)), (1, (119, 117, 111))]
    px = metal.load()
    for x in range(W):
        t = x / (W - 1)
        for (a, ca), (b, cb) in zip(stops, stops[1:]):
            if a <= t <= b:
                k = (t - a) / (b - a)
                c = tuple(round(ca[i] + (cb[i] - ca[i]) * k) for i in range(3))
                break
        for y in range(H):
            px[x, y] = (*c, 255)
    img.paste(metal, (0, 0), rounded((W, H), 150))
    black = Image.new('RGBA', (W - 2 * edge, H - 2 * edge), (11, 11, 11, 255))
    img.paste(black, (edge, edge), rounded(black.size, 138))
    img.paste(screen, (edge + bezel, edge + bezel), rounded((sw, sh), 112))
    d = ImageDraw.Draw(img)
    cx = W // 2
    d.rounded_rectangle([cx - 125, edge + bezel + 22, cx + 125, edge + bezel + 96], 37, fill=(0, 0, 0, 255))
    img.save(OUT / f'{name}.png', optimize=True)
    print(name, img.size)

for f in sorted(SCREENS.glob('*.jpg')):
    phone(Image.open(f), f.stem)
# Stills from the screen recordings.
for name, t in [('browse', '0.3'), ('trial', '5.0')]:
    still = OUT / f'_{name}.jpg'
    subprocess.run(['npx', '--prefix', str(ROOT.parent / 'promo'), 'remotion', 'ffmpeg', '-y', '-ss', t, '-i', str(VIDEO / f'{name}.mp4'), '-frames:v', '1', str(still)], check=True, capture_output=True)
    phone(Image.open(still), f'rec-{name}')
    still.unlink()
