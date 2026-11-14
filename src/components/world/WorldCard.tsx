import type { LocalizedString, World } from '../../schemas/world';

import { t, uiT } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import FiveAxes from './FiveAxes';
import '../../styles/world-card.css';

type MetadataField = World['metadata'][keyof World['metadata']];

type Props = {
  world: World;
  chapterTitle?: LocalizedString;
  themeLabels?: Record<string, LocalizedString>;
  baseUrl?: string;
  hideHeader?: boolean;
};

export default function WorldCard({
  world,
  themeLabels = {},
  baseUrl = '',
  hideHeader = false,
}: Props) {
  const locale = useLocale();
  const showBullets = Boolean(world.signatureBullets?.length);

  const body = (
    <>
      <div className="world-card__core-wrap">
        <span className="world-card__core-label">{uiT('card.coreLabel', locale)}</span>
        <section className="world-card__core">{t(world.core, locale)}</section>
      </div>

      <section className="meta-grid" aria-label={uiT('card.metadataAria', locale)}>
        <div className="meta-grid__row1">
          <MetaTile label={uiT('card.genreProfile', locale)} field={world.metadata.genreProfile} />
          <MetaTile label={uiT('card.atmosphere', locale)} field={world.metadata.atmosphere} />
          <MetaTile label={uiT('card.historicalDepth', locale)} field={world.metadata.historicalDepth} />
        </div>
        <div className="meta-grid__row2">
          <MetaTile label={uiT('card.spatialScope', locale)} field={world.metadata.spatialScope} />
          <MetaTile label={uiT('card.societalOrder', locale)} field={world.metadata.societalOrder} />
          <MetaTile label={uiT('card.sourceOfPower', locale)} field={world.metadata.sourceOfPower} />
        </div>
        <div className="meta-grid__row3">
          <MetaTile
            label={uiT('card.protagonistPerspective', locale)}
            field={world.metadata.protagonistPerspective}
          />
          <MetaTile label={uiT('card.keyActors', locale)} field={world.metadata.keyActors} actors />
        </div>
      </section>

      <section className="world-card__themes" aria-label={uiT('card.themesHeading', locale)}>
        <span className="world-card__themes-title">{uiT('card.themesHeading', locale)}</span>
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
      </section>

      <FiveAxes world={world} notesHref={baseUrl ? `${baseUrl}/notes/` : undefined} />

      {showBullets && (
        <section className="world-card__signature" aria-label={uiT('card.signatureAria', locale)}>
          <h3 className="world-card__signature-title">{uiT('card.signatureHeading', locale)}</h3>
          <ul className="world-card__bullets">
            {world.signatureBullets!.map((b) => (
              <li key={b.en ?? b.cs}>
                <SignatureLead text={t(b, locale)} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="triad-grid" aria-label={uiT('card.triadAria', locale)}>
        <MetaTile label={uiT('card.originalSin', locale)} body={t(world.triad.originalSin, locale)} />
        <MetaTile label={uiT('card.centralDilemma', locale)} body={t(world.triad.centralDilemma, locale)} />
        <MetaTile label={uiT('card.ultimateMystery', locale)} body={t(world.triad.ultimateMystery, locale)} />
      </section>
    </>
  );

  if (hideHeader) {
    return <div className="world-card__body" id="world-card">{body}</div>;
  }

  return (
    <article className="world-card" id="world-card">
      {body}
    </article>
  );
}

function SignatureLead({ text }: { text: string }) {
  const match = text.match(/^(.+?\.)(\s+)(.*)$/s);
  if (!match || !match[3]) return <>{text}</>;
  return (
    <>
      <strong>{match[1]}</strong>
      {match[2]}
      {match[3]}
    </>
  );
}

function MetaTile({
  label,
  field,
  body,
  actors,
}: {
  label: string;
  field?: MetadataField;
  body?: string;
  actors?: boolean;
}) {
  const locale = useLocale();
  const main = field ? t(field, locale) : (body ?? '');
  const sub = field?.sub ? t(field.sub, locale) : null;

  return (
    <div className={`meta-tile${actors ? ' meta-tile--actors' : ''}`}>
      <div className="meta-tile__label">{label}</div>
      <div className={`meta-tile__body${field && !actors ? ' meta-tile__body--value' : ''}`}>{main}</div>
      {sub ? <p className="meta-tile__sub">{sub}</p> : null}
    </div>
  );
}
