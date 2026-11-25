/**
 * Rejstřík pro hledání v hlavičce webu (lupa). Skládá se při sestavení z dat atlasu
 * a vychází jako /search-index.json (src/pages/search-index.json.ts); prohlížeč ho
 * načte až při prvním otevření hledání. Odkazy jsou bez `base`, ten přidá klient.
 */
import { worlds, chapters, themeTaxonomy } from './worlds';
import { TRAILS, trailSlug } from './trails';
import { publishedEssayFor } from './trail-pages';
import { uiT } from './i18n';
import { noteFields, noteKinshipPillars } from '../../data/meta/notes';
import axesMeta from '../../data/meta/axes.json';
import { MYSTERY_HOLDERS, MYSTERY_KINDS } from './triad-types';
import { themePath } from './themes';
import type { SearchEntry } from './site-search';

const both = (key: string) => ({ cs: uiT(key, 'cs'), en: uiT(key, 'en') });
const loc = (value: { en: string; cs?: string } | undefined) =>
  value ? { cs: value.cs ?? value.en, en: value.en } : undefined;

export function buildSearchEntries(): SearchEntry[] {
  const published = worlds.filter((w) => !w.draft);
  const chapterById = new Map(chapters.map((c) => [c.id, c]));
  const themeLabel = new Map(themeTaxonomy.map((th) => [th.slug, th.label]));
  const entries: SearchEntry[] = [];

  for (const w of published) {
    const chapter = chapterById.get(w.chapterId);
    const meta = w.metadata;
    entries.push({
      kind: 'world',
      id: w.id,
      title: loc(w.gameTitle)!,
      sub: loc(meta.genreProfile),
      href: `/worlds/${w.id}/`,
      hue: chapter?.accent,
      keys: [
        w.gameTitle.en,
        w.gameTitle.cs,
        w.chronicleTitle.cs,
        w.chronicleTitle.en,
        ...(w.universe ?? []).flatMap((u) => [u.cs, u.en]),
        ...w.studios,
        meta.keyActors?.cs,
        meta.keyActors?.en,
        meta.genreProfile?.cs,
        meta.genreProfile?.sub?.cs,
      ]
        .filter(Boolean)
        .join(' · '),
    });
  }

  for (const trail of TRAILS) {
    const essay = publishedEssayFor(trail.id);
    const members = trail.members
      .map((id) => published.find((w) => w.id === id))
      .filter((w): w is (typeof published)[number] => Boolean(w));
    entries.push({
      kind: 'trail',
      id: trail.id,
      title: both(trail.nameKey),
      sub: { cs: essay?.tagline ?? uiT(trail.descKey, 'cs'), en: uiT(trail.descKey, 'en') },
      href: `/putovani/${trailSlug(trail.id)}/`,
      keys: [
        ...trail.themes.flatMap((slug) => [themeLabel.get(slug)?.cs, themeLabel.get(slug)?.en]),
        ...members.flatMap((w) => [w.gameTitle.cs, w.gameTitle.en]),
      ]
        .filter(Boolean)
        .join(' · '),
    });
  }

  const trailThemes = new Set(TRAILS.flatMap((tr) => tr.themes));
  for (const th of themeTaxonomy) {
    const count = published.filter((w) => w.themes.includes(th.slug)).length;
    if (!count) continue;
    entries.push({
      kind: 'theme',
      id: th.slug,
      title: loc(th.label)!,
      href: themePath(th.slug),
      altHref: trailThemes.has(th.slug) ? `/putovani/?tema=${th.slug}` : undefined,
      count,
      keys: [th.label.en, th.label.cs].filter(Boolean).join(' · '),
    });
  }

  // Zkratky, kterými lidé archetypy hledají (všechny archetypy mají navíc slovo „archetyp“).
  const chapterAliases: Record<string, string> = {
    fantasy: 'fantasy fantazy',
    'science-fiction': 'scifi sci-fi sf vědecká',
    'post-apocalypse': 'postapo post-apo postapokalyptický apokalypsa',
    horror: 'horor horror hrůza',
    dystopia: 'dystopie dystopický utopie',
    historical: 'historie historický alternativní alternate',
    metaphysical: 'metafyzika metafyzický experimentální experimental',
  };
  for (const c of chapters) {
    entries.push({
      kind: 'chapter',
      id: c.id,
      title: loc(c.title)!,
      sub: loc(c.thesis),
      href: `/chapters/${c.id}/`,
      hue: c.accent,
      keys: [c.title.en, c.title.cs, chapterAliases[c.id], 'archetyp archetype'].filter(Boolean).join(' · '),
    });
  }

  // Pojmy z Vysvětlivek: vedou na oddíl, kde je výklad.
  const notes = both('notes.title');
  const term = (id: string, title: { cs: string; en: string }, anchor: string, keys = '') =>
    entries.push({ kind: 'term', id, title, sub: notes, href: `/notes/#${anchor}`, keys });
  noteFields.forEach((f, i) => term(`field-${i}`, loc(f.term)!, 'charakter'));
  term('coordinates', both('home.axesTitle'), 'stupnice', 'souřadnice coordinates profil světa world profile');
  for (const axis of axesMeta.axes) {
    const key = `map.name${axis.id.charAt(0).toUpperCase()}${axis.id.slice(1)}`;
    const poles = [axis.left.cs, axis.left.en, axis.right.cs, axis.right.en].filter(Boolean).join(' · ');
    term(`axis-${axis.id}`, both(key), 'stupnice', poles);
  }
  term('original-sin', both('card.originalSin'), 'triada', 'triáda triad');
  term('central-dilemma', both('card.centralDilemma'), 'triada', 'triáda triad');
  term('ultimate-mystery', both('card.ultimateMystery'), 'triada', 'triáda triad');
  // Druhy tajemství a kdo drží mezeru (typy hříchů a dilemat vedou do Galerie triád přes stránku).
  for (const x of [...MYSTERY_KINDS, ...MYSTERY_HOLDERS])
    term(`triad-${x.id}`, loc(x.label)!, 'triada', 'tajemství mystery mezera gap mapa neznáma');
  term('kinship', both('notes.kinshipTitle'), 'pribuznost', 'příbuznost kinship index sourozenci blízcí příbuzní spříznění vzdálení cizí');
  noteKinshipPillars.forEach((p, i) => term(`pillar-${i}`, loc(p.term)!, 'pribuznost', 'pilíř pillar příbuznost'));
  term('compass', both('notes.compassTitle'), 'kompas', 'kompas compass ladění otisk');
  term('canon', both('notes.canonTitle'), 'kanon', 'kánon canon výklad');

  const page = (id: string, title: { cs: string; en: string }, href: string, keys = '') =>
    entries.push({ kind: 'page', id, title, href, keys });
  page('atlas', both('atlasPage.title'), '/atlas/', 'atlas katalog catalog světy worlds');
  page('trails', both('trailsPage.title'), '/putovani/', 'putování journeys stezky eseje');
  page('compare', both('compare.title'), '/compare/', 'srovnání compare porovnat příbuznost');
  page('map', both('nav.map'), '/map/', 'mapa souřadnic coordinate map');
  page('themes', both('themesPage.title'), '/temata/', 'témata themes otázky');
  page('deep-time', both('deepTime.title'), '/hlubina-casu/', 'hlubina času deep time časová osa timeline dějiny stáří světa');
  page('triads', both('triads.title'), '/galerie-triad/', 'galerie triád triáda prvotní hřích hříchy ústřední dilema dilemata original sin dilemma');
  page('unknown', both('triads.mysteriesTitle'), '/galerie-triad/#hlavni-tajemstvi', 'hlavní tajemství mapa neznáma tajemstvi záhady nosná mezera řízená mezera mystery unknown');
  page('essay', { cs: 'Anatomie herního lore', en: 'Anatomy of game lore' }, '/anatomie-herniho-lore/', 'esej essay metoda method');
  page('theory', both('footer.theory'), '/teoreticke-zazemi/', 'prameny literatura sources teorie theory');
  page('notes', notes, '/notes/', 'vysvětlivky notes metoda pojmy glossary');
  page('about', both('about.title'), '/about/', 'o atlasu o projektu about');
  page('contact', both('contact.title'), '/contact/', 'kontakt contact napiš');

  return entries;
}
