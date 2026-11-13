import type { LocalizedString, World } from '../../schemas/world';
import { t, uiT } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import axesMeta from '../../../data/meta/axes.json';
import '../../styles/world-card.css';

type Props = {
  world: World;
  chapterTitle?: LocalizedString;
  themeLabels?: Record<string, LocalizedString>;
  baseUrl?: string;
};

export default function WorldCard({
  world,
  chapterTitle,
  themeLabels = {},
  baseUrl = '',
}: Props) {
  const locale = useLocale();

  return (
    <article className="world-card" id="world-card">
      <header>
        <p className="meta-tile__label">
          #{world.number} · {chapterTitle ? t(chapterTitle, locale) : world.chapterId}
        </p>
        <h1 className="display" style={{ fontSize: '2rem', margin: '0.25rem 0' }}>
          {t(world.gameTitle, locale)}
        </h1>
        <p style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-ink-muted)' }}>
          {t(world.subtitlePoetic, locale)} · {world.studios.join(' · ')} · {world.yearRange}
        </p>
        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
          <strong>{uiT('world.canonScope', locale)}:</strong> {t(world.canonScope, locale)}
        </p>
      </header>

      <section className="world-card__core">{t(world.core, locale)}</section>

      {world.signatureBullets && world.signatureBullets.length > 0 && (
        <ul className="world-card__bullets">
          {world.signatureBullets.map((b) => (
            <li key={b.en ?? b.cs}>{t(b, locale)}</li>
          ))}
        </ul>
      )}

      <section className="meta-grid" aria-label={uiT('card.metadataAria', locale)}>
        <div className="meta-grid__row1">
          <MetaTile label={uiT('card.genreProfile', locale)} body={t(world.metadata.genreProfile, locale)} />
          <MetaTile label={uiT('card.spatialScope', locale)} body={t(world.metadata.spatialScope, locale)} />
          <MetaTile label={uiT('card.historicalDepth', locale)} body={t(world.metadata.historicalDepth, locale)} />
        </div>
        <div className="meta-grid__row2">
          <MetaTile label={uiT('card.societalOrder', locale)} body={t(world.metadata.societalOrder, locale)} />
          <MetaTile label={uiT('card.sourceOfPower', locale)} body={t(world.metadata.sourceOfPower, locale)} />
        </div>
        <div className="meta-grid__row3">
          <MetaTile
            label={uiT('card.protagonistPerspective', locale)}
            body={t(world.metadata.protagonistPerspective, locale)}
          />
          <MetaTile
            label={uiT('card.keyActors', locale)}
            body={t(world.metadata.keyActors, locale)}
            actors
          />
        </div>
      </section>

      <div className="theme-pills">
        {world.themes.map((slug) => (
          <a
            key={slug}
            className="theme-pill"
            href={`${baseUrl}/?theme=${encodeURIComponent(slug)}`}
          >
            {themeLabels[slug] ? t(themeLabels[slug], locale) : slug}
          </a>
        ))}
      </div>

      <section className="axes-block" aria-label={uiT('card.axesAria', locale)}>
        <h2 className="display" style={{ fontSize: '1.35rem', marginBottom: '0.75rem' }}>
          {uiT('card.fiveAxes', locale)}
        </h2>
        {axesMeta.axes.map((axis) => {
          const key = axis.id as keyof World['axes'];
          const val = world.axes[key];
          const pct = ((val.value - 1) / 4) * 100;
          return (
            <div className="axis-row" key={axis.id}>
              <div className="axis-row__labels">
                <span>{t(axis.left, locale)}</span>
                <span>{t(axis.right, locale)}</span>
              </div>
              <div className="axis-row__bar">
                <div className="axis-row__fill" style={{ width: `${pct}%` }} />
              </div>
              <p className="axis-row__comment">{t(val.comment, locale)}</p>
            </div>
          );
        })}
      </section>

      <section className="triad-grid" aria-label={uiT('card.triadAria', locale)}>
        <MetaTile label={uiT('card.originalSin', locale)} body={t(world.triad.originalSin, locale)} />
        <MetaTile label={uiT('card.centralDilemma', locale)} body={t(world.triad.centralDilemma, locale)} />
        <MetaTile label={uiT('card.ultimateMystery', locale)} body={t(world.triad.ultimateMystery, locale)} />
      </section>
    </article>
  );
}

function MetaTile({
  label,
  body,
  actors,
}: {
  label: string;
  body: string;
  actors?: boolean;
}) {
  return (
    <div className={`meta-tile${actors ? ' meta-tile--actors' : ''}`}>
      <div className="meta-tile__label">{label}</div>
      <div className="meta-tile__body">{body}</div>
    </div>
  );
}
