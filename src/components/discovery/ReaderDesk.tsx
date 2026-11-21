import { t, uiT, type Locale } from '../../lib/i18n';
import { withBase } from '../../lib/base-url';
import { SHOW_READING_PROGRESS, clearReaderDesk, isChronicleInProgress, useReaderDesk } from '../../lib/reader-desk';

type Props = {
  locale: Locale;
  base: string;
};

/** Jeden řádek pro vracejícího se čtenáře: rozečtená kronika a skok tam, kde skončil. */
export default function ReaderDesk({ locale, base }: Props) {
  const desk = useReaderDesk();
  const chronicle =
    desk.chronicle && isChronicleInProgress(desk.chronicle.scrollPercent) ? desk.chronicle : null;
  if (!chronicle || !SHOW_READING_PROGRESS) return null;

  const resumeHref = withBase(base, `/worlds/${chronicle.id}/?view=chronicle&resume=1`);

  return (
    <aside className="reader-desk" aria-label={uiT('home.deskTitle', locale)}>
      <p className="reader-desk__line">
        <span className="reader-desk__label">{uiT('home.deskRead', locale)}</span>
        <a className="reader-desk__title" href={resumeHref}>
          {t(chronicle.title, locale)}
        </a>
        <span className="reader-desk__pct">{chronicle.scrollPercent} %</span>
        <a className="reader-desk__resume" href={resumeHref}>
          {uiT('home.deskResume', locale)} →
        </a>
      </p>
      <button type="button" className="reader-desk__dismiss" onClick={() => clearReaderDesk()}>
        {uiT('home.deskDismiss', locale)}
      </button>
    </aside>
  );
}
