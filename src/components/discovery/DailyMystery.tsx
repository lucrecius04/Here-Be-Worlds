import { useMemo, useState } from 'react';
import type { World } from '../../schemas/world';
import { t, uiT, type Locale } from '../../lib/i18n';
import { withBase } from '../../lib/base-url';
import {
  addDays,
  dailyWorldIndex,
  formatMysteryKicker,
  mysteryChoices,
  mysteryMode,
} from '../../lib/calendar';
import MiniAxes from './MiniAxes';

type Props = {
  catalog: World[];
  locale: Locale;
  base: string;
  today: Date;
};

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
  const world =
    catalog.length > 0
      ? (catalog[dailyWorldIndex(catalog.length, 1, viewDate)] ?? catalog[0])
      : undefined;
  const choices = useMemo(
    () => (world ? mysteryChoices(catalog, world, viewDate) : []),
    [catalog, world, viewDate],
  );

  if (!world) return null;

  const clue = clueFor(world, mode, locale);
  const answered = picked !== null;
  const kickerDate = formatMysteryKicker(viewDate, locale);

  const shift = (next: 0 | -1) => {
    setOffset(next);
    setPicked(null);
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
      {mode === 3 ? <MiniAxes world={world} locale={locale} /> : null}
      <div className="hp-mystery__choices">
        {choices.map((choice, i) => {
          const state =
            picked === null
              ? ''
              : choice.id === world.id
                ? ' is-right'
                : picked === choice.id
                  ? ' is-wrong'
                  : '';
          return (
            <button
              key={choice.id}
              type="button"
              className={`hp-mystery__choice${state}`}
              disabled={answered}
              onClick={() => setPicked(choice.id)}
            >
              <span>{t(choice.gameTitle, locale)}</span>
              <span className="hp-mystery__letter" aria-hidden="true">
                {'ABCDE'[i]}
              </span>
            </button>
          );
        })}
      </div>
      {answered ? (
        <a className="hp-link hp-mystery__link" href={withBase(base, `/worlds/${world.id}/`)}>
          {uiT('home.mysteryLink', locale)}
        </a>
      ) : null}
    </section>
  );
}
