import { t, uiT } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import { withBase } from '../../lib/base-url';
import { noteCanon, noteFields, noteScale } from '../../../data/meta/notes';
import axesMeta from '../../../data/meta/axes.json';
import '../../styles/notes.css';

type Props = { base: string };

export default function NotesPage({ base }: Props) {
  const locale = useLocale();

  return (
    <article className="notes-frame">
      <p className="notes-page__back">
        <a href={withBase(base, '/atlas/')}>{uiT('notes.back', locale)}</a>
      </p>
      <header className="notes-page__masthead">
        <h1 className="notes-page__title display">{uiT('notes.title', locale)}</h1>
        <div className="notes-page__ornament" aria-hidden="true">
          <span>✦</span>
          <span>✦</span>
          <span>✦</span>
        </div>
        <p className="notes-page__essay">
          <a href={withBase(base, '/anatomie-herniho-lore/')}>{uiT('notes.essayLink', locale)} →</a>
        </p>
      </header>

      <div className="notes-table">
        {noteFields.map((field) => (
          <section className="notes-table__row" key={field.term.cs}>
            <h2 className="notes-table__term">{t(field.term, locale)}</h2>
            <div className="notes-table__body">
              <p className="notes-table__help">
                <em>{t(field.help, locale)}</em>
              </p>
              {field.values ? <p className="notes-table__values">{t(field.values, locale)}</p> : null}
            </div>
          </section>
        ))}
      </div>

      <h2 className="notes-page__section notes-page__section--center" id="stupnice">
        {uiT('notes.profileTitle', locale)}
      </h2>
      <div className="notes-table">
        {axesMeta.axes.map((axis) => (
          <section className="notes-table__row" key={axis.id}>
            <h3 className="notes-table__term">
              {t(axis.left, locale)} ↔ {t(axis.right, locale)}
            </h3>
            <div className="notes-table__body">
              <p className="notes-table__help">
                <em>
                  {t(axis.help, locale)}
                  {'notesExtra' in axis && axis.notesExtra ? ` ${t(axis.notesExtra, locale)}` : ''}
                </em>
              </p>
            </div>
          </section>
        ))}
      </div>

      <div className="notes-scale">
        {noteScale.map((step) => (
          <p className="notes-scale__row" key={step.value}>
            <span className={`notes-scale__value${step.value === '3' ? ' notes-scale__value--mid' : ''}`}>{step.value}</span>
            {t(step.label, locale)}
          </p>
        ))}
      </div>

      <h2 className="notes-page__section notes-page__section--center" id="triada">
        {uiT('notes.triadTitle', locale)}
      </h2>
      <div className="notes-table">
        {(
          [
            ['card.originalSin', 'card.triadHelpOriginalSin', 'prvotni-hrich'],
            ['card.centralDilemma', 'card.triadHelpCentralDilemma', 'ustredni-otazka'],
            ['card.ultimateMystery', 'card.triadHelpUltimateMystery', 'rizena-mezera'],
          ] as const
        ).map(([term, help, anchor]) => (
          <section className="notes-table__row" key={term}>
            <h3 className="notes-table__term">{uiT(term, locale)}</h3>
            <div className="notes-table__body">
              <p className="notes-table__help">
                <em>{uiT(help, locale)}</em>
              </p>
              <p className="notes-table__values">
                <a href={withBase(base, `/anatomie-herniho-lore/#${anchor}`)}>{uiT('card.triadHelpMore', locale)} →</a>
              </p>
            </div>
          </section>
        ))}
      </div>

      <h2 className="notes-page__section notes-page__section--center" id="kanon">
        {uiT('notes.canonTitle', locale)}
      </h2>
      <div className="notes-page__canon">
        {t(noteCanon, locale)
          .split(/\n\s*\n/)
          .map((para) => para.trim())
          .filter(Boolean)
          .map((para) => (
            <p key={para.slice(0, 48)}>{para}</p>
          ))}
      </div>
    </article>
  );
}
