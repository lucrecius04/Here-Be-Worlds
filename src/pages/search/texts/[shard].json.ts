import type { APIRoute, GetStaticPaths } from 'astro';
import { buildTextIndex } from '../../../lib/text-search-index';

/** Hledání v textech: slova začínající dvojicí písmen a oddíly, ve kterých jsou. */
export const getStaticPaths: GetStaticPaths = () =>
  [...buildTextIndex().shards.keys()].map((shard) => ({ params: { shard } }));

export const GET: APIRoute = ({ params }) =>
  new Response(JSON.stringify(buildTextIndex().shards.get(params.shard as string) ?? {}), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
