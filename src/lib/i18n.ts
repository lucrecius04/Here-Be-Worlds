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
    theme: {
      group: 'Vzhled',
      light: 'Světlý režim',
      dark: 'Tmavý režim',
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
      allAtmospheres: 'Všechny nálady',
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
      viewCard: 'Charakter světa',
      viewChronicle: 'Kronika',
      viewAppendices: 'Faktografie',
      viewAnalysis: 'Anatomie vyprávění',
      genreLine: 'Archetyp',
      howJudged: 'Jak číst tento atlas →',
    },
    card: {
      coreLabel: 'Jádro světa',
      metadataAria: 'Metadata světa',
      genreProfile: 'Profil archetypu',
      atmosphere: 'Nálada a estetika',
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
      lead: 'Položte dva světy na stejných pěti osách — uvidíte, kde se potkávají a kde se rozcházejí.',
      back: 'Zpět na atlas',
      slotEmpty: 'Vyberte svět',
      searchPlaceholder: 'Hledat světy…',
      clear: 'Odebrat',
      addThird: '+ třetí svět',
      removeSlot: 'Zavřít slot',
      suggested: 'Připravené páry',
      pickTwo: 'Vyberte alespoň dva světy.',
      axesTitle: 'Pět os',
      themesTitle: 'Témata',
      themesShared: 'Společná',
      themesOnly: 'Jen',
      insightThemes: 'Společná témata',
      insightAxes: 'Nejblíž na osách',
      insightNone: 'Žádná společná témata',
      coresTitle: 'Jádro světa',
      factsTitle: 'Charakter',
      triadTitle: 'Trojblok',
      openCard: 'Charakter světa',
      openChronicle: 'Kronika',
      compareWith: 'Srovnat',
      noMatch: 'Tomuto hledání neodpovídá žádný svět.',
      versus: '×',
    },
    map: {
      title: '2D kartografická mapa',
      body: 'Fáze 2: scatter plot všech 43 světů — libovolné dvě z pěti os na osy X a Y.',
      back: 'Zpět na atlas',
    },
    chapterPage: {
      back: 'Zpět',
      kicker: 'Archetyp',
      empty: 'V tomto archetypu zatím není žádný profil.',
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
      canonTitle: 'Kánon, výklad a naše metoda',
    },
    about: {
      title: 'O projektu',
      lead: 'Proč mapujeme místa, která neexistují',
      body: `Tento projekt vznikl z docela obyčejné zvědavosti a celoživotní fascinace dějinami, mytologií a vyprávěním příběhů. Když procházíme skvělým herním světem, málokdy vnímáme jen samotné úkoly na obrazovce. Přitahuje nás i to, co leží v pozadí – polorozpadlé chrámy bohů, na jejichž jména už místní zapomněli, ozvěny dávných občanských válek, podivné zákony magie nebo politické napětí, které visí ve vzduchu onoho přístavního města. Ty nejlepší fiktivní vesmíry totiž nepůsobí jako kulisy postavené kolem hráče, ale spíš jako místa, která žila dávno před námi a budou žít i poté, co odložíme ovladač.

Často se ale stává, že všechna tato krása zůstane roztroušená v desítkách vedlejších dialogů, prastarých svitcích, vybitých databankách nebo popiscích předmětů, na které uprostřed akce není dostatek klidu. Právě proto vzniklo Here Be Worlds. Chtěli jsme vytvořit tiché místo, kde odložíme meče, pulsní pušky, statistiky i herní mechaniky a podíváme se na fiktivní světy očima historika, kartografa a pozorného vypravěče. Nezajímá nás tu, jak porazit závěrečného bosse, ale co ten svět drží pohromadě, jaký prvotní hřích ho v minulosti nalomil a na jaké otázky v něm neexistuje snadná odpověď.

Každý ze světů v tomto atlase proto prozkoumáváme hlavně ze dvou úhlů. Tím prvním je analytická stránka – pokus nahlédnout pod kapotu daného univerza, pojmenovat jeho esenci, původ moci, uspořádání společnosti a zmapovat ho na pěti myšlenkových osách. Druhým úhlem je pak výpravná kronika, která poskládá roztříštěné střípky lore do jednoho souvislého příběhu – od prvního mýtu o stvoření až po poslední známé události. Díky tomu lze světy nejen nerušeně číst jako napínavou knihu, ale také je mezi sebou porovnávat a nacházet nečekané souvislosti tam, kde by je člověk na první pohled vůbec nehledal.

Berte prosím tento atlas jako skromnou poctu všem scenáristům, designérům a vypravěčům, kteří dokázali z nul a jedniček vystavět celé civilizace. Ať už sem přicházíte připomenout si dějiny světa, ve kterém jste kdysi strávili stovky hodin, nebo jen hledáte inspiraci a chuť objevit vesmír, do kterého jste se zatím neodvážili vkročit – udělejte si pohodlí. Mapa je rozložená.`,
      signoff: 'Tým Here Be Worlds',
      note: 'Malá poznámka, která by ale měla být zmíněna. Při tvorbě obsahu využíváme umělou inteligenci jako pomocníka a nástroj. Pomáhá nám shromažďovat, syntetizovat a vizualizovat data. Nejsme neomylní – ani my a bohužel ani AI. K různým halucinacím máme veskrze negativní postoje a nemilosrdně je mýtíme. Pokud nicméně na stránkách Here Be Worlds narazíte na nepřesnost, chybný údaj nebo zavádějící interpretaci, budeme za zpětnou vazbu velmi vděční.',
      noteLink: 'Napište nám.',
    },
    contact: {
      title: 'Napište nám',
      lead: 'Máte připomínku, našli jste chybu nebo máte dobrý nápad na vylepšení? Pište!',
      name: 'Jméno',
      namePlaceholder: 'Vaše jméno',
      email: 'E-mail',
      emailPlaceholder: 'vas@email.cz',
      message: 'Zpráva',
      messagePlaceholder: 'Váš komentář, dotaz nebo připomínka…',
      submit: 'Odeslat zprávu',
      mailSubject: 'Here Be Worlds',
    },
  },
  en: {
    siteName: 'Here Be Worlds',
    nav: {
      atlas: 'Atlas',
      compare: 'Compare',
      map: 'Map',
    },
    theme: {
      group: 'Appearance',
      light: 'Light mode',
      dark: 'Dark mode',
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
      allAtmospheres: 'All moods',
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
      viewCard: 'World character',
      viewChronicle: 'Chronicle',
      viewAppendices: 'Factography',
      viewAnalysis: 'Narrative anatomy',
      genreLine: 'Archetype',
      howJudged: 'How to read this atlas →',
    },
    card: {
      coreLabel: 'The core of the world',
      metadataAria: 'World metadata',
      genreProfile: 'Archetype profile',
      atmosphere: 'Mood and aesthetics',
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
      title: 'World comparison',
      lead: 'Lay two worlds on the same five axes — see where they meet and where they part.',
      back: 'Back to the atlas',
      slotEmpty: 'Choose a world',
      searchPlaceholder: 'Search worlds…',
      clear: 'Remove',
      addThird: '+ third world',
      removeSlot: 'Close slot',
      suggested: 'Prepared pairs',
      pickTwo: 'Choose at least two worlds.',
      axesTitle: 'Five axes',
      themesTitle: 'Themes',
      themesShared: 'Shared',
      themesOnly: 'Only',
      insightThemes: 'Shared themes',
      insightAxes: 'Closest on the axes',
      insightNone: 'No shared themes',
      coresTitle: 'The core of the world',
      factsTitle: 'Character',
      triadTitle: 'Triad',
      openCard: 'World character',
      openChronicle: 'Chronicle',
      compareWith: 'Compare',
      noMatch: 'No world matches this search.',
      versus: '×',
    },
    map: {
      title: '2D cartography map',
      body: 'Phase 2: scatter plot of all 43 worlds—pick any two of the five axes for X and Y.',
      back: 'Return to the atlas',
    },
    chapterPage: {
      back: 'Back',
      kicker: 'Archetype',
      empty: 'No profiles in this archetype yet.',
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
      canonTitle: 'Canon, interpretation, and our method',
    },
    about: {
      title: 'About the project',
      lead: 'Why we map places that do not exist',
      body: `This project grew out of fairly ordinary curiosity and a lifelong fascination with history, mythology, and storytelling. When we move through a great game world, we rarely take in only the tasks on the screen. We are drawn to what lies in the background – half-ruined temples of gods whose names the locals have already forgotten, echoes of ancient civil wars, strange laws of magic, or the political tension hanging in the air of that harbour city. The best fictional universes do not feel like sets built around the player, but rather like places that lived long before us and will go on living after we put the controller down.

Too often, though, all that beauty remains scattered across dozens of side dialogues, ancient scrolls, drained databanks, or item descriptions for which, in the middle of the action, there is not enough quiet. That is why Here Be Worlds came to be. We wanted a still place where we set aside swords, pulse rifles, statistics, and game mechanics, and look at fictional worlds through the eyes of a historian, a cartographer, and an attentive storyteller. We are not interested here in how to beat the final boss, but in what holds that world together, what original sin cracked it in the past, and which questions in it have no easy answer.

Each of the worlds in this atlas is therefore explored mainly from two angles. The first is the analytical page – an attempt to look under the hood of a given universe, to name its essence, the origin of power, the arrangement of society, and to map it on five axes of thought. The second angle is the narrative chronicle, which gathers the scattered shards of lore into one continuous story – from the first myth of creation to the last known events. Worlds can then be read in peace as a gripping book, and also compared with one another, revealing unexpected connections where at first glance one would not look for them at all.

Please take this atlas as a modest tribute to every writer, designer, and storyteller who managed to build entire civilizations out of zeroes and ones. Whether you come here to recall the history of a world in which you once spent hundreds of hours, or you are only looking for inspiration and the appetite to discover a universe you have not yet dared to enter – make yourself comfortable. The map is spread out.`,
      signoff: 'The Here Be Worlds team',
      note: 'A small note that should nevertheless be mentioned. In creating the content we use artificial intelligence as a helper and a tool. It helps us gather, synthesize, and visualize data. We are not infallible – neither we, unfortunately, nor AI. We take a thoroughly negative view of various hallucinations and weed them out without mercy. If, however, you come across an inaccuracy, a wrong fact, or a misleading interpretation on the pages of Here Be Worlds, we will be very grateful for the feedback.',
      noteLink: 'Write to us.',
    },
    contact: {
      title: 'Write to us',
      lead: 'A note, a mistake you found, or a good idea for an improvement? Write!',
      name: 'Name',
      namePlaceholder: 'Your name',
      email: 'Email',
      emailPlaceholder: 'you@email.com',
      message: 'Message',
      messagePlaceholder: 'Your comment, question, or note…',
      submit: 'Send message',
      mailSubject: 'Here Be Worlds',
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
