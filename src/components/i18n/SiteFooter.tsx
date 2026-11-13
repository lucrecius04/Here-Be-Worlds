import { useLocale } from '../../lib/locale-store';
import { uiT } from '../../lib/i18n';

export default function SiteFooter() {
  const locale = useLocale();
  return <footer className="site-footer">{uiT('footer.disclaimer', locale)}</footer>;
}
