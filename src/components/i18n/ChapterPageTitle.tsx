import type { LocalizedString } from '../../schemas/world';
import { t, uiT } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';

export default function ChapterPageHeader({
  base,
  title,
  thesis,
}: {
  base: string;
  title: LocalizedString;
  thesis: LocalizedString;
}) {
  const locale = useLocale();
  return (
    <>
      <a href={base}>{uiT('chapterPage.back', locale)}</a>
      <h1 className="display" style={{ fontSize: '2rem' }}>
        {t(title, locale)}
      </h1>
      <p>{t(thesis, locale)}</p>
    </>
  );
}
