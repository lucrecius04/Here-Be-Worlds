import type { LocalizedString } from '../../src/schemas/world';

export type FieldOption = { en: string; cs: string };

export const atmosphereOptions: FieldOption[] = [
  { en: 'Absurdity', cs: 'Absurdita' },
  { en: 'Cynicism', cs: 'Cynismus' },
  { en: 'Decadence', cs: 'Dekadence' },
  { en: 'Fascination', cs: 'Fascinace' },
  { en: 'Grotesque', cs: 'Grotesknost' },
  { en: 'Humor', cs: 'Humor' },
  { en: 'Irony', cs: 'Ironie' },
  { en: 'Melancholy', cs: 'Melancholie' },
  { en: 'Hope', cs: 'Naděje' },
  { en: 'Tension', cs: 'Napětí' },
  { en: 'Nostalgia', cs: 'Nostalgie' },
  { en: 'Alienation', cs: 'Odcizení' },
  { en: 'Sentiment', cs: 'Sentimentálnost' },
  { en: 'Dreamlike', cs: 'Snovost' },
  { en: 'Fear', cs: 'Strach' },
  { en: 'Oppression', cs: 'Tísnivost' },
  { en: 'Wonder', cs: 'Úžas' },
  { en: 'Warmth', cs: 'Vřelost' },
  { en: 'Defiance', cs: 'Vzdor' },
  { en: 'Sublimity', cs: 'Vznešenost' },
  { en: 'Despair', cs: 'Zoufalství' },
];

export const historicalDepthOptions: FieldOption[] = [
  { en: 'Generational', cs: 'Generační' },
  { en: 'Historical', cs: 'Historická' },
  { en: 'Civilizational', cs: 'Civilizační' },
  { en: 'Mythic', cs: 'Mytická' },
  { en: 'Cosmic', cs: 'Kosmická' },
];

export const spatialScopeOptions: FieldOption[] = [
  { en: 'Single location', cs: 'Lokalita' },
  { en: 'City', cs: 'Město' },
  { en: 'Region', cs: 'Region' },
  { en: 'Continent', cs: 'Kontinent' },
  { en: 'World (planet)', cs: 'Svět (planeta)' },
  { en: 'Star system', cs: 'Hvězdný systém' },
  { en: 'Galaxy', cs: 'Galaxie' },
  { en: 'Multiverse and multiple planes', cs: 'Multiverzum a více rovin' },
];

export const societalOrderOptions: FieldOption[] = [
  { en: 'Fragmented enclaves after collapse', cs: 'Roztříštěné enklávy po kolapsu' },
  { en: 'Totalitarian and corporate cage', cs: 'Totalitní a korporátní klec' },
  { en: 'Dying world in ruins', cs: 'Umírající svět v troskách' },
  { en: 'A closed microcosm', cs: 'Uzavřený mikrokosmos' },
  { en: 'A world in the shadow of hidden power', cs: 'Svět ve stínu utajené moci' },
  { en: 'Contending realms and nations', cs: 'Zápasící říše a národy' },
];

export const sourceOfPowerOptions: FieldOption[] = [
  { en: 'Biology, genes, and mutation', cs: 'Biologie, geny a mutace' },
  { en: 'Divine and cosmic essence', cs: 'Božská a kosmická esence' },
  { en: 'Purely human means', cs: 'Čistě lidské prostředky' },
  { en: 'Magic and alchemy', cs: 'Magie a alchymie' },
  { en: 'The force of mind, faith, and souls', cs: 'Síla mysli, víry a duší' },
  { en: 'Technology and cybernetics', cs: 'Technologie a kybernetika' },
];

export const protagonistPerspectiveOptions: FieldOption[] = [
  { en: 'The player as part of the world', cs: 'Hráč jako součást světa' },
  { en: 'Pilgrim and outcast on the margins', cs: 'Poutník a psanec na okraji' },
  { en: 'Witness and survivor in the machinery', cs: 'Svědek a přeživší v soukolí' },
  { en: 'Leader and mover of factions', cs: 'Vůdce a hybatel frakcí' },
  { en: 'Investigator and seeker of truth', cs: 'Vyšetřovatel a hledač pravdy' },
  { en: 'Chosen champion of fate', cs: 'Vyvolený a šampion osudu' },
];

export type MetadataFilterKey =
  | 'atmosphere'
  | 'historicalDepth'
  | 'spatialScope'
  | 'societalOrder'
  | 'sourceOfPower'
  | 'protagonistPerspective';

type MetadataField = LocalizedString & {
  sub?: LocalizedString;
};

function normalize(value: string): string {
  return value.toLowerCase().replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();
}

function sameOrPrefix(text: string, needle: string): boolean {
  return text === needle || text.startsWith(`${needle} `) || needle.startsWith(`${text} `);
}

export function fieldMatchesOption(field: MetadataField | undefined, optionId: string): boolean {
  if (!field || !optionId) return false;
  const option =
    [
      ...atmosphereOptions,
      ...historicalDepthOptions,
      ...spatialScopeOptions,
      ...societalOrderOptions,
      ...sourceOfPowerOptions,
      ...protagonistPerspectiveOptions,
    ].find((item) => item.en === optionId);
  if (!option) return false;

  const needles = [option.en, option.cs].map(normalize);
  const mains = [field.en, field.cs].filter(Boolean).map((value) => normalize(value as string));
  const extras = [field.sub?.en, field.sub?.cs].filter(Boolean).map((value) => normalize(value as string));

  if (mains.some((text) => needles.some((needle) => sameOrPrefix(text, needle)))) return true;
  return extras.some((text) => needles.some((needle) => text === needle || text.includes(needle)));
}
