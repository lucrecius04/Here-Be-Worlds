import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { worlds } from './worlds';

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
});
