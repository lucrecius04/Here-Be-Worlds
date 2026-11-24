import { describe, expect, it } from 'vitest';
import { worlds } from './worlds';
import { createWorldIndex, searchWorldIds } from './search';

const published = worlds.filter((w) => !w.draft);
const index = createWorldIndex(published);

describe('hledání v katalogu', () => {
  it('nesmysl nic nenajde', () => {
    expect(searchWorldIds(index, 'deatc').size).toBe(0);
    expect(searchWorldIds(index, 'xqzw').size).toBe(0);
  });

  it('najde svět podle názvu i bez diakritiky a podle začátku slova', () => {
    expect(searchWorldIds(index, 'zaklinac').has('the-witcher')).toBe(true);
    expect(searchWorldIds(index, 'cyber').has('cyberpunk-2077')).toBe(true);
  });

  it('dlouhé slovo snese jeden překlep', () => {
    expect(searchWorldIds(index, 'cyberpnuk').has('cyberpunk-2077')).toBe(true);
  });

  it('najde jiný pád téhož slova', () => {
    expect(searchWorldIds(index, 'zaklinace').has('the-witcher')).toBe(true);
    expect(searchWorldIds(index, 'halo').has('half-life')).toBe(false);
  });
});
