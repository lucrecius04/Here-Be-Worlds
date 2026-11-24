import { describe, expect, it } from 'vitest';
import { feedItems, renderFeed } from './feed';
import { worlds } from './worlds';
import { TRAILS } from './trails';
import { publishedEssayFor } from './trail-pages';

describe('kanál novinek (RSS)', () => {
  const items = feedItems('2099-12-31');

  it('obsahuje každý zveřejněný svět a každé schválené putování', () => {
    for (const w of worlds.filter((x) => !x.draft)) expect(items.some((i) => i.guid === `world:${w.id}`)).toBe(true);
    for (const t of TRAILS) {
      if (publishedEssayFor(t.id)) expect(items.some((i) => i.guid === `journey:${t.id}`)).toBe(true);
    }
  });

  it('každá schválená esej putování má datum zveřejnění', () => {
    for (const t of TRAILS) {
      const essay = publishedEssayFor(t.id);
      if (essay) expect(essay.published, t.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('nemá koncepty a vynechá položky s datem v budoucnosti', () => {
    for (const w of worlds.filter((x) => x.draft)) expect(items.some((i) => i.guid === `world:${w.id}`)).toBe(false);
    expect(feedItems('2000-01-01')).toHaveLength(0);
  });

  it('je řazený od nejnovějšího a XML má platné odkazy', () => {
    for (let k = 1; k < items.length; k += 1) expect(items[k - 1].date >= items[k].date).toBe(true);
    const xml = renderFeed('https://example.org/hbw', items);
    expect(xml).toContain('<link>https://example.org/hbw/worlds/');
    expect(xml).not.toMatch(/&(?!amp;|lt;|gt;|quot;)/);
  });
});
