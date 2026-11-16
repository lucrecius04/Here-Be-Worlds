import { uiT, type Locale } from '../../lib/i18n';
import { withBase } from '../../lib/base-url';

type Props = { locale: Locale; base: string };

const KEYS: [string, string][] = [
  ['card.originalSin', 'prvotni-hrich'],
  ['card.centralDilemma', 'ustredni-otazka'],
  ['card.ultimateMystery', 'rizena-mezera'],
];

/** Pruh na titulní straně: vstup do eseje Anatomie herního lore. */
export default function EssayTeaser({ locale, base }: Props) {
  const href = withBase(base, '/anatomie-herniho-lore/');
  return (
    <section className="essay-teaser" aria-label={uiT('essay.title', locale)}>
      <div className="essay-teaser__text">
        <p className="essay-teaser__kicker">{uiT('essay.homeKicker', locale)}</p>
        <h2 className="essay-teaser__title display">
          <a href={href}>{uiT('essay.title', locale)}</a>
        </h2>
        <p className="essay-teaser__lead">{uiT('essay.homeLead', locale)}</p>
      </div>
      <div className="essay-teaser__side">
        <ul className="essay-teaser__keys">
          {KEYS.map(([key, anchor]) => (
            <li key={anchor}>
              <a href={`${href}#${anchor}`}>{uiT(key, locale)}</a>
            </li>
          ))}
        </ul>
        <a className="essay-teaser__cta" href={href}>
          {uiT('essay.homeCta', locale)} →
        </a>
      </div>
    </section>
  );
}
