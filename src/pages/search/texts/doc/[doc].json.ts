import type { APIRoute, GetStaticPaths } from 'astro';
import { buildTextIndex } from '../../../../lib/text-search-index';

/** Hledání v textech: texty oddílů jednoho dokumentu (pro úryvek ve výsledku). */
export const getStaticPaths: GetStaticPaths = () =>
  [...buildTextIndex().texts.keys()].map((doc) => ({ params: { doc } }));

export const GET: APIRoute = ({ params }) =>
  new Response(JSON.stringify(buildTextIndex().texts.get(params.doc as string) ?? []), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
