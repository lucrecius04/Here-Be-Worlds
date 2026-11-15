import { uiT, type Locale } from '../../lib/i18n';
import { TRAILS, type TrailId } from '../../lib/trails';

type Props = {
  locale: Locale;
  active: TrailId | null;
  onSelect: (id: TrailId | null) => void;
};

export default function ThematicTrails({ locale, active, onSelect }: Props) {
  return (
    <section className="trails" aria-label={uiT('home.trailsTitle', locale)}>
      <h2 className="home-section-title">{uiT('home.trailsTitle', locale)}</h2>
      <p className="trails__lead">{uiT('home.trailsLead', locale)}</p>
      <div className="trails__grid">
        {TRAILS.map((trail) => {
          const selected = active === trail.id;
          return (
            <button
              key={trail.id}
              type="button"
              className={`trails__card${selected ? ' trails__card--on' : ''}`}
              aria-pressed={selected}
              onClick={() => onSelect(selected ? null : trail.id)}
            >
              <span className="trails__name">{uiT(trail.nameKey, locale)}</span>
              <span className="trails__desc">{uiT(trail.descKey, locale)}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
