import type { RelatedWorld } from '../../schemas/world';
import { t, uiT } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';

type Props = {
  items: Array<RelatedWorld & { href?: string }>;
};

export default function SimilarWorlds({ items }: Props) {
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
          const inner = (
            <>
              <div className="related-worlds__name">
                {title}
                {genre ? <span className="related-worlds__genre"> ({genre})</span> : null}
              </div>
              {note ? <p className="related-worlds__note">{note}</p> : null}
            </>
          );
          return item.href ? (
            <a key={item.id ?? title} className="related-worlds__card" href={item.href}>
              {inner}
            </a>
          ) : (
            <div key={item.id ?? title} className="related-worlds__card related-worlds__card--static">
              {inner}
            </div>
          );
        })}
      </div>
    </section>
  );
}
