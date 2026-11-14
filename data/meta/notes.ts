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
    term: { cs: 'Atmosféra', en: 'Atmosphere' },
    help: {
      cs: 'Převažující nálada a emoční naladění světa. Dominantní a nejvýš dvě vedlejší.',
      en: 'The prevailing mood and emotional tone of the world. One dominant and at most two secondary.',
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
      cs: 'Město · Region · Kontinent · Svět (planeta) · Hvězdný systém · Galaxie · Multiverzum a více rovin',
      en: 'City · Region · Continent · World (planet) · Star system · Galaxy · Multiverse and multiple planes',
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
      cs: 'Vyvolený a šampion osudu · Poutník a psanec na okraji · Svědek a přeživší v soukolí · Vůdce a hybatel frakcí · Hráč jako součást světa',
      en: 'Chosen champion of fate · Pilgrim and outcast on the margins · Witness and survivor in the machinery · Leader and mover of factions · The player as part of the world',
    },
  },
  {
    term: { cs: 'Témata', en: 'Themes' },
    help: {
      cs: 'Významná témata a konflikty přítomny v herním světě. Maximálně šest témat na herní svět.',
      en: 'Significant themes and conflicts present in the game world. At most six themes per world.',
    },
    values: {
      cs: 'Bohové · Cyklické dějiny · Humor, ironie, nadsázka · Identita a existence · Kolaps civilizace · Konspirace · Láska a vztahy · Moc a nadvláda · Objevování · Odhalování minulosti · Pokrok a jeho důsledky · Politika a intriky · Pomsta · Přátelství a společenství · Přežití · Svobodná vůle a osud · Válka · Vina a vykoupení · Víra',
      en: 'Civilizational collapse · Conspiracy · Cyclical history · Discovery · Faith · Free will and fate · Friendship and fellowship · Gods · Guilt and redemption · Humor, irony, exaggeration · Identity and existence · Love and relationships · Politics and intrigue · Power and dominion · Progress and its costs · Revenge · Survival · Uncovering the past · War',
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
  cs: 'Povaha posuzovaného světa stojí na herním kánonu a oficiálních doprovodných materiálech. Nejednoznačná místa jsou formulována opatrně jako výklad. Nepotvrzené teorie patří do kronik, do rámečků „Jak se to vykládá“.',
  en: 'The character of the world under study rests on game canon and official companion materials. Ambiguous places are worded carefully as interpretation. Unconfirmed theories belong in the chronicles, in the “How it is read” boxes.',
};
