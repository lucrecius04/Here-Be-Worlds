import type { CSSProperties } from 'react';
import type { LocalizedString } from '../../schemas/world';
import { t, uiT } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import { withBase } from '../../lib/base-url';

export type WorldJourney = {
  id: string;
  slug: string;
  nameKey: string;
  descKey: string;
  tagline?: string;
  minutes: number | null;
  members: Array<{ id: string; title: LocalizedString; accent: { light: string; dark: string } }>;
};

type Props = {
  worldId: string;
  journeys: WorldJourney[];
  base: string;
};

/** Záložka Putování: putování, kterými svět prochází, s trasou světů jako na stránce /putovani/. */
export default function WorldJourneys({ worldId, journeys, base }: Props) {
  const locale = useLocale();
  return (
    <div className="wj">
      <ol className="wj-list">
        {journeys.map((journey) => {
          const href = withBase(base, `/putovani/${journey.slug}/`);
          const question = locale === 'cs' && journey.tagline ? journey.tagline : uiT(journey.descKey, locale);
          return (
            <li key={journey.id} className="wj-item">
              <div className="wj-item__head">
                <h2 className="wj-item__name display">
                  <a href={href}>{uiT(journey.nameKey, locale)}</a>
                </h2>
                {journey.minutes ? (
                  <span className="wj-item__min">
                    {uiT('compare.essayMin', locale).replace('{m}', String(journey.minutes))}
                  </span>
                ) : null}
              </div>
              <p className="wj-item__question">{question}</p>
              <ol className="wj-route" aria-label={uiT(journey.nameKey, locale)}>
                {journey.members.map((member) => (
                  <li
                    key={member.id}
                    className={`wj-route__stop${member.id === worldId ? ' is-here' : ''}`}
                    style={{ '--hue-l': member.accent.light, '--hue-d': member.accent.dark } as CSSProperties}
                  >
                    {member.id === worldId ? (
                      <span>{t(member.title, locale)}</span>
                    ) : (
                      <a href={withBase(base, `/worlds/${member.id}/`)}>{t(member.title, locale)}</a>
                    )}
                  </li>
                ))}
              </ol>
              <a className="wj-item__go" href={href}>
                {uiT('home2.journeyGo', locale)} →
              </a>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
