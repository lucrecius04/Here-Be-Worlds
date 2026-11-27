import type { LocalizedString } from '../../src/schemas/world';

export type NoteField = {
  term: LocalizedString;
  help: LocalizedString;
  values?: LocalizedString;
};

export const noteFields: NoteField[] = [
  {
    term: { cs: 'Archetyp', en: 'Archetype' },
    help: {
      cs: 'Základní zařazení světa: jedna ze sedmi skupin podle toho, co svět určuje nejvíc. Archetyp dává světu barvu, souhvězdí na obloze atlasu a místo v katalogu.',
      en: 'The basic placement of a world: one of seven groups, by what defines the world most. The archetype gives the world its colour, its constellation in the atlas sky and its place in the catalogue.',
    },
    values: {
      cs: 'Fantasy · Science fiction · Postapokalypsa · Horor · Historické a alternativní světy · Dystopie · Metafyzické a experimentální světy',
      en: 'Fantasy · Science fiction · Post-apocalypse · Horror · Historical and alternate worlds · Dystopia · Metaphysical and experimental worlds',
    },
  },
  {
    term: { cs: 'Profil archetypu', en: 'Archetype profile' },
    help: {
      cs: 'Podtyp uvnitř archetypu, pojmenovaný podle rysů konkrétního světa.',
      en: 'A subtype within the archetype, named after the traits of the given world.',
    },
    values: {
      cs: 'Například: Temná fantasy · Space opera · Kyberpunk · Kosmický horor · Postjaderná satira · Alternativní historie · Metafikce',
      en: 'For example: Dark fantasy · Space opera · Cyberpunk · Cosmic horror · Post-nuclear satire · Alternate history · Metafiction',
    },
  },
  {
    term: { cs: 'Přesah', en: 'Overlap' },
    help: {
      cs: 'Kam svět sahá za své zařazení. Přesah archetypu míří do druhého archetypu, kam by svět mohl patřit také. Přesah profilu míří k sousednímu podtypu. Zapisujeme je stejně: Cyberpunk 2077 má archetyp „Dystopie · přesah: Science fiction“ a profil „Kyberpunk · přesah: noir“. Přesah má jen svět, u kterého je opravdu znát.',
      en: 'Where a world reaches beyond its placement. The archetype overlap points to a second archetype the world could also belong to. The profile overlap points to a neighbouring subtype. Both are written the same way: Cyberpunk 2077 has the archetype “Dystopia · overlap: Science fiction” and the profile “Cyberpunk · overlap: noir”. Only a world where it truly shows has an overlap.',
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
    term: { cs: 'Poetika světa', en: 'Poetics of the world' },
    help: {
      cs: 'Způsoby, kterými svět vypráví a kterými při tom vyniká, podle hlavních nástrojů jeho kroniky. Výklad a šest kruhů najdeš níž v oddílu Poetika světů.',
      en: 'The techniques a world tells with and excels at, taken from the main tools of its chronicle. The Poetics of worlds section below explains them and the six rings.',
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

/** Příbuznost světů: šest pilířů ve dvou trojicích a pět stupňů (slovy, bez procent; počítá compare.ts). */
export const noteKinshipIntro: LocalizedString = {
  cs: 'Příbuznost dvou světů skládáme ze šesti pilířů ve dvou trojicích: podoba říká, jak svět vypadá a zní, povaha, z čeho je postaven. Počítáme jen z údajů atlasu; nejvíc váží charakter, souřadnice a témata, nejméně poetika. Stupňů je pět a každý má pevnou hranici: nezáleží na pořadí mezi ostatními dvojicemi, takže se stupeň nezmění, ani když do atlasu přibudou další světy.',
  en: 'We build the kinship of two worlds from six pillars in two groups of three: look says how a world appears and sounds, nature what it is built from. We compute it from the atlas data alone; character, coordinates and themes weigh the most, poetics the least. There are five degrees and each has a fixed threshold: rank among the other pairs does not matter, so a degree does not change even when more worlds join the atlas.',
};

export const noteKinshipPillars: NoteField[] = [
  {
    term: { cs: 'Archetyp', en: 'Archetype' },
    help: {
      cs: 'Podoba. Stejný archetyp, nebo aspoň přesah do archetypu druhého světa, a stejný nebo příbuzný profil archetypu.',
      en: "Look. The same archetype, or at least an overlap into the other world's archetype, and the same or a kindred archetype profile.",
    },
  },
  {
    term: { cs: 'Souřadnice', en: 'Coordinates' },
    help: { cs: 'Podoba. Jak blízko si světy leží v pěti souřadnicích profilu světa.', en: 'Look. How close the worlds lie in the five coordinates of the world profile.' },
  },
  {
    term: { cs: 'Charakter', en: 'Character' },
    help: {
      cs: 'Podoba. Nálada (hlavní i vedlejší), původ moci, struktura společnosti, prostorový dosah, perspektiva hráče a paměť světa: druh historické hloubky, její délka a mýtický čas.',
      en: 'Look. Mood (main and secondary), source of power, societal order, spatial scope, player perspective and the memory of the world: the kind of historical depth, its length and mythic time.',
    },
  },
  {
    term: { cs: 'Témata', en: 'Themes' },
    help: { cs: 'Povaha. Společná témata a konflikty.', en: 'Nature. Shared themes and conflicts.' },
  },
  {
    term: { cs: 'Triáda (jádro příběhu)', en: 'Triad (story core)' },
    help: {
      cs: 'Povaha. Stejný typ prvotního hříchu, stejný typ ústředního dilematu a stejný druh hlavního tajemství.',
      en: 'Nature. The same type of original sin, the same type of central dilemma and the same kind of ultimate mystery.',
    },
  },
  {
    term: { cs: 'Poetika', en: 'Poetics' },
    help: {
      cs: 'Povaha. Společné způsoby z poetiky světů. Počítá se jen to, co světy sdílejí: kronika vybírá hlavní nástroje, takže chybějící nástroj nic neznamená.',
      en: 'Nature. Shared techniques from the poetics of worlds. Only what the worlds share counts: a chronicle lists the main tools, so a missing tool means nothing.',
    },
  },
];

export const noteKinshipLevels: { level: 1 | 2 | 3 | 4 | 5; help: LocalizedString }[] = [
  { level: 5, help: { cs: 'Nejvzácnější stupeň. Světy, které se shodují podobou i povahou. Nestačí k němu dost bodů: aspoň čtyři ze šesti pilířů musí mít výraznou nebo silnou shodu, jinak jsou světy Blízcí příbuzní.', en: 'The rarest degree. Worlds that agree in both look and nature. Enough points are not sufficient: at least four of the six pillars must show a marked or strong match, otherwise the worlds are Close kin.' } },
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

/** Hlubina času: jak číst sloupce a naši časovou osu (stránka /hlubina-casu/). */
/* Poetika světů (2026-11-27, na pokyn majitele; do 2026-11-28 Jak světy vyprávějí): výklad pojmů stránky /poetika-svetu/;
   texty šesti kruhů bere stránka Vysvětlivek z data/meta/narrative-tools.json. */
export const noteNarrationIntro: LocalizedString = {
  cs: 'Poetika světa je soubor nástrojů, kterými svět vypráví a kterými při tom vyniká. Každá kronika končí rozborem a v něm oddílem Hlavní nástroje vyprávění. Atlas z nich skládá přehled a řadí nástroje do šesti kruhů podle toho, co z hraní potřebují.',
  en: 'The poetics of a world is the set of tools it tells with and excels at. Every chronicle ends with an analysis that includes a section on its main narrative tools. The atlas turns them into an overview and sorts the tools into six rings by what they need from play.',
};

export const noteNarrationTerms: NoteField[] = [
  {
    term: { cs: 'Nástroj', en: 'Tool' },
    help: {
      cs: 'Konkrétní postup, který kronika u světa vyzdvihla: třeba deník hrdiny, popisky předmětů nebo smrt, která patří k příběhu. Kronika vybírá jen ty hlavní. Co mezi nimi chybí, svět umět může, jen tím nevyniká.',
      en: 'A specific device the chronicle singles out for a world: a hero’s diary, item descriptions, or death that belongs to the story. The chronicle lists only the main ones. A world may still use what is missing; it just does not stand out for it.',
    },
  },
  {
    term: { cs: 'Způsob', en: 'Technique' },
    help: {
      cs: 'Typ nástroje, který se opakuje aspoň u dvou světů, například Postavy a rozhovory nebo Stopy v prostoru. Způsoby vidíš na kartě světa (Poetika světa), ve filtru atlasu a ve Srovnání.',
      en: 'A type of tool that recurs in at least two worlds, such as Characters and conversations or Traces in space. You see techniques on the world card (Poetics of the world), in the atlas filter and in Compare.',
    },
  },
  {
    term: { cs: 'Kruh', en: 'Ring' },
    help: {
      cs: 'Jedna ze šesti skupin způsobů. Kruh neříká, jak dobře svět vypráví. Říká, co by muselo zůstat, aby nástroj přežil převyprávění: stačí text, nebo je potřeba obraz, místo, pravidla, zákulisí hry, případně ty sám.',
      en: 'One of six groups of techniques. A ring does not say how well a world tells its story. It says what would have to remain for the tool to survive a retelling: text alone, or image, place, rules, the backstage of the game, or you yourself.',
    },
  },
  {
    term: { cs: 'Unese i jiné umění × umí jen hra', en: 'Other arts can carry it × only a game can' },
    help: {
      cs: 'První tři kruhy by unesla i kniha, film nebo procházka místem. Od čtvrtého kruhu by převyprávění ztratilo pointu: Čin, Zákulisí a Hráče umí jen hra.',
      en: 'A book, a film or a walk through a place could carry the first three rings. From the fourth ring on, a retelling would lose the point: only a game can do Action, Backstage and Player.',
    },
  },
  {
    term: { cs: 'Vzniká při hraní', en: 'Emerges in play' },
    help: {
      cs: 'Značka u nástroje, jehož výsledek nenapsal autor. Vzešel z pravidel a z toho, jak hraješ.',
      en: 'A mark on a tool whose outcome no author wrote. It came out of the rules and of how you play.',
    },
  },
  {
    term: { cs: 'Mimo kruhy', en: 'Outside the rings' },
    help: {
      cs: 'Zákony světa, jeho fyzika a metafyzika. Kronika je vyzdvihla, ale nevyprávějí: jsou tím, co se vypráví. Mezi způsoby na kartě světa ani ve filtru se nepočítají.',
      en: 'The laws of a world, its physics and metaphysics. The chronicle singles them out, yet they do not tell: they are what is told. They are not counted among the techniques on the world card or in the filter.',
    },
  },
  {
    term: { cs: 'Podpis světa', en: 'Signature of a world' },
    help: {
      cs: 'Kombinace kruhů, ve kterých má svět nástroje. Kreslí se jako šest půlkruhů: čím víc nástrojů v kruhu, tím silnější oblouk.',
      en: 'The combination of rings in which a world has tools. It is drawn as six half-rings: the more tools in a ring, the heavier the arc.',
    },
  },
  {
    term: { cs: 'Ve Srovnání', en: 'In Compare' },
    help: {
      cs: 'Mřížka ukazuje způsoby vybraných světů, nejdřív společné, uvnitř skupiny podle kruhu. Do příbuznosti vstupuje jen to, co světy sdílejí.',
      en: 'The grid shows the techniques of the selected worlds, shared ones first, ordered by ring within each group. Only what the worlds share enters kinship.',
    },
  },
];

export const noteDeepTimeIntro: LocalizedString = {
  cs: 'Hlubina času převádí časové osy z Faktografie kronik na hloubku v letech. Každý svět je jeden sloupec a čím hlouběji sahá, tím starší událost si jeho dějiny pamatují.',
  en: 'Deep time turns the timelines from the chronicles’ Factography into depth in years. Each world is one column, and the deeper it reaches, the older the event its history remembers.',
};

export const noteDeepTimeTerms: NoteField[] = [
  {
    term: { cs: 'Sloupec a hladina', en: 'Column and surface' },
    help: {
      cs: 'Hladina je přítomnost světa, tedy poslední díl hlavní linie. Od ní se měří hloubka dolů k nejstarší události, o které kronika ví. Díly, které se odehrávají později, stojí nad hladinou.',
      en: 'The surface is the present of the world, the latest game of the main line. Depth is measured from it down to the oldest event the chronicle knows. Games set later stand above the surface.',
    },
  },
  {
    term: { cs: 'Období her a rysky', en: 'Period of the games and ticks' },
    help: {
      cs: 'Sytá barva vede od nejstaršího datovaného dílu po přítomnost a každý díl je v ní ryska. Díly, které kronika spojuje do jednoho řádku, jsou jedna ryska; díly bez data jsou jen v detailu světa.',
      en: 'The full colour runs from the earliest dated game to the present and each game is a tick in it. Games the chronicle joins in one row are one tick; undated games appear only in the world detail.',
    },
  },
  {
    term: { cs: 'Dějiny a fundamentální události', en: 'History and fundamental events' },
    help: {
      cs: 'Bledé vrstvy jsou dějiny před hrami, tenká mezera v nich je významná událost časové osy. Tušová spára je fundamentální událost světa, která ho rozlomí; někdy je zároveň dílem.',
      en: 'Pale layers are the history before the games, a thin gap marks a major event of the timeline. An ink seam is a fundamental event that breaks the world; sometimes it is also a game.',
    },
  },
  {
    term: { cs: 'Odhad, mýtus a cyklus', en: 'Estimate, myth and cycle' },
    help: {
      cs: 'Šrafování je odhad, kde kronika udává jen přibližné období. Události bez letopočtu leží pod měřitelným časem jako kroužky mýtického času a smyčka označuje světy, jejichž dějiny se opakují.',
      en: 'Hatching is an estimate where the chronicle gives only an approximate period. Events without a date lie below measurable time as rings of mythic time, and a loop marks worlds whose history repeats.',
    },
  },
  {
    term: { cs: 'Stupnice', en: 'Scale' },
    help: {
      cs: 'Stupnice je logaritmická: každý řád (1, 10, 100 let…) má stejnou výšku, takže blízká minulost je roztažená a hluboká stlačená. Mezi sto tisíci a milionem let je zlom a propast pod milionem je ještě stlačenější.',
      en: 'The scale is logarithmic: every order of magnitude (1, 10, 100 years…) has the same height, so the recent past is stretched and the deep past compressed. Between a hundred thousand and a million years the scale breaks, and the abyss below a million is compressed further.',
    },
  },
  {
    term: { cs: 'Na naší časové ose', en: 'On our timeline' },
    help: {
      cs: 'Druhý graf ukazuje jen světy, které počítají roky jako my, kolem dnešního roku: vlevo minulost, vpravo budoucnost. Měří se od dneška, ne od přítomnosti světa.',
      en: 'The second chart shows only worlds that count years as we do, around the present year: the past on the left, the future on the right. It is measured from today, not from the present of the world.',
    },
  },
];
