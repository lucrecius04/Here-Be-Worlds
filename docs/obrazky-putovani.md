# Obrázky k putováním: styl

Stav 2026-11-23: styl nalezený po pěti kolech zkoušek (náhled `/putovani/navrh-obrazku/`, podrobnosti v `docs/stav.md`). Motivy pro 22 putování se teprve budou vymýšlet.

## Styl: monotypie s kresbou

- **Technika:** tmavá monotypie tuší na teplém krémovém papíře (tradice Degasových monotypií). Měkká indigová mlha otisknutá a setřená, přes ni jisté ruční tahy perem, tuší a tužkou s různou silou a trochou šrafury. Mlha převažuje, kresba drží tvar.
- **Okraj:** obraz se nepravidelně rozpíjí do holého papíru; žádný rámeček ani rovný řez. Na webu se pak vpije do pozadí (ve světlém motivu `multiply`, freska-maska není potřeba).
- **Paleta:** jen indigo a noční modř (#1B2547, #0D1324) na krémovém papíře. Žádná černá, hnědá, sépie.
- **Světlo:** přesně jedno malé zlaté světlo (#E5BE7E), nic jiného zlaté.
- **Motiv:** detail nebo polocelek, ne velká scéna. Obraz s druhým čtením: na první pohled obyčejný, na druhý nese otázku eseje. Prázdný prostor kolem.
- **Nikdy:** text, písmena, podpisy, rámečky; postavy, loga a místa z her; náboženské symboly; lidé (nanejvýš drobná postava zezadu, když to motiv potřebuje); cákance tuše; airbrush; uhlazená digitální linka.
- **Formát:** 16 : 9 na šířku, hlavní motiv v prostřední třetině (výřez 4 : 5 v rejstříku), čitelné i jako malý náhled.

## Na webu

- Soubory `public/putovani-obrazky/<slug>-1.jpg` (pod úvodním citátem eseje a náhled v rejstříku `/putovani/`) a `<slug>-2.jpg` (uprostřed eseje, před nadpisem ## nejblíž polovině). Šířka max 1600 px, JPEG 82.
- Masky: `maska/<slug>-N.png` podle tuše pro tmavý motiv (`python3 scripts/ink-masks.py`, pak zkopírovat z `navrh-obrazku/maska/`, nebo upravit cestu ve skriptu), `maska/freska.png` obecná.
- Které putování obrázky má: `READY` v `src/lib/trail-images.ts`. Obrázky se ukážou jen u schválené eseje.
- Rejstřík `/putovani/` má rozvržení karet ve dvou sloupcích s obrázkem nahoře (C, vybráno ze tří variant: A obraz za textem, B střídavé desky). Dokud nemají obrázky všechna putování, stojí vedle karty s obrázkem textové karty.
- Na webu (2026-11-23): Bohové jako břemeno (katedrála ze žeber, kamenné víčko); Dům, ze kterého nejde odejít (tapeta odloupnutá na zeď cely, dveře se zlatou škvírou; z pěti motivů, zbylé kolébka, dům v domě, věž). Postup: 5 motivů z otázky a obrazů eseje, vybrat 2. Masky: `python3 scripts/ink-masks.py public/putovani-obrazky/<slug>-1.jpg …`.

## Jak generovat

Gemini, nový chat. Přiložit **jediný vzorový obrázek** `public/navrh-obrazku/25-styl-vicko.jpg` (s více vzory se jejich motivy propisují do nového obrázku: lampa se změnila ve svíčku z katedrály). Měnit jen řádek `Scene:`.

```
Use the attached image as the style reference: keep exactly the same technique, paper, ink, mist, line work, palette and mood, and the same single small gold light. Do not copy its subject or objects.
Style: a dark-field ink monotype printed on warm off-white paper, in the tradition of Degas' monotypes: soft foggy indigo ink pressed and wiped into mist, the image dissolving irregularly into the bare paper at the edges. Over the soft print, confident hand-drawn ink and pencil lines with varied thickness and some cross-hatching define the main forms; the mist stays dominant and the image stays quiet. No ruled frame, no border.
Colour: indigo and midnight blue ink (#1B2547, #0D1324) on cream paper only, no black, no brown, no sepia. Exactly one small warm gold light (#E5BE7E), nothing else gold.
Scene: [MOTIV]
Composition: 16:9 wide, detail or medium shot, main subject in the central third, quiet empty space around, legible even as a small thumbnail.
Avoid: text, letters, signatures, frames, video game characters, logos, religious symbols, photorealism, ink splatter, airbrush.
```

## Slepé uličky (nezkoušet znovu)

Mezzotinta a mědiryt (uhlazené), papírová rytina (dětská kniha), šin-hanga (tapeta, komiks), symbolistní uhel (v náhledu zmizí), kyanotypie (švy, kýč), krakeláž a omítka (filtr, prach), plochý „setřený“ obdélník (prompt s válečkem a hadrem), doslovné scény (obr s městem na hrudi).
