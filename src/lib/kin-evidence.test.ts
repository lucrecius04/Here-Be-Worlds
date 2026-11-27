import { describe, expect, it } from 'vitest';
import { PILLARS, affinityBreakdown, discoveryPairs, kinshipHalves, kinshipLevel, kinshipRanking } from './compare';
import { kinPublished, relatedBonds } from './kin-worlds';

const ratio = (aId: string, bId: string, key: (typeof PILLARS)[number]['key']) => {
  const a = kinPublished.find((w) => w.id === aId)!;
  const b = kinPublished.find((w) => w.id === bId)!;
  return affinityBreakdown(a, b)[key] / PILLARS.find((p) => p.key === key)!.max;
};

describe('pouta v Příbuzenstvu (kin-evidence.ts)', () => {
  it('každý příbuzný na spisu má nejsilnější pouto česky i anglicky', () => {
    for (const world of kinPublished) {
      for (const { world: other } of kinshipRanking(world, kinPublished, 3)) {
        const bonds = relatedBonds(world.id, other.id);
        expect(bonds, `${world.id} × ${other.id}`).not.toBeNull();
        for (const tie of [bonds!.bond, bonds!.rift]) {
          if (!tie) continue;
          expect(tie.label.cs, `${world.id} × ${other.id}`).toBeTruthy();
          expect(tie.label.en).toBeTruthy();
          expect(tie.text.cs).toBeTruthy();
          expect(tie.text.en).toBeTruthy();
        }
      }
    }
  });

  it('nejsilnější pouto není slabší než kterýkoli jiný pilíř', () => {
    const a = kinPublished.find((w) => w.id === 'dark-souls')!;
    const b = kinPublished.find((w) => w.id === 'path-of-exile')!;
    const score = affinityBreakdown(a, b);
    const best = Math.max(...PILLARS.map((p) => score[p.key] / p.max));
    /* Dark Souls × Path of Exile: plný počet má archetyp i vyprávění, přednost má výmluvnější vyprávění */
    expect(ratio('dark-souls', 'path-of-exile', 'narration')).toBe(best);
    expect(relatedBonds('dark-souls', 'path-of-exile')!.bond.label.cs).toBe('Vyprávění');
  });

  it('nejslabší pouto se ukáže, jen když je opravdu slabé, a říká, v čem se světy rozcházejí', () => {
    /* sourozenci bez slabého místa */
    expect(relatedBonds('dark-souls', 'elden-ring')!.rift).toBeNull();
    /* jiný typ prvotního hříchu */
    const rift = relatedBonds('dark-souls', 'path-of-exile')!.rift!;
    expect(ratio('dark-souls', 'path-of-exile', 'triad')).toBeLessThan(0.55);
    expect(rift.label.cs).toBe('Prvotní hřích');
    expect(rift.text.cs).toContain(' × ');
  });

  it('pouto je pro obě strany dvojice stejné, jen s obráceným pořadím světů', () => {
    const ab = relatedBonds('dark-souls', 'path-of-exile')!;
    const ba = relatedBonds('path-of-exile', 'dark-souls')!;
    expect(ba.bond.label.cs).toBe(ab.bond.label.cs);
    expect(ba.rift!.label.cs).toBe(ab.rift!.label.cs);
    expect(ba.rift!.text.cs!.split(' × ').reverse().join(' × ')).toBe(ab.rift!.text.cs);
  });
});

describe('skrytí příbuzní (discoveryPairs)', () => {
  const { hidden, unexpected, opposites } = discoveryPairs(kinPublished);

  it('jsou blízcí povahou, vzdálení podobou a celkově aspoň spříznění', () => {
    expect(hidden.length).toBeGreaterThanOrEqual(6);
    for (const { a, b, level } of hidden) {
      const halves = kinshipHalves(a, b, kinPublished);
      expect(halves.nature, `${a.id} × ${b.id}`).toBeGreaterThanOrEqual(4);
      expect(halves.look, `${a.id} × ${b.id}`).toBeLessThanOrEqual(2);
      expect(level).toBe(kinshipLevel(a, b, kinPublished));
      expect(level).toBeGreaterThanOrEqual(3);
    }
  });

  it('každý svět je v jednom seznamu nejvýš jednou', () => {
    for (const list of [hidden, unexpected, opposites]) {
      const ids = list.flatMap(({ a, b }) => [a.id, b.id]);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});
