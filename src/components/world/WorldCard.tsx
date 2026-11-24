import { useEffect, useId, useRef, useState } from 'react';
import type { LocalizedString, World } from '../../schemas/world';

import { t, uiT } from '../../lib/i18n';
import type { TriadAnchor } from '../../lib/chronicle-toc';
import { GALLERY_PATH, UNKNOWN_PATH, mysteryAnchor, triadTypesOf } from '../../lib/triad-types';
import { themePath } from '../../lib/themes';
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
      {/* Nahoře jádro a vedle něj profil světa; pod nimi šest údajů a pak rejstřík
          (témata, jak svět vypráví, klíčoví aktéři) ve stejné podobě: linka, popisek, seznam. */}
      <div className="wc-top">
        <p className="wc-core">{t(world.core, locale)}</p>
        <div className="wc-profile">
          <FiveAxes world={world} notesHref={baseUrl ? `${baseUrl}/notes/` : undefined} />
        </div>
      </div>

      <dl className="wc-meta" aria-label={uiT('card.metadataAria', locale)}>
        {meta.map(([labelKey, field]) => (
          <div className="wc-meta__item" key={labelKey}>
            <dt className="wc-label">{uiT(labelKey, locale)}</dt>
            <dd className="wc-meta__value">{t(field, locale)}</dd>
            {field.sub ? <dd className="wc-meta__sub">{t(field.sub, locale)}</dd> : null}
          </div>
        ))}
      </dl>

      <div className="wc-lexicon">
        <section className="wc-lex" aria-labelledby="wc-themes">
          <h2 id="wc-themes" className="wc-label">
            {uiT('card.themesHeading', locale)}
          </h2>
          <ul className="wc-lex__list">
            {world.themes.map((slug) => (
              <li key={slug}>
                <a className="wc-lex__link" href={`${baseUrl}${themePath(slug)}`}>
                  {themeLabels[slug] ? t(themeLabels[slug], locale) : slug}
                </a>
              </li>
            ))}
          </ul>
        </section>

        {world.narration?.length ? (
          <section className="wc-lex" aria-labelledby="wc-narration">
            <h2 id="wc-narration" className="wc-label">
              <a href={`${baseUrl}/anatomie-herniho-lore/#jak-svety-vypraveji`}>
                {uiT('card.narrationHeading', locale)}
              </a>
            </h2>
            <ul className="wc-lex__list">
              {world.narration.map((slug) => (
                <li key={slug}>{NARRATION_LABELS[slug] ? t(NARRATION_LABELS[slug], locale) : slug}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {actors ? (
          <section className="wc-lex" aria-labelledby="wc-actors">
            <h2 id="wc-actors" className="wc-label">
              {uiT('card.keyActors', locale)}
            </h2>
            <ul className="wc-lex__list">
              {actors
                .split(/\s+·\s+/)
                .filter(Boolean)
                .map((actor) => (
                  <li key={actor}>{actor}</li>
                ))}
            </ul>
          </section>
        ) : null}
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
            <TriadTypeLink worldId={world.id} kind={key} baseUrl={baseUrl} />
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

/** Pod polem triády: typ, do kterého svět patří, jako odkaz do Galerie triád nebo na Mapu neznáma. */
function TriadTypeLink({ worldId, kind, baseUrl }: { worldId: string; kind: TriadAnchor; baseUrl: string }) {
  const locale = useLocale();
  const types = triadTypesOf(worldId);
  if (!types) return null;
  if (kind === 'ultimateMystery') {
    if (!types.mystery || !types.holder) return null;
    return (
      <a
        className="wc-triad__type"
        href={`${baseUrl}${UNKNOWN_PATH}#${mysteryAnchor(worldId)}`}
        aria-label={`${t(types.mystery.label, locale)}, ${t(types.holder.label, locale)} – ${uiT('card.triadMysteryIn', locale)}`}
      >
        {t(types.mystery.label, locale)} · {t(types.holder.label, locale)} <span aria-hidden="true">→</span>
      </a>
    );
  }
  const type = kind === 'originalSin' ? types.sin : types.dilemma;
  if (!type) return null;
  return (
    <a
      className="wc-triad__type"
      href={`${baseUrl}${GALLERY_PATH}#${type.id}`}
      aria-label={`${t(type.label, locale)} – ${uiT('card.triadTypeIn', locale)}`}
    >
      {t(type.label, locale)} <span aria-hidden="true">→</span>
    </a>
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
