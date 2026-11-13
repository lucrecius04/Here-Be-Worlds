/** Normalize site base path for link building (GitHub Pages subpath). */
export function normalizeBasePath(base: string): string {
  if (!base || base === '/') return '';
  return base.replace(/\/$/, '');
}

export function withBase(base: string, path: string): string {
  const root = normalizeBasePath(base);
  const segment = path.startsWith('/') ? path : `/${path}`;
  return `${root}${segment}`;
}
