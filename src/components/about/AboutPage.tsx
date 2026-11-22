import { t, uiT } from '../../lib/i18n';
import type { LocalizedString } from '../../schemas/world';
import { useLocale } from '../../lib/locale-store';
import { withBase } from '../../lib/base-url';
import '../../styles/about.css';

type Stats = { worlds: number; archetypes: number; chapters: number; hours: number; themes: number };

type Props = {
  base: string;
  stats: Stats;
  latest: { id: string; title: LocalizedString } | null;
  next: string;
};

const NOT_ITEMS = ['about.notReviews', 'about.notGuide', 'about.notNews', 'about.notOfficial', 'about.notSpoilers'] as const;

/** Název webu v textu kurzívou. */
function withSiteName(text: string) {
  return text.split('Here Be Worlds').flatMap((part, index) =>
    index === 0 ? [part] : [<em key={index}>Here Be Worlds</em>, part],
  );
}

function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** O projektu: autorský text vlevo (beze změny), vpravo poznámka o AI a cesty dál po atlasu. */
export default function AboutPage({ base, stats, latest, next }: Props) {
  const locale = useLocale();
  const body = paragraphs(uiT('about.body', locale));
  const note = uiT('about.note', locale).trim();
  const noteLink = uiT('about.noteLink', locale).trim();

  return (
    <article className="doc about-page">
      <header className="doc-head page-band">
        <h1 className="doc-title">{uiT('about.title', locale)}</h1>
        <p className="doc-lead">{uiT('about.lead', locale)}</p>
      </header>
      <dl className="about-stats">
        {(
          [
            ['about.statWorlds', stats.worlds],
            ['about.statArchetypes', stats.archetypes],
            ['about.statChapters', stats.chapters],
            ['about.statHours', stats.hours],
            ['about.statThemes', stats.themes],
          ] as const
        ).map(([key, value]) => (
          <div className="about-stats__item" key={key}>
            <dt>{uiT(key, locale)}</dt>
            <dd>{value.toLocaleString(locale === 'cs' ? 'cs-CZ' : 'en-GB')}</dd>
          </div>
        ))}
      </dl>
      <div className="about-page__grid">
        <div className="doc-prose about-page__body">
          {body.map((para) => (
            <p key={para.slice(0, 48)}>{para}</p>
          ))}
          <p className="about-page__signoff">{uiT('about.signoff', locale)}</p>

          <section className="about-page__section">
            <h2 className="doc-h2">{uiT('about.notTitle', locale)}</h2>
            <dl className="about-not">
              {NOT_ITEMS.map((key) => {
                const [term, text] = uiT(key, locale).split('|');
                return (
                  <div className="about-not__row" key={key}>
                    <dt>{term}</dt>
                    <dd>{text}</dd>
                  </div>
                );
              })}
            </dl>
          </section>

          <section className="about-page__section">
            <h2 className="doc-h2">{uiT('about.nextTitle', locale)}</h2>
            {next ? (
              <p className="about-page__next">
                {uiT('about.nextWriting', locale)} <em>{next}</em>
              </p>
            ) : null}
            {latest ? (
              <p className="about-page__next">
                <span className="doc-kicker">{uiT('home2.latest', locale)}</span>{' '}
                <a href={withBase(base, `/worlds/${latest.id}/`)}>{t(latest.title, locale)}</a>
              </p>
            ) : null}
          </section>
        </div>
        <aside className="doc-side about-page__side">
          {note ? (
            <section className="doc-side__block">
              <h2 className="doc-kicker">{uiT('about.noteTitle', locale)}</h2>
              <p className="about-page__note">
                {withSiteName(note)} <a href={withBase(base, '/contact/')}>{noteLink}</a>
              </p>
            </section>
          ) : null}
          <section className="doc-side__block">
            <h2 className="doc-kicker">{uiT('about.more', locale)}</h2>
            <ul className="doc-links">
              <li>
                <a href={withBase(base, '/notes/')}>
                  {uiT('notes.title', locale)} <span aria-hidden="true">→</span>
                </a>
              </li>
              <li>
                <a href={withBase(base, '/anatomie-herniho-lore/')}>
                  {uiT('footer.essay', locale)} <span aria-hidden="true">→</span>
                </a>
              </li>
              <li>
                <a href={withBase(base, '/contact/')}>
                  {uiT('contact.title', locale)} <span aria-hidden="true">→</span>
                </a>
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </article>
  );
}
