import { useEffect, useState } from 'react';

/**
 * Telefon (i otočený na šířku): stránka světa se posouvá celá, ne ve vnitřním okénku.
 * Prohlížeč pak sám schová svou lištu a hlavička webu odjede s textem.
 * Stejný dotaz používá CSS (layout.css, world-card.css, chronicle.css).
 */
export const PAGE_FLOW_QUERY = '(max-width: 720px), (max-height: 540px) and (pointer: coarse)';

export function usePageFlow(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(PAGE_FLOW_QUERY);
    const update = () => setOn(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return on;
}
