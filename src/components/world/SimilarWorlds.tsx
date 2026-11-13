import type { World } from '../../schemas/world';
import { t, uiT } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';

type Props = {
  worlds: World[];
  baseUrl?: string;
};

export default function SimilarWorlds({ worlds, baseUrl = '' }: Props) {
  const locale = useLocale();
  if (worlds.length === 0) return null;
  return (
    <section style={{ marginTop: '2.5rem' }}>
      <h2 className="display" style={{ fontSize: '1.5rem' }}>
        {uiT('world.similarWorlds', locale)}
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginTop: '1rem',
        }}
      >
        {worlds.map((w) => (
          <a
            key={w.id}
            href={`${baseUrl}/worlds/${w.id}/`}
            style={{
              border: '1px solid var(--color-line)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              textDecoration: 'none',
              color: 'inherit',
              background: 'var(--color-tile)',
            }}
          >
            <div className="meta-tile__label">#{w.number}</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem' }}>
              {t(w.gameTitle, locale)}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)', marginTop: '0.5rem' }}>
              {w.themes.slice(0, 2).join(' · ')}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
