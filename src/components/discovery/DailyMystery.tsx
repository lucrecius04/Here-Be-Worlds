import { useEffect, useMemo, useState } from 'react';
import type { World } from '../../schemas/world';
import { t, uiT, type Locale } from '../../lib/i18n';
import { withBase } from '../../lib/base-url';
import {
  addDays,
  dayNumber,
  formatMysteryKicker,
  mysteryChoices,
  mysteryMode,
  mysteryWorldIndex,
} from '../../lib/calendar';
import AxisBars from './AxisBars';

type Props = {
  catalog: World[];
  locale: Locale;
  base: string;
  today: Date;
};

const STORAGE_KEY = 'hbw_mystery';

/** Odpovědi posledních dní (den → id zvoleného světa), aby šlo hádat jen jednou. */
function readAnswers(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveAnswer(day: number, id: string) {
  try {
    const answers = { ...readAnswers(), [String(day)]: id };
    const recent = Object.keys(answers)
      .map(Number)
      .filter((key) => key >= day - 7)
      .reduce<Record<string, string>>((acc, key) => ({ ...acc, [String(key)]: answers[String(key)] }), {});
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
  } catch {
    /* bez úložiště se odpověď jen nezapamatuje */
  }
}

function redactGameTitle(text: string, world: World): string {
  const names = [world.gameTitle.cs, world.gameTitle.en].filter(
    (name): name is string => Boolean(name),
  );
  let next = text;
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    next = next.replace(new RegExp(escaped, 'gi'), '[…]');
  }
  return next;
}

function clueFor(world: World, mode: 0 | 1 | 2 | 3, locale: Locale): { label: string; body: string } {
  if (mode === 1) {
    return { label: uiT('card.centralDilemma', locale), body: t(world.triad.centralDilemma, locale) };
  }
  if (mode === 2) {
    return { label: uiT('card.ultimateMystery', locale), body: t(world.triad.ultimateMystery, locale) };
  }
  if (mode === 3) {
    return {
      label: uiT('card.keyActors', locale),
      body: redactGameTitle(t(world.metadata.keyActors, locale), world),
    };
  }
  return { label: uiT('card.originalSin', locale), body: t(world.triad.originalSin, locale) };
}

const PROMPT_KEYS = [
  'home.mysteryPrompt',
  'home.mysteryPromptDilemma',
  'home.mysteryPromptSecret',
  'home.mysteryPromptActors',
] as const;

export default function DailyMystery({ catalog, locale, base, today }: Props) {
  const [offset, setOffset] = useState<0 | -1>(0);
  const [picked, setPicked] = useState<string | null>(null);
  const viewDate = offset === 0 ? today : addDays(today, offset);
  const mode = mysteryMode(viewDate);
  const day = dayNumber(viewDate);
  const world =
    catalog.length > 0 ? (catalog[mysteryWorldIndex(catalog.length, viewDate)] ?? catalog[0]) : undefined;
  const choices = useMemo(
    () => (world ? mysteryChoices(catalog, world, viewDate) : []),
    [catalog, world, viewDate],
  );

  useEffect(() => {
    setPicked(readAnswers()[String(day)] ?? null);
  }, [day]);

  if (!world) return null;

  const clue = clueFor(world, mode, locale);
  const answered = picked !== null;
  const kickerDate = formatMysteryKicker(viewDate, locale);

  const shift = (next: 0 | -1) => {
    setOffset(next);
  };

  const pick = (id: string) => {
    setPicked(id);
    saveAnswer(day, id);
  };

  return (
    <section className="hp-mystery" aria-label={uiT('home.dailyMystery', locale)}>
      <div className="hp-mystery__head">
        <p className="hp-kicker">
          {uiT('home.dailyMystery', locale)} · {kickerDate}
        </p>
        <p className="hp-mystery__nav">
          <button
            type="button"
            className="hp-mystery__nav-btn"
            disabled={offset === -1}
            onClick={() => shift(-1)}
          >
            {uiT('home.mysteryYesterday', locale)}
          </button>
          <span aria-hidden="true">|</span>
          <button
            type="button"
            className="hp-mystery__nav-btn"
            disabled={offset === 0}
            onClick={() => shift(0)}
          >
            {uiT('home.mysteryToday', locale)}
          </button>
        </p>
      </div>
      <h2 className="hp-mystery__prompt">{uiT(PROMPT_KEYS[mode], locale)}</h2>
      <p className="hp-mystery__clue">
        <span className="visually-hidden">{clue.label}: </span>„{clue.body}“
      </p>
      {mode === 3 ? <AxisBars world={world} locale={locale} /> : null}
      <div className="hp-mystery__choices" aria-live="polite">
        {choices.map((choice) => {
          const title = t(choice.gameTitle, locale);
          if (!answered) {
            return (
              <button key={choice.id} type="button" className="hp-mystery__choice" onClick={() => pick(choice.id)}>
                <span>{title}</span>
              </button>
            );
          }
          // Po odpovědi jsou všechny tři světy odkazy na své spisy.
          const right = choice.id === world.id;
          const wrong = !right && picked === choice.id;
          return (
            <a
              key={choice.id}
              className={`hp-mystery__choice is-open${right ? ' is-right' : ''}${wrong ? ' is-wrong' : ''}`}
              href={withBase(base, `/worlds/${choice.id}/`)}
            >
              <span className="hp-mystery__title">{title}</span>
              {right ? (
                <span className="hp-mystery__mark" aria-label={uiT('home.mysteryRight', locale)}>
                  ✓
                </span>
              ) : wrong ? (
                <span className="hp-mystery__mark" aria-label={uiT('home.mysteryWrong', locale)}>
                  ✗
                </span>
              ) : (
                <span className="hp-mystery__mark hp-mystery__mark--go" aria-hidden="true">
                  →
                </span>
              )}
            </a>
          );
        })}
      </div>
    </section>
  );
}
