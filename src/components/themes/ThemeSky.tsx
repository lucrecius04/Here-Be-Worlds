import type { CSSProperties } from 'react';
import { t, type Locale } from '../../lib/i18n';
import { withBase } from '../../lib/base-url';
import type { ThemeSkyData } from '../../lib/theme-pages';

type Props = {
  sky: ThemeSkyData;
  base: string;
  locale: Locale;
  label: string;
  /** Rozsvícené hvězdy (najetí na svět nebo archetyp na stránce); prázdné = všechny stejně. */
  highlight: Set<string>;
  onHover: (id: string | null) => void;
};

const hue = (accent: { light: string; dark: string }) =>
  ({ '--th-hue-l': accent.light, '--th-hue-d': accent.dark }) as CSSProperties;

/**
 * Obloha z titulní strany: noční nebe vpravo v hlavičce (pás za ním přechází do noci),
 * hvězdy na stejných místech, světy tématu svítí v barvě archetypu a spojuje je zlatá
 * přerušovaná trasa jako „Trasy oblohou“. Ostatní hvězdy tlumeně.
 */
export default function ThemeSky({ sky, base, locale, label, highlight, onHover }: Props) {
  const path = sky.route.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
  const one = highlight.size === 1 ? [...highlight][0] : null;
  const shown = sky.stars.find((s) => s.id === one && s.lit);
  return (
    <figure className="th-sky">
      <svg viewBox={`0 0 1000 ${sky.height}`} role="group" aria-label={label} className={highlight.size ? 'has-focus' : undefined}>
        <g className="th-sky__lines" aria-hidden="true">
          {sky.lines.map((l, i) => (
            <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
          ))}
        </g>
        <g className="th-sky__groups" aria-hidden="true">
          {sky.groups.map((g) => (
            <text key={g.id} x={g.x - 20} y={g.y + 14} className={g.lit ? 'is-lit' : undefined} style={hue(g.accent)}>
              {t(g.label, locale)}
            </text>
          ))}
        </g>
        {sky.route.length > 1 ? <path className="th-sky__route" d={path} aria-hidden="true" /> : null}
        <g aria-hidden="true">
          {sky.stars
            .filter((s) => !s.lit)
            .map((s) => (
              <circle key={s.id} className="th-sky__star" cx={s.x} cy={s.y} r={4} style={hue(s.accent)} />
            ))}
        </g>
        {sky.stars
          .filter((s) => s.lit)
          .map((s) => (
            <a
              key={s.id}
              href={withBase(base, `/worlds/${s.id}/`)}
              className={`th-sky__lit${highlight.has(s.id) ? ' is-hover' : ''}`}
              style={hue(s.accent)}
              onMouseEnter={() => onHover(s.id)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(s.id)}
              onBlur={() => onHover(null)}
            >
              <title>{t(s.title, locale)}</title>
              <circle className="th-sky__halo" cx={s.x} cy={s.y} r={s.size + 9} />
              <circle className="th-sky__dot" cx={s.x} cy={s.y} r={s.size + 2} />
            </a>
          ))}
        {shown ? (
          <text className="th-sky__name" x={Math.min(900, Math.max(100, shown.x))} y={shown.y + 40} textAnchor="middle" aria-hidden="true">
            {t(shown.title, locale)}
          </text>
        ) : null}
      </svg>
    </figure>
  );
}
