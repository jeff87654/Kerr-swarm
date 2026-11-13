# Contact sheets from screenshots, to look at many at once:
#   python tools/sheet.py out/me/lake out/me/sheet.png [--cols 3]
# The first argument is a path prefix (every <prefix>*.png is used) or a folder.
import sys, os, glob
from PIL import Image, ImageDraw, ImageFont

src, out = sys.argv[1], sys.argv[2]
cols = int(sys.argv[sys.argv.index('--cols') + 1]) if '--cols' in sys.argv else 3
files = sorted(glob.glob(os.path.join(src, '*.png')) if os.path.isdir(src) else glob.glob(src + '*.png'))
files = [f for f in files if os.path.abspath(f) != os.path.abspath(out)]
if not files:
    print('no pictures match', src); sys.exit(1)
W = 1920 // cols
H = int(W * 9 / 16)
rows = (len(files) + cols - 1) // cols
try: font = ImageFont.truetype('arial.ttf', 15)
except Exception: font = ImageFont.load_default()
sheet = Image.new('RGB', (W * cols, (H + 20) * rows), (10, 8, 6))
d = ImageDraw.Draw(sheet)
for k, f in enumerate(files):
    im = Image.open(f).convert('RGB').resize((W, H), Image.LANCZOS)
    x, y = (k % cols) * W, (k // cols) * (H + 20)
    sheet.paste(im, (x, y + 20))
    d.text((x + 6, y + 2), os.path.splitext(os.path.basename(f))[0], fill=(240, 230, 210), font=font)
os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
sheet.save(out)
print(out, len(files), 'pictures')
