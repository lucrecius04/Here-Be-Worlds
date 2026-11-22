import type { APIRoute } from 'astro';
import { buildSearchEntries } from '../lib/site-search-index';

/** Rejstřík pro hledání v hlavičce (lupa); vzniká při sestavení jako statický soubor. */
export const GET: APIRoute = () =>
  new Response(JSON.stringify(buildSearchEntries()), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
