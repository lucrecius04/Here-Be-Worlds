# Masky pro náhled obrázků k putováním v tmavém motivu: u kreseb na krémovém papíře vytvoří masku
# podle tuše (nepravidelný tvar skvrny), aby papír kolem nevystupoval jako pravidelný obdélník.
# Obrázky bez papírového okraje (tmavé grafiky) masku nedostanou a použijí obecnou fresku.
# Spuštění: python3 scripts/ink-masks.py  → public/navrh-obrazku/maska/<obrázek>.png
import glob, os
import numpy as np
from PIL import Image, ImageFilter

import sys
# bez argumentů: všechny zkušební obrázky; s argumenty: zadané soubory (maska do maska/ vedle nich)
# --fill: vyplní světlá místa uvnitř kresby (morfologické uzavření), když je papír součástí motivu
# (mezera mezi konci mostu u mesto-ktere-dycha-2), jinak by v tmavém motivu zmizel střed obrázku
FILL = '--fill' in sys.argv
files = [a for a in sys.argv[1:] if a != '--fill']
src = 'public/navrh-obrazku'
out = os.path.join(src, 'maska')
os.makedirs(out, exist_ok=True)

def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t)

made = []
for f in (files or sorted(glob.glob(os.path.join(src, '[0-9]*.jpg')))):
    out = os.path.join(os.path.dirname(f), 'maska'); os.makedirs(out, exist_ok=True)
    im = Image.open(f).convert('L')
    w, h = im.size
    a = np.asarray(im, np.float32) / 255
    b = max(4, w // 40)
    border = np.concatenate([a[:b].ravel(), a[-b:].ravel(), a[:, :b].ravel(), a[:, -b:].ravel()])
    paper = np.percentile(border, 60)
    if paper < 0.78 or (border > paper - 0.08).mean() < 0.6:
        continue  # bez papírového okraje
    ink = np.clip((paper - a) / 0.22, 0, 1)
    k = Image.fromarray((ink * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(w / 60))
    s = np.asarray(k, np.float32) / 255
    if FILL:
        from scipy import ndimage
        q = 8; small = s[::q, ::q]
        r = max(3, int(small.shape[1] * 0.14))
        yy, xx = np.ogrid[-r:r + 1, -r:r + 1]; disk = xx * xx + yy * yy <= r * r
        closed = ndimage.grey_closing(small, footprint=disk)
        big = np.asarray(Image.fromarray((closed * 255).astype(np.uint8)).resize((w, h), Image.BILINEAR), np.float32) / 255
        # jen uprostřed obrázku: vnější zálivy u okrajů zůstanou průhledné (jinak svatozář papíru v tmavém motivu)
        uu = np.linspace(-1, 1, w)[None, :]; vv = np.linspace(-1, 1, h)[:, None]
        win = smooth(1.0, 0.55, np.sqrt((uu / 0.42) ** 2 + ((vv + 0.1) / 0.5) ** 2))
        s = np.maximum(s, big * win)
    alpha = smooth(0.12, 0.7, s) ** 1.3  # dlouhý pozvolný přechod, okraj se ztrácí uvnitř tuše
    u = np.linspace(0, 1, w)[None, :]; v = np.linspace(0, 1, h)[:, None]
    alpha *= smooth(0, 0.06, np.minimum(u, 1 - u)) * smooth(0, 0.07, np.minimum(v, 1 - v))
    m = Image.fromarray((alpha * 255).astype(np.uint8), 'L').filter(ImageFilter.GaussianBlur(w / 70))
    o = Image.new('LA', (w, h), 0); o.putalpha(m)
    name = os.path.basename(f).replace('.jpg', '.png')
    o.save(os.path.join(out, name), optimize=True)
    made.append(name)
print(len(made), made)
