import type { LocalizedString } from '../schemas/world';

export type Locale = 'en' | 'cs';

export const DEFAULT_LOCALE: Locale = 'cs';

/** Localized game / card copy — `cs` default; missing `en` falls back to `cs`. */
export function t(value: LocalizedString, locale: Locale = DEFAULT_LOCALE): string {
  if (locale === 'cs') return value.cs ?? value.en ?? '';
  return value.en ?? value.cs ?? '';
}

type UiTree = Record<string, string | Record<string, string>>;

export const ui: Record<Locale, UiTree> = {
  cs: {
    siteName: 'Here Be Worlds',
    nav: {
      atlas: 'Atlas',
      compare: 'Srovnání',
      map: 'Mapa',
    },
    footer: {
      disclaimer:
        'Neoficiální fanouškovský atlas. Názvy her a ochranné známky patří jejich vlastníkům.',
    },
    home: {
      tagline: '43 světů · 7 kapitol · komparativní lore',
      title: 'Atlas herních vesmírů',
      lead: 'Kurátorská kartografická skříň pro vnitřní anatomii fiktivních herních světů — ne mechaniky, ale historie, metafyzika a kroniky.',
      exploreIndex: 'Prozkoumat katalog',
      chaptersAria: 'Kapitoly atlasu',
    },
    profiles: {
      one: 'profil',
      few: 'profily',
      many: 'profilů',
    },
    search: {
      label: 'Vyhledávání',
      placeholder: 'Hledat světy…',
    },
    filter: {
      chapter: 'Kapitola',
      theme: 'Téma',
      allChapters: 'Všechny kapitoly',
      allThemes: 'Všechna témata',
      axisMin: 'Minimum osy (1–5)',
    },
    results: {
      countOne: 'svět',
      countMany: 'světů',
    },
    world: {
      canonScope: 'Rozsah kánonu',
      backToAtlas: 'Zpět na atlas',
      fullChronicle: 'Plná kronika',
      chronicleMissing: 'Kronika pro tento svět zatím chybí. Spusťte',
      chronicleLoading: 'Načítám kroniku…',
      spoilerNotice: 'Text vyzrazuje děj. Obsahuje spoilery.',
      similarWorlds: 'Podobné světy',
      viewCard: 'Analytická karta',
      viewChronicle: 'Kronika světa',
      viewAppendices: 'Přílohy',
      viewAnalysis: 'Rozbor vyprávění',
      genreLine: 'Žánr',
    },
    card: {
      coreLabel: 'Jádro světa',
      metadataAria: 'Metadata světa',
      genreProfile: 'Žánrový profil',
      atmosphere: 'Atmosféra',
      spatialScope: 'Prostorový dosah',
      historicalDepth: 'Historická hloubka',
      societalOrder: 'Struktura společnosti',
      sourceOfPower: 'Původ moci',
      protagonistPerspective: 'Perspektiva hráče',
      signatureHeading: 'Čím je svět charakteristický',
      signatureAria: 'Charakteristické rysy světa',
      detailInfo: 'Rozšířený popis',
      keyActors: 'Klíčoví aktéři',
      profileWorld: 'Profil světa',
      themesHeading: 'Témata',
      axesAria: 'Pět os světa',
      triadAria: 'Analytický trojblok',
      originalSin: 'Prvotní hřích',
      centralDilemma: 'Ústřední dilema',
      ultimateMystery: 'Hlavní tajemství',
    },
    compare: {
      title: 'Srovnání světů',
      body: 'Fáze 2: vedle sebe 2–3 světy — překryv os, dlaždic a témat. Routování je připravené; duel přijde v dalším milníku.',
      back: 'Zpět na atlas',
    },
    map: {
      title: '2D kartografická mapa',
      body: 'Fáze 2: scatter plot všech 43 světů — libovolné dvě z pěti os na osy X a Y.',
      back: 'Zpět na atlas',
    },
    chapterPage: {
      back: '← Atlas',
    },
    stub: {
      coming: 'Připravujeme',
    },
  },
  en: {
    siteName: 'Here Be Worlds',
    nav: {
      atlas: 'Atlas',
      compare: 'Compare',
      map: 'Map',
    },
    footer: {
      disclaimer:
        'Unofficial fan atlas. Game names and marks belong to their respective owners.',
    },
    home: {
      tagline: '43 worlds · 7 chapters · comparative lore',
      title: 'An Atlas of Game Universes',
      lead: 'A curated cartographic cabinet for the inner anatomy of fictional game worlds—not mechanics, but history, metaphysics, and chronicle.',
      exploreIndex: 'Explore the index',
      chaptersAria: 'Atlas chapters',
    },
    profiles: {
      one: 'profile',
      few: 'profiles',
      many: 'profiles',
    },
    search: {
      label: 'Search',
      placeholder: 'Search worlds…',
    },
    filter: {
      chapter: 'Chapter',
      theme: 'Theme',
      allChapters: 'All chapters',
      allThemes: 'All themes',
      axisMin: 'Axis minimum (1–5)',
    },
    results: {
      countOne: 'world',
      countMany: 'worlds',
    },
    world: {
      canonScope: 'Canon scope',
      backToAtlas: 'Back to atlas',
      fullChronicle: 'Full chronicle',
      chronicleMissing: 'Chronicle not found. Run',
      chronicleLoading: 'Loading chronicle…',
      spoilerNotice: 'This text reveals the plot. It contains spoilers.',
      similarWorlds: 'Similar worlds',
      viewCard: 'Analytical card',
      viewChronicle: 'World chronicle',
      viewAppendices: 'Appendices',
      viewAnalysis: 'Narrative analysis',
      genreLine: 'Genre',
    },
    card: {
      coreLabel: 'The core of the world',
      metadataAria: 'World metadata',
      genreProfile: 'Genre profile',
      atmosphere: 'Atmosphere',
      spatialScope: 'Spatial scope',
      historicalDepth: 'Historical depth',
      societalOrder: 'Societal order',
      sourceOfPower: 'Source of power',
      protagonistPerspective: 'Player perspective',
      signatureHeading: 'What defines this world',
      signatureAria: 'Signature traits',
      detailInfo: 'Extended description',
      keyActors: 'Key actors',
      profileWorld: 'World profile',
      themesHeading: 'Themes',
      axesAria: 'Five world axes',
      triadAria: 'Analytical triad',
      originalSin: 'Original sin',
      centralDilemma: 'Central dilemma',
      ultimateMystery: 'Ultimate mystery',
    },
    compare: {
      title: 'World comparator',
      body: 'Phase 2: compare 2–3 worlds side by side—axes, tiles, and themes. Routing is ready; the duel view ships next.',
      back: 'Return to the atlas',
    },
    map: {
      title: '2D cartography map',
      body: 'Phase 2: scatter plot of all 43 worlds—pick any two of the five axes for X and Y.',
      back: 'Return to the atlas',
    },
    chapterPage: {
      back: '← Atlas',
    },
    stub: {
      coming: 'Coming soon',
    },
  },
};

export function uiT(path: string, locale: Locale = DEFAULT_LOCALE): string {
  const parts = path.split('.');
  let node: unknown = ui[locale];
  for (const p of parts) {
    if (node && typeof node === 'object' && p in node) {
      node = (node as Record<string, unknown>)[p];
    } else {
      return path;
    }
  }
  return typeof node === 'string' ? node : path;
}

export function profileCountLabel(count: number, locale: Locale): string {
  if (locale === 'en') {
    return `${count} ${count === 1 ? ui.en.profiles.one : ui.en.profiles.many}`;
  }
  if (count === 1) return `1 ${ui.cs.profiles.one}`;
  if (count >= 2 && count <= 4) return `${count} ${ui.cs.profiles.few}`;
  return `${count} ${ui.cs.profiles.many}`;
}

export function worldCountLabel(count: number, locale: Locale): string {
  if (locale === 'en') {
    return `${count} ${count === 1 ? ui.en.results.countOne : ui.en.results.countMany}`;
  }
  return `${count} ${count === 1 ? ui.cs.results.countOne : ui.cs.results.countMany}`;
}

/** Apply `data-i18n` and `data-i18n-html` nodes in the document. */
export function applyDomI18n(locale: Locale): void {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) el.textContent = uiT(key, locale);
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-aria]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria');
    if (key) el.setAttribute('aria-label', uiT(key, locale));
  });
}
