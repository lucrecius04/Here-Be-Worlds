# Obrázky k putováním: styl

Stav 2026-11-23: styl nalezený po pěti kolech zkoušek (náhled `/putovani/navrh-obrazku/`, podrobnosti v `docs/stav.md`). Motivy pro 22 putování se teprve budou vymýšlet.

## Styl: monotypie s kresbou

- **Technika:** tmavá monotypie tuší na teplém krémovém papíře (tradice Degasových monotypií). Měkká indigová mlha otisknutá a setřená, přes ni jisté ruční tahy perem, tuší a tužkou s různou silou a trochou šrafury. Mlha převažuje, kresba drží tvar.
- **Okraj:** obraz se nepravidelně rozpíjí do holého papíru; žádný rámeček ani rovný řez. Na webu se pak vpije do pozadí (ve světlém motivu `multiply`, freska-maska není potřeba).
- **Paleta:** jen indigo a noční modř (#1B2547, #0D1324) na krémovém papíře. Žádná černá, hnědá, sépie.
- **Jedna myšlenka, malý předmět (majitel 2026-11-23, po nepovedeném kole Uvězněni v kruhu):** velké přeplněné scény (had s průvodem poutníků, nekonečné schodiště, ptačí klec se světem, koleje s planetami) majitel zamítl jako tematicky nesevřené a „poznat, že je to AI“. Nosná je jedna myšlenka na jednom malém předmětu nebo polocelku (vzor: kamenné víčko, žebřík opřený o nebe, gramofon). Vedlejší motivy jen tam, kde tvoří hlavní tvar (most z kořenů, copů a prádla), ne jako zástup figurek a symbolů.
- **Víc motivů k objevování:** hlavní tvar ať je složený z několika nečekaných předmětů, které člověk objeví až při delším pohledu (vzor: most z dlažby, kořenů, copů a šňůr s prádlem; majitel 2026-11-23). Jen když dávají jednomu tvaru smysl, nikdy jako výčet symbolů tématu.
- **Světlo:** výchozí je **čistě modrá tuš bez zlaté**. Zlatá (#E5BE7E) jen výjimečně, když ji řádek scény výslovně jmenuje a je jádrem motivu (klíčová dírka na nebi, oheň u gramofonu). Gemini jinak zlatou přidává sám (okénka, lucerny), protože ji má vzorový obrázek: proto prompt výslovně zakazuje převzít lampu ze vzoru (majitel 2026-11-23: „pořád stejné rozsvícené okýnko a lucerna“).
- **Motiv:** detail nebo polocelek, ne velká scéna. Obraz s druhým čtením: na první pohled obyčejný, na druhý nese otázku eseje. Prázdný prostor kolem.
- **Nikdy:** text, písmena, podpisy, rámečky; postavy, loga a místa z her; náboženské symboly; lidé (nanejvýš drobná postava zezadu, když to motiv potřebuje); cákance tuše; airbrush; uhlazená digitální linka.
- **Formát:** 16 : 9 na šířku, hlavní motiv v prostřední třetině (výřez 4 : 5 v rejstříku), čitelné i jako malý náhled.

## Na webu

- Soubory `public/putovani-obrazky/<slug>-1.jpg` (pod úvodním citátem eseje a náhled v rejstříku `/putovani/`) a `<slug>-2.jpg` (uprostřed eseje, před nadpisem ## nejblíž polovině; při třech obrázcích -2 a -3 na třetinách, `READY` v `trail-images.ts` udává počet). Šířka max 1600 px, JPEG 82.
- Masky: `maska/<slug>-N.png` podle tuše pro tmavý motiv (`python3 scripts/ink-masks.py`, pak zkopírovat z `navrh-obrazku/maska/`, nebo upravit cestu ve skriptu), `maska/freska.png` obecná.
- Které putování obrázky má: `READY` v `src/lib/trail-images.ts`. Obrázky se ukážou jen u schválené eseje.
- Rejstřík `/putovani/` má rozvržení karet ve dvou sloupcích s obrázkem nahoře (C, vybráno ze tří variant: A obraz za textem, B střídavé desky). Dokud nemají obrázky všechna putování, stojí vedle karty s obrázkem textové karty.
- Na webu (2026-11-23): Bohové jako břemeno (katedrála ze žeber, kamenné víčko); Město, které dýchá (domy, které se otáčejí za chodcem; most z dlažby, kořenů, copů a prádla); Dům, ze kterého nejde odejít (měsíc jako zlatá klíčová dírka nad městečkem, okno uprostřed pláně s pokojem uvnitř). Válka, kterou nikdo nevyhraje (tři obrázky: prapory z hejn ptáků, kolotoč z děl, kavalerie z rozbitých hodin se svíčkou v temnu); Pod lhostejnými hvězdami (žebřík opřený o nebe s prázdnými botami a lucernou, gramofon, ze kterého se sypou hvězdy, u táboráku). Postup: 5 motivů, vybrat 2. **Motivy: surrealismus a neobvyklé kompozice, klidně velké měřítko a zachycený pohyb (Magritte, Dalí), neobvyklé spojení předmětů (v duchu Magritta), jen lehce doslovné** — první kolo s doslovnými motivy (tapeta, dveře, kolébka) majitel zamítl jako nenápadité. Do promptu řádek `Mood: subtle surrealism in the spirit of Magritte: one unexpected combination, quiet and uncanny, never literal or explanatory. Rich in discoverable detail: several unexpected secondary motifs are woven into the main forms, so the viewer keeps finding new things on a second look.` Masky: `python3 scripts/ink-masks.py public/putovani-obrazky/<slug>-1.jpg …`; když je světlý papír uprostřed součástí motivu (mezera mezi konci mostu), přidej `--fill`. Skript dělá dvě masky: `<soubor>.png` pro tmavý motiv a širokou `<soubor>-light.png` pro světlý (papír tam schová multiply a lehké vybělení `brightness(1.06) saturate(0.8)`, maska nesmí zamlžit slabé tahy; majitel 2026-11-23). V eseji se kresba ořezává jen maskou podle tuše (fresková maska by ořízla tahy štětce nahoře a stopy u spodního okraje; majitel 2026-11-23), v tmavém motivu je maska dvakrát přes sebe; v rejstříku zůstává i fresková (obrázek je tam oříznutý na 3 : 2).

## Jak generovat

Gemini, nový chat. Přiložit **jediný vzorový obrázek** `public/navrh-obrazku/25-styl-vicko.jpg` (s více vzory se jejich motivy propisují do nového obrázku: lampa se změnila ve svíčku z katedrály). Měnit jen řádek `Scene:`.

```
Use the attached image as the style reference: keep exactly the same technique, paper, ink, mist, line work, palette and mood. Do not copy its subject, objects or its small lamp.
Style: a dark-field ink monotype printed on warm off-white paper, in the tradition of Degas' monotypes: soft foggy indigo ink pressed and wiped into mist, the image dissolving irregularly into the bare paper at the edges. Over the soft print, confident hand-drawn ink and pencil lines with varied thickness and some cross-hatching define the main forms; the mist stays dominant and the image stays quiet. No ruled frame, no border.
Colour: monochrome indigo and midnight blue ink (#1B2547, #0D1324) on cream paper only. No gold, no yellow, no warm light, no glowing windows, no lamps, lanterns or candles (unless the Scene line explicitly asks for one gold element).
Mood: quiet surrealism in the spirit of Magritte: one single unexpected idea carried by one small object, precise and restrained, uncanny but never literal, crowded or explanatory.
Scene: [JEDEN PŘEDMĚT A JEDNA MYŠLENKA]
Composition: 16:9 wide, detail or medium shot, main subject in the central third, quiet empty space around, legible even as a small thumbnail.
Avoid: text, letters, signatures, frames, video game characters, logos, religious symbols, photorealism, ink splatter, airbrush, random decorative lamps or candles.
```

## Slepé uličky (nezkoušet znovu)

Mezzotinta a mědiryt (uhlazené), papírová rytina (dětská kniha), šin-hanga (tapeta, komiks), symbolistní uhel (v náhledu zmizí), kyanotypie (švy, kýč), krakeláž a omítka (filtr, prach), plochý „setřený“ obdélník (prompt s válečkem a hadrem), doslovné scény (obr s městem na hrudi).
