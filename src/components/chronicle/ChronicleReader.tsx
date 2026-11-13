import { useEffect, useMemo, useRef, useState } from 'react';
import '../../styles/chronicle.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLocale } from '../../lib/locale-store';
import { uiT } from '../../lib/i18n';
import {
  extractChronicleToc,
  parseBookLabel,
  slugifyChronicleHeading,
} from '../../lib/chronicle-toc';

type Props = {
  markdown: string;
  coverTitle?: string;
  coverTagline?: string;
  coverRange?: string;
  showToc?: boolean;
  showCover?: boolean;
  sidebarTitle?: string;
};

export default function ChronicleReader({
  markdown,
  coverTitle,
  coverTagline,
  coverRange,
  showToc = true,
  showCover = true,
  sidebarTitle,
}: Props) {
  const locale = useLocale();
  const [active, setActive] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const toc = useMemo(() => (showToc ? extractChronicleToc(markdown) : []), [markdown, showToc]);

  useEffect(() => {
    const root = scrollRef.current;
    const observe = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) setActive(visible[0].target.id);
      },
      { root, rootMargin: '-10% 0px -70% 0px', threshold: [0, 0.25, 0.5] },
    );
    toc.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observe.observe(el);
    });
    return () => observe.disconnect();
  }, [toc, markdown]);

  return (
    <div className={`chronicle-layout${showToc ? '' : ' chronicle-layout--wide'}`}>
      {showToc ? (
        <nav className="chronicle-toc" aria-label={locale === 'cs' ? 'Obsah kroniky' : 'Chronicle contents'}>
          <p className="chronicle-toc__title">
            {sidebarTitle ?? uiT('world.fullChronicle', locale)}
          </p>
          {toc.length > 0 ? (
            <ul>
              {toc.map((h) => (
                <li key={h.id} className="chronicle-toc__item">
                  <a
                    href={`#${h.id}`}
                    className={active === h.id ? 'chronicle-toc__link--active' : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                  >
                    <span className="chronicle-toc__book">{h.label}</span>
                    {h.title ? <span className="chronicle-toc__chapter">{h.title}</span> : null}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </nav>
      ) : null}
      <div className="chronicle-scroll" ref={scrollRef}>
        {showCover ? (
          coverTitle || coverTagline ? (
            <header className="chronicle-cover">
              {coverTitle ? <h2 className="chronicle-cover__title display">{coverTitle}</h2> : null}
              {coverTagline ? <p className="chronicle-cover__tagline">{coverTagline}</p> : null}
              {coverRange ? <p className="chronicle-cover__range">{coverRange}</p> : null}
              <p className="chronicle-cover__spoiler">{uiT('world.spoilerNotice', locale)}</p>
            </header>
          ) : (
            <p className="chronicle-cover__spoiler">{uiT('world.spoilerNotice', locale)}</p>
          )
        ) : null}
        <article
          className={`chronicle-prose chronicle-prose--body${showToc ? '' : ' chronicle-prose--wide'}`}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => {
                const text = String(children);
                const book = parseBookLabel(text);
                if (book) {
                  return (
                    <p id={slugifyChronicleHeading(book)} className="chronicle-book-label">
                      {book}
                    </p>
                  );
                }
                return <p>{children}</p>;
              },
              h2: ({ children }) => {
                const text = String(children);
                const id = slugifyChronicleHeading(text);
                return <h2 id={id}>{children}</h2>;
              },
              h3: ({ children }) => {
                const text = String(children);
                const id = slugifyChronicleHeading(text);
                return <h3 id={id}>{children}</h3>;
              },
            }}
          >
            {markdown}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
