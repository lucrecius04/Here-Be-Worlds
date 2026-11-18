import { useEffect, useId, useRef, useState } from 'react';
import type { LocalizedString, World } from '../../schemas/world';

import { t, uiT } from '../../lib/i18n';
import type { TriadAnchor } from '../../lib/chronicle-toc';
import { useLocale } from '../../lib/locale-store';
import FiveAxes from './FiveAxes';
import narrationData from '../../../data/meta/narration-taxonomy.json';

const NARRATION_LABELS: Record<string, LocalizedString> = Object.fromEntries(
  narrationData.narration.map((item) => [item.slug, item.label]),
);
import '../../styles/world-card.css';

type MetadataField = World['metadata'][keyof World['metadata']];

type Props = {
  world: World;
  chapterTitle?: LocalizedString;
  themeLabels?: Record<string, LocalizedString>;
  baseUrl?: string;
  hideHeader?: boolean;
  onOpenAnalysis?: (anchor: TriadAnchor) => void;
};

export default function WorldCard({
  world,
  themeLabels = {},
  baseUrl = '',
  hideHeader = false,
  onOpenAnalysis,
}: Props) {
  const locale = useLocale();
  const actors = t(world.metadata.keyActors, locale);

  const meta: Array<[string, MetadataField]> = [
    ['card.atmosphere', world.metadata.atmosphere],
    ['card.historicalDepth', world.metadata.historicalDepth],
    ['card.spatialScope', world.metadata.spatialScope],
    ['card.societalOrder', world.metadata.societalOrder],
    ['card.sourceOfPower', world.metadata.sourceOfPower],
    ['card.protagonistPerspective', world.metadata.protagonistPerspective],
  ];

  const body = (
    <>
      <p className="wc-core">{t(world.core, locale)}</p>

      <div className="wc-grid">
        <dl className="wc-meta" aria-label={uiT('card.metadataAria', locale)}>
          {meta.map(([labelKey, field]) => (
            <div className="wc-meta__item" key={labelKey}>
              <dt className="wc-label">{uiT(labelKey, locale)}</dt>
              <dd className="wc-meta__value">{t(field, locale)}</dd>
              {field.sub ? <dd className="wc-meta__sub">{t(field.sub, locale)}</dd> : null}
            </div>
          ))}
        </dl>

        <div className="wc-side">
          <FiveAxes world={world} notesHref={baseUrl ? `${baseUrl}/notes/` : undefined} />

          <section className="wc-block" aria-labelledby="wc-themes">
            <h2 id="wc-themes" className="wc-label">
              {uiT('card.themesHeading', locale)}
            </h2>
            <div className="wc-chips">
              {world.themes.map((slug) => (
                <a key={slug} className="wc-chip" href={`${baseUrl}/atlas/?theme=${encodeURIComponent(slug)}`}>
                  {themeLabels[slug] ? t(themeLabels[slug], locale) : slug}
                </a>
              ))}
            </div>
          </section>

          {world.narration?.length ? (
            <section className="wc-block" aria-labelledby="wc-narration">
              <h2 id="wc-narration" className="wc-label">
                <a href={`${baseUrl}/anatomie-herniho-lore/#jak-svety-vypraveji`}>
                  {uiT('card.narrationHeading', locale)}
                </a>
              </h2>
              <div className="wc-chips">
                {world.narration.map((slug) => (
                  <span key={slug} className="wc-chip wc-chip--fill">
                    {NARRATION_LABELS[slug] ? t(NARRATION_LABELS[slug], locale) : slug}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {actors ? (
            <section className="wc-block" aria-labelledby="wc-actors">
              <h2 id="wc-actors" className="wc-label">
                {uiT('card.keyActors', locale)}
              </h2>
              <p className="wc-actors">{actors}</p>
            </section>
          ) : null}
        </div>
      </div>

      {world.signatureBullets?.length ? (
        <section className="wc-signature" aria-label={uiT('card.signatureAria', locale)}>
          <h2 className="wc-h2">{uiT('card.signatureHeading', locale)}</h2>
          <ul className="wc-bullets">
            {world.signatureBullets.map((b) => (
              <li key={b.en ?? b.cs}>
                <SignatureLead text={t(b, locale)} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="wc-triad" aria-label={uiT('card.triadAria', locale)}>
        {(
          [
            ['originalSin', 'card.originalSin', 'card.triadHelpOriginalSin', 'prvotni-hrich'],
            ['centralDilemma', 'card.centralDilemma', 'card.triadHelpCentralDilemma', 'ustredni-otazka'],
            ['ultimateMystery', 'card.ultimateMystery', 'card.triadHelpUltimateMystery', 'rizena-mezera'],
          ] as const
        ).map(([key, labelKey, helpKey, anchor]) => (
          <div className="wc-triad__cell" key={key}>
            <div className="wc-triad__head">
              <h3 className="wc-triad__label">{uiT(labelKey, locale)}</h3>
              <TriadHelp
                label={uiT(labelKey, locale)}
                text={uiT(helpKey, locale)}
                href={`${baseUrl}/anatomie-herniho-lore/#${anchor}`}
              />
            </div>
            {onOpenAnalysis ? (
              <button type="button" className="wc-triad__text wc-triad__text--jump" onClick={() => onOpenAnalysis(key)}>
                {t(world.triad[key], locale)}
              </button>
            ) : (
              <p className="wc-triad__text">{t(world.triad[key], locale)}</p>
            )}
          </div>
        ))}
      </section>
    </>
  );

  if (hideHeader) {
    return (
      <div className="world-card__body" id="world-card">
        {body}
      </div>
    );
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

/** Otazník u pole triády: krátká definice a odkaz do eseje Anatomie herního lore. */
function TriadHelp({ label, text, href }: { label: string; text: string; href: string }) {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="triad-help" ref={ref}>
      <button
        type="button"
        className="triad-help__toggle"
        aria-expanded={open}
        aria-controls={id}
        aria-label={`${uiT('card.triadHelpButton', locale)} ${label}?`}
        onClick={() => setOpen((v) => !v)}
      >
        ?
      </button>
      {open ? (
        <div className="triad-help__pop" id={id} role="dialog" aria-label={label}>
          <p className="triad-help__term">{label}</p>
          <p className="triad-help__text">{text}</p>
          <a className="triad-help__more" href={href}>
            {uiT('card.triadHelpMore', locale)} →
          </a>
        </div>
      ) : null}
    </div>
  );
}
