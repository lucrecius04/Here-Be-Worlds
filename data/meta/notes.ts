import type { LocalizedString } from '../../src/schemas/world';

export type NoteField = {
  term: LocalizedString;
  help: LocalizedString;
  values?: LocalizedString;
};

export const noteFields: NoteField[] = [
  {
    term: { cs: 'Profil archetypu', en: 'Archetype profile' },
    help: {
      cs: 'Hlavní skupina určuje archetyp. Podtyp a nejvýš dva přesahy jsou pojmenované podle rysů konkrétního světa.',
      en: 'The main group sets the archetype. A subtype and at most two overlaps are named after the traits of the given world.',
    },
    values: {
      cs: 'Fantasy · Science fiction · Postapokalypsa · Horor · Historické a alternativní světy · Dystopie · Metafyzické a experimentální světy',
      en: 'Fantasy · Science fiction · Post-apocalypse · Horror · Historical and alternate worlds · Dystopia · Metaphysical and experimental worlds',
    },
  },
  {
    term: { cs: 'Nálada a estetika', en: 'Mood and aesthetics' },
    help: {
      cs: 'Základní převažující esence a naladění světa. Dominantní a nejvýš dvě vedlejší.',
      en: 'The basic prevailing essence and tone of the world. One dominant and at most two secondary.',
    },
    values: {
      cs: 'Absurdita · Cynismus · Dekadence · Fascinace · Grotesknost · Humor · Ironie · Melancholie · Naděje · Napětí · Nostalgie · Odcizení · Sentimentálnost · Snovost · Strach · Tísnivost · Úžas · Vřelost · Vzdor · Vznešenost · Zoufalství',
      en: 'Absurdity · Alienation · Cynicism · Decadence · Defiance · Despair · Dreamlike · Fascination · Fear · Grotesque · Hope · Humor · Irony · Melancholy · Nostalgia · Oppression · Sentiment · Sublimity · Tension · Warmth · Wonder',
    },
  },
  {
    term: { cs: 'Historická hloubka', en: 'Historical depth' },
    help: {
      cs: 'Jak daleko sahají známé dějiny světa?',
      en: 'How far back do the known histories of the world reach?',
    },
    values: {
      cs: 'Generační (desetiletí, několik generací) · Historická (zaznamenaná staletí) · Civilizační (říše a kultury v tisíciletích) · Mytická (vznik světa, bohů a prvních civilizací) · Kosmická (cykly přesahující jednotlivé civilizace)',
      en: 'Generational (decades, a few generations) · Historical (recorded centuries) · Civilizational (empires and cultures across millennia) · Mythic (the making of the world, gods, and first civilizations) · Cosmic (cycles beyond any one civilization)',
    },
  },
  {
    term: { cs: 'Prostorový dosah', en: 'Spatial scope' },
    help: {
      cs: 'Hlavní dějiště příběhu.',
      en: 'The main stage of the story.',
    },
    values: {
      cs: 'Lokalita (budova, stanice, izolované místo) · Město · Region · Kontinent · Svět (planeta) · Hvězdný systém · Galaxie · Multiverzum a více rovin',
      en: 'Single location (a building, station, or isolated place) · City · Region · Continent · World (planet) · Star system · Galaxy · Multiverse and multiple planes',
    },
  },
  {
    term: { cs: 'Struktura společnosti', en: 'Societal order' },
    help: {
      cs: 'Dominantní civilizační stav a uspořádání světa napříč díly ságy.',
      en: 'The dominant civilizational condition and arrangement of the world across the saga.',
    },
    values: {
      cs: 'Zápasící říše a národy · Svět ve stínu utajené moci · Totalitní a korporátní klec · Roztříštěné enklávy po kolapsu · Umírající svět v troskách · Uzavřený mikrokosmos',
      en: 'Contending realms and nations · A world in the shadow of hidden power · Totalitarian and corporate cage · Fragmented enclaves after collapse · A dying world in ruins · A closed microcosm',
    },
  },
  {
    term: { cs: 'Původ moci', en: 'Source of power' },
    help: {
      cs: 'Zdroj síly světa či hybný zákon reality.',
      en: 'The source of the world’s power, or the driving law of its reality.',
    },
    values: {
      cs: 'Magie a alchymie · Božská a kosmická esence · Technologie a kybernetika · Biologie, geny a mutace · Síla mysli, víry a duší · Čistě lidské prostředky',
      en: 'Magic and alchemy · Divine and cosmic essence · Technology and cybernetics · Biology, genes, and mutation · The force of mind, faith, and souls · Purely human means',
    },
  },
  {
    term: { cs: 'Klíčoví aktéři', en: 'Key actors' },
    help: {
      cs: 'Až pět hlavních jednajících sil, frakcí, institucí, božstev nebo entit, které svět určují.',
      en: 'Up to five principal acting forces, factions, institutions, deities, or entities that shape the world.',
    },
  },
  {
    term: { cs: 'Perspektiva hráče', en: 'Player perspective' },
    help: {
      cs: 'Z jaké pozice je svět typicky prožíván.',
      en: 'From what position the world is typically lived.',
    },
    values: {
      cs: 'Vyvolený a šampion osudu · Poutník a psanec na okraji · Svědek a přeživší v soukolí · Vyšetřovatel a hledač pravdy · Vůdce a hybatel frakcí · Hráč jako součást světa',
      en: 'Chosen champion of fate · Pilgrim and outcast on the margins · Witness and survivor in the machinery · Investigator and seeker of truth · Leader and mover of factions · The player as part of the world',
    },
  },
  {
    term: { cs: 'Jak svět vypráví', en: 'How the world tells its story' },
    help: {
      cs: 'Hlavní nástroje, jimiž svět předává svůj příběh. Nejvýš tři.',
      en: 'The main tools through which the world tells its story. At most three.',
    },
    values: {
      cs: 'Prostorové vyprávění · Popisky předmětů · Knihy a dokumenty · Nahrávky a deníky · Dialogy · Nespolehliví vypravěči · Vícenásobné průchody · Filmové scény · Mechanika jako význam',
      en: 'Environmental storytelling · Item descriptions · Books and documents · Recordings and logs · Dialogue · Unreliable narrators · Multiple playthroughs · Cinematic scenes · Mechanics as meaning',
    },
  },
  {
    term: { cs: 'Témata', en: 'Themes' },
    help: {
      cs: 'Významná témata a konflikty přítomné v herním světě. Nejvýš šest témat na jeden svět.',
      en: 'Significant themes and conflicts present in the game world. At most six themes per world.',
    },
    values: {
      cs: 'Bohové · Cyklické dějiny · Humor, ironie, nadsázka · Identita a existence · Kolaps civilizace · Konspirace · Láska a vztahy · Moc a nadvláda · Objevování · Odhalování minulosti · Pokrok a jeho důsledky · Politika a intriky · Pomsta · Přátelství a společenství · Přežití · Smrt a nesmrtelnost · Svobodná vůle a osud · Válka · Vina a vykoupení · Víra',
      en: 'Civilizational collapse · Conspiracy · Cyclical history · Death and immortality · Discovery · Faith · Free will and fate · Friendship and fellowship · Gods · Guilt and redemption · Humor, irony, exaggeration · Identity and existence · Love and relationships · Politics and intrigue · Power and dominion · Progress and its costs · Revenge · Survival · Uncovering the past · War',
    },
  },
];

export const noteScale: { value: string; label: LocalizedString }[] = [
  { value: '1', label: { cs: 'krajní levý pól', en: 'far left pole' } },
  { value: '2', label: { cs: 'zřetelně vychýlené k levému pólu', en: 'clearly leaning to the left pole' } },
  { value: '3', label: { cs: 'vyvážené nebo ambivalentní', en: 'balanced or ambivalent' } },
  { value: '4', label: { cs: 'zřetelně vychýlené k pravému pólu', en: 'clearly leaning to the right pole' } },
  { value: '5', label: { cs: 'krajní pravý pól', en: 'far right pole' } },
];

export const noteCanon: LocalizedString = {
  cs: `Každý profil v tomto atlase stavíme na pevných základech – vycházíme z hlavního herního kánonu, přímo vyprávěných událostí a oficiálních doprovodných materiálů (knih, kodexů či průvodců světem). Tam, kde tvůrci záměrně nechávají v dějinách bílá místa, si nehrajeme na všeznalé kronikáře. Nejednoznačné momenty formulujeme opatrně jako možný výklad a divočejší fanouškovské hypotézy či nepotvrzené spekulace striktně oddělujeme – v kronikách mají své vlastní místo ve speciálních rámečcích „Jak se to vykládá“, aby bylo vždy jasné, kde končí fakta světa a začíná domýšlení.

Zároveň si plně uvědomujeme, že živoucí fiktivní vesmíry nelze změřit pravítkem ani uzavřít do neprodyšných škatulek. Profily světů, zařazení do kategorií i hodnoty pěti souřadnic proto nelze brát jako exaktní vědu nebo definitivní verdikt. Jde o orientační, často pocitové a interpretační záchytné body, které mají sloužit především jako kompas. Pokud by někdo u některého světa vnímal míru jeho metafyzična, epičnosti nebo morální šedi o dílek jinak než my, je to naprosto v pořádku – cílem této metody není světy sešněrovat do tabulky, ale nabídnout společný jazyk, díky kterému o nich můžeme přemýšlet v souvislostech.`,
  en: `Every profile in this atlas is built on firm ground – we start from the main game canon, directly told events, and official companion materials (books, codices, or world guides). Where the creators deliberately leave blank spaces in the history, we do not play at being all-knowing chroniclers. Ambiguous moments are worded carefully as a possible reading, and the wilder fan hypotheses or unconfirmed speculations we strictly separate – in the chronicles they have their own place in special “How it is read” boxes, so it is always clear where the facts of the world end and conjecture begins.

At the same time we fully understand that living fictional universes cannot be measured with a ruler or sealed into airtight boxes. World profiles, category placements, and values of the five coordinates should therefore not be taken as exact science or a definitive verdict. They are orienting, often felt and interpretive landmarks, meant first of all as a compass. If for a given world you feel the measure of its metaphysics, epic scale, or moral grey a notch differently than we do, that is entirely all right – the aim of this method is not to lace worlds into a table, but to offer a shared language through which we can think about them in context.`,
};

/** Příbuznost světů: čtyři pilíře a pět stupňů (slovy, bez procent; počítá compare.ts). */
export const noteKinshipIntro: LocalizedString = {
  cs: 'Příbuznost dvou světů skládáme ze čtyř pilířů. Všechny dvojice v atlasu pak seřadíme od nejbližší po nejvzdálenější a rozdělíme do pěti stupňů.',
  en: 'We build the kinship of two worlds from four pillars. Then we rank every pair in the atlas from closest to farthest and split them into five degrees.',
};

export const noteKinshipPillars: NoteField[] = [
  {
    term: { cs: 'Archetyp a profil archetypu', en: 'Archetype and archetype profile' },
    help: { cs: 'Archetyp, podtyp a přesahy.', en: 'Archetype, subtype and overlaps.' },
  },
  {
    term: { cs: 'Profil světa', en: 'World profile' },
    help: { cs: 'Jak blízko si světy leží v pěti souřadnicích.', en: 'How close the worlds lie in the five coordinates.' },
  },
  {
    term: { cs: 'Charakter světa', en: 'World character' },
    help: {
      cs: 'Nálada, původ moci, struktura společnosti, historická hloubka, prostorový dosah a perspektiva hráče.',
      en: 'Mood, source of power, societal order, historical depth, spatial scope and player perspective.',
    },
  },
  {
    term: { cs: 'Témata', en: 'Themes' },
    help: { cs: 'Společná témata a konflikty.', en: 'Shared themes and conflicts.' },
  },
];

export const noteKinshipLevels: { level: 1 | 2 | 3 | 4 | 5; help: LocalizedString }[] = [
  { level: 5, help: { cs: 'Nejvzácnější stupeň. Světy, které sdílejí archetyp, ladění i témata.', en: 'The rarest degree. Worlds that share archetype, tone and themes.' } },
  { level: 4, help: { cs: 'Shodují se ve většině pilířů a liší se spíš v detailech.', en: 'They agree on most pillars and differ mostly in detail.' } },
  { level: 3, help: { cs: 'Mají společný základ, ale každý jde vlastní cestou.', en: 'They share a common ground, but each goes its own way.' } },
  { level: 2, help: { cs: 'Potkají se jen v jednom dvou rysech.', en: 'They meet in only one or two traits.' } },
  { level: 1, help: { cs: 'Skoro nic společného.', en: 'Almost nothing in common.' } },
];

/** Kompas a ladění na Mapě souřadnic: jen pět souřadnic, žádná příbuznost. */
export const noteCompass: LocalizedString = {
  cs: `Kompas „Který svět je tvůj?“ na titulní straně a v atlasu i ladění „Kde leží tvůj svět?“ v Mapě souřadnic pracují jen s pěti souřadnicemi. Tvoje nastavení se změří proti profilu každého světa jako vzdálenost dvou bodů: nejblíž je svět, jehož profil se tvému ladění podobá nejvíc, a protinožec je ten nejvzdálenější.

Protože zadáváš jen souřadnice, kompas příbuznost nepočítá. Archetyp, charakter světa ani témata do něj nevstupují, a proto se jeho výsledek může lišit od stupňů příbuznosti ve srovnání.`,
  en: `The “Which world is yours?” compass on the home page and in the atlas, and the “Where does your world lie?” tuning on the Coordinate map, work only with the five coordinates. Your setting is measured against each world's profile as the distance between two points: the closest world is the one whose profile resembles your tuning most, and the antipode is the farthest.

Because you only enter coordinates, the compass does not calculate kinship. Archetype, world character and themes play no part in it, so its result can differ from the degrees of kinship in the comparison.`,
};
