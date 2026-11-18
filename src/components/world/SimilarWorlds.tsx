import type { RelatedWorld } from '../../schemas/world';
import { t, uiT } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import { withBase } from '../../lib/base-url';

type Props = {
  items: Array<RelatedWorld & { href?: string; level?: number }>;
  sourceId?: string;
  base?: string;
};

export default function SimilarWorlds({ items, sourceId, base = '' }: Props) {
  const locale = useLocale();
  if (items.length === 0) return null;
  return (
    <section className="related-worlds" aria-label={uiT('world.similarWorlds', locale)}>
      <h2 className="related-worlds__title">{uiT('world.similarWorlds', locale)}</h2>
      <div className="related-worlds__grid">
        {items.map((item) => {
          const title = t(item.title, locale);
          const note = t(item.note, locale);
          const genre = item.genreProfile ? t(item.genreProfile, locale) : null;
          const compareHref =
            sourceId && item.id && item.href
              ? withBase(base, `/compare/?w=${sourceId},${item.id}`)
              : null;
          const inner = (
            <>
              <div className="related-worlds__name">
                {title}
                {genre ? <span className="related-worlds__genre"> ({genre})</span> : null}
              </div>
              {item.level ? (
                <p className="related-worlds__kin">{uiT(`compare.kinLevel${item.level}`, locale)}</p>
              ) : null}
              {note ? <p className="related-worlds__note">{note}</p> : null}
            </>
          );
          return (
            <div key={item.id ?? title} className="related-worlds__item">
              {item.href ? (
                <a className="related-worlds__card" href={item.href}>
                  {inner}
                </a>
              ) : (
                <div className="related-worlds__card related-worlds__card--static">{inner}</div>
              )}
              {compareHref ? (
                <a className="related-worlds__compare" href={compareHref}>
                  {uiT('compare.compareWith', locale)}
                </a>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
