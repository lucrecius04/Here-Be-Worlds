import type { World } from '../../schemas/world';
import { t } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';

export default function ChapterWorldList({ worlds, base }: { worlds: World[]; base: string }) {
  const locale = useLocale();
  return (
    <ul>
      {worlds.map((w) => (
        <li key={w.id}>
          <a href={`${base}worlds/${w.id}/`}>{t(w.gameTitle, locale)}</a>
        </li>
      ))}
    </ul>
  );
}
