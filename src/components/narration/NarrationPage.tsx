import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { LocalizedString } from '../../schemas/world';
import { t, uiT, worldCountLabel, type Locale } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import { withBase } from '../../lib/base-url';
import '../../styles/narration.css';

export type NarrPageFamily = {
  id: string;
  short: LocalizedString;
  label: LocalizedString;
  kin: LocalizedString;
  desc: LocalizedString;
  own: boolean;
};
export type NarrPageTechnique = {
  id: string;
  family: string;
  label: LocalizedString;
  desc: LocalizedString;
  trail?: { slug: string; label: LocalizedString };
};
export type NarrPageTool = { world: string; technique: string; title: string; aside?: string; text: string };
export type NarrPageWorld = {
  id: string;
  title: LocalizedString;
  chapterId: string;
  accent: { light: string; dark: string };
  anchor: string;
  counts: number[];
  centroid: number;
};
export type NarrPageChapter = { id: string; title: LocalizedString; short?: LocalizedString };

type Props = {
  base: string;
  families: NarrPageFamily[];
  techniques: NarrPageTechnique[];
  tools: NarrPageTool[];
  worlds: NarrPageWorld[];
  chapters: NarrPageChapter[];
};

type Sort = 'centroid' | 'archetype' | 'alpha';

const hue = (accent: { light: string; dark: string }) =>
  ({ '--nv-hue-l': accent.light, '--nv-hue-d': accent.dark }) as CSSProperties;

function plural(n: number, locale: Locale, one: string, few: string, many: string): string {
  const word =
    locale === 'en' ? (n === 1 ? uiT(`narrPage.${one}`, locale) : uiT(`narrPage.${many}`, locale)) : n === 1 ? uiT(`narrPage.${one}`, locale) : n >= 2 && n <= 4 ? uiT(`narrPage.${few}`, locale) : uiT(`narrPage.${many}`, locale);
  return `${n} ${word}`;
}
const toolsLabel = (n: number, locale: Locale) => plural(n, locale, 'toolOne', 'toolFew', 'toolMany');
const techLabel = (n: number, locale: Locale) => plural(n, locale, 'techOne', 'techFew', 'techMany');

const SPECTRUM_ID = 'od-slova-ke-hre';
const WORLDS_ID = 'svety';

export default function NarrationPage({ base, families, techniques, tools, worlds, chapters }: Props) {
  const locale = useLocale();
  const byWorld = useMemo(() => new Map(worlds.map((w) => [w.id, w])), [worlds]);
  const techFamily = useMemo(() => new Map(techniques.map((x) => [x.id, x.family])), [techniques]);
  const chapterOrder = useMemo(() => new Map(chapters.map((c, i) => [c.id, i])), [chapters]);
  const chapterName = (id: string) => {
    const c = chapters.find((x) => x.id === id);
    return c ? t(c.short ?? c.title, locale) : id;
  };

  // Nástroje v pořadí atlasu (archetyp, název), aby byl rejstřík v každém způsobu stejně řazený.
  const orderedTools = useMemo(
    () =>
      [...tools].sort((a, b) => {
        const wa = byWorld.get(a.world);
        const wb = byWorld.get(b.world);
        return (
          (chapterOrder.get(wa?.chapterId ?? '') ?? 0) - (chapterOrder.get(wb?.chapterId ?? '') ?? 0) ||
          t(wa?.title ?? { en: '' }, locale).localeCompare(t(wb?.title ?? { en: '' }, locale), locale)
        );
      }),
    [tools, byWorld, chapterOrder, locale],
  );

  const familyTools = (familyId: string) => orderedTools.filter((tool) => techFamily.get(tool.technique) === familyId);
  const firstOwn = families.findIndex((f) => f.own);

  const [sort, setSort] = useState<Sort>('centroid');
  const sortedWorlds = useMemo(() => {
    const name = (w: NarrPageWorld) => t(w.title, locale);
    const list = [...worlds];
    if (sort === 'alpha') return list.sort((a, b) => name(a).localeCompare(name(b), locale));
    if (sort === 'archetype')
      return list.sort(
        (a, b) => (chapterOrder.get(a.chapterId) ?? 0) - (chapterOrder.get(b.chapterId) ?? 0) || name(a).localeCompare(name(b), locale),
      );
    return list.sort((a, b) => a.centroid - b.centroid || name(a).localeCompare(name(b), locale));
  }, [worlds, sort, chapterOrder, locale]);

  // Oddíl, který právě čteš: zvýrazní se v lepivém pruhu.
  const jumpIds = useMemo(() => [SPECTRUM_ID, ...families.map((f) => f.id), WORLDS_ID], [families]);
  const [current, setCurrent] = useState(SPECTRUM_ID);
  useEffect(() => {
    const els = jumpIds.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const onScroll = () => {
      const line = window.innerHeight * 0.3;
      let id = els[0]?.id ?? SPECTRUM_ID;
      for (const el of els) if (el.getBoundingClientRect().top <= line) id = el.id;
      setCurrent(id);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [jumpIds]);

  // Na telefonu je pruh posuvný do strany: zvýrazněný oddíl se v něm posune do zorného pole.
  useEffect(() => {
    const nav = document.querySelector<HTMLElement>('.nv-jump');
    const link = nav?.querySelector<HTMLElement>('[aria-current="location"]');
    if (!nav || !link || nav.scrollWidth <= nav.clientWidth) return;
    const left = link.offsetLeft - nav.offsetLeft;
    if (left < nav.scrollLeft || left + link.offsetWidth > nav.scrollLeft + nav.clientWidth)
      nav.scrollTo({ left: Math.max(0, left - 16), behavior: 'smooth' });
  }, [current]);

  // Kotva na způsob (#dialogue z karty světa): po načtení na něj sjede a zvýrazní ho.
  useEffect(() => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    const el = document.getElementById(id);
    if (el) requestAnimationFrame(() => el.scrollIntoView({ block: 'start' }));
  }, []);

  const worldsInFamily = (familyId: string) => new Set(familyTools(familyId).map((x) => x.world)).size;

  return (
    <div className="nv-page">
      <header className="atlas-page__head page-band nv-head">
        <h1 className="atlas-page__title display">{uiT('narrPage.title', locale)}</h1>
        <p className="atlas-page__lead">{uiT('narrPage.lead', locale)}</p>
        <p className="nv-head__meta">
          {toolsLabel(tools.length, locale)} · {worldCountLabel(worlds.length, locale)} · {techLabel(techniques.length, locale)}
        </p>
        <p className="nv-head__links">
          <a href={withBase(base, '/anatomie-herniho-lore/#jak-svety-vypraveji')}>{uiT('narrPage.method', locale)}</a>
          <span className="nv-head__sep" aria-hidden="true">
            ·
          </span>
          <a href={withBase(base, '/teoreticke-zazemi/')}>{uiT('narrPage.theory', locale)}</a>
        </p>
      </header>

      <div className="nv-sticky">
        <nav className="nv-jump" aria-label={uiT('narrPage.onPage', locale)}>
          <a href={`#${SPECTRUM_ID}`} aria-current={current === SPECTRUM_ID ? 'location' : undefined}>
            {uiT('narrPage.spectrumTitle', locale)}
          </a>
          <span className="nv-jump__group">
            {families.map((f, i) => (
              <a
                key={f.id}
                href={`#${f.id}`}
                className={i === firstOwn ? 'is-own-start' : undefined}
                aria-current={current === f.id ? 'location' : undefined}
              >
                {t(f.short, locale)}
              </a>
            ))}
          </span>
          <a href={`#${WORLDS_ID}`} aria-current={current === WORLDS_ID ? 'location' : undefined}>
            {uiT('narrPage.worldsJump', locale)}
          </a>
        </nav>
      </div>

      {/* ---------- Od slova ke hře: sedm rejstříků vedle sebe ---------- */}
      <section className="nv-spectrum" id={SPECTRUM_ID} aria-labelledby={`${SPECTRUM_ID}-h`}>
        <h2 className="visually-hidden" id={`${SPECTRUM_ID}-h`}>
          {uiT('narrPage.spectrumTitle', locale)}
        </h2>
        <div className="nv-spectrum__grid" style={{ '--nv-n': families.length } as CSSProperties}>
          <p className="nv-spectrum__band nv-spectrum__band--borrowed" style={{ gridColumn: `1 / ${firstOwn + 1}` }}>
            <span>{uiT('narrPage.borrowed', locale)}</span>
          </p>
          <p className="nv-spectrum__band nv-spectrum__band--own" style={{ gridColumn: `${firstOwn + 1} / -1` }}>
            <span>{uiT('narrPage.ownOnly', locale)}</span>
          </p>
          {families.map((f, i) => {
            const list = familyTools(f.id);
            return (
              <a key={f.id} className={`nv-col${i === firstOwn ? ' is-own-start' : ''}${f.own ? ' is-own' : ''}`} href={`#${f.id}`}>
                <span className="nv-col__kin">{t(f.kin, locale)}</span>
                <span className="nv-col__name">{t(f.label, locale)}</span>
                <span className="nv-col__n">
                  <b>{list.length}</b> {toolsLabel(list.length, locale).replace(/^\d+\s/, '')}
                </span>
                <span className="nv-col__squares" aria-hidden="true">
                  {list.map((tool, k) => {
                    const w = byWorld.get(tool.world);
                    return w ? <i key={k} style={hue(w.accent)} title={t(w.title, locale)} /> : null;
                  })}
                </span>
              </a>
            );
          })}
        </div>
      </section>

      {/* ---------- Rejstříky ---------- */}
      {families.map((f) => {
        const famTechniques = techniques.filter((x) => x.family === f.id);
        const count = familyTools(f.id).length;
        return (
          <section key={f.id} className={`nv-family${f.own ? ' is-own' : ''}`} id={f.id} aria-labelledby={`${f.id}-h`}>
            <header className="nv-family__head">
              <p className="nv-family__kin">{t(f.kin, locale)}</p>
              <h2 className="nv-family__name" id={`${f.id}-h`}>
                {t(f.label, locale)}
              </h2>
              <p className="nv-family__desc">{t(f.desc, locale)}</p>
              <p className="nv-family__count">
                {toolsLabel(count, locale)} · {worldCountLabel(worldsInFamily(f.id), locale)}
              </p>
            </header>

            {famTechniques.map((tech) => {
              const list = orderedTools.filter((tool) => tool.technique === tech.id);
              return (
                <section key={tech.id} className="nv-tech" id={tech.id} aria-labelledby={`${tech.id}-h`}>
                  <div className="nv-tech__head">
                    <h3 className="nv-tech__name" id={`${tech.id}-h`}>
                      {t(tech.label, locale)}
                    </h3>
                    <p className="nv-tech__desc">{t(tech.desc, locale)}</p>
                    <p className="nv-tech__count">
                      {toolsLabel(list.length, locale)}
                      {tech.trail ? (
                        <>
                          <br />
                          <a href={withBase(base, `/putovani/${tech.trail.slug}/`)}>
                            {uiT('narrPage.trail', locale)}: {t(tech.trail.label, locale)} →
                          </a>
                        </>
                      ) : null}
                    </p>
                  </div>
                  <ul className="nv-tools">
                    {list.map((tool, k) => {
                      const w = byWorld.get(tool.world);
                      if (!w) return null;
                      return (
                        <li key={`${tool.world}-${k}`} className="nv-tool" style={hue(w.accent)}>
                          <details>
                            <summary>
                              <span className="nv-tool__world">
                                {t(w.title, locale)}
                                <span className="nv-tool__arch">{chapterName(w.chapterId)}</span>
                              </span>
                              <span className="nv-tool__title">
                                {tool.title}
                                {tool.aside ? <span className="nv-tool__aside"> ({tool.aside})</span> : null}
                              </span>
                            </summary>
                            <div className="nv-tool__body">
                              <p>{tool.text}</p>
                              <a href={withBase(base, `/worlds/${w.id}/?view=analysis#${w.anchor}`)}>{uiT('narrPage.readAnalysis', locale)} →</a>
                            </div>
                          </details>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </section>
        );
      })}

      {/* ---------- Jak vypráví který svět ---------- */}
      <section className="nv-worlds" id={WORLDS_ID} aria-labelledby={`${WORLDS_ID}-h`}>
        <div className="nv-worlds__head">
          <h2 className="nv-worlds__title" id={`${WORLDS_ID}-h`}>
            {uiT('narrPage.worldsTitle', locale)}
          </h2>
          <div className="nv-sort" role="group" aria-label={uiT('narrPage.sortLabel', locale)}>
            {(['centroid', 'archetype', 'alpha'] as Sort[]).map((s) => (
              <button key={s} type="button" aria-pressed={sort === s} onClick={() => setSort(s)}>
                {uiT(`narrPage.sort${s[0].toUpperCase()}${s.slice(1)}`, locale)}
              </button>
            ))}
          </div>
        </div>

        <table className="nv-matrix">
          <colgroup>
            <col className="nv-matrix__c-world" />
            {families.map((f) => (
              <col key={f.id} />
            ))}
            <col className="nv-matrix__c-cg" />
          </colgroup>
          <thead>
            <tr className="nv-matrix__bands" aria-hidden="true">
              <th />
              <th colSpan={firstOwn} className="nv-matrix__band">
                {uiT('narrPage.borrowed', locale)}
              </th>
              <th colSpan={families.length - firstOwn} className="nv-matrix__band nv-matrix__band--own">
                {uiT('narrPage.ownOnly', locale)}
              </th>
              <th className="nv-matrix__cg-col" />
            </tr>
            <tr>
              <th scope="col" className="nv-matrix__corner">
                {uiT('narrPage.world', locale)}
              </th>
              {families.map((f, i) => (
                <th key={f.id} scope="col" className={`nv-matrix__fam${f.own ? ' is-own' : ''}${i === firstOwn ? ' is-own-start' : ''}`}>
                  <a href={`#${f.id}`}>{t(f.short, locale)}</a>
                </th>
              ))}
              <th scope="col" className="nv-matrix__cg-col" title={uiT('narrPage.centroidHint', locale)}>
                {uiT('narrPage.centroid', locale)}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedWorlds.map((w, row) => {
              const newChapter = sort === 'archetype' && row > 0 && sortedWorlds[row - 1].chapterId !== w.chapterId;
              return (
                <tr key={w.id} style={hue(w.accent)} className={newChapter ? 'is-chapter-start' : undefined}>
                  <th scope="row" className="nv-matrix__world">
                    <a href={withBase(base, `/worlds/${w.id}/?view=analysis#${w.anchor}`)}>{t(w.title, locale)}</a>
                  </th>
                  {families.map((f, i) => {
                    const n = w.counts[i];
                    return (
                      <td
                        key={f.id}
                        className={`nv-matrix__cell${f.own ? ' is-own' : ''}${i === firstOwn ? ' is-own-start' : ''}`}
                        aria-label={`${t(f.label, locale)}: ${n}`}
                      >
                        {n > 0 ? (
                          <span className="nv-matrix__marks" aria-hidden="true">
                            {Array.from({ length: n }, (_, k) => (
                              <i key={k} />
                            ))}
                          </span>
                        ) : (
                          <span className="nv-matrix__none" aria-hidden="true" />
                        )}
                      </td>
                    );
                  })}
                  <td className="nv-matrix__cg-col">
                    <span className="nv-cg" aria-hidden="true">
                      <span className="nv-cg__track" />
                      <span className="nv-cg__mark" style={{ left: `${(w.centroid / (families.length - 1)) * 100}%` }} />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
