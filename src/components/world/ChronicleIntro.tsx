import type { World } from '../../schemas/world';
import { t, uiT } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';

type Props = {
  world: World;
  hasChronicle: boolean;
};

export default function ChronicleIntro({ world, hasChronicle }: Props) {
  const locale = useLocale();
  return (
    <>
      <h2 className="display" style={{ fontSize: '1.75rem' }}>
        {uiT('world.fullChronicle', locale)}
      </h2>
      {world.chronicleTeaser && (
        <p style={{ color: 'var(--color-ink-muted)', maxWidth: 'var(--read-max)' }}>
          {t(world.chronicleTeaser, locale)}
        </p>
      )}
      {!hasChronicle && (
        <p>
          {uiT('world.chronicleMissing', locale)} <code>npm run import:chronicle</code>.
        </p>
      )}
    </>
  );
}
