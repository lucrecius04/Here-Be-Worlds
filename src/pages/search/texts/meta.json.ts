import type { APIRoute } from 'astro';
import { buildTextIndex } from '../../../lib/text-search-index';

/** Hledání v textech: dokumenty a jejich oddíly (kde leží, kotva). */
export const GET: APIRoute = () =>
  new Response(JSON.stringify(buildTextIndex().meta), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
