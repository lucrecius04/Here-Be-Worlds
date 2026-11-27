# Znak Here Be Worlds — rozhodnutí a slepé uličky

Záznam z hledání znaku (listopad 2026), aby se neopakovaly cesty, které nefungovaly.
Návrhy jsou na plátně Design v Claude „Here Be Worlds — logo a značka“.

## Nový znak na webu (od 2026-11-27, zkušebně): loď s brkem jako plachtou

- Ikona lodi je **majitelova** (Illustrator, `Ikonka_HBW.svg`, 16 × 16): plachta je brk se dvěma zářezy, pod ní trup a vlna. Obrysy byly vyhlazené (původní obtažená cesta měla „zuby“ na hranách zářezů); vyhlazení: rastr 2000 px, Gaussovo vyhlazení obrysu s ochranou ostrých rohů, husté Catmull-Rom křivky.
- Ikona stojí v **kruhu světa** (r 7,6 kolem bodu 8 / 9,6 v souřadnicích ikony) a **špička plachty z kruhu vyjíždí** nahoru: Here Be Worlds = plavba za okraj mapy. Mezery mezi lodí a kruhem jsou tah v barvě noci (`--color-night`). Tah se kreslí pod výplně brku i trupu, takže **stěžeň zůstává s trupem spojený** jako v majitelově ikoně (dřív mezera kolem trupu stěžeň přerušila a udělala do trupu zářez; opraveno 2026-11-27).
- **Zlatá je vlna** (putování, cesta, hladina; zlatá je na webu barva putování), plachta je celá krémová. Zlatá špička i zlatá vlna najednou se perou (zamítnuto).
- Čtyři podoby, mezi kterými majitel vybírá (přepínač `?znak=w1|z1|o2|o2k|vypnout`, localStorage `hbw_znak`, `data-znak` na `<html>`, tlačítko „Znak: W1 ⇄“ vlevo dole jen u toho, kdo ho zapne):
  - **W1 (výchozí):** šedý kruh (`--mark-shade`), vlna natažená 1,3× do šířky, takže **i vlna prorazí kruh** do obou stran,
  - **Z1:** krémový kruh (`--mark-light`), vlna uvnitř,
  - **O2:** šedý kruh **otevřený dole** (oblouk od 16° do 164°), natažená vlna leží v mezeře a přesahuje do stran: svět se otevírá k moři,
  - **O2K:** totéž s krémovým kruhem.
  - Zkoušené a odložené otevřené kruhy: O1 (užší mezera, vlna jako dno), O3 (mezera vpravo, ve faviconě působí jako písmeno C).
- Barvy jen z palety znaku: krémová, zlatá, šedá na noci. Ultramarínový akcent (odkazy) ani barvy archetypů do znaku nepatří.
- Kód: `src/components/i18n/BrandMark.tsx` (cesty `FEATHER`, `HULL`, `WAVE`, výřez `SAIL_VIEWBOX`, čtverec), CSS `.brand-mark-pair` v `layout.css`, přepínač v `BaseLayout`. **Favicony, ikona pro iPhone a karty pro sdílení zatím mají starý znak** (předělat po volbě podoby; na favicon navržen kotouč v negativu se zlatou vlnou, W6 / Z5).
- Hledání 2026-11-26/27 (zamítnuto): koule na plátky (tisíce podobných log), pravidelné pruhy v kruhu, okraj mapy se šrafami, souhvězdí, mořský had (táhne k fantasy), neutrální ikonky (dveře, kompas, kniha, obzor), zvířátka (sova, kočka…), linka jedním tahem, svět jako kniha, šestiúhelník-kniha, ovladač s hradní bránou. Návrhy z Gemini (kniha, kompas, měsíční klenba, nekonečno, střepy) přidávají ozdoby a vlasové linky, které v malém mizí; z nich vzešel jen nápad otevřeného kruhu. Vodítko od majitele: pravidelnost a jeden nápad jako ikona GitHubu; volná ikona bez rámu „není ono“, kruh ano.

## Předchozí znak (2026-11-18 až 2026-11-27)

- Kotouč světa rozložený na **čtyři vodorovné vrstvy** (vyprávění, historie, klasifikace, mapa).
- Vrstvy jsou rozjeté do **schodů se sklonem /**, stejně jako kurzíva „*Be*“ v nápisu.
- Barvy shora: bílá `#F4F1EA`, **zlatá** `#E5BE7E`, bílá, šedý stín `#AEB3BE`. Vše na noční modři `#0D1324`.
- Zlatá vrstva je **druhá shora**, vysunutá **doprava** za kotouč a zakončená **vykrojením jako štítek**: vrstva, kterou právě čteme, vytažená z kartotéky.
- Na webu je zlatá vždy zlatá. Barvu archetypu nese jen na kartách světů pro sdílení (`public/og/worlds/`).
- Kód: `src/components/i18n/BrandMark.tsx` (cesty, výřez 4 : 3), ikony v `public/`, karty generuje `scripts/og-images.mjs`.

## Pravidla, která z hledání vyplynula

- **Žádná tečka ani hvězda nad osou souměrnosti.** Čte se jako hlava (postava v prostěradle).
- **Tečka na okraji ikony** vypadá jako nepřečtená notifikace.
- **Světlo patří dovnitř tvaru**, ne nad něj. Zlatá nahoře jako čepička vypadá jako hlava nebo vycházející slunce.
- **Rovné hrany.** Vlnité okraje se čtou jako látka nebo prostěradlo.
- **Přesah jen na jednu stranu.** Kotouč se souměrným vodorovným pruhem přes celou šířku je londýnské metro nebo značka zákaz vjezdu.
- **Vodorovné vrstvy, ne svislé.** Vodorovné znamenají čas a vrstvy dějin. Svislé se čtou jako mříž, čárový kód nebo hřbety knih.
- **Čtyři vrstvy.** Tři vypadají jako vajíčko nebo hamburger, pět se v malé velikosti slévá.
- Vrstvy se schody pomáhají i proti „hamburgeru“, protože burger má vrstvy srovnané.
- Každý návrh ověřit **vedle nápisu v hlavičce** a v **16 px**.

## Vyzkoušeno a zamítnuto

| Motiv | Proč ne |
|---|---|
| Leporelo (W z horní hrany), s tečkou | postava v prostěradle |
| Leporelo A2 (šedá, bílá, zlatá, bílá) | nasazené, ale „neladí s nápisem, nevypadá jako ikona“ |
| Kulatá kniha, dvě hemisféry | mozek |
| Kniha jako horizont | stan nebo deštník |
| Planeta se záložkou | samuraj s čelenkou |
| Sněžítko, had, kaňka, klíčová dírka, pečeť, lucerna, kartuše | příliš opotřebované symboly |
| Kasiopeja (W z hvězd), tah pera | pěkné, ale nedotažené k výraznému znaku |
| Plné geometrické tvary (větrník, sedmilist, brána …) | obecné, „fotobankové“ |
| Planeta s prstencem, srpek, zatmění | dobré, ale klasika |
| Dva oblouky s tečkou | usměvavý obličej |
| Planeta nad obzorem, planeta v klíčové dírce | UFO, houba |
| Vnořené soustředné oblouky z rohu | ikona Wi-Fi |
| Pootevřený kotouč (vyjmutý dílek) | koláčový graf, Pac-Man |
| Posun (rozříznutý kotouč) | vedl ke schodům, z něj vznikl finální znak |
