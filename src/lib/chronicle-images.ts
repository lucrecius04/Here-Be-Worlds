/**
 * Rozměry obrázků kroniky (jen při sestavení, v Node; do prohlížeče se nenačítá).
 *
 * Obrázky v kronikách (`/chronicles/<svět>/…png`) se načítají líně. Bez rozměrů mají do načtení
 * nulovou výšku, a když se dočtou nad místem, kam čtenář skočil z obsahu, text pod ním odjede
 * a zvýraznění v obsahu přeskočí na jinou kapitolu. S `width` a `height` prohlížeč místo vyhradí
 * předem a nic se nehýbe.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export type ImageSizes = Record<string, [number, number]>;

/** Šířka a výška z hlavičky PNG (IHDR), jinak null. */
export function pngSize(buffer: Uint8Array): [number, number] | null {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (buffer.length < 24 || signature.some((byte, i) => buffer[i] !== byte)) return null;
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const width = view.getUint32(16);
  const height = view.getUint32(20);
  return width > 0 && height > 0 ? [width, height] : null;
}

/** Rozměry všech PNG ve složce `public/chronicles/<slug>/`, klíčem je cesta jako v markdownu. */
export function chronicleImageSizes(slug: string, root = process.cwd()): ImageSizes {
  const dir = join(root, 'public', 'chronicles', slug);
  if (!existsSync(dir)) return {};
  const sizes: ImageSizes = {};
  for (const file of readdirSync(dir)) {
    if (!file.toLowerCase().endsWith('.png')) continue;
    const size = pngSize(readFileSync(join(dir, file)));
    if (size) sizes[`/chronicles/${slug}/${file}`] = size;
  }
  return sizes;
}
