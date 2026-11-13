import { useLocale } from '../../lib/locale-store';
import { profileCountLabel, t, uiT } from '../../lib/i18n';
import type { LocalizedString } from '../../schemas/world';

export type ChapterCardData = {
  id: string;
  title: LocalizedString;
  thesis: LocalizedString;
  accent: string;
  count: number;
};

export default function HomeIntro({ chapters }: { chapters: ChapterCardData[] }) {
  const locale = useLocale();

  return (
    <>
      <header style={{ maxWidth: '40rem' }}>
        <p className="meta-tile__label">{uiT('home.tagline', locale)}</p>
        <h1 className="display" style={{ fontSize: '2.75rem', margin: '0.25rem 0 0.75rem' }}>
          {uiT('home.title', locale)}
        </h1>
        <p style={{ color: 'var(--color-ink-muted)', fontSize: '1.05rem' }}>{uiT('home.lead', locale)}</p>
      </header>

      <section className="chapter-strip" aria-label={uiT('home.chaptersAria', locale)}>
        {chapters.map((c) => (
          <article key={c.id} className="chapter-card" style={{ ['--chapter-accent' as string]: c.accent }}>
            <h2 className="display" style={{ fontSize: '1.2rem', margin: 0 }}>
              {t(c.title, locale)}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', margin: '0.5rem 0' }}>
              {profileCountLabel(c.count, locale)}
            </p>
            <p style={{ fontSize: '0.9rem', margin: 0 }}>{t(c.thesis, locale)}</p>
          </article>
        ))}
      </section>

      <h2 className="display" style={{ fontSize: '1.75rem', marginTop: '2.5rem' }}>
        {uiT('home.exploreIndex', locale)}
      </h2>
    </>
  );
}
