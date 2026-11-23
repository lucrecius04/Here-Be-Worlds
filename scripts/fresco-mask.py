# Maska „freska“ pro náhled obrázků k putováním: nepravidelný rozpitý okraj a odprýsknutá místa.
# Spuštění: python3 scripts/fresco-mask.py  → public/navrh-obrazku/freska-maska.png (průhlednost = maska).
import numpy as np
from PIL import Image, ImageFilter
W, H = 1680, 720  # 21 : 9

def value_noise(cells_x, seed):
    r = np.random.default_rng(seed)
    cells_y = max(2, round(cells_x * H / W))
    g = r.random((cells_y + 1, cells_x + 1)).astype(np.float32)
    img = Image.fromarray((g * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)
    return np.asarray(img, dtype=np.float32) / 255

def fractal(seed, base=3, octaves=6):
    n = np.zeros((H, W), np.float32); amp = 1; tot = 0
    for o in range(octaves):
        n += amp * value_noise(base * 2 ** o, seed + o); tot += amp; amp *= 0.55
    return n / tot

def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t)

u = np.linspace(-1, 1, W)[None, :]
v = np.linspace(-1, 1, H)[:, None]
r = (np.abs(u) ** 5.5 + np.abs(v * 1.05) ** 5.5) ** (1 / 5.5)
inside = 1 - r

big = fractal(11, base=2, octaves=2)      # velké zálivy a výběžky
big = (big + big[:, ::-1]) / 2            # souměrně: obraz zůstane uprostřed
fine = fractal(23, base=8, octaves=5)     # drobná eroze okraje
tilt = 0 * u
s = inside + 0.30 * (big - 0.5) + 0.07 * (fine - 0.5) + tilt

alpha = smooth(0.02, 0.34, s)

flake = fractal(41, base=70, octaves=3)   # odprýsknutá omítka jen u okraje
edge = 1 - smooth(0.10, 0.30, s)
alpha *= 1 - 0.25 * smooth(0.60, 0.72, flake) * edge   # jen náznak odprýsknutí

wash = fractal(57, base=5, octaves=4)     # vybledlá místa i uvnitř
alpha *= 0.94 + 0.06 * smooth(0.3, 0.7, wash)

ux = (u + 1) / 2; vy = (v + 1) / 2        # ke krajům vždy do ztracena, žádný rovný řez
alpha *= smooth(0.0, 0.07, np.minimum(ux, 1 - ux)) * smooth(0.0, 0.12, np.minimum(vy, 1 - vy))

a = Image.fromarray((np.clip(alpha, 0, 1) * 255).astype(np.uint8), 'L').filter(ImageFilter.GaussianBlur(2.0))
out = Image.new('LA', (W, H), 0)
out.putalpha(a)  # maska se čte z průhlednosti
out.save('/home/claude/here-be-worlds/public/navrh-obrazku/freska-maska.png', optimize=True)
print(out.size)
