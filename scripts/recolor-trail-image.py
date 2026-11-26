# Přebarvení obrázku k putování, který ujel do modra: tónová mapa podle schválených obrázků.
# Každý pixel dostane barvu, jakou mají schválené obrázky v průměru při stejné světlosti
# (kresba a světlost zůstanou, změní se jen tón tuše a papíru).
# Spuštění: python3 scripts/recolor-trail-image.py vstup.jpg výstup.jpg
import sys
import numpy as np
from PIL import Image

REFS = ['prace-ktera-nikdy-nekonci-1', 'jmeno-jako-klic-i-kletba-1', 'jmeno-jako-klic-i-kletba-3',
        'logo-nad-troskami-1', 'smich-nad-propasti-1', 'nakaza-s-vlastni-vuli-2']
W = np.array([0.299, 0.587, 0.114])

S = np.zeros((256, 3)); N = np.zeros(256)
for r in REFS:
    a = np.asarray(Image.open(f'public/putovani-obrazky/{r}.jpg').convert('RGB')).astype(float)
    L = np.clip((a @ W).round().astype(int), 0, 255).ravel()
    np.add.at(S, L, a.reshape(-1, 3)); np.add.at(N, L, 1)
lut = np.zeros((256, 3)); idx = np.where(N > 50)[0]
for c in range(3):
    lut[:, c] = np.interp(np.arange(256), idx, S[idx, c] / N[idx])
    lut[:, c] = np.convolve(np.pad(lut[:, c], 4, mode='edge'), np.ones(9) / 9, 'valid')

src = np.asarray(Image.open(sys.argv[1]).convert('RGB')).astype(float)
out = lut[np.clip((src @ W).round().astype(int), 0, 255)]
Image.fromarray(out.clip(0, 255).astype(np.uint8)).save(sys.argv[2], quality=95)
