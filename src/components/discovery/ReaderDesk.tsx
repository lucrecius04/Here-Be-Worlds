import { t, uiT, type Locale } from '../../lib/i18n';
import { withBase } from '../../lib/base-url';
import {
  clearReaderDesk,
  deskHasContent,
  isChronicleInProgress,
  useReaderDesk,
} from '../../lib/reader-desk';

type Props = {
  locale: Locale;
  base: string;
};

export default function ReaderDesk({ locale, base }: Props) {
  const desk = useReaderDesk();
  const chronicle =
    desk.chronicle && isChronicleInProgress(desk.chronicle.scrollPercent) ? desk.chronicle : null;
  if (!deskHasContent(desk) && !chronicle) return null;
  if (!chronicle && desk.recent.length === 0) return null;

  return (
    <aside className="reader-desk" aria-label={uiT('home.deskTitle', locale)}>
      <p className="home-section-title reader-desk__kicker">{uiT('home.deskTitle', locale)}</p>
      <div className="reader-desk__row">
        {chronicle ? (
          <a
            className="reader-desk__read"
            href={withBase(base, `/worlds/${chronicle.id}/?view=chronicle&resume=1`)}
          >
            {uiT('home.deskRead', locale)}: {t(chronicle.title, locale)} (
            {uiT('world.viewChronicle', locale)} · {chronicle.scrollPercent} %) →
          </a>
        ) : (
          <span className="reader-desk__read reader-desk__read--empty" />
        )}
        <div className="reader-desk__recent">
          {desk.recent.length > 0 ? (
            <p className="reader-desk__recent-line">
              <span>{uiT('home.deskRecent', locale)}: </span>
              {desk.recent.map((item, index) => (
                <span key={item.id}>
                  {index > 0 ? ' · ' : null}
                  <a href={withBase(base, `/worlds/${item.id}/`)}>{t(item.title, locale)}</a>
                </span>
              ))}
            </p>
          ) : null}
          <button type="button" className="reader-desk__clear" onClick={() => clearReaderDesk()}>
            {uiT('home.deskClear', locale)}
          </button>
        </div>
      </div>
    </aside>
  );
}
