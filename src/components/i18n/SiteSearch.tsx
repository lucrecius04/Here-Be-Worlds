import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLocale } from '../../lib/locale-store';
import { uiT, worldsCountLabel, type Locale } from '../../lib/i18n';
import { withBase } from '../../lib/base-url';
import { readReaderDesk } from '../../lib/reader-desk';
import {
  comparePair,
  createSiteIndex,
  matchRanges,
  searchSite,
  type SearchEntry,
  type SearchKind,
  type SiteIndex,
} from '../../lib/site-search';
import '../../styles/site-search.css';

type Props = { base: string };

/** Rejstřík se načte jednou za návštěvu stránky, poprvé při najetí na lupu nebo jejím otevření. */
let indexPromise: Promise<{ index: SiteIndex; entries: SearchEntry[] }> | null = null;
function loadIndex(base: string) {
  if (!indexPromise) {
    indexPromise = fetch(withBase(base, '/search-index.json'))
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<SearchEntry[]>;
      })
      .then((entries) => ({ index: createSiteIndex(entries), entries }))
      .catch((err) => {
        indexPromise = null;
        throw err;
      });
  }
  return indexPromise;
}

type Row = {
  key: string;
  href: string;
  group: string;
  entry?: SearchEntry;
  /** Vlastní obsah řádku (srovnání, náhodný svět). */
  label?: ReactNode;
  sub?: string;
  onPick?: () => void;
};

const pick = (pair: { cs: string; en: string } | undefined, locale: Locale) => (pair ? pair[locale] || pair.cs : '');

function Highlight({ text, query }: { text: string; query: string }) {
  const ranges = query ? matchRanges(text, query) : [];
  if (!ranges.length) return <>{text}</>;
  const chars = [...text];
  const out: ReactNode[] = [];
  let at = 0;
  ranges.forEach(([from, to], i) => {
    if (from > at) out.push(chars.slice(at, from).join(''));
    out.push(
      <mark key={i} className="ss-mark">
        {chars.slice(from, to).join('')}
      </mark>,
    );
    at = to;
  });
  if (at < chars.length) out.push(chars.slice(at).join(''));
  return <>{out}</>;
}

export default function SiteSearch({ base }: Props) {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [data, setData] = useState<{ index: SiteIndex; entries: SearchEntry[] } | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'ready'>('idle');
  const [active, setActive] = useState(0);
  const [top, setTop] = useState(0);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const prefetch = useCallback(() => {
    if (data || status === 'loading') return;
    setStatus('loading');
    loadIndex(base)
      .then((d) => {
        setData(d);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [base, data, status]);

  const openSearch = useCallback(() => {
    // Panel začíná pod hlavičkou webu; když hlavička odjela (spis světa), hned nahoře.
    const header = document.querySelector('.site-header');
    setTop(Math.max(0, header ? header.getBoundingClientRect().bottom : 0));
    setOpen(true);
    prefetch();
  }, [prefetch]);

  const close = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus({ preventScroll: true });
  }, []);

  // `/` nebo Ctrl+K otevře hledání odkudkoli (mimo psaní do pole).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
      if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (open) close();
        else openSearch();
      } else if (e.key === '/' && !typing && !open && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        openSearch();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, openSearch, close]);

  // Otevřený panel: stránka pod ním se neposouvá, kurzor je v poli.
  useEffect(() => {
    if (!open) return undefined;
    document.documentElement.classList.add('is-search-open');
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      cancelAnimationFrame(frame);
      document.documentElement.classList.remove('is-search-open');
    };
  }, [open]);

  const groups = useMemo(() => (data && query.trim() ? searchSite(data.index, query) : []), [data, query]);
  const pair = useMemo(() => (data && query.trim() ? comparePair(data.index, query) : null), [data, query]);

  const rows = useMemo<Row[]>(() => {
    if (!data) return [];
    const out: Row[] = [];
    if (query.trim()) {
      if (pair) {
        out.push({
          key: 'compare',
          group: 'action',
          href: `/compare/?w=${pair[0].id},${pair[1].id}`,
          label: (
            <>
              {uiT('siteSearch.compare', locale)} <span className="ss-item__strong">{pick(pair[0].title, locale)}</span> ×{' '}
              <span className="ss-item__strong">{pick(pair[1].title, locale)}</span>
            </>
          ),
        });
      }
      for (const g of groups) for (const e of g.items) out.push({ key: `${e.kind}:${e.id}`, group: e.kind, href: e.href, entry: e });
      return out;
    }
    // Prázdné pole: naposledy otevřené spisy, archetypy, náhodný svět.
    const byKey = data.index.byKey;
    readReaderDesk()
      .recent.slice(0, 4)
      .forEach((r) => {
        const e = byKey.get(`world:${r.id}`);
        if (e) out.push({ key: `recent:${r.id}`, group: 'recent', href: e.href, entry: e });
      });
    data.entries
      .filter((e) => e.kind === 'chapter')
      .forEach((e) => out.push({ key: `chapter:${e.id}`, group: 'archetypes', href: e.href, entry: e }));
    const worlds = data.entries.filter((e) => e.kind === 'world');
    out.push({
      key: 'random',
      group: 'archetypes',
      href: '/atlas/',
      label: <>{uiT('siteSearch.random', locale)} →</>,
      onPick: () => {
        const w = worlds[Math.floor(Math.random() * worlds.length)];
        if (w) window.location.href = withBase(base, w.href);
      },
    });
    return out;
  }, [data, query, groups, pair, locale, base]);

  useEffect(() => setActive(0), [query, open]);

  useEffect(() => {
    listRef.current?.querySelector('.ss-item.is-active')?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const go = (row: Row | undefined) => {
    if (!row) return;
    if (row.onPick) row.onPick();
    else window.location.href = withBase(base, row.href);
  };

  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (query) setQuery('');
      else close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(rows.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(rows[active]);
    }
  };

  const groupLabel = (g: string) =>
    g === 'recent'
      ? uiT('siteSearch.recent', locale)
      : g === 'archetypes'
        ? uiT('siteSearch.archetypes', locale)
        : uiT(`siteSearch.groups.${g}`, locale);

  const subOf = (e: SearchEntry) => {
    if (e.kind === 'theme') return e.count ? worldsCountLabel(e.count, locale) : '';
    if (e.kind === 'trail' || e.kind === 'world' || e.kind === 'term' || e.kind === 'chapter') return pick(e.sub, locale);
    return '';
  };

  // Řádky po skupinách (pořadí zůstává jako v `rows`, kvůli šipkám).
  const sections: { group: string; rows: Array<Row & { index: number }> }[] = [];
  rows.forEach((row, index) => {
    const last = sections[sections.length - 1];
    if (last && last.group === row.group) last.rows.push({ ...row, index });
    else sections.push({ group: row.group, rows: [{ ...row, index }] });
  });

  const q = query.trim();
  const nothing = Boolean(q) && status === 'ready' && rows.length === 0;
  const totals = new Map<SearchKind, number>(groups.map((g) => [g.kind, g.total]));

  const panel = open ? (
    <div className="ss" style={{ '--ss-top': `${top}px` } as CSSProperties}>
      <div className="ss__backdrop" onClick={close} aria-hidden="true" />
      <div className="ss__panel" role="dialog" aria-modal="true" aria-label={uiT('siteSearch.label', locale)}>
        <div className="ss__inner">
          <div className="ss__field">
            <SearchIcon className="ss__icon" />
            <input
              ref={inputRef}
              className="ss__input"
              type="search"
              value={query}
              placeholder={uiT('siteSearch.placeholder', locale)}
              aria-label={uiT('siteSearch.label', locale)}
              aria-controls="ss-results"
              aria-activedescendant={rows[active] ? `ss-${rows[active].key}` : undefined}
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="go"
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onInputKey}
            />
            <button type="button" className="ss__close" onClick={close}>
              <span className="ss__close-key">Esc</span>
              <span className="ss__close-word">{uiT('siteSearch.close', locale)}</span>
            </button>
          </div>

          <div className="ss__results" id="ss-results" ref={listRef} role="listbox">
            {status === 'loading' && !data ? <p className="ss__note">{uiT('siteSearch.loading', locale)}</p> : null}
            {status === 'error' ? <p className="ss__note">{uiT('siteSearch.error', locale)}</p> : null}
            {nothing ? (
              <div className="ss__nothing">
                <p className="ss__nothing-title">{uiT('siteSearch.empty', locale)}</p>
                <p className="ss__note">{uiT('siteSearch.emptyHint', locale)}</p>
              </div>
            ) : null}

            {sections.map((section) => (
              <section key={section.group} className="ss-group">
                <h2 className="ss-group__label">
                  {groupLabel(section.group)}
                  {totals.get(section.group as SearchKind) && totals.get(section.group as SearchKind)! > section.rows.length ? (
                    <span className="ss-group__count">
                      {section.rows.length} / {totals.get(section.group as SearchKind)}
                    </span>
                  ) : null}
                </h2>
                <ul className="ss-group__list">
                  {section.rows.map((row) => {
                    const e = row.entry;
                    const sub = e ? subOf(e) : row.sub;
                    const hue = e?.hue ? ({ '--hue-l': e.hue.light, '--hue-d': e.hue.dark } as CSSProperties) : undefined;
                    return (
                      <li key={row.key} className="ss-group__row">
                        <a
                          id={`ss-${row.key}`}
                          role="option"
                          aria-selected={row.index === active}
                          className={`ss-item${row.index === active ? ' is-active' : ''}${hue ? ' has-hue' : ''}`}
                          href={withBase(base, row.href)}
                          style={hue}
                          onMouseMove={() => row.index !== active && setActive(row.index)}
                          onClick={(ev) => {
                            if (row.onPick) {
                              ev.preventDefault();
                              row.onPick();
                            }
                          }}
                        >
                          {hue ? <i className="ss-item__dot" aria-hidden="true" /> : null}
                          <span className="ss-item__title">
                            {row.label ?? (e ? <Highlight text={pick(e.title, locale)} query={q} /> : null)}
                          </span>
                          {sub ? (
                            <span className="ss-item__sub">
                              <Highlight text={sub} query={e?.kind === 'world' || e?.kind === 'trail' ? q : ''} />
                            </span>
                          ) : null}
                        </a>
                        {e?.kind === 'theme' && e.altHref ? (
                          <a className="ss-item__alt" href={withBase(base, e.altHref)}>
                            {uiT('siteSearch.trailsForTheme', locale)} →
                          </a>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}

            {q && status === 'ready' ? (
              <p className="ss__atlas">
                <a href={withBase(base, `/atlas/?q=${encodeURIComponent(q)}`)}>
                  {uiT('siteSearch.inAtlas', locale).replace('{q}', q)} →
                </a>
              </p>
            ) : null}
          </div>

          <p className="ss__hint" aria-hidden="true">
            {uiT('siteSearch.hint', locale)}
          </p>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="site-search__btn"
        aria-label={uiT('siteSearch.open', locale)}
        title={`${uiT('siteSearch.open', locale)} (/)`}
        aria-expanded={open}
        onPointerEnter={prefetch}
        onFocus={prefetch}
        onClick={() => (open ? close() : openSearch())}
      >
        <SearchIcon className="site-search__icon" />
      </button>
      {mounted && panel ? createPortal(panel, document.body) : null}
    </>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <path d="M15.2 15.2 20.5 20.5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}
