import { useEffect, useState } from 'react';
import type { LocalizedString } from '../../schemas/world';
import { t, uiT } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import { withBase } from '../../lib/base-url';
import { MAX_COMPARE } from '../../lib/compare';
import { toggleCompareTray, useCompareTray, writeCompareTray } from '../../lib/compare-tray';

type TrayWorld = {
  id: string;
  gameTitle: LocalizedString;
};

type Props = {
  worlds: TrayWorld[];
  base: string;
};

export default function CompareTray({ worlds, base }: Props) {
  const locale = useLocale();
  const ids = useCompareTray();
  const [onComparePage, setOnComparePage] = useState(true);

  useEffect(() => {
    setOnComparePage(window.location.pathname.includes('/compare'));
  }, []);

  if (onComparePage || ids.length === 0) return null;

  const byId = new Map(worlds.map((world) => [world.id, world]));
  const selected = ids
    .map((id) => byId.get(id))
    .filter((world): world is TrayWorld => Boolean(world));
  const href = withBase(base, `/compare/?w=${ids.join(',')}`);
  const ready = selected.length >= 2;

  return (
    <div className="compare-tray" role="region" aria-label={uiT('nav.compare', locale)}>
      <div className="compare-tray__chips">
        {selected.map((world) => (
          <button
            key={world.id}
            type="button"
            className="compare-tray__chip"
            onClick={() => toggleCompareTray(world.id)}
          >
            {t(world.gameTitle, locale)} ×
          </button>
        ))}
        {Array.from({ length: MAX_COMPARE - selected.length }).map((_, index) => (
          <span key={`empty-${index}`} className="compare-tray__slot">
            {uiT('compare.slotEmpty', locale)}
          </span>
        ))}
      </div>
      <div className="compare-tray__actions">
        {ready ? (
          <a className="compare-tray__go" href={href}>
            {uiT('home.trayCompare', locale)} ({selected.length}/{MAX_COMPARE}) →
          </a>
        ) : (
          <span className="compare-tray__go compare-tray__go--wait">
            {uiT('home.trayCompare', locale)} ({selected.length}/{MAX_COMPARE}) →
          </span>
        )}
        <button type="button" className="compare-tray__clear" onClick={() => writeCompareTray([])}>
          {uiT('home.trayClear', locale)}
        </button>
      </div>
    </div>
  );
}
