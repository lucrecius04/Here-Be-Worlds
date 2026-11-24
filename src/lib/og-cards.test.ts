import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { worlds } from './worlds';
import { TRAILS, TRAIL_SLUGS } from './trails';

// Karty pro sdílení se negenerují při buildu, ale skriptem `npm run og` a commitují se.
// Tento test hlídá, aby nový publikovaný svět nezůstal bez karty.
describe('karty pro sdílení (public/og)', () => {
  it('obecná karta webu existuje', () => {
    expect(existsSync(join(process.cwd(), 'public/og/site.jpg'))).toBe(true);
  });

  it('každý publikovaný svět má kartu – po přidání světa spusť `npm run og`', () => {
    const missing = worlds
      .filter((w) => !w.draft)
      .map((w) => w.id)
      .filter((id) => !existsSync(join(process.cwd(), 'public/og/worlds', `${id}.jpg`)));
    expect(missing).toEqual([]);
  });

  it('každé putování a rejstřík putování mají kartu – po přidání putování nebo obrázku spusť `npm run og -- putovani`', () => {
    const missing = TRAILS.map((t) => TRAIL_SLUGS[t.id]).filter(
      (slug) => !existsSync(join(process.cwd(), 'public/og/putovani', `${slug}.jpg`)),
    );
    expect(missing).toEqual([]);
    expect(existsSync(join(process.cwd(), 'public/og/putovani.jpg'))).toBe(true);
  });
});
