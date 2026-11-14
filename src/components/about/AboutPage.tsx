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

export default function AboutPage({ base }: Props) {
  const locale = useLocale();
  const body = paragraphs(uiT('about.body', locale));
  const note = uiT('about.note', locale).trim();
  const noteLink = uiT('about.noteLink', locale).trim();

  return (
    <article className="about-page">
      <h1 className="about-page__title display">{uiT('about.title', locale)}</h1>
      <p className="about-page__lead">{uiT('about.lead', locale)}</p>
      <div className="about-page__ornament" aria-hidden="true">
        <span>✦</span>
        <span>✦</span>
        <span>✦</span>
      </div>
      <div className="about-page__body">
        {body.map((para) => (
          <p key={para.slice(0, 48)}>{para}</p>
        ))}
      </div>
      <p className="about-page__signoff">{uiT('about.signoff', locale)}</p>
      {note ? (
        <p className="about-page__note">
          {note}{' '}
          <a href={withBase(base, '/contact/')}>{noteLink}</a>
        </p>
      ) : null}
    </article>
  );
}
