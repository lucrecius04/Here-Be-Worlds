# Plán dalších putování

Zásobník nových putování a knih k nim. Postup se nemění: **nejdřív knihy, pak balíčky**. Majitel dodá knihu, Claude sepíše výtah do `docs/prameny/`, zapíše ho do rozcestníku a na `/teoreticke-zazemi/` a teprve pak se kniha použije v eseji.

Naposledy aktualizováno: 2026-11-22.

## Kde jsme

Na webu je **22 putování**, všechna se schválenou esejí (poslední schválena 2026-11-21). Druhá vlna podle návrhů Gemini je celá hotová (tabulka níže). **Další vlna zatím nemá plán**: kandidáti jsou odložená témata dole a světy, které jsou na málo putováních.

## Pokrytí světů (stav 2026-11-22, spočítáno z `trails.ts`)

Žádný svět už není bez putování. Nová putování by měla brát hlavně z prvních dvou řádků a vyhýbat se poslednímu.

| Počet putování | Světy |
|---|---|
| 1 | Path of Exile, XCOM, Death Stranding, Assassin's Creed |
| 2 | Diablo, Elden Ring, Pathfinder, Warcraft, DOOM, Halo, StarCraft, Metro, Tides of Numenera, Pillars of Eternity |
| 3 | Baldur's Gate, Dark Souls, Hades, Zaklínač, Mass Effect, Xenoblade, Bloodborne, Resident Evil, Silent Hill, SOMA, Pentiment, Cyberpunk 2077, Deus Ex, Half-Life, Inscryption, Outer Wilds, Planescape: Torment |
| 4 | Dragon Age, Elder Scrolls, Warhammer 40 000, Fallout, Horizon, Dishonored, Control, Pathologic |
| 5 | NieR: Automata, Disco Elysium, BioShock, Undertale |

Po přidání putování tabulku přepočítat (stačí projít `members` v `trails.ts`).

## Hotová druhá vlna (návrhy Gemini, schváleno 2026-11-21)

| Putování | id | Světy na webu | Prameny |
|---|---|---|---|
| **Kdo drží kroniku** | `chronicle-keepers` | Elder Scrolls, Pentiment, Dragon Age, DOOM, Warhammer 40 000, Pillars of Eternity | Assmannovi, Doležel, Eliade, Boymová, Foucault |
| **Kopie bez originálu** | `copies` | Mass Effect, Halo, Fallout, Horizon, Deus Ex, Cyberpunk 2077 | Parfit, Freud |
| **Dům, ze kterého nejde odejít** | `house` | Metro, Resident Evil, Inscryption, Control, Half-Life, XCOM | Bachelard, Foucault, Goffman |
| **Jméno jako klíč i kletba** | `true-names` | Dishonored, Undertale, Dragon Age, Elder Scrolls, Control, Tides of Numenera | Cassirer |
| **Práce, která nikdy nekončí** | `endless-work` | Death Stranding, Pentiment, Disco Elysium, Half-Life, Dark Souls | Camus, Goffman |
| **Nákaza s vlastní vůlí** | `contagion` | Halo, StarCraft, Warcraft, Diablo, Elden Ring, Pathfinder | Douglasová, Carroll, Girard, Foucault, Parfit, Clute |

Kdyby se id v tabulce rozcházela s `trails.ts`, platí `trails.ts`.

### Poznámky k výběru (ověřeno proti kronikám, hodí se i pro další putování)

- **Kdo drží kroniku:** Horizon vyřazen, protože Farovo mazání APOLLA už rozebírají tři eseje. Farář Thomas v Pentimentu je Nitkař, který kryje pohanský původ světců (Mithrova svatyně pod kostelem). Ve Warhammeru jsou dva vymazaní primarchové a Lectitio Divinitatus.
- **Kopie bez originálu:** od eseje *Kdo se to probudil?* se odlišuje tím, že nejde o ztrátu paměti, ale o to, co je vyrobená bytost. Halo: Cortana a unesené děti, za které podstrčili klony umírající během měsíců. Další ověřené parfitovské motivy, které zůstaly mimo: rozdělený Klaus v Xenoblade, Odvržení v Tides of Numenera, Duševrah v Cyberpunku, kvazivzpomínky Animu v Assassin's Creed, splynutí s Heliem v Deus Ex.
- **Dům, ze kterého nejde odejít:** Metro je dvacet let drženo v nevědomosti, že svět přežil (Hanza a Pozorovatelé, rušička). Věznice v Control se jmenuje Panoptikum. City 17 a Nova Prospekt v Half-Life 2 a „mírná“ utopie ADVENTu v XCOM 2 se použily. BioShock vyřazen (je na pěti putováních). Dunwall a Gorchon jako morová města nese esej *Město, které dýchá*.
- **Jméno jako klíč i kletba:** Planescape vynechán (ztracené jméno už rozebrala esej *Kdo se to probudil?*; v eseji jen jako zrcadlo k Numeneře), BioShock vynechán (je na pěti putováních), Dark Souls vynechán (Bezejmenný král je v kronice jen v rejstříku).
- **Práce, která nikdy nekončí:** postavené hlavně kvůli Death Stranding. Control a Hades sem nepatří, protože byrokracii a kancelář podsvětí rozebral *Smích nad propastí*.
- **Nákaza s vlastní vůlí:** ověřeno: Potopa a Hrobomysl, prstence Halo míří na potravu Potopy; Roj, Nadvědomí a Královna čepelí; morové obilí, Stratholme a Pohroma; Diablo korumpuje Lazara a Leorica, Kámen duše v čele prince Albrechta; Šarlatová hniloba a Caelid; Areelu Vorlesh a Světová rána. Bloodborne (mor bestií z léčivé krve) vynechán, je na třech putováních.

## Kandidáti na další vlnu (odloženo, překrývá se s hotovými putováními)

Před případným psaním každé téma odlišit od eseje, se kterou se překrývá, a světy brát hlavně z horních řádků tabulky pokrytí. Členy navržené Gemini nepovažovat za hotové: každý svět ověřit proti kronice.

- **Umění nechat svět zemřít** (Outer Wilds, Dark Souls, Elden Ring, Planescape, Cyberpunk, Inscryption): totéž už rozebírají *Uvězněni v kruhu*, *Bohové jako břemeno* a *Na mrtvole boha*.
- **Tělo na splátky** (Cyberpunk, Bloodborne, BioShock, Zaklínač, Resident Evil, XCOM, Deus Ex): překrývá se s *Logem nad troskami* a *Prokletým dědictvím*. Oporu by mělo v Mary Douglasové (už v pramenech).
- **Cena většího dobra** (Warhammer, XCOM, Mass Effect, Pathologic, Dishonored, Pillars): překrývá se s *Kdo za to může?* a *Válkou, kterou nikdo nevyhraje*. Potřebovalo by Baumana (*Modernita a holocaust*).
- **Hříchy otců** (Silent Hill, Hades, Fallout, Death Stranding, Zaklínač, Baldur's Gate, Undertale): stálo by na psychoanalýze typu Alice Millerové, kterou jako pramen atlasu nebereme. Šlo by to opřít o Freudovo *Das Unheimliche* (máme).

Assassin's Creed a Path of Exile jsou jen na jednom putování a žádný kandidát s nimi zatím nepočítá. Animus a kvazivzpomínky (viz poznámka u *Kopie bez originálu*) jsou ověřený materiál.

## Knihy

**Máme a jsou ve výtazích** (`docs/prameny/`): Parfit *Reasons and Persons*, Foucault *Dohlížet a trestat*, Goffman *Asylums* (italský překlad), Camus *Mýtus o Sisyfovi*, Cassirer *Jazyk a mýtus*, Freud *Das Unheimliche* (v atlasu „tísnivě povědomé“, aby se nepletlo s Fisherovým „tísnivým“), Lovecraft *Supernatural Horror in Literature*. Ostatní prameny viz rozcestník `docs/prameny/README.md`.

**Chybí a hodilo by se:** Foucaultova esej *O jiných prostorech* (heterotopie) jako krátký doplněk k výtahu z *Dohlížet a trestat*.

**Až budou potřeba** (zatím nenutné): Kevin Lynch *Obraz města* (čitelnost města a mentální mapy, hodí se ke každému putování o prostoru), Bauman *Modernita a holocaust* (pro *Cenu většího dobra*), Arendtová *Eichmann v Jeruzalémě*, Bachtin *Rabelais*, Kristevová *Powers of Horror*, Becker *The Denial of Death*, Graeber *The Utopia of Rules*, Caillois *Hry a lidé*, Ong *Technologizace slova*.

## Co obnáší nové putování v kódu

- `src/lib/trails.ts`: nové `def(id, key, members, themes)` (4–7 světů, 2–4 témata z taxonomie) a slug v `TRAIL_SLUGS`.
- `src/lib/i18n.ts`: název a popis (`trails.*`, cs i en).
- Tabulka *Prameny podle stezek* v `docs/prameny/README.md` (z ní se skládá oddíl *Na čem putování stojí*).
- Počet putování se v textech pro čtenáře nebere natvrdo („Všech {n} putování“), ale v `CLAUDE.md` je číslo 22 napsané na několika místech (titulní strana, `/putovani/`, `trails.ts`, seznam schválených esejí) a je potřeba ho upravit.
- Mřížku *Kde se putování kříží* zkontrolovat v prohlížeči (šířka sloupců, popisky dole), u víc než 22 putování roste.
- Přepočítat tabulku pokrytí světů výše.
- Pak teprve balíček: `npm run bundle:trail -- <id> --split`.
