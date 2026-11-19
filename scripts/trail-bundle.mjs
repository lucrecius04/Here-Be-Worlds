// Složí studijní balíček pro autora eseje ke stezce (člověka nebo jiný model, např. Gemini).
// Použití:
//   npm run bundle:trail -- <id-stezky>   balíček jedné stezky (např. scapegoat)
//   npm run bundle:trail -- --all         balíčky všech stezek
//   npm run bundle:trail -- --base        základní balíček bez kronik (pro studium knih)
// Výstup: bundles/*.md (necommituje se).
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(join(root, p), 'utf8');
const json = (p) => JSON.parse(read(p));

// --- data atlasu ---------------------------------------------------------
const worldsRaw = json('data/worlds.json');
const worlds = (Array.isArray(worldsRaw) ? worldsRaw : worldsRaw.worlds).filter((w) => !w.draft);
const byId = Object.fromEntries(worlds.map((w) => [w.id, w]));
const chapters = Object.fromEntries(json('data/meta/chapters.json').chapters.map((c) => [c.id, c]));
const themes = Object.fromEntries(json('data/meta/theme-taxonomy.json').themes.map((t) => [t.slug, t]));
const cs = (v) => (v == null ? '' : typeof v === 'string' ? v : v.cs ?? v.en ?? '');

const AXES = [
  ['hopeDespair', 'Vyhlídka', 'Naděje', 'Zoufalství'],
  ['knownUnknown', 'Poznatelnost', 'Poznání', 'Záhada'],
  ['intimateEpic', 'Měřítko', 'Intimita', 'Epičnost'],
  ['moralClarityAmbiguity', 'Morálka', 'Morálně jednoznačné', 'Morálně komplexní'],
  ['realismMetaphysical', 'Realita', 'Realismus', 'Metafyzično'],
];

// --- stezky z trails.ts a české texty z i18n.ts -------------------------
const trailsSrc = read('src/lib/trails.ts');
const trails = [...trailsSrc.matchAll(/def\('([^']+)',\s*'([^']+)',\s*\[([^\]]*)\]\)/g)].map((m) => ({
  id: m[1],
  key: m[2],
  members: [...m[3].matchAll(/'([^']+)'/g)].map((x) => x[1]),
}));
const i18n = read('src/lib/i18n.ts');
const trailsStart = i18n.indexOf('trails: {');
const csTrailsBlock = i18n.slice(trailsStart, i18n.indexOf('\n    },', trailsStart));
const trailText = (key) => {
  const get = (k) => (csTrailsBlock.match(new RegExp(`\\n\\s*${k}: '((?:[^'\\\\]|\\\\.)*)'`)) || [])[1] || '';
  return { name: get(key), desc: get(`${key}Desc`) };
};

// --- části balíčku -------------------------------------------------------
const section = (title, body) => `\n\n${'='.repeat(78)}\n# ${title}\n${'='.repeat(78)}\n\n${body.trim()}\n`;

function worldCard(w) {
  const ch = chapters[w.chapterId];
  const m = w.metadata || {};
  const lines = [
    `## ${cs(w.gameTitle)} (id: ${w.id})`,
    '',
    `- Archetyp: ${cs(ch?.title)} · podžánr: ${cs(m.genreProfile)}${m.genreProfile?.sub ? ` (${cs(m.genreProfile.sub)})` : ''}`,
    `- Studio: ${(w.studios || []).join(', ')} · roky: ${w.yearRange} · rozsah kánonu: ${cs(w.canonScope)}`,
    `- Vesmír: ${(w.universe || []).map(cs).join(', ')}`,
    `- Kronika: ${cs(w.chronicleTitle)} (content/chronicles/${w.chronicleSlug || w.id}.md, na webu /worlds/${w.id}/?view=chronicle)`,
    `- Jádro světa: ${cs(w.core)}`,
    `- Témata: ${(w.themes || []).map((t) => cs(themes[t]?.label) || t).join(', ')}`,
    '',
    '**Souřadnice (1–5):**',
    ...AXES.map(([k, name, lo, hi]) => {
      const a = w.axes?.[k];
      return `- ${name}: ${a?.value ?? '?'} (${lo} 1 ↔ ${hi} 5)${a?.comment ? ` – ${cs(a.comment)}` : ''}`;
    }),
    '',
    '**Triáda:**',
    `- Prvotní hřích: ${cs(w.triad?.originalSin)}`,
    `- Ústřední dilema: ${cs(w.triad?.centralDilemma)}`,
    `- Hlavní tajemství: ${cs(w.triad?.ultimateMystery)}`,
  ];
  const fields = [
    ['atmosphere', 'Nálada a estetika'], ['historicalDepth', 'Historická hloubka'], ['spatialScope', 'Prostorový dosah'],
    ['societalOrder', 'Struktura společnosti'], ['sourceOfPower', 'Původ moci'], ['protagonistPerspective', 'Perspektiva hráče'], ['keyActors', 'Klíčoví aktéři'],
  ];
  const meta = fields.filter(([k]) => m[k]).map(([k, label]) => `- ${label}: ${cs(m[k])}${m[k].detail ? ` – ${cs(m[k].detail)}` : ''}`);
  if (meta.length) lines.push('', '**Charakter světa:**', ...meta);
  if (w.signatureBullets?.length) lines.push('', '**Čím je svět charakteristický:**', ...w.signatureBullets.map((b) => `- ${cs(b)}`));
  return lines.join('\n');
}

const prameny = () => {
  const dir = 'docs/prameny';
  const files = readdirSync(join(root, dir)).filter((f) => f.endsWith('.md') && f !== 'README.md').sort();
  return [read(`${dir}/README.md`), ...files.map((f) => `\n\n---\n\n<!-- ${dir}/${f} -->\n\n${read(`${dir}/${f}`)}`)].join('');
};

const trailOverview = () =>
  trails
    .map((t) => {
      const { name, desc } = trailText(t.key);
      return `- **${name}** (id: ${t.id}) – ${desc}\n  Světy: ${t.members.map((id) => cs(byId[id]?.gameTitle) || `${id} (CHYBÍ)`).join(', ')}`;
    })
    .join('\n');

const worldOverview = () =>
  Object.values(chapters)
    .sort((a, b) => a.order - b.order)
    .map((c) => `- **${cs(c.title)}:** ${worlds.filter((w) => w.chapterId === c.id).map((w) => `${cs(w.gameTitle)} (${w.id})`).join(', ')}`)
    .join('\n');

const common = () => [
  section('Příručka pro autory esejí ke stezkám (docs/pro-autory/README.md)', read('docs/pro-autory/README.md')),
  section('Vzorová esej ke stezce: Na mrtvole boha (content/trails/na-mrtvole-boha.md)', read('content/trails/na-mrtvole-boha.md')),
  section('Metoda atlasu: Anatomie herního lore (content/essays/anatomie-herniho-lore.md)', read('content/essays/anatomie-herniho-lore.md')),
  section('Teoretické zázemí (content/essays/teoreticke-zazemi.md)', read('content/essays/teoreticke-zazemi.md')),
  section('Výtahy z odborných pramenů (docs/prameny/)', prameny()),
];

const header = (title, intro) =>
  `# ${title}\n\nStudijní balíček atlasu Here Be Worlds, složený ${new Date().toISOString().slice(0, 10)} skriptem scripts/trail-bundle.mjs.\n\n${intro}\n\n**Obsah balíčku:**\n`;

function trailBundle(t) {
  const { name, desc } = trailText(t.key);
  const missing = t.members.filter((id) => !byId[id]);
  if (missing.length) throw new Error(`Stezka ${t.id}: neznámé světy ${missing.join(', ')}`);
  const parts = [
    section(`Zadání: esej ke stezce „${name}“`, [
      `- Id stezky: \`${t.id}\` (do frontmatteru jako \`trail: ${t.id}\`)`,
      `- Název stezky: ${name}`,
      `- Popis stezky na webu: ${desc}`,
      `- Světy stezky v pořadí: ${t.members.map((id) => cs(byId[id].gameTitle)).join(', ')}`,
      '',
      'Napište esej ke stezce podle příručky pro autory (oddíly 3–9). Fakta o světech berte jen z kronik níže, prameny jen z výtahů. Řádek této stezky v tabulce „Prameny podle stezek“ (rozcestník pramenů) říká, které prameny se k ní hodí. Odevzdejte esej, seznam faktů s místem v kronice, seznam míst k ověření a případné návrhy k pramenům.',
    ].join('\n')),
    section('Karty světů stezky (data/worlds.json)', t.members.map((id) => worldCard(byId[id])).join('\n\n')),
    ...common(),
    ...t.members.map((id) => {
      const w = byId[id];
      const file = `content/chronicles/${w.chronicleSlug || w.id}.md`;
      return section(`Kronika: ${cs(w.gameTitle)} (${file})`, existsSync(join(root, file)) ? read(file) : '(kronika chybí)');
    }),
  ];
  const toc = parts.map((p) => `- ${p.match(/\n# (.+)\n/)[1]}`).join('\n');
  return header(`Balíček stezky: ${name}`, 'Obsahuje vše potřebné k napsání eseje ke stezce: zadání, karty a kroniky světů stezky, příručku pro autory, vzorovou esej, metodu atlasu a výtahy z odborných pramenů.') + toc + parts.join('');
}

function baseBundle() {
  const parts = [
    section('Zadání: studium dalších knih (docs/pro-autory/studium-knih.md)', read('docs/pro-autory/studium-knih.md')),
    section('Všechny stezky atlasu', trailOverview()),
    section('Všechny světy atlasu podle archetypů', worldOverview()),
    ...common(),
  ];
  const toc = parts.map((p) => `- ${p.match(/\n# (.+)\n/)[1]}`).join('\n');
  return header('Základní balíček Here Be Worlds', 'Pro studium nových knih a pro seznámení s atlasem: zadání ke studiu, přehled stezek a světů, příručka pro autory, vzorová esej, metoda atlasu, teoretické zázemí a všechny výtahy z pramenů. Kroniky nejsou součástí (jsou v balíčcích jednotlivých stezek).') + toc + parts.join('');
}

// --- spuštění ------------------------------------------------------------
const args = process.argv.slice(2);
if (!args.length) {
  console.log('Použití: npm run bundle:trail -- <id-stezky> | --all | --base\nStezky:\n' + trails.map((t) => `  ${t.id}  ${trailText(t.key).name}`).join('\n'));
  process.exit(0);
}
const outDir = join(root, 'bundles');
mkdirSync(outDir, { recursive: true });
const write = (name, text) => {
  writeFileSync(join(outDir, name), text);
  console.log(`bundles/${name}  ${text.split(/\s+/).length.toLocaleString('cs-CZ')} slov`);
};
if (args.includes('--base')) write('zakladni-balicek.md', baseBundle());
const ids = args.includes('--all') ? trails.map((t) => t.id) : args.filter((a) => !a.startsWith('--'));
for (const id of ids) {
  const t = trails.find((x) => x.id === id);
  if (!t) {
    console.error(`Neznámá stezka: ${id}`);
    process.exitCode = 1;
    continue;
  }
  write(`stezka-${id}.md`, trailBundle(t));
}
