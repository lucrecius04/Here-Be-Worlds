import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { chronicleImageSizes, pngSize } from './chronicle-images';

const CHRONICLES = join(process.cwd(), 'content', 'chronicles');

describe('chronicle images', () => {
  it('reads PNG dimensions from the header', () => {
    const header = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52, 0, 0, 3, 0x20, 0, 0, 2,
      0x58,
    ]);
    expect(pngSize(header)).toEqual([800, 600]);
    expect(pngSize(new Uint8Array([1, 2, 3]))).toBeNull();
  });

  // Obrázek bez rozměrů má do načtení nulovou výšku a posouvá text pod čtenářem (skoky z obsahu).
  it('every image in a chronicle has known dimensions', () => {
    const missing: string[] = [];
    for (const file of readdirSync(CHRONICLES).filter((f) => f.endsWith('.md'))) {
      const slug = file.replace(/\.md$/, '');
      const sizes = chronicleImageSizes(slug);
      const markdown = readFileSync(join(CHRONICLES, file), 'utf8');
      for (const [, src] of markdown.matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)) {
        if (!sizes[src]) missing.push(`${file}: ${src}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
