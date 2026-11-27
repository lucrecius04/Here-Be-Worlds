import type { CSSProperties } from 'react';
import type { LocalizedString, RelatedWorld } from '../../schemas/world';
import { t, uiT } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import { withBase } from '../../lib/base-url';

export type ChapterAccentMap = Record<string, { light: string; dark: string; title?: LocalizedString }>;

/** Pouto dvojice: čeho se týká (pilíř nebo přesnější úvod) a co světy sdílejí či v čem se rozcházejí. */
type Tie = { label: LocalizedString; text: LocalizedString };

export type RelatedItem = RelatedWorld & {
  href?: string;
  level?: number;
  number?: number;
  chapterId?: string;
  /** Nejsilnější pouto (kin-evidence.ts). */
  bond?: Tie;
  /** Nejslabší pouto; chybí, když světy nic výrazného nedělí. */
  rift?: Tie | null;
};

type Props = {
  items: RelatedItem[];
  sourceId?: string;
  base?: string;
  chapterAccents?: ChapterAccentMap;
};

/** Příbuzenstvo: tři nejbližší světy podle indexu příbuznosti (compare.ts) se slovním stupněm,
 *  pod jménem nejsilnější pouto („Pojí je“) a nejslabší („Dělí je“). */
export default function SimilarWorlds({ items, sourceId, base = '', chapterAccents = {} }: Props) {
  const locale = useLocale();
  if (items.length === 0) return null;
  return (
    <section className="related-worlds" aria-labelledby="related-worlds-title">
      <div className="related-worlds__head">
        <h2 id="related-worlds-title" className="wc-h2">
          {uiT('world.similarWorlds', locale)}
        </h2>
        {sourceId ? (
          <a className="related-worlds__map" href={withBase(base, `/map/?svet=${sourceId}`)}>
            {uiT('world.showOnMap', locale)}
          </a>
        ) : null}
      </div>
      <div className="related-worlds__grid">
        {items.map((item) => {
          const title = t(item.title, locale);
          const note = t(item.note, locale);
          const accent = item.chapterId ? chapterAccents[item.chapterId] : undefined;
          const style = accent
            ? ({ '--hue-l': accent.light, '--hue-d': accent.dark } as CSSProperties)
            : undefined;
          const compareHref =
            sourceId && item.id && item.href ? withBase(base, `/compare/?w=${sourceId},${item.id}`) : null;
          const inner = (
            <>
              <span className="related-worlds__meta">
                <span>{accent?.title ? t(accent.title, locale) : ''}</span>
                {item.level ? (
                  <span className="related-worlds__kin">{uiT(`compare.kinLevel${item.level}`, locale)}</span>
                ) : null}
              </span>
              <span className="related-worlds__name">{title}</span>
              {item.bond ? (
                <span className="related-worlds__ties">
                  <span className="related-worlds__tie is-bond">
                    <span className="related-worlds__tie-label">
                      <b>{uiT('world.kinBond', locale)}</b>{' '}
                      {t(item.bond.label, locale)}
                    </span>
                    <span className="related-worlds__tie-text">{t(item.bond.text, locale)}</span>
                  </span>
                  {item.rift ? (
                    <span className="related-worlds__tie is-rift">
                      <span className="related-worlds__tie-label">
                        <b>{uiT('world.kinRift', locale)}</b>{' '}
                        {t(item.rift.label, locale)}
                      </span>
                      <span className="related-worlds__tie-text">{t(item.rift.text, locale)}</span>
                    </span>
                  ) : null}
                </span>
              ) : note ? (
                <span className="related-worlds__note">{note}</span>
              ) : null}
            </>
          );
          return (
            <div key={item.id ?? title} className="related-worlds__item" style={style}>
              {item.href ? (
                <a className="related-worlds__card" href={item.href}>
                  {inner}
                </a>
              ) : (
                <div className="related-worlds__card related-worlds__card--static">{inner}</div>
              )}
              {compareHref ? (
                <a className="related-worlds__compare" href={compareHref}>
                  {uiT('compare.compareWith', locale)} →
                </a>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
