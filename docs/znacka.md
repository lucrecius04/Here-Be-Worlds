# Znak Here Be Worlds — rozhodnutí a slepé uličky

Záznam z hledání znaku (listopad 2026), aby se neopakovaly cesty, které nefungovaly.
Návrhy jsou na plátně Design v Claude „Here Be Worlds — logo a značka“.

## Finální znak (od 2026-11-18)

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
