import { useMemo, useState, type CSSProperties } from 'react';
import type { LocalizedString } from '../../schemas/world';
import { t, uiT, worldCountLabel } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import { withBase } from '../../lib/base-url';
import { DILEMMA_TYPES, SIN_TYPES, UNKNOWN_PATH, WORLD_TRIAD_TYPES, type TriadType } from '../../lib/triad-types';
import '../../styles/triads.css';

export type TriadWorld = {
  id: string;
  title: LocalizedString;
  chapterId: string;
  accent: { light: string; dark: string };
  originalSin: LocalizedString;
  centralDilemma: LocalizedString;
  ultimateMystery: LocalizedString;
  /** Kotva oddílu Nosná mezera v Anatomii vyprávění (pro Mapu neznáma). */
  mysteryAnchor?: string | null;
};

export type TriadChapter = { id: string; title: LocalizedString; short?: LocalizedString; accent: { light: string; dark: string } };

type Props = { base: string; worlds: TriadWorld[]; chapters: TriadChapter[] };

export const hueVars = (accent: { light: string; dark: string }) =>
  ({ '--tg-hue-l': accent.light, '--tg-hue-d': accent.dark }) as CSSProperties;

/** Archetypová legenda jako na mapě souřadnic: zvýrazní světy jednoho archetypu, ostatní ztlumí. */
export function ArchetypeFilter({
  chapters,
  value,
  onChange,
  label,
}: {
  chapters: TriadChapter[];
  value: string | null;
  onChange: (id: string | null) => void;
  label: string;
}) {
  const locale = useLocale();
  return (
    <div className="tg-filter" role="group" aria-label={label}>
      <span className="tg-filter__label" aria-hidden="true">
        {label}
      </span>
      <button type="button" className="tg-filter__btn" aria-pressed={value === null} onClick={() => onChange(null)}>
        {uiT('triads.all', locale)}
      </button>
      {chapters.map((c) => (
        <button
          key={c.id}
          type="button"
          className="tg-filter__btn"
          style={hueVars(c.accent)}
          aria-pressed={value === c.id}
          onClick={() => onChange(value === c.id ? null : c.id)}
        >
          <span className="tg-dot" aria-hidden="true" />
          {t(c.short ?? c.title, locale)}
        </button>
      ))}
    </div>
  );
}

export default function TriadGallery({ base, worlds, chapters }: Props) {
  const locale = useLocale();
  const [arch, setArch] = useState<string | null>(null);
  const order = useMemo(() => new Map(chapters.map((c, i) => [c.id, i])), [chapters]);
  const sorted = useMemo(
    () =>
      [...worlds].sort(
        (a, b) =>
          (order.get(a.chapterId) ?? 0) - (order.get(b.chapterId) ?? 0) ||
          t(a.title, locale).localeCompare(t(b.title, locale), locale),
      ),
    [worlds, order, locale],
  );
  const chapterName = (id: string) => {
    const c = chapters.find((x) => x.id === id);
    return c ? t(c.short ?? c.title, locale) : id;
  };

  const sections: { id: string; title: string; types: TriadType[]; key: 'sin' | 'dilemma'; text: 'originalSin' | 'centralDilemma' }[] = [
    { id: 'prvotni-hrichy', title: uiT('triads.sinsTitle', locale), types: SIN_TYPES, key: 'sin', text: 'originalSin' },
    { id: 'velka-dilemata', title: uiT('triads.dilemmasTitle', locale), types: DILEMMA_TYPES, key: 'dilemma', text: 'centralDilemma' },
  ];

  const membersOf = (key: 'sin' | 'dilemma', typeId: string) => sorted.filter((w) => WORLD_TRIAD_TYPES[w.id]?.[key] === typeId);
  const dim = (w: TriadWorld) => arch !== null && w.chapterId !== arch;

  return (
    <div className="tg-page">
      <header className="atlas-page__head page-band tg-head">
        <h1 className="atlas-page__title display">{uiT('triads.title', locale)}</h1>
        <p className="atlas-page__lead">{uiT('triads.lead', locale)}</p>
        <p className="tg-head__links">
          {uiT('triads.leadUnknown', locale)}{' '}
          <a href={withBase(base, UNKNOWN_PATH)}>{uiT('unknown.title', locale)} →</a>
          <span className="tg-head__sep" aria-hidden="true">
            ·
          </span>
          <a href={withBase(base, '/notes/#triada')}>{uiT('triads.method', locale)}</a>
        </p>
      </header>

      <nav className="tg-jump" aria-label={uiT('triads.onPage', locale)}>
        {sections.map((s) => (
          <a key={s.id} href={`#${s.id}`}>
            {s.title}
          </a>
        ))}
      </nav>

      <div className="tg-sticky">
        <ArchetypeFilter chapters={chapters} value={arch} onChange={setArch} label={uiT('triads.filter', locale)} />
      </div>

      {sections.map((s) => (
        <section key={s.id} className="tg-section" id={s.id} aria-labelledby={`${s.id}-h`}>
          <h2 className="tg-section__title" id={`${s.id}-h`}>
            {s.title}
          </h2>

          <ol className="tg-overview" aria-label={uiT('triads.overview', locale)}>
            {s.types.map((type) => {
              const members = membersOf(s.key, type.id);
              const lit = members.filter((w) => !dim(w)).length;
              return (
                <li key={type.id} className="tg-overview__row">
                  <a className="tg-overview__name" href={`#${type.id}`}>
                    {t(type.label, locale)}
                  </a>
                  <span className="tg-overview__dots" aria-hidden="true">
                    {members.map((w) => (
                      <span key={w.id} className={`tg-dot${dim(w) ? ' is-dim' : ''}`} style={hueVars(w.accent)} title={t(w.title, locale)} />
                    ))}
                  </span>
                  <span className="tg-overview__n">
                    {arch ? uiT('triads.ofType', locale).replace('{n}', String(lit)).replace('{total}', String(members.length)) : members.length}
                  </span>
                </li>
              );
            })}
          </ol>

          {s.types.map((type) => {
            const members = membersOf(s.key, type.id);
            // „také: …“ – světy, které mají tento typ jako vedlejší (jen u prvotních hříchů)
            const alsoHere = s.key === 'sin' ? sorted.filter((w) => WORLD_TRIAD_TYPES[w.id]?.sinAlso === type.id) : [];
            return (
              <section key={type.id} className="tg-type" id={type.id} aria-labelledby={`${type.id}-h`}>
                <div className="tg-type__head">
                  <h3 className="tg-type__name" id={`${type.id}-h`}>
                    {t(type.label, locale)}
                  </h3>
                  <p className="tg-type__desc">{t(type.desc, locale)}</p>
                  <p className="tg-type__count">{worldCountLabel(members.length, locale)}</p>
                </div>
                <ul className="tg-list">
                  {members.map((w) => {
                    const also = s.key === 'sin' ? WORLD_TRIAD_TYPES[w.id]?.sinAlso : undefined;
                    const alsoType = also ? SIN_TYPES.find((x) => x.id === also) : undefined;
                    return (
                      <li key={w.id} className={`tg-entry${dim(w) ? ' is-dim' : ''}`} style={hueVars(w.accent)}>
                        <p className="tg-entry__world">
                          <a href={withBase(base, `/worlds/${w.id}/`)}>{t(w.title, locale)}</a>
                          <span className="tg-entry__arch">{chapterName(w.chapterId)}</span>
                        </p>
                        <p className="tg-entry__text">{t(w[s.text], locale)}</p>
                        {alsoType ? (
                          <p className="tg-entry__also">
                            {uiT('triads.also', locale)}: <a href={`#${alsoType.id}`}>{t(alsoType.label, locale)}</a>
                          </p>
                        ) : null}
                      </li>
                    );
                  })}
                  {alsoHere.map((w) => (
                    <li key={`also-${w.id}`} className={`tg-entry tg-entry--also${dim(w) ? ' is-dim' : ''}`} style={hueVars(w.accent)}>
                      <p className="tg-entry__world">
                        <a href={withBase(base, `/worlds/${w.id}/`)}>{t(w.title, locale)}</a>
                        <span className="tg-entry__arch">
                          {uiT('triads.also', locale)} · {chapterName(w.chapterId)}
                        </span>
                      </p>
                      <p className="tg-entry__text">{t(w[s.text], locale)}</p>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </section>
      ))}
    </div>
  );
}
