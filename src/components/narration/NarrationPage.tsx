import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { LocalizedString } from '../../schemas/world';
import { t, uiT, worldCountLabel, type Locale } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import { withBase } from '../../lib/base-url';
import '../../styles/narration.css';

export type NarrPageFamily = {
  id: string;
  short: LocalizedString;
  label: LocalizedString;
  kin: LocalizedString;
  question: LocalizedString;
  desc: LocalizedString;
  own: boolean;
};
export type NarrPageTechnique = {
  id: string;
  family: string;
  label: LocalizedString;
  desc: LocalizedString;
  trail?: { slug: string; label: LocalizedString };
};
export type NarrPageTool = {
  world: string;
  index: number;
  technique: string;
  mode?: 'V' | 'I' | 'E';
  also?: string;
  title: string;
  aside?: string;
  text: string;
};
export type NarrPageWorld = {
  id: string;
  title: LocalizedString;
  chapterId: string;
  accent: { light: string; dark: string };
  anchor: string;
  counts: number[];
};
export type NarrPageChapter = { id: string; title: LocalizedString; short?: LocalizedString };

type Props = {
  base: string;
  /** Šest kruhů od slova k hráči. */
  rings: NarrPageFamily[];
  /** Skupina mimo kruhy (vlastnosti světa). */
  outside: NarrPageFamily;
  techniques: NarrPageTechnique[];
  tools: NarrPageTool[];
  worlds: NarrPageWorld[];
  chapters: NarrPageChapter[];
};

type Sort = 'archetype' | 'alpha';

const hue = (accent: { light: string; dark: string }) =>
  ({ '--nv-hue-l': accent.light, '--nv-hue-d': accent.dark }) as CSSProperties;

function plural(n: number, locale: Locale, one: string, few: string, many: string): string {
  const key = locale === 'en' ? (n === 1 ? one : many) : n === 1 ? one : n >= 2 && n <= 4 ? few : many;
  return `${n} ${uiT(`narrPage.${key}`, locale)}`;
}
const toolsLabel = (n: number, locale: Locale) => plural(n, locale, 'toolOne', 'toolFew', 'toolMany');
const techLabel = (n: number, locale: Locale) => plural(n, locale, 'techOne', 'techFew', 'techMany');
const ringLabel = (n: number, locale: Locale) => plural(n, locale, 'ringOne', 'ringFew', 'ringMany');

const SPECTRUM_ID = 'od-slova-k-hraci';
const WORLDS_ID = 'svety';
const toolId = (tool: { world: string; index: number }) => `n-${tool.world}-${tool.index}`;

/* ---------- geometrie mapy kruhů ---------- */
const W = 1000;
const CX = 500;
const CY = 508;
const R0 = 92;
const BAND = 68;
const rIn = (k: number) => R0 + k * BAND;
const rOut = (k: number) => rIn(k) + BAND;
const pt = (r: number, a: number) => [CX + r * Math.cos(a), CY - r * Math.sin(a)] as const;
const f1 = (n: number) => Math.round(n * 10) / 10;
/** Horní půlkruh poloměru r zleva doprava (pro popisek po oblouku). */
const arcPath = (r: number) => `M ${f1(CX - r)} ${CY} A ${r} ${r} 0 0 1 ${f1(CX + r)} ${CY}`;
/** Půlmezikruží kruhu k (plocha pro najetí a podklad). */
const bandPath = (k: number) => {
  const a = rOut(k);
  const b = rIn(k);
  return `M ${CX - a} ${CY} A ${a} ${a} 0 0 1 ${CX + a} ${CY} L ${CX + b} ${CY} A ${b} ${b} 0 0 0 ${CX - b} ${CY} Z`;
};

type Placed = { tool: NarrPageTool; x: number; y: number; rot: number };
type Tick = { x1: number; y1: number; x2: number; y2: number };

/**
 * Čtverečky nástrojů po oblouku kruhu: shluky po způsobech, uprostřed nahoře. Mezi způsoby je mezera
 * a v ní radiální ryska přes pás (2026-11-28: samotná mezera vypadala jako chybějící čtvereček).
 */
function placeRing(list: NarrPageTool[], k: number): { tools: Placed[]; ticks: Tick[] } {
  const r = rOut(k) - 15;
  const groups = list.reduce((n, tool, i) => n + (i > 0 && tool.technique !== list[i - 1].technique ? 1 : 0), 0);
  let step = 11.5;
  const gap = 11;
  const need = (s: number) => list.length * s + groups * gap;
  const room = Math.PI * r * 0.94;
  if (need(step) > room) step = (room - groups * gap) / list.length;
  let a = Math.PI / 2 + need(step) / 2 / r - step / 2 / r;
  const ticks: Tick[] = [];
  const tools = list.map((tool, i) => {
    if (i > 0) {
      const boundary = tool.technique !== list[i - 1].technique;
      const prev = a;
      a -= (step + (boundary ? gap : 0)) / r;
      if (boundary) {
        const mid = (prev + a) / 2;
        const [x1, y1] = pt(r - 8, mid);
        const [x2, y2] = pt(r + 8, mid);
        ticks.push({ x1: f1(x1), y1: f1(y1), x2: f1(x2), y2: f1(y2) });
      }
    }
    const [x, y] = pt(r, a);
    return { tool, x: f1(x), y: f1(y), rot: f1(90 - (a * 180) / Math.PI) };
  });
  return { tools, ticks };
}

export default function NarrationPage({ base, rings, outside, techniques, tools, worlds, chapters }: Props) {
  const locale = useLocale();
  const byWorld = useMemo(() => new Map(worlds.map((w) => [w.id, w])), [worlds]);
  const techById = useMemo(() => new Map(techniques.map((x) => [x.id, x])), [techniques]);
  const chapterOrder = useMemo(() => new Map(chapters.map((c, i) => [c.id, i])), [chapters]);
  const ringIndex = useMemo(() => new Map(rings.map((r, i) => [r.id, i])), [rings]);
  const ownFrom = rings.findIndex((f) => f.own);
  const chapterName = (id: string) => {
    const c = chapters.find((x) => x.id === id);
    return c ? t(c.short ?? c.title, locale) : id;
  };
  const ringName = (id: string) => {
    const r = rings.find((x) => x.id === id);
    return r ? t(r.label, locale) : id;
  };

  // Nástroje v pořadí atlasu (archetyp, název světa), aby byl rejstřík v každém způsobu stejně řazený.
  const orderedTools = useMemo(
    () =>
      [...tools].sort((a, b) => {
        const wa = byWorld.get(a.world);
        const wb = byWorld.get(b.world);
        return (
          (chapterOrder.get(wa?.chapterId ?? '') ?? 0) - (chapterOrder.get(wb?.chapterId ?? '') ?? 0) ||
          t(wa?.title ?? { en: '' }, locale).localeCompare(t(wb?.title ?? { en: '' }, locale), locale) ||
          a.index - b.index
        );
      }),
    [tools, byWorld, chapterOrder, locale],
  );

  const familyOf = (tool: NarrPageTool) => techById.get(tool.technique)?.family ?? '';
  const familyTools = (familyId: string) => orderedTools.filter((tool) => familyOf(tool) === familyId);
  // Nástroje světa po kruzích (pro čtverečky v tabulce Světy: popisek a odkaz na nástroj).
  const worldRingTools = useMemo(() => {
    const map = new Map<string, NarrPageTool[]>();
    for (const tool of [...tools].sort((a, b) => a.index - b.index)) {
      const key = `${tool.world}|${techById.get(tool.technique)?.family ?? ''}`;
      map.set(key, [...(map.get(key) ?? []), tool]);
    }
    return map;
  }, [tools, techById]);
  const worldsInFamily = (familyId: string) => new Set(familyTools(familyId).map((x) => x.world)).size;
  const ringToolCount = rings.reduce((n, r) => n + familyTools(r.id).length, 0);

  // Mapa kruhů: v každém kruhu nástroje seřazené po způsobech (pořadí z dat), uvnitř podle atlasu.
  const placed = useMemo(
    () =>
      rings.map((ring, k) => {
        const order = techniques.filter((x) => x.family === ring.id).map((x) => x.id);
        const list = order.flatMap((id) => orderedTools.filter((tool) => tool.technique === id));
        return placeRing(list, k);
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rings, techniques, orderedTools],
  );
  const [hover, setHover] = useState<NarrPageTool | null>(null);
  const [hoverRing, setHoverRing] = useState<string | null>(null);

  // Oddíl, který právě čteš: zvýrazní se v lepivém pruhu.
  const jumpIds = useMemo(() => [SPECTRUM_ID, ...rings.map((f) => f.id), outside.id, WORLDS_ID], [rings, outside]);
  const [current, setCurrent] = useState(SPECTRUM_ID);
  useEffect(() => {
    const els = jumpIds.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const onScroll = () => {
      const line = window.innerHeight * 0.3;
      let id = els[0]?.id ?? SPECTRUM_ID;
      for (const el of els) if (el.getBoundingClientRect().top <= line) id = el.id;
      setCurrent(id);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [jumpIds]);

  // Na telefonu je pruh posuvný do strany: zvýrazněný oddíl se v něm posune do zorného pole.
  useEffect(() => {
    const nav = document.querySelector<HTMLElement>('.nv-jump');
    const link = nav?.querySelector<HTMLElement>('[aria-current="location"]');
    if (!nav || !link || nav.scrollWidth <= nav.clientWidth) return;
    const left = link.offsetLeft - nav.offsetLeft;
    if (left < nav.scrollLeft || left + link.offsetWidth > nav.scrollLeft + nav.clientWidth)
      nav.scrollTo({ left: Math.max(0, left - 16), behavior: 'smooth' });
  }, [current]);

  // Kotva na způsob (#postavy-a-rozhovory z karty světa) nebo na nástroj (#n-svet-2 z mapy kruhů):
  // sjede na ni; nástroj se rozbalí.
  useEffect(() => {
    const go = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;
      const details = el.querySelector('details');
      if (details) details.open = true;
      requestAnimationFrame(() => el.scrollIntoView({ block: id.startsWith('n-') ? 'center' : 'start' }));
    };
    go();
    window.addEventListener('hashchange', go);
    return () => window.removeEventListener('hashchange', go);
  }, []);

  const [sort, setSort] = useState<Sort>('archetype');
  const sortedWorlds = useMemo(() => {
    const name = (w: NarrPageWorld) => t(w.title, locale);
    const list = [...worlds];
    if (sort === 'alpha') return list.sort((a, b) => name(a).localeCompare(name(b), locale));
    return list.sort(
      (a, b) => (chapterOrder.get(a.chapterId) ?? 0) - (chapterOrder.get(b.chapterId) ?? 0) || name(a).localeCompare(name(b), locale),
    );
  }, [worlds, sort, chapterOrder, locale]);

  /* Věta nad tabulkou vysvětluje, jak ji číst (2026-11-28: dřívější počet světů „bez kruhů z hraní“ byl zavádějící,
     kronika vybírá jen nástroje, kterými svět vyniká, ne všechny, které používá). */
  const finding = uiT('narrPage.finding', locale);

  const renderTools = (list: NarrPageTool[]) => (
    <ul className="nv-tools">
      {list.map((tool) => {
        const w = byWorld.get(tool.world);
        if (!w) return null;
        return (
          <li key={toolId(tool)} id={toolId(tool)} className="nv-tool" style={hue(w.accent)}>
            <details>
              <summary>
                <span className="nv-tool__world">
                  {t(w.title, locale)}
                  <span className="nv-tool__arch">{chapterName(w.chapterId)}</span>
                </span>
                <span className="nv-tool__title">
                  {tool.title}
                  {tool.aside ? <span className="nv-tool__aside"> ({tool.aside})</span> : null}
                </span>
                {tool.also || tool.mode === 'E' ? (
                  <span className="nv-tool__tags">
                    {tool.mode === 'E' ? (
                      <span className="nv-tool__tag nv-tool__tag--emergent" title={uiT('narrPage.emergentTitle', locale)}>
                        {uiT('narrPage.emergent', locale)}
                      </span>
                    ) : null}
                    {tool.also ? (
                      <span className="nv-tool__tag">
                        {uiT('narrPage.also', locale)}: {ringName(tool.also)}
                      </span>
                    ) : null}
                  </span>
                ) : null}
              </summary>
              <div className="nv-tool__body">
                <p>{tool.text}</p>
                <a href={withBase(base, `/worlds/${w.id}/?view=analysis#${w.anchor}`)}>{uiT('narrPage.readAnalysis', locale)} →</a>
              </div>
            </details>
          </li>
        );
      })}
    </ul>
  );

  const renderFamily = (f: NarrPageFamily, k: number | null) => {
    const famTechniques = techniques.filter((x) => x.family === f.id);
    const count = familyTools(f.id).length;
    const isOutside = k === null;
    return (
      <section
        key={f.id}
        className={`nv-family${f.own ? ' is-own' : ''}${isOutside ? ' is-outside' : ''}`}
        id={f.id}
        aria-labelledby={`${f.id}-h`}
      >
        <header className="nv-family__head">
          <div className="nv-family__lead">
            <p className="nv-family__kin">{isOutside ? t(f.kin, locale) : `${uiT(`narrPage.ordinal${k! + 1}`, locale)} · ${t(f.kin, locale)}`}</p>
            <h2 className="nv-family__name" id={`${f.id}-h`}>
              {t(f.label, locale)}
            </h2>
            {t(f.question, locale) ? <p className="nv-family__question">{t(f.question, locale)}</p> : null}
          </div>
          <div className="nv-family__aside">
            {!isOutside ? <RingGlyph active={k!} own={ownFrom} /> : null}
            <p className="nv-family__desc">{t(f.desc, locale)}</p>
            <p className="nv-family__count">
              {toolsLabel(count, locale)} · {worldCountLabel(worldsInFamily(f.id), locale)}
              {famTechniques.length > 1 ? ` · ${techLabel(famTechniques.length, locale)}` : ''}
            </p>
          </div>
        </header>

        {famTechniques.map((tech) => {
          const list = orderedTools.filter((tool) => tool.technique === tech.id);
          return (
            <section key={tech.id} className="nv-tech" id={tech.id} aria-labelledby={`${tech.id}-h`}>
              <div className="nv-tech__head">
                <h3 className="nv-tech__name" id={`${tech.id}-h`}>
                  {t(tech.label, locale)}
                </h3>
                <p className="nv-tech__desc">{t(tech.desc, locale)}</p>
                <p className="nv-tech__count">
                  <span className="nv-tech__squares" aria-hidden="true">
                    {list.map((tool) => {
                      const w = byWorld.get(tool.world);
                      return w ? <i key={toolId(tool)} style={hue(w.accent)} /> : null;
                    })}
                  </span>
                  {toolsLabel(list.length, locale)}
                  {tech.trail ? (
                    <>
                      <br />
                      <a href={withBase(base, `/putovani/${tech.trail.slug}/`)}>
                        {uiT('narrPage.trail', locale)}: {t(tech.trail.label, locale)} →
                      </a>
                    </>
                  ) : null}
                </p>
              </div>
              {renderTools(list)}
            </section>
          );
        })}
      </section>
    );
  };

  const hoverWorld = hover ? byWorld.get(hover.world) : undefined;

  return (
    <div className="nv-page">
      <header className="atlas-page__head page-band nv-head">
        <h1 className="atlas-page__title display">{uiT('narrPage.title', locale)}</h1>
        <p className="atlas-page__lead">{uiT('narrPage.lead', locale)}</p>
        <p className="nv-head__meta">
          {toolsLabel(ringToolCount, locale)} · {worldCountLabel(worlds.length, locale)} · {ringLabel(rings.length, locale)} ·{' '}
          {techLabel(techniques.filter((x) => x.family !== outside.id).length, locale)}
        </p>
        <p className="nv-head__links">
          <a href={withBase(base, '/notes/#poetika')}>{uiT('narrPage.whatIs', locale)}</a>
          <span className="nv-head__sep" aria-hidden="true">
            ·
          </span>
          <a href={withBase(base, '/anatomie-herniho-lore/#poetika-svetu')}>{uiT('narrPage.method', locale)}</a>
          <span className="nv-head__sep" aria-hidden="true">
            ·
          </span>
          <a href={withBase(base, '/teoreticke-zazemi/#herni-vypraveni-sest-kruhu')}>{uiT('narrPage.theory', locale)}</a>
        </p>
      </header>

      <div className="nv-sticky">
        <nav className="nv-jump" aria-label={uiT('narrPage.onPage', locale)}>
          <a href={`#${SPECTRUM_ID}`} aria-current={current === SPECTRUM_ID ? 'location' : undefined}>
            {uiT('narrPage.spectrumTitle', locale)}
          </a>
          {/* šest kruhů jako jeden blok na tónu pásu, uvnitř hranice před Činem */}
          <span className="nv-jump__group">
            {rings.map((f, i) => (
              <a
                key={f.id}
                href={`#${f.id}`}
                className={i === ownFrom ? 'is-own-start' : undefined}
                aria-current={current === f.id ? 'location' : undefined}
              >
                {t(f.short, locale)}
              </a>
            ))}
          </span>
          <span className="nv-jump__tail">
            <a href={`#${outside.id}`} aria-current={current === outside.id ? 'location' : undefined}>
              {uiT('narrPage.outsideJump', locale)}
            </a>
            <a href={`#${WORLDS_ID}`} aria-current={current === WORLDS_ID ? 'location' : undefined}>
              {uiT('narrPage.worldsJump', locale)}
            </a>
          </span>
        </nav>
      </div>

      {/* ---------- Od slova k hráči: mapa šesti kruhů ---------- */}
      <section className="nv-rings" id={SPECTRUM_ID} aria-labelledby={`${SPECTRUM_ID}-h`}>
        <h2 className="nv-rings__title" id={`${SPECTRUM_ID}-h`}>
          {uiT('narrPage.spectrumTitle', locale)}
        </h2>

        <figure className="nv-rings__figure">
          <svg
            className={`nv-map${hover ? ' has-hover' : ''}${hoverRing ? ' has-ring' : ''}`}
            viewBox={`0 0 ${W} 540`}
            role="img"
            aria-label={uiT('narrPage.ringsAria', locale)}
            onMouseLeave={() => {
              setHover(null);
              setHoverRing(null);
            }}
          >
            <defs>
              {rings.map((r, k) => (
                <path key={r.id} id={`nv-arc-${r.id}`} d={arcPath(rIn(k) + 23)} />
              ))}
            </defs>

            {/* kruhy od vnějšího: podklad, popisek po oblouku */}
            {[...rings].reverse().map((r) => {
              const k = ringIndex.get(r.id)!;
              return (
                <a
                  key={r.id}
                  href={`#${r.id}`}
                  className={`nv-map__ring${r.own ? ' is-own' : ''}${hoverRing === r.id ? ' is-hover' : ''}`}
                  onMouseEnter={() => {
                    setHover(null);
                    setHoverRing(r.id);
                  }}
                  onFocus={() => {
                    setHover(null);
                    setHoverRing(r.id);
                  }}
                  aria-label={`${t(r.label, locale)}: ${toolsLabel(familyTools(r.id).length, locale)}`}
                >
                  <path className="nv-map__band" d={bandPath(k)} />
                  <text className="nv-map__label">
                    <textPath href={`#nv-arc-${r.id}`} startOffset="50%" textAnchor="middle">
                      {t(r.label, locale)}
                    </textPath>
                  </text>
                </a>
              );
            })}

            {/* hranice „z hraní“ mezi třetím a čtvrtým kruhem */}
            <path className="nv-map__threshold" d={arcPath(rOut(ownFrom - 1))} />
            <line className="nv-map__base" x1={CX - rOut(rings.length - 1)} y1={CY} x2={CX + rOut(rings.length - 1)} y2={CY} />

            {/* nástroje: čtvereček v barvě archetypu světa */}
            {/* rysky mezi způsoby */}
            {placed.map((ring, k) =>
              ring.ticks.map((tick, i) => (
                <line
                  key={`${rings[k].id}-t${i}`}
                  className={`nv-map__tick${hoverRing && hoverRing !== rings[k].id ? ' is-dim' : ''}`}
                  x1={tick.x1}
                  y1={tick.y1}
                  x2={tick.x2}
                  y2={tick.y2}
                />
              )),
            )}

            {placed.map((ring, k) =>
              ring.tools.map(({ tool, x, y, rot }) => {
                const w = byWorld.get(tool.world);
                if (!w) return null;
                const isHover = hover === tool;
                const dim = (hoverRing && hoverRing !== rings[k].id) || (hover && hover.world !== tool.world);
                return (
                  <a
                    key={toolId(tool)}
                    href={`#${toolId(tool)}`}
                    className={`nv-map__tool${isHover ? ' is-hover' : ''}${dim ? ' is-dim' : ''}${hover && !isHover && hover.world === tool.world ? ' is-kin' : ''}`}
                    style={hue(w.accent)}
                    onMouseEnter={() => {
                      setHover(tool);
                      setHoverRing(null);
                    }}
                    /* po odjetí z čtverečku se nástroj zapomene: pod kurzorem je zase kruh, ne poslední svět */
                    onMouseLeave={() => setHover((cur) => (cur === tool ? null : cur))}
                    onFocus={() => {
                      setHover(tool);
                      setHoverRing(null);
                    }}
                    onBlur={() => setHover((cur) => (cur === tool ? null : cur))}
                    aria-label={`${t(w.title, locale)}: ${tool.title}`}
                  >
                    <rect x={-4.5} y={-4.5} width={9} height={9} transform={`translate(${x} ${y}) rotate(${rot})`} />
                  </a>
                );
              }),
            )}

            <text className="nv-map__core" x={CX} y={CY - 26} textAnchor="middle">
              {uiT('narrPage.core', locale)}
            </text>
            <text className="nv-map__caption" x={CX} y={CY + 22} textAnchor="middle">
              {uiT('narrPage.borrowed', locale)}
            </text>
            {[-1, 1].map((side) => (
              <text
                key={side}
                className="nv-map__caption is-own"
                x={CX + side * ((rOut(ownFrom - 1) + rOut(rings.length - 1)) / 2)}
                y={CY + 22}
                textAnchor="middle"
              >
                {uiT('narrPage.ownOnly', locale)}
              </text>
            ))}
          </svg>

          <figcaption className="nv-rings__readout" aria-live="polite">
            {hover && hoverWorld ? (
              <span className="nv-readout" style={hue(hoverWorld.accent)}>
                <span className="nv-readout__world">
                  {t(hoverWorld.title, locale)}
                  <span className="nv-readout__arch">{chapterName(hoverWorld.chapterId)}</span>
                </span>
                <span className="nv-readout__title">{hover.title}</span>
                <span className="nv-readout__where">
                  {ringName(familyOf(hover))} · {t(techById.get(hover.technique)?.label ?? { en: '' }, locale)}
                </span>
              </span>
            ) : hoverRing ? (
              (() => {
                const r = rings.find((x) => x.id === hoverRing)!;
                return (
                  <span className="nv-readout">
                    <span className="nv-readout__world">{t(r.label, locale)}</span>
                    <span className="nv-readout__title">{t(r.question, locale)}</span>
                    <span className="nv-readout__where">
                      {toolsLabel(familyTools(r.id).length, locale)} · {worldCountLabel(worldsInFamily(r.id), locale)}
                    </span>
                  </span>
                );
              })()
            ) : (
              <span className="nv-readout nv-readout--hint">{uiT('narrPage.ringsHint', locale)}</span>
            )}
          </figcaption>
        </figure>

        {/* telefon: kruhy jako seznam */}
        <ol className="nv-ringlist">
          {rings.map((r, k) => {
            const list = familyTools(r.id);
            return (
              <li key={r.id} className={`${r.own ? 'is-own' : ''}${k === ownFrom ? ' is-own-start' : ''}`}>
                <a href={`#${r.id}`}>
                  <span className="nv-ringlist__kin">{t(r.kin, locale)}</span>
                  <span className="nv-ringlist__name">{t(r.label, locale)}</span>
                  <span className="nv-ringlist__n">{list.length}</span>
                  <span className="nv-ringlist__squares" aria-hidden="true">
                    {list.map((tool) => {
                      const w = byWorld.get(tool.world);
                      return w ? <i key={toolId(tool)} style={hue(w.accent)} /> : null;
                    })}
                  </span>
                </a>
              </li>
            );
          })}
        </ol>
      </section>

      {/* ---------- Kruhy ---------- */}
      {rings.map((f, k) => (
        <div key={f.id} className="nv-ring-wrap">
          {k === ownFrom ? (
            <div className="nv-threshold" role="separator">
              <p className="nv-threshold__title">{uiT('narrPage.threshold', locale)}</p>
              <p className="nv-threshold__sub">{uiT('narrPage.thresholdSub', locale)}</p>
            </div>
          ) : null}
          {renderFamily(f, k)}
        </div>
      ))}

      {/* ---------- Mimo kruhy ---------- */}
      {renderFamily(outside, null)}

      {/* ---------- Vypravěčský podpis světů ---------- */}
      <section className="nv-worlds" id={WORLDS_ID} aria-labelledby={`${WORLDS_ID}-h`}>
        <div className="nv-worlds__head">
          <h2 className="nv-worlds__title" id={`${WORLDS_ID}-h`}>
            {uiT('narrPage.worldsTitle', locale)}
          </h2>
          <div className="nv-sort" role="group" aria-label={uiT('narrPage.sortLabel', locale)}>
            {(['archetype', 'alpha'] as Sort[]).map((s) => (
              <button key={s} type="button" aria-pressed={sort === s} onClick={() => setSort(s)}>
                {uiT(`narrPage.sort${s[0].toUpperCase()}${s.slice(1)}`, locale)}
              </button>
            ))}
          </div>
        </div>
        <p className="nv-finding">{finding}</p>

        <table className="nv-matrix">
          <colgroup>
            <col className="nv-matrix__c-world" />
            <col className="nv-matrix__c-sig" />
            {rings.map((f) => (
              <col key={f.id} />
            ))}
          </colgroup>
          <thead>
            <tr className="nv-matrix__bands" aria-hidden="true">
              <th colSpan={2} />
              <th colSpan={ownFrom} className="nv-matrix__band">
                {uiT('narrPage.borrowed', locale)}
              </th>
              <th colSpan={rings.length - ownFrom} className="nv-matrix__band nv-matrix__band--own">
                {uiT('narrPage.ownOnly', locale)}
              </th>
            </tr>
            <tr>
              <th scope="col" className="nv-matrix__corner">
                {uiT('narrPage.world', locale)}
              </th>
              <th scope="col" className="nv-matrix__corner nv-matrix__corner--sig">
                {uiT('narrPage.signature', locale)}
              </th>
              {rings.map((f, i) => (
                <th key={f.id} scope="col" className={`nv-matrix__fam${f.own ? ' is-own' : ''}${i === ownFrom ? ' is-own-start' : ''}`}>
                  <a href={`#${f.id}`}>{t(f.short, locale)}</a>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedWorlds.flatMap((w, row) => {
              const prev = row > 0 ? sortedWorlds[row - 1] : null;
              const rowsOut = [];
              if (sort === 'archetype' && w.chapterId !== prev?.chapterId) {
                const n = worlds.filter((x) => x.chapterId === w.chapterId).length;
                rowsOut.push(
                  <tr key={`g-${w.chapterId}`} className="nv-matrix__group">
                    <th scope="rowgroup" colSpan={rings.length + 2}>
                      <span className="nv-matrix__group-name">{chapterName(w.chapterId)}</span>
                      <span className="nv-matrix__group-meta">{worldCountLabel(n, locale)}</span>
                    </th>
                  </tr>,
                );
              }
              rowsOut.push(
                <tr key={w.id} style={hue(w.accent)}>
                  <th scope="row" className="nv-matrix__world">
                    <a href={withBase(base, `/worlds/${w.id}/?view=analysis#${w.anchor}`)}>{t(w.title, locale)}</a>
                  </th>
                  <td className="nv-matrix__sig">
                    <SignatureGlyph counts={w.counts} own={ownFrom} />
                  </td>
                  {rings.map((f, i) => {
                    const n = w.counts[i];
                    return (
                      <td
                        key={f.id}
                        className={`nv-matrix__cell${f.own ? ' is-own' : ''}${i === ownFrom ? ' is-own-start' : ''}`}
                        aria-label={`${t(f.label, locale)}: ${n}`}
                      >
                        {n > 0 ? (
                          <span className="nv-matrix__marks">
                            {(worldRingTools.get(`${w.id}|${f.id}`) ?? []).map((tool) => (
                              <a
                                key={toolId(tool)}
                                href={`#${toolId(tool)}`}
                                className="nv-matrix__mark"
                                aria-label={`${tool.title} (${uiT('narrPage.tipTechnique', locale)}: ${t(techById.get(tool.technique)?.label ?? { en: '' }, locale)})`}
                              >
                                <span className="nv-matrix__tip" aria-hidden="true">
                                  <span className="nv-matrix__tip-name">{tool.title}</span>
                                  <span className="nv-matrix__tip-tech">
                                    {uiT('narrPage.tipTechnique', locale)}: <em>{t(techById.get(tool.technique)?.label ?? { en: '' }, locale)}</em>
                                  </span>
                                </span>
                              </a>
                            ))}
                          </span>
                        ) : (
                          <span className="nv-matrix__none" aria-hidden="true" />
                        )}
                      </td>
                    );
                  })}
                </tr>,
              );
              return rowsOut;
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}

/** Malý znak kruhu v hlavičce oddílu: šest půlkruhů, tento kruh vyplněný. */
function RingGlyph({ active, own }: { active: number; own: number }) {
  const cx = 40;
  const cy = 38;
  return (
    <svg className="nv-glyph" viewBox="0 0 80 42" aria-hidden="true">
      {Array.from({ length: 6 }, (_, k) => {
        const r = 7 + k * 5.6;
        return (
          <path
            key={k}
            className={`${k === active ? 'is-active' : ''}${k === own ? ' is-own-start' : ''}`}
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          />
        );
      })}
      <line x1={2} y1={cy} x2={78} y2={cy} />
    </svg>
  );
}

/** Vypravěčský podpis světa: šest půlkruhů, kruhy s nástroji v barvě archetypu, tloušťka podle počtu. */
function SignatureGlyph({ counts, own }: { counts: number[]; own: number }) {
  const cx = 30;
  const cy = 27;
  return (
    <svg className="nv-sig" viewBox="0 0 60 30" aria-hidden="true">
      {counts.map((n, k) => {
        const r = 4.5 + k * 4.2;
        return (
          <path
            key={k}
            className={n > 0 ? 'is-on' : k >= own ? 'is-own-off' : undefined}
            style={n > 0 ? { strokeWidth: Math.min(1.4 + n * 0.9, 3.6) } : undefined}
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          />
        );
      })}
    </svg>
  );
}
