# Masky pro náhled obrázků k putováním v tmavém motivu: u kreseb na krémovém papíře vytvoří masku
# podle tuše (nepravidelný tvar skvrny), aby papír kolem nevystupoval jako pravidelný obdélník.
# Obrázky bez papírového okraje (tmavé grafiky) masku nedostanou a použijí obecnou fresku.
# Spuštění: python3 scripts/ink-masks.py  → public/navrh-obrazku/maska/<obrázek>.png
import glob, os
import numpy as np
from PIL import Image, ImageFilter

import sys
# bez argumentů: všechny zkušební obrázky; s argumenty: zadané soubory (maska do maska/ vedle nich)
files = sys.argv[1:]
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
    alpha = smooth(0.25, 0.85, s) ** 1.6  # dlouhý pozvolný přechod, okraj se ztrácí uvnitř tuše
    u = np.linspace(0, 1, w)[None, :]; v = np.linspace(0, 1, h)[:, None]
    alpha *= smooth(0, 0.12, np.minimum(u, 1 - u)) * smooth(0, 0.16, np.minimum(v, 1 - v))
    m = Image.fromarray((alpha * 255).astype(np.uint8), 'L').filter(ImageFilter.GaussianBlur(w / 50))
    o = Image.new('LA', (w, h), 0); o.putalpha(m)
    name = os.path.basename(f).replace('.jpg', '.png')
    o.save(os.path.join(out, name), optimize=True)
    made.append(name)
print(len(made), made)
