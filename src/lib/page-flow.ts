import { useEffect, useState } from 'react';

/**
 * Stránka světa se posouvá celá (dřív jen telefon, od 2026-11-22 i počítač), ne ve vnitřním
 * okénku: hlavička spisu odjede s textem a vrátí se jako stažený pruh. Na telefonu (dotaz
 * `BAR_HIDES_QUERY`, i otočeném na šířku) pruh při čtení dolů zajede; na počítači zůstane.
 */
export const PAGE_FLOW_QUERY = 'all';
export const BAR_HIDES_QUERY = '(max-width: 720px), (max-height: 540px) and (pointer: coarse)';

export function useMediaQuery(query: string): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setOn(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [query]);
  return on;
}

export function usePageFlow(): boolean {
  return useMediaQuery(PAGE_FLOW_QUERY);
}
