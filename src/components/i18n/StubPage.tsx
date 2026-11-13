import { uiT } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';

type Props = {
  titleKey: string;
  bodyKey: string;
  backKey: string;
  base: string;
};

export default function StubPage({ titleKey, bodyKey, backKey, base }: Props) {
  const locale = useLocale();
  return (
    <>
      <h1 className="display" style={{ fontSize: '2.25rem' }}>
        {uiT(titleKey, locale)}
      </h1>
      <p style={{ maxWidth: '36rem', color: 'var(--color-ink-muted)' }}>{uiT(bodyKey, locale)}</p>
      <p>
        <a href={base}>{uiT(backKey, locale)}</a>
      </p>
    </>
  );
}
