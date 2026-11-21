import { useEffect, useState } from 'react';
import type { LocalizedString } from '../schemas/world';

const KEY = 'hbw_reader_desk';
const EVENT = 'hbw-reader-desk';
const MAX_RECENT = 3;
/** Rozečtenost kroniky (lišta v kronice, řádek na titulní straně) je zatím skrytá; pozice se dál ukládá. */
export const SHOW_READING_PROGRESS = false;

export const CHRONICLE_RESUME_MIN = 5;
export const CHRONICLE_RESUME_MAX = 95;

export type DeskRecent = {
  id: string;
  title: LocalizedString;
  at: number;
};

export type DeskChronicle = {
  id: string;
  title: LocalizedString;
  scrollPercent: number;
  heading: string;
  headingId: string;
};

export type ReaderDesk = {
  recent: DeskRecent[];
  chronicle: DeskChronicle | null;
};

const EMPTY: ReaderDesk = { recent: [], chronicle: null };

function isLocalized(value: unknown): value is LocalizedString {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return typeof record.en === 'string' || typeof record.cs === 'string';
}

function parseRecent(value: unknown): DeskRecent[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const items: DeskRecent[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const row = entry as Record<string, unknown>;
    if (typeof row.id !== 'string' || !row.id || seen.has(row.id)) continue;
    if (!isLocalized(row.title)) continue;
    const at = typeof row.at === 'number' ? row.at : 0;
    seen.add(row.id);
    items.push({ id: row.id, title: row.title, at });
    if (items.length >= MAX_RECENT) break;
  }
  return items;
}

function parseChronicle(value: unknown): DeskChronicle | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  if (typeof row.id !== 'string' || !row.id || !isLocalized(row.title)) return null;
  const scrollPercent = typeof row.scrollPercent === 'number' ? row.scrollPercent : 0;
  const heading = typeof row.heading === 'string' ? row.heading : '';
  const headingId = typeof row.headingId === 'string' ? row.headingId : '';
  return { id: row.id, title: row.title, scrollPercent, heading, headingId };
}

function parse(raw: string | null): ReaderDesk {
  if (!raw) return EMPTY;
  try {
    const value = JSON.parse(raw) as unknown;
    if (!value || typeof value !== 'object') return EMPTY;
    const row = value as Record<string, unknown>;
    return {
      recent: parseRecent(row.recent),
      chronicle: parseChronicle(row.chronicle),
    };
  } catch {
    return EMPTY;
  }
}

export function isChronicleInProgress(percent: number): boolean {
  return percent >= CHRONICLE_RESUME_MIN && percent <= CHRONICLE_RESUME_MAX;
}

export function readReaderDesk(): ReaderDesk {
  if (typeof window === 'undefined') return EMPTY;
  return parse(window.localStorage.getItem(KEY));
}

export function writeReaderDesk(desk: ReaderDesk): ReaderDesk {
  const next: ReaderDesk = {
    recent: desk.recent.slice(0, MAX_RECENT),
    chronicle: desk.chronicle,
  };
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT));
  return next;
}

export function clearReaderDesk(): ReaderDesk {
  return writeReaderDesk(EMPTY);
}

export function touchRecent(id: string, title: LocalizedString): ReaderDesk {
  const desk = readReaderDesk();
  const next: DeskRecent[] = [
    { id, title, at: Date.now() },
    ...desk.recent.filter((item) => item.id !== id),
  ].slice(0, MAX_RECENT);
  return writeReaderDesk({ ...desk, recent: next });
}

export function writeChronicleProgress(
  id: string,
  title: LocalizedString,
  scrollPercent: number,
  heading: string,
  headingId: string,
): ReaderDesk {
  const desk = readReaderDesk();
  if (!isChronicleInProgress(scrollPercent)) {
    if (desk.chronicle?.id === id) return writeReaderDesk({ ...desk, chronicle: null });
    return desk;
  }
  return writeReaderDesk({
    ...desk,
    chronicle: {
      id,
      title,
      scrollPercent: Math.round(scrollPercent),
      heading,
      headingId,
    },
  });
}

export function subscribeReaderDesk(onChange: (desk: ReaderDesk) => void): () => void {
  const handler = () => onChange(readReaderDesk());
  window.addEventListener(EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

export function useReaderDesk(): ReaderDesk {
  const [desk, setDesk] = useState<ReaderDesk>(EMPTY);

  useEffect(() => {
    setDesk(readReaderDesk());
    return subscribeReaderDesk(setDesk);
  }, []);

  return desk;
}

export function deskHasContent(desk: ReaderDesk): boolean {
  return desk.recent.length > 0 || isChronicleInProgress(desk.chronicle?.scrollPercent ?? 0);
}
