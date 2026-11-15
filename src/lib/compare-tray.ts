import { useEffect, useState } from 'react';
import { MAX_COMPARE } from './compare';

const KEY = 'hbw_compare';
const EVENT = 'hbw-compare';

function parse(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter((id): id is string => typeof id === 'string').slice(0, MAX_COMPARE);
  } catch {
    return [];
  }
}

export function readCompareTray(): string[] {
  if (typeof window === 'undefined') return [];
  return parse(window.localStorage.getItem(KEY));
}

export function writeCompareTray(ids: string[]): void {
  const next = ids.filter(Boolean).slice(0, MAX_COMPARE);
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT));
}

export function toggleCompareTray(id: string): string[] {
  const current = readCompareTray();
  const next = current.includes(id)
    ? current.filter((item) => item !== id)
    : current.length >= MAX_COMPARE
      ? current
      : [...current, id];
  writeCompareTray(next);
  return next;
}

export function subscribeCompareTray(onChange: (ids: string[]) => void): () => void {
  const handler = () => onChange(readCompareTray());
  window.addEventListener(EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

export function useCompareTray(): string[] {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(readCompareTray());
    return subscribeCompareTray(setIds);
  }, []);

  return ids;
}
