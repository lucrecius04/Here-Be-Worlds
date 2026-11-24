import type { APIRoute } from 'astro';
import { renderFeed } from '../lib/feed';

/** Kanál novinek (RSS): vzniká při sestavení jako statický soubor /rss.xml. */
export const GET: APIRoute = ({ site }) => {
  const base = import.meta.env.BASE_URL;
  const root = new URL(base, site ?? 'https://lucrecius04.github.io').href.replace(/\/$/, '');
  return new Response(renderFeed(root), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
};
