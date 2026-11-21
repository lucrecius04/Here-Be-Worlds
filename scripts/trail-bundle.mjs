// Složí studijní balíček pro autora eseje ke stezce (člověka nebo jiný model, např. Gemini).
// Použití:
//   npm run bundle:trail -- <id-stezky>   balíček jedné stezky (např. scapegoat)
//   npm run bundle:trail -- --all         balíčky všech stezek
//   npm run bundle:trail -- --base        základní balíček bez kronik (pro studium knih)
//   npm run bundle:trail -- <id> --split  balíček stezky rozsekaný na menší soubory (pro Gemini,
//                                          které dlouhé soubory při nahrání usekne); --limit=30000 znaků
// Výstup: bundles/*.md, rozsekaný balíček v bundles/<id>/ (necommituje se).
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
const trails = [...trailsSrc.matchAll(/def\('([^']+)',\s*'([^']+)',\s*\[([^\]]*)\](?:,\s*\[([^\]]*)\])?\)/g)].map((m) => ({
  id: m[1],
  key: m[2],
  members: [...m[3].matchAll(/'([^']+)'/g)].map((x) => x[1]),
  themes: [...(m[4] ?? '').matchAll(/'([^']+)'/g)].map((x) => x[1]),
}));
const themeLabel = Object.fromEntries(
  JSON.parse(read('data/meta/theme-taxonomy.json')).themes.map((th) => [th.slug, th.label.cs ?? th.label.en]),
);
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
      ...(t.themes.length ? [`- Témata, která web u putování uvádí (esej by se jich měla dotknout): ${t.themes.map((s) => themeLabel[s] ?? s).join(', ')}`] : []),
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

// --- rozsekaný balíček pro modely s malým limitem nahrávání ---------------
// Prameny jen ty, které rozcestník u stezky doporučuje (tabulka „Prameny podle stezek“).
const PRAMEN_KEYS = [
  [/Doležel/, 'dolezel-heterocosmica'], [/Fisher/, 'fisher-weird-eerie'], [/Todorov/, 'todorov-uvod-do-fantasticke-literatury'],
  [/Clute/, 'clute-encyclopedia-of-fantasy'], [/Otto/, 'otto-posvatno'], [/Tolkien/, 'tolkien-o-pohadkach'],
  [/Wolf(?! \(ed\.\))/, 'wolf-building-imaginary-worlds'], [/Wolf \(ed\.\)/, 'wolf-revisiting-imaginary-worlds'],
  [/Murray/, 'murray-hamlet-on-the-holodeck'], [/Calleja/, 'calleja-in-game'], [/Ryan/, 'ryan-narrative-as-virtual-reality'],
  [/Jenkins/, 'jenkins-convergence-culture'], [/Aarseth/, 'aarseth-cybertext'], [/Juul/, 'juul-half-real'], [/Bogost/, 'bogost-persuasive-games'],
  [/vizní dokument|Last Rites/, 'planescape-last-rites'], [/Švelch/, 'svelch-player-vs-monster'], [/Girard/, 'girard-obetni-beranek'],
  [/Turner/, 'turner-prubeh-ritualu'], [/Mendlesohn(?! a James)/, 'mendlesohn-rhetorics-of-fantasy'],
  [/Mendlesohn a James/, 'mendlesohn-short-history-of-fantasy'], [/Eliade/, 'eliade-mytus-o-vecnem-navratu'],
  [/Jan Assmann/, 'assmann-jan-kultura-a-pamet'], [/Assmannová/, 'assmann-cultural-memory'], [/Bachelard/, 'bachelard-poetika-prostoru'],
  [/Boym/, 'boym-future-of-nostalgia'], [/Douglas/, 'douglas-cistota-a-nebezpeci'], [/Carroll/, 'carroll-philosophy-of-horror'],
  [/Iser/, 'iser-implizite-leser'], [/Suvin/, 'suvin-metamorphoses-of-science-fiction'],
  [/Nietzsche|mýty o stvoření|deus otiosus/, 'drobne-prameny'],
];
const trailRow = (name) => read('docs/prameny/README.md').split('\n').find((l) => l.startsWith(`| ${name} |`)) || '';
const trailPrameny = (name) => {
  const cell = trailRow(name).split('|')[3] || '';
  return PRAMEN_KEYS.filter(([re]) => re.test(cell)).map(([, f]) => f).filter((f, i, a) => a.indexOf(f) === i);
};

const slugify = (x) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

// Rozdělí text na části do limitu, přednostně na nadpisech, jinak na odstavcích.
function splitText(text, limit) {
  if (text.length <= limit) return [text];
  const n = Math.ceil(text.length / limit);
  const target = Math.ceil(text.length / n);
  const blocks = text.split(/\n(?=#{1,3} )/).flatMap((b) => (b.length > target ? b.split(/\n\n/).map((p) => p + '\n') : [b + '\n']));
  const parts = [];
  let cur = '';
  for (const b of blocks) {
    if (cur && cur.length + b.length > target && cur.length > target * 0.4) { parts.push(cur); cur = ''; }
    cur += (cur && !cur.endsWith('\n') ? '\n' : '') + b;
  }
  if (cur.trim()) parts.push(cur);
  while (parts.length > n && parts[parts.length - 1].length + parts[parts.length - 2].length <= limit) {
    const last = parts.pop();
    parts[parts.length - 1] += last;
  }
  return parts.flatMap((p) => (p.length > limit ? splitText(p, limit) : [p]));
}

// Souřadnice světů stezky v jedné tabulce, aby autor nepočítal z karet ručně.
function coordTable(ids) {
  const head = `| Svět | ${AXES.map(([, n]) => n).join(' | ')} |\n|---|${AXES.map(() => '---').join('|')}|`;
  const rows = ids.map((id) => `| ${cs(byId[id].gameTitle)} | ${AXES.map(([k]) => byId[id].axes?.[k]?.value ?? '?').join(' | ')} |`);
  const stat = AXES.map(([k, n, lo, hi]) => {
    const v = ids.map((id) => byId[id].axes?.[k]?.value).filter((x) => x != null);
    const avg = (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1).replace('.', ',');
    return `- ${n} (${lo} 1 ↔ ${hi} 5): od ${Math.min(...v)} do ${Math.max(...v)}, průměr ${avg}`;
  });
  return ['## Souřadnice světů stezky (z karet, přesné hodnoty)', '', head, ...rows, '', 'Rozpětí a průměr:', '', ...stat,
    '', 'V eseji hodnoty uvádějte přesně podle této tabulky; průměr nejvýš jako opora, žádná procenta.'].join('\n');
}

function splitBundle(t, limit) {
  const { name, desc } = trailText(t.key);
  const pr = trailPrameny(name);
  const docs = [
    { title: `Zadání a karty světů stezky „${name}“`, body: [
      `Id stezky: \`${t.id}\` (do frontmatteru \`trail: ${t.id}\`)`,
      `Název stezky: ${name}`,
      `Popis stezky na webu: ${desc}`,
      `Světy stezky v pořadí: ${t.members.map((id) => cs(byId[id].gameTitle)).join(', ')}`,
      '',
      'Prameny, které rozcestník k této stezce doporučuje (výtahy jsou v dalších souborech):',
      '',
      (trailRow(name).split('|')[3] || '').trim(),
      '',
      '---',
      '',
      coordTable(t.members),
      '',
      '---',
      '',
      t.members.map((id) => worldCard(byId[id])).join('\n\n---\n\n'),
    ].join('\n') },
    { title: 'Příručka pro autory esejí ke stezkám', body: read('docs/pro-autory/README.md') },
    { title: 'Vzorová esej 1: Na mrtvole boha', body: read('content/trails/na-mrtvole-boha.md') },
    ...(existsSync(join(root, 'content/trails/kdo-za-to-muze.md')) ? [{ title: 'Vzorová esej 2: Kdo za to může? (po opravách a zkrácení, 4 200 slov)', body: read('content/trails/kdo-za-to-muze.md') }] : []),
    { title: 'Metoda atlasu: Anatomie herního lore', body: read('content/essays/anatomie-herniho-lore.md') },
    ...pr.map((f) => ({ title: `Výtah z pramene: ${f}`, body: read(`docs/prameny/${f}.md`) })),
    ...t.members.map((id) => {
      const w = byId[id];
      const file = `content/chronicles/${w.chronicleSlug || w.id}.md`;
      return { title: `Kronika: ${cs(w.gameTitle)}`, body: read(file) };
    }),
    { title: 'Teoretické zázemí (přehled všech pramenů atlasu, doplňkové)', body: read('content/essays/teoreticke-zazemi.md') },
  ];
  // části dokumentů
  const room = limit - 400;
  let chunks = docs.flatMap((d) => {
    const ps = splitText(d.body.trim(), room);
    return ps.map((p, i) => ({ titles: [ps.length > 1 ? `${d.title} (část ${i + 1}/${ps.length})` : d.title], body: p.trim() }));
  });
  // malé sousední části spojit do jednoho souboru
  const merged = [];
  for (const c of chunks) {
    const last = merged[merged.length - 1];
    if (last && last.body.length + c.body.length + 200 <= room) {
      last.titles.push(...c.titles);
      last.body += `\n\n${'='.repeat(60)}\n# ${c.titles[0]}\n${'='.repeat(60)}\n\n${c.body}`;
    } else merged.push({ titles: [...c.titles], body: c.body });
  }
  const total = merged.length;
  const nn = (i) => String(i).padStart(2, '0');
  const files = merged.map((c, i) => {
    const no = `${nn(i + 1)}/${nn(total)}`;
    const text = `SOUBOR ${no} · Here Be Worlds · stezka „${name}“\nObsah: ${c.titles.join(' · ')}\n\n${'='.repeat(60)}\n# ${c.titles[0]}\n${'='.repeat(60)}\n\n${c.body}\n\nKONEC SOUBORU ${no}\n`;
    const base = c.titles.length > 1 && c.titles.every((x) => x.startsWith('Výtah z pramene')) ? 'vytahy-z-pramenu' : c.titles.length > 1 ? `${slugify(c.titles[0]).slice(0, 28)}-a-dalsi` : slugify(c.titles[0]);
    return { name: `${nn(i + 1)}-${base}.md`, text, titles: c.titles };
  });
  const manifest = files.map((f) => `- ${f.name} – ${f.titles.join(' · ')}`).join('\n');
  const start = startPrompt(t, name, desc, total, manifest);
  return [{ name: '00-START-vloz-do-chatu.md', text: start }, ...files];
}

// Světy stezky, které už mají esej k jiné stezce: autor má zvolit jiný úhel.
function overlapNote(t) {
  const dir = join(root, 'content/trails');
  if (!existsSync(dir)) return '';
  const lines = [];
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.md'))) {
    const src = readFileSync(join(dir, f), 'utf8');
    const trail = (src.match(/^trail:\s*(\S+)/m) || [])[1];
    const title = (src.match(/^title:\s*(.+)$/m) || [])[1];
    if (!trail || trail === t.id) continue;
    const other = trails.find((x) => x.id === trail);
    if (!other) continue;
    const shared = t.members.filter((id) => other.members.includes(id)).map((id) => cs(byId[id].gameTitle));
    if (shared.length) lines.push(`${shared.join(', ')} (esej „${title}“)`);
  }
  return lines.length
    ? `\n- **Neopakuj úhel minulých esejí.** Tyto světy už jsou rozebrané jinde: ${lines.join('; ')}. U nich vyber to, co nese otázku této stezky, ne to, co už zaznělo tam.`
    : '';
}

function startPrompt(t, name, desc, total, manifest) {
  const worldsList = t.members.map((id) => cs(byId[id].gameTitle)).join(', ');
  const batches = [];
  for (let i = 1; i <= total; i += 10) batches.push(`${String(i).padStart(2, '0')}–${String(Math.min(i + 9, total)).padStart(2, '0')}`);
  return `# Zadání: esej ke stezce „${name}“ pro atlas Here Be Worlds

(Tento text vlož do chatu jako první zprávu. Soubory 01–${String(total).padStart(2, '0')} pak nahraj po dávkách: ${batches.join(', ')}.)

Jsi autor odborných esejí pro český atlas herních světů Here Be Worlds. Napíšeš esej ke stezce **„${name}“**. Popis stezky na webu: ${desc} Světy stezky: ${worldsList}.

## Materiály

Dostaneš ${total} souborů. Každý začíná řádkem „SOUBOR NN/${String(total).padStart(2, '0')}“ a končí řádkem „KONEC SOUBORU NN/${String(total).padStart(2, '0')}“. Když koncový řádek chybí, soubor se při nahrání usekl.

${manifest}

Kroniky jsou **jediný zdroj faktů o světech**. Prameny používej jen v rozsahu výtahů. Příručka (soubor se zadáním a příručkou) platí celá; níže jsou body, které se u minulé eseje nedodržely.

## Postup

1. **Teď jen čti.** Po každé dávce odpověz jedním řádkem: „Načteno NN–NN, všechny soubory úplné“, nebo vypiš soubory bez koncového řádku. Nic jiného nepiš.
2. Až napíšu **„Vše nahráno“**, odevzdej **krok 1** (krátce, bez textu eseje):
   - otázku eseje (jedna věta s otazníkem),
   - osnovu (nadpisy kapitol a u každé jedna věta),
   - ke každému světu 3–6 faktů, na kterých oddíl postavíš, každý s místem v kronice (kapitola nebo oddíl Faktografie),
   - které prameny použiješ a k čemu.
   Pak počkej, až napíšu „ok“ nebo pošlu připomínky.
3. **Krok 2: celá esej najednou** v jednom bloku markdownu (frontmatter, Úvodem, kořeny, světy, typologie, proč to hry milují, odpověď, Zdroje). Kdyby se nevešla do jedné odpovědi, skonči celým odstavcem, napiš řádek „POKRAČOVÁNÍ NÁSLEDUJE“ a po mém „dál“ navaž přesně tam.
4. **Krok 3:** seznam faktů s místy v kronikách, seznam míst k ověření (\`[OVĚŘIT: …]\`), případné návrhy k pramenům.

## Na co si dát pozor (poučení z minulé eseje)

- **Slovo „putování“, ne „stezka“.** Na webu se stezky jmenují Putování; v textu eseje piš „toto putování“, „světy tohoto putování“ (putování vede, prochází, vydáme se na něj).
- **Délka 3 500–4 500 slov, nikdy přes 5 000.** Jedna z minulých esejí měla 5 700 slov a musela se krátit. Hutně a kratší je lepší než dlouze a řídce. Oddíl jednoho světa zhruba 350–500 slov.${overlapNote(t)}
- **Nepřevyprávět děj.** U světa jen to, co nese otázku eseje. Čtenář si kroniku otevře sám.
- **Jedna myšlenka jednou.** Typologie a závěr neopakují, co už zaznělo u světů.
- **Jména přesně podle kroniky** (postavy, místa, frakce, letopočty, pořadí událostí). Když se karta světa a kronika liší, platí kronika.
- **Nic nedomýšlet.** Žádné příčinné souvislosti, motivace postav ani detaily, které kronika neříká. Co víš odjinud, označ \`[OVĚŘIT: …]\`.
- **Výklad označit jako výklad** („čteme to jako…“, „pro atlas je to…“), nevydávat ho za fakt hry.
- **Souřadnice přesně z karty** (hodnota 1–5), slovo „osy“ nikdy, žádná procenta.
- **Prameny:** žádné vymyšlené citace ani čísla stran; odborníka představit při prvním výskytu; u Girarda, Eliada a Mendlesohnové jednou zmínit výhradu (viz příručka).
- **Úvodní citát doslova z kroniky**, zkopírovaný znak po znaku.
- Esej: první osoba množného čísla a vykání čtenáři; česká typografie; velké zvraty do spoilerových bloků (formát v příručce, oddíl 6).
`;
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
const limitArg = args.find((a) => a.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : 30000;
const ids = args.includes('--all') ? trails.map((t) => t.id) : args.filter((a) => !a.startsWith('--'));
for (const id of ids) {
  const t = trails.find((x) => x.id === id);
  if (!t) {
    console.error(`Neznámá stezka: ${id}`);
    process.exitCode = 1;
    continue;
  }
  if (args.includes('--split')) {
    const dir = join(outDir, id);
    mkdirSync(dir, { recursive: true });
    for (const f of readdirSync(dir)) if (f.endsWith('.md')) writeFileSync(join(dir, f), ''), (await import('node:fs')).unlinkSync(join(dir, f));
    for (const f of splitBundle(t, limit)) {
      writeFileSync(join(dir, f.name), f.text);
      console.log(`bundles/${id}/${f.name}  ${f.text.length.toLocaleString('cs-CZ')} znaků`);
    }
  } else write(`stezka-${id}.md`, trailBundle(t));
}
