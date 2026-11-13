import { uiT } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';

export default function WorldPageNav({ base }: { base: string }) {
  const locale = useLocale();
  return (
    <p>
      <a href={base} style={{ fontSize: '0.9rem' }}>
        {uiT('world.backToAtlas', locale)}
      </a>
    </p>
  );
}
