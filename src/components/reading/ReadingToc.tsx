import { useEffect, useState, type MouseEvent } from 'react';
import '../../styles/reading-toc.css';

export type ReadingTocItem = {
  id: string;
  title: string;
  /** Číslo před názvem („01“). Úvodem, Epilog a Zdroje ho nemají, názvy přesto lícují. */
  kicker?: string;
};

type Props = {
  items: ReadingTocItem[];
  active: string;
  label: string;
  /** „11 kapitol · 38 min“ */
  meta?: string;
  ariaLabel?: string;
  /** Vlastní posun (kronika se posouvá ve vlastním sloupci). Bez něj funguje obyčejná kotva. */
  onSelect?: (id: string, event: MouseEvent<HTMLAnchorElement>) => void;
  /** Delší štítek (např. „Kniha první“) nad názvem místo krátkého čísla před ním (kronika). */
  stacked?: boolean;
};

/**
 * Obsah dlouhého čtení (esej, kronika). Jedna svislá linka, přečtená část
 * se vybarví do aktuální kapitoly. Na úzkém displeji se sbalí do řádku,
 * který ukazuje, kde čtenář právě je.
 */
export default function ReadingToc({ items, active, label, meta, ariaLabel, onSelect, stacked = false }: Props) {
  const [open, setOpen] = useState(false);
  const activeIndex = items.findIndex((item) => item.id === active);
  const current = activeIndex >= 0 ? items[activeIndex] : undefined;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <nav className={`rtoc${stacked ? ' rtoc--stacked' : ''}${open ? ' is-open' : ''}`} aria-label={ariaLabel ?? label}>
      <p className="rtoc__head">
        <span className="rtoc__label">{label}</span>
        {meta ? <span className="rtoc__meta">{meta}</span> : null}
      </p>

      <button
        type="button"
        className="rtoc__toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="rtoc__label">{label}</span>
        <span className="rtoc__now">{current?.title ?? meta ?? ''}</span>
        <span className="rtoc__sign" aria-hidden="true">
          {open ? '−' : '+'}
        </span>
      </button>

      <ol className="rtoc__list">
        {items.map((item, i) => {
          const state = i === activeIndex ? ' is-active' : i < activeIndex ? ' is-read' : '';
          return (
            <li key={item.id} className={`rtoc__item${state}`}>
              <a
                href={`#${item.id}`}
                aria-current={i === activeIndex ? 'location' : undefined}
                onClick={(e) => {
                  setOpen(false);
                  onSelect?.(item.id, e);
                }}
              >
                {item.kicker ? <span className="rtoc__kicker">{item.kicker}</span> : null}
                <span className="rtoc__title">{item.title}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
