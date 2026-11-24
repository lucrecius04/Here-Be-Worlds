import { t, uiT } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import { withBase } from '../../lib/base-url';
import {
  noteCanon,
  noteCompass,
  noteFields,
  noteKinshipIntro,
  noteKinshipLevels,
  noteKinshipPillars,
  noteScale,
} from '../../../data/meta/notes';
import axesMeta from '../../../data/meta/axes.json';
import {
  DILEMMA_TYPES,
  GALLERY_PATH,
  MYSTERY_HOLDERS,
  MYSTERY_KINDS,
  SIN_TYPES,
  UNKNOWN_PATH,
  type TriadType,
} from '../../lib/triad-types';
import { HolderIcon } from '../triads/HolderIcon';
import '../../styles/notes.css';

type Props = { base: string };

export default function NotesPage({ base }: Props) {
  const locale = useLocale();

  const sections = [
    { id: 'charakter', label: uiT('notes.fieldsTitle', locale) },
    { id: 'stupnice', label: uiT('notes.profileTitle', locale) },
    { id: 'triada', label: uiT('notes.triadTitle', locale) },
    { id: 'pribuznost', label: uiT('notes.kinshipTitle', locale) },
    { id: 'kompas', label: uiT('notes.compassTitle', locale) },
    { id: 'kanon', label: uiT('notes.canonTitle', locale) },
  ];

  return (
    <article className="doc notes-page">
      <header className="doc-head page-band">
        <p className="doc-kicker">{uiT('notes.kicker', locale)}</p>
        <h1 className="doc-title">{uiT('notes.title', locale)}</h1>
        <p className="doc-lead">
          <a href={withBase(base, '/anatomie-herniho-lore/')}>{uiT('notes.essayLink', locale)} →</a>
        </p>
      </header>

      <nav className="notes-toc" aria-label={uiT('essay.toc', locale)}>
        {sections.map((section) => (
          <a key={section.id} href={`#${section.id}`}>
            {section.label}
          </a>
        ))}
      </nav>

      <section className="notes-section" id="charakter">
        <h2 className="doc-h2">{uiT('notes.fieldsTitle', locale)}</h2>
        <dl className="notes-list">
          {noteFields.map((field) => (
            <div className="notes-list__row" key={field.term.cs}>
              <dt className="notes-list__term">{t(field.term, locale)}</dt>
              <dd className="notes-list__body">
                <p className="notes-list__help">{t(field.help, locale)}</p>
                {field.values ? <p className="notes-list__values">{t(field.values, locale)}</p> : null}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="notes-section" id="stupnice">
        <h2 className="doc-h2">{uiT('notes.profileTitle', locale)}</h2>
        <dl className="notes-list">
          {axesMeta.axes.map((axis) => (
            <div className="notes-list__row" key={axis.id}>
              <dt className="notes-list__term">
                {uiT(`map.name${axis.id.charAt(0).toUpperCase()}${axis.id.slice(1)}`, locale)}
                <span className="notes-list__poles">
                  {t(axis.left, locale)} ↔ {t(axis.right, locale)}
                </span>
              </dt>
              <dd className="notes-list__body">
                <p className="notes-list__help">
                  {t(axis.help, locale)}
                  {'notesExtra' in axis && axis.notesExtra ? ` ${t(axis.notesExtra, locale)}` : ''}
                </p>
              </dd>
            </div>
          ))}
        </dl>
        {/* Stupnice ve stejném jazyce jako osy na webu: pět dílků, svítí jeden. */}
        <div className="notes-scale" role="list">
          {noteScale.map((step) => (
            <p className="notes-scale__row" role="listitem" key={step.value}>
              <span className="notes-scale__cells" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((v) => (
                  <i key={v} className={String(v) === step.value ? 'is-on' : undefined} />
                ))}
              </span>
              <span className="notes-scale__value">{step.value}</span>
              {t(step.label, locale)}
            </p>
          ))}
        </div>
      </section>

      <section className="notes-section" id="triada">
        <h2 className="doc-h2">{uiT('notes.triadTitle', locale)}</h2>
        <dl className="notes-list">
          {(
            [
              ['card.originalSin', 'card.triadHelpOriginalSin', 'prvotni-hrich', `${GALLERY_PATH}#prvotni-hrichy`, 'notes.triadSinIn'],
              ['card.centralDilemma', 'card.triadHelpCentralDilemma', 'ustredni-otazka', `${GALLERY_PATH}#ustredni-dilemata`, 'notes.triadDilemmaIn'],
              ['card.ultimateMystery', 'card.triadHelpUltimateMystery', 'rizena-mezera', UNKNOWN_PATH, 'notes.triadMysteryIn'],
            ] as const
          ).map(([term, help, anchor, view, viewLabel]) => (
            <div className="notes-list__row" key={term}>
              <dt className="notes-list__term">{uiT(term, locale)}</dt>
              <dd className="notes-list__body">
                <p className="notes-list__help">{uiT(help, locale)}</p>
                <p className="notes-list__more">
                  <a href={withBase(base, `/anatomie-herniho-lore/#${anchor}`)}>{uiT('card.triadHelpMore', locale)} →</a>
                </p>
                <p className="notes-list__more">
                  <a href={withBase(base, view)}>{uiT(viewLabel, locale)} →</a>
                </p>
              </dd>
            </div>
          ))}
        </dl>

        <div className="doc-prose notes-section__intro notes-section__intro--after">
          <p>{uiT('notes.triadTypesIntro', locale)}</p>
        </div>
        <TypeList title={uiT('notes.triadSinTypes', locale)} types={SIN_TYPES} locale={locale} />
        <TypeList title={uiT('notes.triadDilemmaTypes', locale)} types={DILEMMA_TYPES} locale={locale} />
        <p className="notes-list__more notes-section__foot">
          <a href={withBase(base, GALLERY_PATH)}>{uiT('notes.triadToGallery', locale)} →</a>
        </p>
        <TypeList title={uiT('notes.triadMysteryKinds', locale)} types={MYSTERY_KINDS} locale={locale} />
        <TypeList title={uiT('notes.triadHolders', locale)} types={MYSTERY_HOLDERS} locale={locale} icons />
        <p className="notes-list__more notes-section__foot">
          <a href={withBase(base, UNKNOWN_PATH)}>{uiT('notes.triadToUnknown', locale)} →</a>
        </p>
      </section>

      <section className="notes-section" id="pribuznost">
        <h2 className="doc-h2">{uiT('notes.kinshipTitle', locale)}</h2>
        <div className="doc-prose notes-section__intro">
          <p>{t(noteKinshipIntro, locale)}</p>
        </div>
        <h3 className="doc-kicker notes-section__sub">{uiT('notes.kinshipPillars', locale)}</h3>
        <dl className="notes-list">
          {noteKinshipPillars.map((pillar) => (
            <div className="notes-list__row" key={pillar.term.cs}>
              <dt className="notes-list__term">{t(pillar.term, locale)}</dt>
              <dd className="notes-list__body">
                <p className="notes-list__help">{t(pillar.help, locale)}</p>
              </dd>
            </div>
          ))}
        </dl>
        <h3 className="doc-kicker notes-section__sub">{uiT('notes.kinshipLevels', locale)}</h3>
        <dl className="notes-list">
          {noteKinshipLevels.map(({ level, help }) => (
            <div className="notes-list__row" key={level}>
              <dt className="notes-list__term notes-list__term--kin">
                <span className="notes-kin" aria-hidden="true">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <i key={v} className={v <= level ? 'is-on' : undefined} />
                  ))}
                </span>
                {uiT(`compare.kinLevel${level}`, locale)}
              </dt>
              <dd className="notes-list__body">
                <p className="notes-list__help">{t(help, locale)}</p>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="notes-section" id="kompas">
        <h2 className="doc-h2">{uiT('notes.compassTitle', locale)}</h2>
        <div className="doc-prose">
          {t(noteCompass, locale)
            .split(/\n\s*\n/)
            .map((para) => para.trim())
            .filter(Boolean)
            .map((para) => (
              <p key={para.slice(0, 48)}>{para}</p>
            ))}
        </div>
      </section>

      <section className="notes-section" id="kanon">
        <h2 className="doc-h2">{uiT('notes.canonTitle', locale)}</h2>
        <div className="doc-prose">
          {t(noteCanon, locale)
            .split(/\n\s*\n/)
            .map((para) => para.trim())
            .filter(Boolean)
            .map((para) => (
              <p key={para.slice(0, 48)}>{para}</p>
            ))}
        </div>
      </section>
    </article>
  );
}

/** Seznam typů triády (název vlevo, věta výkladu vpravo); texty z data/meta/triad-types.json. */
function TypeList({
  title,
  types,
  locale,
  icons = false,
}: {
  title: string;
  types: TriadType[];
  locale: ReturnType<typeof useLocale>;
  icons?: boolean;
}) {
  return (
    <>
      <h3 className="doc-kicker notes-section__sub">{title}</h3>
      <dl className="notes-list">
        {types.map((type) => (
          <div className="notes-list__row" key={type.id}>
            <dt className={`notes-list__term${icons ? ' notes-list__term--icon' : ''}`}>
              {icons && <HolderIcon id={type.id} className="notes-holder-icon" />}
              {t(type.label, locale)}
            </dt>
            <dd className="notes-list__body">
              <p className="notes-list__help">{t(type.desc, locale)}</p>
            </dd>
          </div>
        ))}
      </dl>
    </>
  );
}
