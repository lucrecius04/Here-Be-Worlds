# Postupné odkrývání světů

Záměr majitele (2026-11-19): web nespustit se všemi 43 světy najednou. Na startu ukázat jen část a zbytek odkrývat v pravidelném rytmu, aby se čtenáři měli proč vracet a každé odkrytí šlo sdílet.

## Rozhodnuto

- Odkrývat postupně, v pevném rytmu (týdně, nebo po 14 dnech).
- Na startu musí mít každý archetyp rozumný počet světů.

## Rozhodne se ke konci (teď se testuje celý web)

- **Kolik světů na startu.** Ve hře je 20; doporučení je 25 (viz níže).
- **Rytmus a den odkrývání** (týdně ve stejný den, nebo po 14 dnech).
- **Které světy skrýt.**

## Doporučení k počtu na startu

20 světů vychází zhruba na tři na archetyp, Historie a Horor by měly dva. Obloha by působila řídce, hádanka by se točila po 20 dnech a atlas by na první pohled vypadal tenký. 25 je rozumný kompromis a 18 světů v záloze vydrží při týdenním rytmu přes čtyři měsíce, k tomu přibývají nově psané kroniky.

Návrh rozložení pro 25 (dnes je 43):

| Archetyp | Celkem | Start | Záloha |
|---|---|---|---|
| Fantasy | 12 | 6 | 6 |
| Sci-fi | 7 | 4 | 3 |
| Postapokalypsa | 5 | 3 | 2 |
| Horor | 4 | 3 | 1 |
| Dystopie | 5 | 3 | 2 |
| Historie | 3 | 2 | 1 |
| Metafyzika | 7 | 4 | 3 |
| **Celkem** | **43** | **25** | **18** |

Zásada výběru: nejznámější tituly hned na startu (přivedou návštěvnost), pár silných jmen v záloze, aby mělo odkrývání tah.

## Jak to technicky udělat (až se rozhodne)

- Každý skrytý svět dostane v `data/worlds.json` datum odkrytí (např. `publishAt: "2026-12-04"`). Do toho dne se chová jako `draft`: není v atlasu, na obloze, ve srovnání, na mapě ani v hádance a jeho stránka se nesestaví.
- `deploy.yml` dostane pravidelné spuštění (cron) v den odkrytí ráno. Svět se objeví sám, bez commitu.
- Počty na webu (Atlas v číslech, kicker, patička) se počítají ze zveřejněných světů. `addedAt` = `publishAt`, takže „Nově zmapováno“ ukáže poslední odkrytý svět.
- Příbuznost a Příbuzenstvo jen mezi zveřejněnými světy; odkazy na skryté se vynechají.
- „Co se chystá“ může automaticky ukázat příští svět a jeho datum.
- Kanál novinek `/rss.xml` (`src/lib/feed.ts`, od 2026-11-24) už bere `publishAt` (jinak `addedAt`) a položky s datem v budoucnosti vynechává: s pravidelným sestavením ohlásí odkrytý svět sám.
- Pozor: ve veřejném repozitáři jsou skryté kroniky čitelné ve zdrojích. Na webu nebudou.
