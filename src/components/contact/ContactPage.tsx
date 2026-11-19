import type { FormEvent } from 'react';
import { uiT } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import '../../styles/contact.css';

type Props = { base: string };

const TOPICS = ['contact.topicFact', 'contact.topicWorld', 'contact.topicCollab', 'contact.topicOther'] as const;

/** Set when ready. Empty string keeps submit from opening a fake mailbox. */
const CONTACT_EMAIL = '';

export default function ContactPage(_props: Props) {
  const locale = useLocale();

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!CONTACT_EMAIL) return;
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') ?? '').trim();
    const from = String(data.get('email') ?? '').trim();
    const message = String(data.get('message') ?? '').trim();
    const topic = String(data.get('topic') ?? '').trim();
    const subject = encodeURIComponent(
      [uiT('contact.mailSubject', locale), topic].filter(Boolean).join(' · '),
    );
    const body = encodeURIComponent([name && from ? `${name} <${from}>` : name || from, '', message].join('\n'));
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <article className="doc contact-page">
      <header className="doc-head">
        <p className="doc-kicker">{uiT('footer.contact', locale)}</p>
        <h1 className="doc-title">{uiT('contact.title', locale)}</h1>
        <p className="doc-lead">{uiT('contact.lead', locale)}</p>
      </header>
      <form className="contact-form" onSubmit={onSubmit}>
        <div className="contact-form__row">
          <label className="contact-field">
            <span>{uiT('contact.name', locale)}</span>
            <input
              type="text"
              name="name"
              autoComplete="name"
              placeholder={uiT('contact.namePlaceholder', locale)}
            />
          </label>
          <label className="contact-field">
            <span>{uiT('contact.email', locale)}</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder={uiT('contact.emailPlaceholder', locale)}
            />
          </label>
        </div>
        <fieldset className="contact-topics">
          <legend>{uiT('contact.topic', locale)}</legend>
          {TOPICS.map((key, index) => (
            <label key={key} className="contact-topic">
              <input type="radio" name="topic" value={uiT(key, locale)} defaultChecked={index === 0} />
              <span>{uiT(key, locale)}</span>
            </label>
          ))}
        </fieldset>
        <label className="contact-field contact-field--message">
          <span>{uiT('contact.message', locale)}</span>
          <textarea
            name="message"
            rows={12}
            placeholder={uiT('contact.messagePlaceholder', locale)}
          />
        </label>
        <div className="contact-form__foot">
          <button className="contact-form__submit" type="submit">
            {uiT('contact.submit', locale)}
          </button>
          <p className="contact-form__privacy">{uiT('contact.privacy', locale)}</p>
        </div>
      </form>
    </article>
  );
}
