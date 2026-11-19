import { uiT } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import { withBase } from '../../lib/base-url';
import '../../styles/about.css';

type Props = { base: string };

function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** O projektu: autorský text vlevo (beze změny), vpravo poznámka o AI a cesty dál po atlasu. */
export default function AboutPage({ base }: Props) {
  const locale = useLocale();
  const body = paragraphs(uiT('about.body', locale));
  const note = uiT('about.note', locale).trim();
  const noteLink = uiT('about.noteLink', locale).trim();

  return (
    <article className="doc about-page">
      <header className="doc-head">
        <p className="doc-kicker">{uiT('footer.about', locale)}</p>
        <h1 className="doc-title">{uiT('about.title', locale)}</h1>
        <p className="doc-lead">{uiT('about.lead', locale)}</p>
      </header>
      <div className="about-page__grid">
        <div className="doc-prose about-page__body">
          {body.map((para) => (
            <p key={para.slice(0, 48)}>{para}</p>
          ))}
          <p className="about-page__signoff">{uiT('about.signoff', locale)}</p>
        </div>
        <aside className="doc-side about-page__side">
          {note ? (
            <section className="doc-side__block">
              <h2 className="doc-kicker">{uiT('about.noteTitle', locale)}</h2>
              <p className="about-page__note">
                {note} <a href={withBase(base, '/contact/')}>{noteLink}</a>
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
