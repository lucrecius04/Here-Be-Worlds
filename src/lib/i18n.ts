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
      tagline: 'Atlas herních vesmírů',
      explore: 'Objevovat',
      chapters: 'Archetypy',
      about: 'O atlasu',
      aboutProject: 'O projektu',
      method: 'Vysvětlivky',
      contact: 'Kontakt',
      sources: 'Zdroje a kánon',
      copyright: '© 2026 Here Be Worlds',
      unofficial: 'Neoficiální fanouškovský projekt',
      disclaimer:
        'Názvy her a ochranné známky patří jejich vlastníkům.',
    },
    home: {
      tagline: '43 světů · 5 os · srovnání',
      kicker: '43 kosmologií · příběhové kroniky · anatomie a mýty',
      title: 'Atlas herních vesmírů',
      slogan: 'Každý svět má příběh. Žádný nestojí sám.',
      lead: 'Kartografická skříň vnitřní anatomie herních světů — ne mechaniky, ale historie, metafyzika a kroniky.',
      exploreIndex: 'Prozkoumat katalog',
      catalog: 'Katalog',
      realms: 'Archetypy světů',
      chaptersAria: 'Archetypy světů',
      readAtlas: 'Jak číst tento atlas →',
      chapterSoon: 'připravujeme',
      noResults: 'Tomuto výběru neodpovídá žádný svět.',
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
      chapter: 'Archetypy světů',
      theme: 'Téma',
      allChapters: 'Všechny archetypy',
      allThemes: 'Všechna témata',
      allAtmospheres: 'Všechny atmosféry',
      allHistoricalDepths: 'Všechny hloubky',
      allSpatialScopes: 'Všechny dosahy',
      allSocietalOrders: 'Všechny struktury',
      allSourcesOfPower: 'Všechny původy moci',
      allPerspectives: 'Všechny perspektivy',
      axisMin: 'Minimum osy (1–5)',
    },
    results: {
      countOne: 'svět',
      countFew: 'světy',
      countMany: 'světů',
    },
    world: {
      canonScope: 'Rozsah kánonu',
      universe: 'Vesmír',
      backToAtlas: 'Zpět na atlas',
      fullChronicle: 'Plná kronika',
      chronicleMissing: 'Kronika pro tento svět zatím chybí. Spusťte',
      chronicleLoading: 'Načítám kroniku…',
      spoilerNotice: 'Upozornění: Text vyzrazuje dějiny světa, obsahuje spoilery.',
      similarWorlds: 'Tematicky příbuzné světy',
      viewCard: 'Analytická karta',
      viewChronicle: 'Kronika světa',
      viewAppendices: 'Faktografie',
      viewAnalysis: 'Anatomie vyprávění',
      genreLine: 'Archetyp',
      howJudged: 'Jak číst tento atlas →',
    },
    card: {
      coreLabel: 'Jádro světa',
      metadataAria: 'Metadata světa',
      genreProfile: 'Profil archetypu',
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
    notes: {
      title: 'Vysvětlivky',
      back: 'Zpět na atlas',
      fieldsTitle: 'Pole karty',
      profileTitle: 'Profil světa na stupnicích',
      profileLead: 'Relativní redakční zařazení povahy světa.',
      scaleTitle: 'Stupnice',
      canonTitle: 'Kánon a výklad',
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
      tagline: 'An atlas of game universes',
      explore: 'Explore',
      chapters: 'Archetypes',
      about: 'About',
      aboutProject: 'The project',
      method: 'Notes on method',
      contact: 'Contact',
      sources: 'Sources and canon',
      copyright: '© 2026 Here Be Worlds',
      unofficial: 'An unofficial fan project',
      disclaimer: 'Game names and marks belong to their respective owners.',
    },
    home: {
      tagline: '43 worlds · 5 axes · comparison',
      kicker: '43 cosmologies · narrative chronicles · anatomy and myth',
      title: 'An Atlas of Game Universes',
      slogan: 'Every world has a story. None stands alone.',
      lead: 'A cartographic cabinet of the inner anatomy of game worlds—not mechanics, but history, metaphysics, and chronicle.',
      exploreIndex: 'Explore the index',
      catalog: 'Catalogue',
      realms: 'World archetypes',
      chaptersAria: 'World archetypes',
      readAtlas: 'How to read this atlas →',
      chapterSoon: 'coming soon',
      noResults: 'No world matches this selection.',
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
      chapter: 'World archetypes',
      theme: 'Theme',
      allChapters: 'All archetypes',
      allThemes: 'All themes',
      allAtmospheres: 'All atmospheres',
      allHistoricalDepths: 'All depths',
      allSpatialScopes: 'All scopes',
      allSocietalOrders: 'All orders',
      allSourcesOfPower: 'All sources of power',
      allPerspectives: 'All perspectives',
      axisMin: 'Axis minimum (1–5)',
    },
    results: {
      countOne: 'world',
      countMany: 'worlds',
    },
    world: {
      canonScope: 'Canon scope',
      universe: 'Universe',
      backToAtlas: 'Back to atlas',
      fullChronicle: 'Full chronicle',
      chronicleMissing: 'Chronicle not found. Run',
      chronicleLoading: 'Loading chronicle…',
      spoilerNotice: 'Note: This text reveals the history of the world and contains spoilers.',
      similarWorlds: 'Thematically related worlds',
      viewCard: 'Analytical card',
      viewChronicle: 'World chronicle',
      viewAppendices: 'Factography',
      viewAnalysis: 'Narrative anatomy',
      genreLine: 'Archetype',
      howJudged: 'How to read this atlas →',
    },
    card: {
      coreLabel: 'The core of the world',
      metadataAria: 'World metadata',
      genreProfile: 'Archetype profile',
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
    notes: {
      title: 'Notes',
      back: 'Back to the atlas',
      fieldsTitle: 'Card fields',
      profileTitle: 'World profile on the scales',
      profileLead: 'A relative editorial placement of the world’s character.',
      scaleTitle: 'Scale',
      canonTitle: 'Canon and interpretation',
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
  if (count === 1) return `1 ${ui.cs.results.countOne}`;
  if (count >= 2 && count <= 4) return `${count} ${ui.cs.results.countFew}`;
  return `${count} ${ui.cs.results.countMany}`;
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
