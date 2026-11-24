import { describe, expect, it } from 'vitest';
import { czStem } from './cz-stem';
import { matchRanges } from './site-search';

describe('ohýbání češtiny v hledání', () => {
  it('různé pády mají stejný kmen', () => {
    const same = (words: string[]) => expect(new Set(words.map(czStem)).size).toBe(1);
    same(['bůh', 'boha', 'bohové', 'bozi', 'bohu']);
    same(['drak', 'draka', 'draci', 'draků']);
    same(['smrt', 'smrti', 'smrtí']);
    same(['kniha', 'knihy', 'knize']);
    same(['Zaklínač', 'Zaklínače', 'Zaklínačem']);
    same(['dům', 'domu', 'domy']);
  });

  it('kmen se nepřekrývá s jinými slovy', () => {
    expect(czStem('halo')).not.toBe(czStem('half'));
    expect(czStem('boha')).not.toBe(czStem('bohatý'));
    expect(czStem('ok')).toBe('');
  });

  it('podtrhne jiný pád téhož slova', () => {
    const text = 'Bůh spí pod horou';
    const [r] = matchRanges(text, 'boha');
    expect(r).toEqual([0, 3]);
  });
});
