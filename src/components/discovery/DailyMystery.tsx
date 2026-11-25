import { useEffect, useState, type CSSProperties } from 'react';
import type { World } from '../../schemas/world';
import { t, uiT, type Locale } from '../../lib/i18n';
import { withBase } from '../../lib/base-url';
import { addDays, dayNumber, featuredWorldIndex, formatMysteryKicker } from '../../lib/calendar';
import { riddleKey, riddleSlot, type Riddle, type RiddleCounts } from '../../lib/riddle-day';
import AxisBars from './AxisBars';

type Props = {
  catalog: World[];
  counts: RiddleCounts;
  locale: Locale;
  base: string;
  today: Date;
};

const STORAGE_KEY = 'hbw_mystery';

/** Odpovědi posledních dní (den → „hádanka|id“), aby šlo hádat jen jednou. */
function readAnswers(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveAnswer(day: number, value: string) {
  try {
    const answers = { ...readAnswers(), [String(day)]: value };
    const recent = Object.keys(answers)
      .map(Number)
      .filter((key) => key >= day - 7)
      .reduce<Record<string, string>>((acc, key) => ({ ...acc, [String(key)]: answers[String(key)] }), {});
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
  } catch {
    /* bez úložiště se odpověď jen nezapamatuje */
  }
}

/** Uložená odpověď k této hádance (starší záznamy bez klíče platí, jen když volba v hádance je). */
function storedPick(day: number, riddle: Riddle): string | null {
  const value = readAnswers()[String(day)];
  if (!value) return null;
  const [key, id] = value.includes('|') ? value.split('|') : [null, value];
  if (key !== null && key !== riddle.key) return null;
  return riddle.choices.some((c) => c.id === id) ? id : null;
}

const loaded = new Map<string, Promise<Riddle | null>>();

function fetchRiddle(base: string, key: string): Promise<Riddle | null> {
  let hit = loaded.get(key);
  if (!hit) {
    hit = fetch(withBase(base, `/hadanky/${key}.json`))
      .then((res) => (res.ok ? (res.json() as Promise<Riddle>) : null))
      .catch(() => null);
    loaded.set(key, hit);
  }
  return hit;
}

/** Hádanka dne: druh i hádanku určí den; svět, o kterém je, nesmí být zároveň Světem dne. */
async function riddleFor(base: string, counts: RiddleCounts, date: Date, avoid: string | undefined): Promise<Riddle | null> {
  const slot = riddleSlot(dayNumber(date), counts);
  if (!slot) return null;
  const n = counts[slot.kind] ?? 1;
  for (let step = 0; step < Math.min(n, 4); step += 1) {
    const riddle = await fetchRiddle(base, riddleKey(slot.kind, (slot.index + step) % n));
    if (!riddle) return null;
    if (!avoid || riddle.about !== avoid) return riddle;
  }
  return null;
}

const hue = (accent: { light: string; dark: string }) =>
  ({ '--hm-hue-l': accent.light, '--hm-hue-d': accent.dark }) as CSSProperties;

export default function DailyMystery({ catalog, counts, locale, base, today }: Props) {
  const [offset, setOffset] = useState<0 | -1>(0);
  const [riddle, setRiddle] = useState<Riddle | null>(null);
  const [failed, setFailed] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const viewDate = offset === 0 ? today : addDays(today, offset);
  const day = dayNumber(viewDate);
  const featuredId = catalog.length > 0 ? catalog[featuredWorldIndex(catalog.length, viewDate)]?.id : undefined;

  useEffect(() => {
    let live = true;
    setFailed(false);
    riddleFor(base, counts, viewDate, featuredId).then((next) => {
      if (!live) return;
      setRiddle(next);
      setFailed(!next);
      setPicked(next ? storedPick(day, next) : null);
    });
    return () => {
      live = false;
    };
    // viewDate se skládá z dne; stačí sledovat den.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, base, counts, featuredId]);

  if (failed) return null;

  const answered = picked !== null;
  const kickerDate = formatMysteryKicker(viewDate, locale);
  const axesWorld = riddle?.axesOf ? catalog.find((w) => w.id === riddle.axesOf) : undefined;

  const pick = (id: string) => {
    if (!riddle) return;
    setPicked(id);
    saveAnswer(day, `${riddle.key}|${id}`);
  };

  return (
    <section className="hp-mystery" aria-label={uiT('home.dailyMystery', locale)} aria-busy={!riddle}>
      <div className="hp-mystery__head">
        <p className="hp-kicker">
          {uiT('home.dailyMystery', locale)} · {kickerDate}
        </p>
        <p className="hp-mystery__nav">
          <button type="button" className="hp-mystery__nav-btn" disabled={offset === -1} onClick={() => setOffset(-1)}>
            {uiT('home.mysteryYesterday', locale)}
          </button>
          <span aria-hidden="true">|</span>
          <button type="button" className="hp-mystery__nav-btn" disabled={offset === 0} onClick={() => setOffset(0)}>
            {uiT('home.mysteryToday', locale)}
          </button>
        </p>
      </div>
      {!riddle ? (
        <p className="hp-mystery__loading">{uiT('riddle.loading', locale)}</p>
      ) : (
        <>
          <h2 className="hp-mystery__prompt">{t(riddle.prompt, locale)}</h2>
          {riddle.worlds ? (
            <ul className="hp-mystery__worlds">
              {riddle.worlds.map((w) => (
                <li key={w.id} style={hue(w.accent)}>
                  {t(w.label, locale)}
                </li>
              ))}
            </ul>
          ) : null}
          {riddle.heading ? <p className="hp-mystery__heading">{t(riddle.heading, locale)}</p> : null}
          {riddle.quote ? <p className="hp-mystery__clue">„{t(riddle.quote, locale)}“</p> : null}
          {riddle.lines ? (
            <dl className="hp-mystery__lines">
              {riddle.lines.map((line) => (
                <div key={t(line.label, locale)}>
                  <dt>{t(line.label, locale)}</dt>
                  <dd>{t(line.text, locale)}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {riddle.tags ? (
            <ul className="hp-mystery__tags">
              {riddle.tags.map((tag) => (
                <li key={tag.en}>{t(tag, locale)}</li>
              ))}
            </ul>
          ) : null}
          {axesWorld ? <AxisBars world={axesWorld} locale={locale} /> : null}
          {answered && riddle.scale ? (
            <p className="hp-mystery__scale" aria-hidden="true">
              {t(riddle.scale.left, locale)} ↔ {t(riddle.scale.right, locale)}
            </p>
          ) : null}
          <div className="hp-mystery__choices" aria-live="polite">
            {riddle.choices.map((choice) => {
              const title = t(choice.label, locale);
              if (!answered) {
                return (
                  <button key={choice.id} type="button" className="hp-mystery__choice" onClick={() => pick(choice.id)}>
                    <span>{title}</span>
                  </button>
                );
              }
              // Po odpovědi jsou všechny tři možnosti odkazy (na spis světa nebo stránku putování).
              const right = choice.id === riddle.answer;
              const wrong = !right && picked === choice.id;
              return (
                <a
                  key={choice.id}
                  className={`hp-mystery__choice is-open${right ? ' is-right' : ''}${wrong ? ' is-wrong' : ''}`}
                  href={withBase(base, choice.href)}
                >
                  <span className="hp-mystery__body">
                    <span className="hp-mystery__title">{title}</span>
                    {choice.note ? <span className="hp-mystery__note">{t(choice.note, locale)}</span> : null}
                  </span>
                  {choice.value !== undefined ? (
                    <span
                      className="hp-mystery__cells"
                      role="img"
                      aria-label={`${riddle.scale ? t(riddle.scale.left, locale) : ''} ${choice.value} / 5 ${riddle.scale ? t(riddle.scale.right, locale) : ''}`}
                    >
                      {[1, 2, 3, 4, 5].map((v) => (
                        <i key={v} className={v === choice.value ? 'is-on' : undefined} />
                      ))}
                    </span>
                  ) : null}
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
          {answered && riddle.more ? (
            <p className="hp-mystery__more">
              <a href={withBase(base, riddle.more.href)}>{t(riddle.more.label, locale)} →</a>
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
