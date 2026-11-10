# Contact sheets from a folder of screenshots: python tools/sheet.py out/play/tour out/sheets [--cols 3] [--match day-]
import sys, os, glob
from PIL import Image, ImageDraw, ImageFont

src, out = sys.argv[1], sys.argv[2]
cols = int(sys.argv[sys.argv.index('--cols') + 1]) if '--cols' in sys.argv else 3
match = sys.argv[sys.argv.index('--match') + 1] if '--match' in sys.argv else ''
files = sorted(f for f in glob.glob(os.path.join(src, '*.png')) if match in os.path.basename(f))
os.makedirs(out, exist_ok=True)
W, H = 1536 // cols, int(1536 // cols * 9 / 16)
per = cols * cols
try: font = ImageFont.truetype('arial.ttf', 15)
except Exception: font = ImageFont.load_default()
for i in range(0, len(files), per):
    sheet = Image.new('RGB', (W * cols, (H + 20) * cols), (10, 8, 6))
    d = ImageDraw.Draw(sheet)
    for k, f in enumerate(files[i:i + per]):
        im = Image.open(f).convert('RGB').resize((W, H), Image.LANCZOS)
        x, y = (k % cols) * W, (k // cols) * (H + 20)
        sheet.paste(im, (x, y + 20))
        d.text((x + 6, y + 2), os.path.splitext(os.path.basename(f))[0], fill=(240, 230, 210), font=font)
    name = os.path.join(out, (match or 'sheet-') + '%02d.png' % (i // per + 1))
    sheet.save(name)
    print(name)
