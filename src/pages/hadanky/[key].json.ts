import type { APIRoute, GetStaticPaths } from 'astro';
import { riddlePool } from '../../lib/riddles';
import type { Riddle } from '../../lib/riddle-day';

/** Jedna hádanka dne jako statický soubor; prohlížeč si podle dne stáhne jen tu, kterou potřebuje. */
export const getStaticPaths: GetStaticPaths = () =>
  Object.values(riddlePool())
    .flat()
    .map((riddle) => ({ params: { key: riddle.key }, props: { riddle } }));

export const GET: APIRoute = ({ props }) =>
  new Response(JSON.stringify((props as { riddle: Riddle }).riddle), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
