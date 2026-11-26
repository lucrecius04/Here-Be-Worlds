# Mírné zesvětlení tmavého obrázku k putování: zvedne jen světlost (LAB L ** 0.8), barva zůstane,
# papír a nejtmavší tahy se skoro nehnou. Silnější zesvětlení (0.68) majitel zamítl: černá ztrácí sílu.
# Spuštění: python3 scripts/lighten-trail-image.py vstup.jpg výstup.jpg [gama, výchozí 0.8]
# Potom znovu masky (scripts/ink-masks.py) a karta pro sdílení (npm run og -- <slug> putovani).
import sys
import cv2
import numpy as np

g = float(sys.argv[3]) if len(sys.argv) > 3 else 0.8
lab = cv2.cvtColor(cv2.imread(sys.argv[1]), cv2.COLOR_BGR2LAB).astype(float)
L = lab[..., 0] / 255
Ln = L ** g
out = lab.copy()
out[..., 0] = Ln * 255
# kde se zesvětlí, trochu ubrat sytost, aby obrázek nezmodral
f = np.clip(1 - 0.35 * (Ln - L) / np.maximum(1 - L, 1e-3), 0.6, 1)
for c in (1, 2):
    out[..., c] = 128 + (lab[..., c] - 128) * f
cv2.imwrite(sys.argv[2], cv2.cvtColor(out.clip(0, 255).astype(np.uint8), cv2.COLOR_LAB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 95])
