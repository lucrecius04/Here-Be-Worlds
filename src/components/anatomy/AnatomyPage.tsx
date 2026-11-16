import { type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { uiT } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import { withBase } from '../../lib/base-url';
import { slugifyChronicleHeading } from '../../lib/chronicle-toc';
import type { AnatomyDoc } from '../../lib/anatomy';
import '../../styles/anatomy.css';

type Props = {
  base: string;
  doc: AnatomyDoc;
};

function nodesToText(children: ReactNode): string {
  if (children == null || typeof children === 'boolean') return '';
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(nodesToText).join('');
  if (typeof children === 'object' && 'props' in children) {
    return nodesToText((children as { props?: { children?: ReactNode } }).props?.children);
  }
  return '';
}

function headingEl(Tag: 'h2' | 'h3', children: ReactNode) {
  const text = nodesToText(children).replace(/\s+/g, ' ').trim();
  const id = slugifyChronicleHeading(text);
  return <Tag id={id}>{children}</Tag>;
}

export default function AnatomyPage({ base, doc }: Props) {
  const locale = useLocale();

  return (
    <article className="anatomy-page">
      <p className="anatomy-page__back">
        <a href={withBase(base, '/')}>{uiT('anatomy.back', locale)}</a>
      </p>
      <header className="anatomy-page__masthead">
        <h1 className="anatomy-page__title display">{uiT('anatomy.title', locale)}</h1>
        {doc.byline ? <p className="anatomy-page__byline">{doc.byline}</p> : null}
        {doc.lead ? <p className="anatomy-page__lead">{doc.lead}</p> : null}
        <div className="anatomy-page__ornament" aria-hidden="true">
          <span>✦</span>
          <span>✦</span>
          <span>✦</span>
        </div>
      </header>

      {!doc.markdown ? (
        <p className="anatomy-page__empty">{uiT('stub.coming', locale)}</p>
      ) : (
        <div className="anatomy-layout">
          <nav className="anatomy-toc" aria-label={uiT('anatomy.toc', locale)}>
            <p className="anatomy-toc__kicker">{uiT('anatomy.toc', locale)}</p>
            <ul>
              {doc.toc.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`}>{item.title}</a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="anatomy-prose" lang="cs">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({ children }) => headingEl('h2', children),
                h3: ({ children }) => headingEl('h3', children),
                a: ({ href, children }) => (
                  <a href={href} target={href?.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                    {children}
                  </a>
                ),
                table: ({ children }) => (
                  <div className="anatomy-table-wrap">
                    <table>{children}</table>
                  </div>
                ),
              }}
            >
              {doc.markdown}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </article>
  );
}
