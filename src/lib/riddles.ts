/**
 * Zásobník hádanek dne, skládaný při sestavení z dat atlasu: triády, jádra, mota a podtituly kronik,
 * charakter, témata, hlubina času, souřadnice, příbuznost (jen index z compare.ts), putování
 * a typy z Galerie triád. Každá hádanka má tři možnosti a právě jednu správnou.
 * Výběr hádanky pro den: `riddle-day.ts`. Stránky: `src/pages/hadanky/[key].json.ts`.
 */
import type { LocalizedString, World } from '../schemas/world';
import { chapters, themeTaxonomy } from './worlds';
import { kinWorlds as allWorlds } from './kin-worlds';
import { uiT } from './i18n';
import { mulberry32, shuffle } from './calendar';
import { AXIS_KEYS } from './axes';
import axesMeta from '../../data/meta/axes.json';
import { kinshipLevel, kinshipRanking } from './compare';
import { DEEP_TIME, summarize, formatAgo, formatDuration } from './deep-time';
import { TRAILS, trailSlug } from './trails';
import { essayFor } from './trail-pages';
import { WORLD_TRIAD_TYPES, SIN_TYPES, DILEMMA_TYPES, GALLERY_PATH } from './triad-types';
import { slugifyChronicleHeading } from './chronicle-toc';
import { RIDDLE_KINDS, riddleKey, type Accent, type Riddle, type RiddleChoice, type RiddleCounts, type RiddleKind } from './riddle-day';

type Draft = Omit<Riddle, 'key' | 'kind'>;

const CHRONICLES = import.meta.glob('../../content/chronicles/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const L = (key: string): LocalizedString => ({ cs: uiT(key, 'cs'), en: uiT(key, 'en') });
const both = (cs: string, en?: string): LocalizedString => ({ cs, en: en ?? cs });

const published = allWorlds.filter((w) => !w.draft);
const byId = new Map(published.map((w) => [w.id, w]));

function accentOf(world: World): Accent {
  return chapters.find((c) => c.id === world.chapterId)?.accent ?? { light: '#57534d', dark: '#c9ceda' };
}

const worldChoice = (w: World, extra: Partial<RiddleChoice> = {}): RiddleChoice => ({
  id: w.id,
  label: w.gameTitle,
  href: `/worlds/${w.id}/`,
  ...extra,
});

/* ---------- skrytí názvu hry v indicii ---------- */

function titleNames(world: World): string[] {
  return [world.gameTitle.cs, world.gameTitle.en].filter((n): n is string => Boolean(n));
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const ACCENTS: Record<string, string> = {
  a: 'aá', e: 'eéě', i: 'ií', o: 'oó', u: 'uúů', y: 'yý', c: 'cč', d: 'dď', n: 'nň', r: 'rř', s: 'sš', t: 'tť', z: 'zž',
};

/** Název jako vzor bez ohledu na diakritiku (Hades i Hádes). */
const namePattern = (name: string) =>
  [...name].map((ch) => (ACCENTS[ch.toLowerCase()] ? `[${ACCENTS[ch.toLowerCase()]}]` : escapeRe(ch))).join('');

/** Název hry v textu nahradí „[…]“ (celé slovo; jednoslovný název i s českou koncovkou). */
export function redact(text: string, world: World): string {
  let next = text;
  for (const name of new Set(titleNames(world))) {
    const tail = /\s/.test(name) || name.length < 5 ? '' : '\\p{L}*';
    next = next.replace(new RegExp(`(?<![\\p{L}\\p{N}])${namePattern(name)}${tail}(?![\\p{L}\\p{N}])`, 'giu'), '[…]');
  }
  return next;
}

const redactL = (value: LocalizedString, world: World): LocalizedString => ({
  cs: value.cs ? redact(value.cs, world) : undefined,
  en: redact(value.en, world),
});

/** Prozrazuje text odpověď? (test i stavba: indicie s názvem hry se zahodí) */
export function leaksTitle(text: string, world: World): boolean {
  return titleNames(world).some((name) =>
    new RegExp(`(?<![\\p{L}\\p{N}])${namePattern(name)}(?![\\p{L}\\p{N}])`, 'iu').test(text),
  );
}

/* ---------- výběr špatných odpovědí ---------- */

/**
 * Dvě špatné odpovědi: jedna ze stejného archetypu (aby nestačilo poznat žánr), jedna odjinud.
 * `ok` vyřadí světy, které by byly také správně.
 */
function distractors(answer: World, rand: () => number, ok: (w: World) => boolean = () => true, sameArchetype = true): World[] {
  const others = shuffle(
    published.filter((w) => w.id !== answer.id && ok(w)),
    rand,
  );
  const sibling = sameArchetype ? others.find((w) => w.chapterId === answer.chapterId) : undefined;
  const rest = others.filter((w) => w !== sibling && w.chapterId !== answer.chapterId);
  const pool = [...(sibling ? [sibling] : []), ...rest, ...others];
  const out: World[] = [];
  for (const w of pool) {
    if (out.length >= 2) break;
    if (!out.includes(w)) out.push(w);
  }
  return out;
}

function threeWorlds(answer: World, rand: () => number, ok?: (w: World) => boolean, extra?: (w: World) => Partial<RiddleChoice>): RiddleChoice[] | null {
  const wrong = distractors(answer, rand, ok);
  if (wrong.length < 2) return null;
  return shuffle([answer, ...wrong], rand).map((w) => worldChoice(w, extra?.(w)));
}

/* ---------- druhy hádanek ---------- */

type Builder = (rand: () => number) => Draft[];

/** Hádanka „poznáš svět podle …“ z jednoho textu světa. */
function identify(prompt: string, pick: (w: World) => LocalizedString | undefined, extra: (w: World) => Partial<Draft> = () => ({})): Builder {
  return (rand) =>
    published.flatMap((w) => {
      const raw = pick(w);
      if (!raw?.en) return [];
      const quote = redactL(raw, w);
      const choices = threeWorlds(w, rand);
      if (!choices) return [];
      return [{ prompt: L(prompt), quote, choices, answer: w.id, about: w.id, ...extra(w) }];
    });
}

function frontmatter(md: string, key: string): string | undefined {
  const head = /^---\n([\s\S]*?)\n---/.exec(md)?.[1] ?? '';
  const m = new RegExp(`^${key}:\\s*"?(.+?)"?\\s*$`, 'm').exec(head);
  return m?.[1];
}

const chronicleOf = (w: World) => CHRONICLES[`../../content/chronicles/${w.chronicleSlug}.md`] ?? '';

/** Mota kapitol kronik: řádek *„…“* hned pod nadpisem kapitoly (bez citátů s uvedeným autorem). */
export function chronicleMottos(md: string): Array<{ text: string; heading: string }> {
  const out: Array<{ text: string; heading: string }> = [];
  let heading = '';
  for (const line of md.split('\n')) {
    const h = /^##\s+(.+?)\s*$/.exec(line);
    if (h) {
      heading = h[1].replace(/\*\*/g, '').trim();
      continue;
    }
    const m = /^\*„(.+)“\*\s*$/.exec(line.trim());
    if (!m || !heading) continue;
    const text = m[1];
    if (text.includes('„') || text.includes('(') || text.length < 40 || text.length > 240) continue;
    out.push({ text, heading });
  }
  return out;
}

const mottos: Builder = (rand) =>
  published.flatMap((w) =>
    chronicleMottos(chronicleOf(w)).flatMap(({ text, heading }) => {
      if (leaksTitle(text, w)) return [];
      const choices = threeWorlds(w, rand);
      if (!choices) return [];
      return [
        {
          prompt: L('riddle.motto'),
          quote: both(text),
          choices,
          answer: w.id,
          about: w.id,
          more: { label: L('riddle.moreChapter'), href: `/worlds/${w.id}/?view=chronicle#${slugifyChronicleHeading(heading)}` },
        },
      ];
    }),
  );

const covers: Builder = (rand) =>
  published.flatMap((w) => {
    const text = frontmatter(chronicleOf(w), 'coverRange');
    if (!text || leaksTitle(text, w)) return [];
    const choices = threeWorlds(w, rand);
    if (!choices) return [];
    return [{ prompt: L('riddle.cover'), quote: both(text), choices, answer: w.id, about: w.id }];
  });

function fieldText(f: World['metadata'][keyof World['metadata']], withSub: boolean, joiner = ': '): LocalizedString {
  const sub = withSub ? f.sub : undefined;
  return {
    cs: f.cs ? (sub?.cs ? `${f.cs}${joiner}${sub.cs}` : f.cs) : undefined,
    en: sub?.en ? `${f.en}${joiner}${sub.en}` : f.en,
  };
}

const character: Builder = (rand) =>
  published.flatMap((w) => {
    const m = w.metadata;
    const lines = [
      { label: L('card.atmosphere'), text: redactL(fieldText(m.atmosphere, true, ', '), w) },
      { label: L('card.societalOrder'), text: redactL(fieldText(m.societalOrder, true), w) },
      { label: L('card.sourceOfPower'), text: redactL(fieldText(m.sourceOfPower, true), w) },
    ];
    // Stejný charakter (všechny tři hlavní hodnoty) by měl i jiný svět: ten nesmí být mezi možnostmi.
    const same = (o: World) =>
      o.metadata.atmosphere.en === m.atmosphere.en &&
      o.metadata.societalOrder.en === m.societalOrder.en &&
      o.metadata.sourceOfPower.en === m.sourceOfPower.en;
    const choices = threeWorlds(w, rand, (o) => !same(o));
    if (!choices) return [];
    return [{ prompt: L('riddle.character'), lines, choices, answer: w.id, about: w.id }];
  });

const themeLabel = (slug: string) => themeTaxonomy.find((t) => t.slug === slug)?.label;

const themes: Builder = (rand) => {
  const freq = new Map<string, number>();
  for (const w of published) for (const s of w.themes) freq.set(s, (freq.get(s) ?? 0) + 1);
  return published.flatMap((w) => {
    const picked = [...w.themes]
      .filter((s) => themeLabel(s))
      .sort((a, b) => (freq.get(a) ?? 0) - (freq.get(b) ?? 0) || a.localeCompare(b))
      .slice(0, 4);
    if (picked.length < 3) return [];
    const choices = threeWorlds(w, rand, (o) => picked.filter((s) => o.themes.includes(s)).length <= Math.min(2, picked.length - 2));
    if (!choices) return [];
    return [
      {
        prompt: L('riddle.themes'),
        tags: shuffle(picked, rand).map((s) => themeLabel(s) as LocalizedString),
        choices,
        answer: w.id,
        about: w.id,
      },
    ];
  });
};

const deepWorlds = published.filter((w) => DEEP_TIME[w.id]);

function deepNote(w: World): LocalizedString | undefined {
  const s = summarize(DEEP_TIME[w.id]);
  if (s.deepestEvent) return { cs: formatAgo(s.deepestEvent, 'cs'), en: formatAgo(s.deepestEvent, 'en') };
  if (s.hasMyth) return L('deepTime.myth');
  return undefined;
}

const timeline: Builder = (rand) =>
  deepWorlds.flatMap((w) => {
    const d = DEEP_TIME[w.id];
    const s = summarize(d);
    const reach = deepNote(w);
    if (!reach) return [];
    const present = d.present.split(' · ')[0];
    if (leaksTitle(present, w)) return [];
    const lines = [
      { label: L('deepTime.present'), text: both(present) },
      { label: L('deepTime.reach'), text: reach },
    ];
    // Období her jen tam, kde mají díly datum (jinak by „0 let“ lhalo o sérii).
    if (s.played > 0) lines.push({ label: L('deepTime.played'), text: { cs: formatDuration(s.played, 'cs'), en: formatDuration(s.played, 'en') } });
    const choices = threeWorlds(w, rand, (o) => Boolean(DEEP_TIME[o.id]));
    if (!choices) return [];
    return [{ prompt: L('riddle.timeline'), lines, choices, answer: w.id, about: w.id, more: { label: L('riddle.moreDeep'), href: '/hlubina-casu/' } }];
  });

/** Souřadnice: který ze tří světů se nejvíc kloní k pólu (s jasným odstupem dvou dílků). */
const axis: Builder = (rand) =>
  AXIS_KEYS.flatMap((key) => {
    const meta = axesMeta.axes.find((a) => a.id === key) ?? axesMeta.axes[0];
    return (['left', 'right'] as const).flatMap((side) => {
      const lean = (w: World) => (side === 'right' ? w.axes[key].value : 6 - w.axes[key].value);
      const promptKey = `riddle.axis${key[0].toUpperCase()}${key.slice(1)}${side === 'left' ? 'Left' : 'Right'}`;
      return shuffle(published.filter((w) => lean(w) >= 4), rand)
        .slice(0, 8)
        .flatMap((w) => {
          const wrong = distractors(w, rand, (o) => lean(o) <= lean(w) - 2);
          if (wrong.length < 2) return [];
          return [
            {
              prompt: L(promptKey),
              scale: { left: meta.left as LocalizedString, right: meta.right as LocalizedString },
              choices: shuffle([w, ...wrong], rand).map((o) => worldChoice(o, { value: o.axes[key].value })),
              answer: w.id,
              about: w.id,
              more: { label: L('riddle.moreMap'), href: `/map/?svet=${w.id}` },
            },
          ];
        });
    });
  });

/** Hlubina času: nejhlubší, nebo nejmělčí paměť ze tří světů (rozdíl aspoň dvacetinásobný). */
const depth: Builder = (rand) => {
  const placed = deepWorlds
    .map((w) => ({ w, mid: summarize(DEEP_TIME[w.id]).deepestMid }))
    .filter((x) => x.mid > 0);
  const note = (w: World) => ({ note: deepNote(w) });
  return (['deep', 'shallow'] as const).flatMap((dir) =>
    placed.flatMap(({ w, mid }) => {
      const fits = placed.filter((o) => o.w.id !== w.id && (dir === 'deep' ? o.mid * 20 <= mid : o.mid >= mid * 20));
      const pool = shuffle(fits, rand);
      const sib = pool.find((o) => o.w.chapterId === w.chapterId);
      const rest = pool.filter((o) => o !== sib && o.w.chapterId !== w.chapterId);
      const wrong = [...(sib ? [sib] : []), ...rest, ...pool].filter((o, i, arr) => arr.indexOf(o) === i).slice(0, 2);
      if (wrong.length < 2) return [];
      return [
        {
          prompt: L(dir === 'deep' ? 'riddle.depthDeep' : 'riddle.depthShallow'),
          choices: shuffle([w, ...wrong.map((o) => o.w)], rand).map((o) => worldChoice(o, note(o))),
          answer: w.id,
          about: w.id,
          more: { label: L('riddle.moreDeep'), href: '/hlubina-casu/' },
        },
      ];
    }),
  );
};

/** Příbuznost: nejbližší příbuzný světa (stupeň aspoň 4) proti dvěma vzdáleným (stupeň nejvýš 2). */
const kin: Builder = (rand) =>
  published.flatMap((x) => {
    const [top] = kinshipRanking(x, published, 1);
    if (!top || top.level < 4) return [];
    const far = (o: World) => o.id !== x.id && kinshipLevel(x, o, published) <= 2;
    const wrong = distractors(top.world, rand, far);
    if (wrong.length < 2) return [];
    const level = (o: World) => L(`compare.kinLevel${kinshipLevel(x, o, published)}`);
    return [
      {
        prompt: L('riddle.kin'),
        worlds: [{ id: x.id, label: x.gameTitle, accent: accentOf(x) }],
        choices: shuffle([top.world, ...wrong], rand).map((o) => worldChoice(o, { note: level(o) })),
        answer: top.world.id,
        about: x.id,
        more: { label: L('riddle.moreCompare'), href: `/compare/?w=${x.id},${top.world.id}` },
      },
    ];
  });

const trailName = (nameKey: string) => L(nameKey);
const trailChoice = (t: (typeof TRAILS)[number]): RiddleChoice => ({
  id: trailSlug(t.id),
  label: trailName(t.nameKey),
  href: `/putovani/${trailSlug(t.id)}/`,
});

function triples<T>(items: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i++)
    for (let j = i + 1; j < items.length; j++) for (let k = j + 1; k < items.length; k++) out.push([items[i], items[j], items[k]]);
  return out;
}

/** Putování: kterým putováním procházejí tři světy (žádné jiné putování je nemá všechny tři). */
const trail: Builder = (rand) =>
  TRAILS.flatMap((t) => {
    const members = t.members.filter((id) => byId.has(id));
    const unique = triples(members).filter((tri) => !TRAILS.some((o) => o !== t && tri.every((id) => o.members.includes(id))));
    return shuffle(unique, rand)
      .slice(0, 2)
      .flatMap((tri) => {
        const others = shuffle(
          TRAILS.filter((o) => o !== t && tri.filter((id) => o.members.includes(id)).length <= 1),
          rand,
        ).slice(0, 2);
        if (others.length < 2) return [];
        return [
          {
            prompt: L('riddle.trail'),
            worlds: tri.map((id) => {
              const w = byId.get(id) as World;
              return { id, label: w.gameTitle, accent: accentOf(w) };
            }),
            choices: shuffle([t, ...others], rand).map(trailChoice),
            answer: trailSlug(t.id),
            more: { label: L('riddle.moreTrail'), href: `/putovani/${trailSlug(t.id)}/` },
          },
        ];
      });
  });

/** Putování: který ze tří světů na putování nepatří (dva členové a jeden vetřelec). */
const intruder: Builder = (rand) =>
  TRAILS.flatMap((t) => {
    const members = t.members.map((id) => byId.get(id)).filter((w): w is World => Boolean(w));
    const essay = essayFor(t.id);
    const question: LocalizedString = {
      cs: essay?.approved && essay.tagline ? essay.tagline : uiT(t.descKey, 'cs'),
      en: uiT(t.descKey, 'en'),
    };
    const used = new Set<string>();
    const order = shuffle(members, rand);
    return [0, 1].flatMap((round) => {
      const pair = order.slice(round * 2, round * 2 + 2);
      if (pair.length < 2) return [];
      const outsiders = shuffle(
        published.filter((w) => !t.members.includes(w.id) && !used.has(w.id)),
        rand,
      );
      const odd = outsiders.find((w) => pair.some((p) => p.chapterId === w.chapterId)) ?? outsiders[0];
      if (!odd) return [];
      used.add(odd.id);
      return [
        {
          prompt: L('riddle.intruder'),
          heading: trailName(t.nameKey),
          quote: question,
          choices: shuffle([odd, ...pair], rand).map((w) => worldChoice(w)),
          answer: odd.id,
          about: odd.id,
          more: { label: L('riddle.moreTrail'), href: `/putovani/${trailSlug(t.id)}/` },
        },
      ];
    });
  });

/** Galerie triád: který svět patří k typu prvotního hříchu / ústředního dilematu. */
function triadType(kind: 'sin' | 'dilemma'): Builder {
  const types = kind === 'sin' ? SIN_TYPES : DILEMMA_TYPES;
  return (rand) =>
    published.flatMap((w) => {
      const own = WORLD_TRIAD_TYPES[w.id];
      if (!own) return [];
      const typeId = own[kind];
      const type = types.find((x) => x.id === typeId);
      if (!type) return [];
      const typesOf = (o: World) => {
        const tt = WORLD_TRIAD_TYPES[o.id];
        return tt ? [tt[kind], kind === 'sin' ? tt.sinAlso : undefined].filter(Boolean) : [];
      };
      const ok = (o: World) =>
        Boolean(WORLD_TRIAD_TYPES[o.id]) && !typesOf(o).includes(typeId) && !(kind === 'sin' && own.sinAlso && typesOf(o).includes(own.sinAlso));
      const label = (o: World) => types.find((x) => x.id === WORLD_TRIAD_TYPES[o.id]?.[kind])?.label;
      const choices = threeWorlds(w, rand, ok, (o) => ({ note: label(o) }));
      if (!choices) return [];
      return [
        {
          prompt: L(kind === 'sin' ? 'riddle.sinType' : 'riddle.dilemmaType'),
          heading: type.label,
          quote: type.desc,
          choices,
          answer: w.id,
          about: w.id,
          more: { label: L('riddle.moreGallery'), href: `${GALLERY_PATH}#${typeId}` },
        },
      ];
    });
}

const BUILDERS: Record<RiddleKind, Builder> = {
  sin: identify('riddle.sin', (w) => w.triad.originalSin),
  dilemma: identify('riddle.dilemma', (w) => w.triad.centralDilemma),
  secret: identify('riddle.secret', (w) => w.triad.ultimateMystery),
  actors: identify('riddle.actors', (w) => w.metadata.keyActors, (w) => ({ axesOf: w.id })),
  core: identify('riddle.core', (w) => w.core),
  cover: covers,
  motto: mottos,
  character,
  themes,
  timeline,
  axis,
  depth,
  kin,
  trail,
  intruder,
  sinType: triadType('sin'),
  dilemmaType: triadType('dilemma'),
};

/** Celý zásobník po druzích; pořadí uvnitř druhu je pevné (stejná data = stejné hádanky). */
export function buildRiddles(): Record<RiddleKind, Riddle[]> {
  const out = {} as Record<RiddleKind, Riddle[]>;
  RIDDLE_KINDS.forEach((kind, i) => {
    const rand = mulberry32(1009 * (i + 1));
    out[kind] = BUILDERS[kind](rand)
      .filter((d) => d.choices.length === 3 && d.choices.some((c) => c.id === d.answer))
      .map((d, n) => ({ key: riddleKey(kind, n), kind, ...d }));
  });
  return out;
}

let cache: Record<RiddleKind, Riddle[]> | null = null;
export function riddlePool(): Record<RiddleKind, Riddle[]> {
  cache ??= buildRiddles();
  return cache;
}

export function riddleCounts(): RiddleCounts {
  return Object.fromEntries(Object.entries(riddlePool()).map(([k, v]) => [k, v.length])) as RiddleCounts;
}

