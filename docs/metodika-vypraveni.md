# Metodika: Poetika světů

> Od 2026-11-28 se stránka i celá oblast jmenuje **Poetika světů** (`/poetika-svetu/`); do té doby Jak světy vyprávějí. V textu níž zůstává původní název tam, kde popisuje vývoj metodiky.

**Stav:** verze 0.2 (2026-11-25; názvy „kruh“ a „Zákulisí“ schválené týž den). **Na webu od 2026-11-25** (majitel: „implementuj na web“): stránka `/jak-svety-vypraveji/`, data `data/meta/narrative-tools.json`, filtr atlasu, karta světa, Anatomie herního lore a Teoretické zázemí. Zařazení podle přílohy `docs/metodika-vypraveni-zarazeni.md` beze změny; čtyři vlastnosti světa stojí na stránce v oddílu Mimo kruhy (Svět jako výpověď), režim se ukazuje jen jako značka „vzniká při hraní“. Otevřené otázky z oddílu 14, které zbývají: název „Čin“, hraniční případy, nové způsoby a kandidáti.

Dokument popisuje model, podle kterého atlas třídí nástroje vyprávění, jeho slovník, opory v pramenech a zkoušku na datech. Výtahy z pramenů jsou v `docs/prameny/` (rozcestník `README.md`).

---

## 0. Ve zkratce

1. Každý nástroj vyprávění má **pointu**: to, kvůli čemu ho kronika vyzdvihla.
2. Model se ptá na jediné: **co potřebuje pointa ze hry, aby přežila?** Odpověď dává šest **kruhů** od slova k hráči:
   **Slovo a stavba · Obraz a zvuk · Prostor a stopy · Čin · Zákulisí · Hráč.**
3. První tři kruhy unese i kniha, film nebo místo (literatura, film, architektura a archiv). Další tři vznikají z hraní. Přesně odpovídají třem věcem, které Juulův test převyprávění vylučuje: **pravidlům** (Čin), **herním rekvizitám** (Zákulisí) a **skutečné situaci, ve které se hraje** (Hráč).
4. Čím dál od středu, tím víc ze situace hraní nástroj potřebuje. Kruhy nejsou stupnice hodnoty.
5. Režimy (vložený, inscenovaný, vznikající) přestávají být druhou osou stránky. Na datech je z 86 % předpoví kruh. Zůstávají jako pomocná značka a nástroj rozboru.
6. Do kruhů nepatří vlastnosti světa (čtyři nástroje) ani běžné herní konvence.
7. Model unesl všech 160 nástrojů. Vznikly v něm čtyři nové způsoby, které dosavadní třídění zakrývalo (Krajina jako výraz, Slovo jako čin, Záměna rolí, Spoluvina), a dva, které čekají na potvrzení dalšími světy (Cizí hráči, Převrácené konvence).

---

## 1. Co stránka ukazuje a co ne

**Zdroj dat.** Oddíl „5. Hlavní nástroje vyprávění“ v každé kronice: 160 nástrojů ze 43 světů. Kronikáři v něm vybrali to, čím svět vyniká, ne úplný soupis.

**Každá hra vypráví vším.** Slovo, obraz, zvuk, prostor i pravidla má každá hra s příběhem. Domsch mluví o hře jako o metamédiu, Aarseth (2012) o „multimediálních softwarových balících“, Pearce připomíná, že každá hra má aspoň prožitý příběh. Stránka proto **neukazuje, čím svět vypráví, ale čím vyniká.**

**Z dat plyne jen přítomnost.** Když u světa nějaký kruh chybí, neznamená to, že ho svět nepoužívá, jen že ho kronikář nevybral. Prázdná místa se nevykládají a nepočítají se z nich podíly.

**Žádný žebříček.** Ryanová odmítá estetiku, která automaticky cení hlubší vrstvy interaktivity. Domsch říká, že míra příběhovosti není estetické hodnocení. Aarseth (2012) dodává, že odebrání hráčova jednání není mírou příběhovosti. Kruh 6 není „víc hra“ než kruh 1, jen potřebuje víc ze situace hraní.

**Ságy.** Když se nástroj týká jen některého dílu, stránka díl uvede.

**Návrh metodické poznámky na začátek stránky** (ke schválení, autorský text majitele má přednost):

> Každá hra vypráví slovem, obrazem, zvukem, prostorem i pravidly. Tady nehledáme, čím svět vypráví, ale čím vyniká: nástroje, které kronika každého světa vyzdvihla jako hlavní. Řadíme je do šesti kruhů podle toho, co z hraní potřebují. První tři by unesla i kniha, film nebo procházka místem. Další tři umí jen hra: stojí na pravidlech, na zákulisí hry (smrt, uložení, rozhraní), nebo na tobě. Kruhy nejsou žebříček. Rozdělení je pracovní nástroj atlasu a jako každé třídění věci zjednodušuje.

---

## 2. Proč nestačilo sedm rejstříků ani šest nosičů

**Sedm rejstříků** (Slovo · Obraz a zvuk · Prostor · Stopy · Pravidla · Opakování · Hráč) míchalo tři různé otázky:
- *čím* se vypráví (Slovo, Obraz a zvuk, Prostor, Pravidla: materiál),
- *kdy* se příběh stal (Stopy: minulost, kterou hráč skládá),
- *jaký vztah k hraní* nástroj využívá (Opakování, Hráč).

Proto bylo možné, že nahrávka v BioShocku patřila ke Stopám a dopis ve Witcheru ke Slovu, ačkoli oba jsou text.

**Šest nosičů z verze 0.1** problém posunulo, ale nevyřešilo. Slovo, Obraz a zvuk, Prostor a Pravidla jsou materiály díla (Koenitzův systém). Čas hraní je ale proces a Hráč účastník, ne materiál. A zrušení Stop stálo na argumentu Fernández-Varové, že index může být psaný, zvukový, prostorový i pravidlový. Ten argument ve skutečnosti říká opak: **stopy nejsou materiál, ale postavení hráče**, který skládá minulost. Patří proto k sobě s Prostorem, ne do Slova.

**Data ukázala další dva švy:**
- „Prostorové vyprávění“ (16 nástrojů) slévalo dvě různé věci: místo jako **stopu** události (kostra ve vaně, Carsonovy vyražené dveře) a místo jako **výraz** myšlenky nebo duše (gotická katedrála Warhammeru, Jiný svět Silent Hillu).
- Režim (vložený, inscenovaný, vznikající) se na datech skoro kryje s kruhem (oddíl 5). Jako druhá osa stránky by čtenáři nic nového neřekl.

---

## 3. Model šesti kruhů

### 3.1 Základní otázka

**Pointa nástroje** je to, kvůli čemu ho kronika vybrala. Model se ptá: **co musí převyprávění zachovat, aby pointa přežila?**

Juul (*Half-Real*, kap. 4) zkouší soudržnost herního světa neformálním testem: dá se popsat, co se ve hře stalo, **bez odkazu na pravidla, herní rekvizity nebo skutečnou situaci, ve které se hrálo?** Atlas test přenáší na jednotlivé nástroje a čte jeho tři výluky jako tři kruhy, které umí jen hra:

| Co pointa potřebuje | Kruh |
|---|---|
| nic víc než text | 1 Slovo a stavba |
| obraz, zvuk, střih | 2 Obraz a zvuk |
| místo, kterým se prochází, a stopy v něm | 3 Prostor a stopy |
| **pravidla** a hráčovo jednání ve světě | 4 Čin |
| **herní rekvizity**: smrt a návrat, uložení, další průchod, rozhraní, herní konvence | 5 Zákulisí |
| **skutečnou situaci hraní**: hráče samého nebo jiné skutečné lidi | 6 Hráč |

Stejné trojí členění má Galloway (*Gaming*): hru tvoří stroj, software a operátor. Činy uvnitř fikce (kruh 4), činy stroje a nastavení mimo fikci (kruh 5) a metalepse, která sahá na operátora (kruh 6).

Přenesení Juulova testu na nástroje a čtení jeho tří výluk jako kruhů je **výklad atlasu**. Juul sám testem posuzuje soudržnost celého světa. Metodika i veřejné texty to musí říkat (viz oprava z 2026-11-25 v Anatomii herního lore a Teoretickém zázemí).

### 3.2 Šest kruhů

| Kruh | Co hráč dělá | Co ho unese mimo hru | Způsoby (počet nástrojů v testu) |
|---|---|---|---|
| **1 Slovo a stavba** | čte a poslouchá | literatura | Postavy a rozhovory (10) · Vypravěč a rámec (8) · Nespolehlivé dějiny (6) · Zrcadlení a ozvěny (6) · Texty ze světa (3) · Víc pohledů (2) |
| **2 Obraz a zvuk** | dívá se a poslouchá | film, malba, hudba | Hudba a ticho (10) · Film a režie (7) · Výtvarný jazyk (6) |
| **3 Prostor a stopy** | prochází a skládá | architektura, muzeum, archiv | Krajina jako výraz (10) · Zápisky a záznamy (9) · Stopy v prostoru (6) · Hlasy mrtvých a svědků (5) · Vrstvy a sestup (4) · Předměty a popisky (4) |
| **4 Čin** | jedná podle pravidel | jen hra (a hry vůbec) | Volba a následky (13) · Pravidla, která vyprávějí (9) · Slovo jako čin (4) |
| **5 Zákulisí** | umírá, ukládá, hraje znovu, čte rozhraní | jen hra | Rozhraní uvnitř příběhu (6) · Paměť hry (5) · Smrt a návrat (4) · Převrácené konvence (2) |
| **6 Hráč** | je sám sebou, hráčem | jen hra | Hrdina jako maska (7) · Záměna rolí (3) · Průnik (3) · Spoluvina (2) · Cizí hráči (2) |

Celkem 156 nástrojů v kruzích a 4 mimo ně (oddíl 6). Kruhy 1 až 3 nesou 96 nástrojů, kruhy 4 až 6 nesou 60.

### 3.3 Proč kruhy

Uprostřed stojí vyprávěný příběh. Každý další kruh vtahuje víc ze situace hraní: oči, nohy, ruce na ovladači, zákulisí hry, nakonec člověka, který hraje. Šestý kruh sahá za hranici, které herní studia podle Huizingy říkají magický kruh (pojem rozšířili Salen a Zimmerman). Průnik ji překročí, spoluvina ji zatíží.

Model je obrácená cibule Ryanové. Ta jde od okraje (rozhraní kolem příběhu) ke středu (příběh tvořený za běhu). Atlas jde od středu (příběh, který se říká) ven ke skutečnému hráči. Obě stavby popisují totéž z opačných stran a obě odmítají hodnotit podle hloubky.

Pořadí prvních tří kruhů odpovídá tomu, kolik pohybu nástroj od hráče chce: číst, dívat se, procházet. Pořadí dalších tří tomu, jak daleko za fikci sahá: pravidla ve fikci, zákulisí kolem fikce, člověk za ní.

### 3.4 Prostor jako pantový kruh

Prostor sdílí hra s architekturou a zábavním parkem (Carson, Jenkins), ale Domsch v něm vidí hlavní vlastní přínos her a Aarseth (*Cybertext*) považuje průzkum za ergodickou funkci. Model to smiřuje: **kruh 3 drží prostor, který se čte a prochází.** Když prostor odpovídá na hráčovo jednání (Dishonored: mrtvoly krmí krysy a město se mění podle chaosu), pointa už potřebuje pravidla a nástroj patří do kruhu 4. U Prostoru tedy o hranici „z hraní“ rozhoduje pointa, ne materiál.

Prostor sám příběhovost nenese (Aarseth 2012, Ryanová: architektura vypráví jen metaforicky). Vypráví tím, co do něj autor vloží: stopy, postavy, vrstvy, výraz. Proto se kruh 3 nehodnotí podle toho, jak je svět otevřený.

### 3.5 Hranice hry a fikce: zfikčnění a průnik

Kruhy 5 a 6 stojí na hranici mezi hrou a fikcí a překračují ji opačným směrem:

- **Zfikčnění** (kruh 5): herní konvence nebo zařízení se stane součástí světa. Jørgensenová tomu říká povýšení ludické informace na fikční. Galloway mluví o umožňujících a znemožňujících činech stroje převlečených do fikce. Juul ukazuje, že nesoudržný svět (proč má Mario tři životy) se dá zdůvodnit. V atlasu: smrt a návrat v Hadovi a Planescape, čipy v mozku androidů v NieR, Animus v Assassin's Creed, Dračí zlom v Elder Scrolls, který udělal ze šesti protichůdných konců jednu historii.
- **Průnik** (kruh 6): fikce sáhne ven na skutečného hráče. Ryanová rozlišuje rétorickou metalepsi (okénko, které se zase zavře) a ontologickou (svět prosákne k hráči). Jen ontologická je nástroj. V atlasu: Inscryption na úrovni operačního systému, NieR: Automata a smazání vlastní uložené hry pro cizího člověka.

Zfikčnění a průnik jsou dvě nejvlastnější věci, které hra s vyprávěním umí, a v dosavadním třídění neměly jméno.

---

## 4. Kruhy a způsoby podrobně

Příklady jsou ze zkušebního zařazení (příloha). U každého kruhu je otázka, kterou si zařazovatel klade.

### Kruh 1: Slovo a stavba

*Otázka: Unesl by pointu text?* Kruh diegeze, tedy vyprávění slovy (Ryanová), a stavby příběhu (syžetu).

- **Postavy a rozhovory**: postavy se odhalují tím, co a jak říkají. Hašteření družiny v Dragon Age, chór 24 hlasů v Disco Elysium, bílá komora zpovědi v Assassin's Creed. Aarseth (2012): bohatost postavy je hlavní autorský nástroj her.
- **Vypravěč a rámec**: kdo vypráví a v jaké podobě. Marigoldův deník v Zaklínači, Arťomův deník v Metru, typografie Pentimentu, povídková stavba úkolů v Zaklínači. Thon (typy herních vypravěčů, rámec výslechu), Genette a Stanzel podle Arjoranty.
- **Nespolehlivé dějiny**: dějiny vypráví někdo zaujatý a pravda leží mezi verzemi. Elder Scrolls, kodexy Dragon Age, Warhammer 40k. Doležel (autentizace: kdo smí ve fikci tvrdit fakta), Thon (nespolehlivý vypravěč uvnitř světa), Aarseth (aporie a epifanie).
- **Texty ze světa**: dokumenty psané pro obyvatele světa, které hráč čte jako texty. Oběžníky v Control, kodex Mass Effectu, epigrafy Warhammeru. Když je pointou hledání a skládání, patří text do kruhu 3.
- **Zrcadlení a ozvěny**: motivy, dvojníci a situace, které se vracejí. Osudy společníků v Baldur's Gate, dvojčata v Elden Ringu, dvojí závěr SOMA.
- **Víc pohledů**: táž doba nebo událost z několika stran. Střídání hrdinů v Dragon Age, tři léčitelé v Pathologic. Murrayová (kaleidoskopické vyprávění). Když pohled mění, *koho hráč hraje*, patří nástroj do kruhu 6 (Záměna rolí).

### Kruh 2: Obraz a zvuk

*Otázka: Unesl by pointu film nebo obraz?* Kruh mimeze, tedy předvedení (Ryanová).

- **Film a režie**: předrenderované filmy, skriptované scény v reálném čase, režie kamery. Half-Life, Cyberpunk, Control s hranými záběry. Jenkins (mikropříběhy podle Ejzenštejna), Galloway (filmové vložky jako čin stroje), Schröter a Thon (předem dané zobrazení).
- **Hudba a ticho**: leitmotiv, který prozradí spojitost (Undertale, Outer Wilds), ticho a šum (Silent Hill), píseň ve správnou chvíli (Death Stranding).
- **Výtvarný jazyk**: barva, malířský styl, podoba tvorů. Olejomalba Disco Elysium, iluminovaný rukopis Pentimentu, monstra Silent Hillu.

### Kruh 3: Prostor a stopy

*Otázka: Unesla by pointu procházka místem nebo archiv?* Hráč tu je průzkumník a vyšetřovatel: Jenkinsův paměťový palác, Fernández-Varové indexy, Callejův tažený příběh, Aarsethova aporie a epifanie.

- **Stopy v prostoru**: místo jako následek události. Fallout, Half-Life, Horizon a průhledy, ruiny Lordaeronu ve World of Warcraft. Carson (příčina a následek, následovat Saknussemma).
- **Krajina jako výraz** (nový způsob): místo vyjadřuje myšlenku, ideologii nebo duši. Utopická architektura BioShocku, katedrála Warhammeru, svět na těle titánů v Xenoblade, město jako anatomie v Pathologic, Jiný svět Silent Hillu, dům v Control, který se kroutí podle stavu mysli. Jenkins (melodrama: vnitřní stavy promítnuté do prostoru), Ryanová (architektura vypráví metaforicky), Carson („příběh“ jako pravidla celého místa), Bachelard.
- **Vrstvy a sestup**: čím hlouběji, tím starší a temnější dějiny. Diablo, Dark Souls, Bloodborne, Elden Ring. Lotmanova hranice podle Schrapeho (událost jako překročení hranice), Aarseth a Günzel (topologie).
- **Zápisky a záznamy**: deníky, nahrávky, terminály, kazety. BioShock, Resident Evil, Outer Wilds. Fernández-Vara (výklad pozůstatků), Calleja (tažený příběh podle Levina).
- **Předměty a popisky**: dějiny v pár řádcích u zbraně nebo v předmětu, jehož účel se zapomněl. Dark Souls, Elden Ring, Path of Exile, cyphery v Tides of Numenera.
- **Hlasy mrtvých a svědků**: schopnost vyslechnout ty, kdo by jinak mlčeli. Pozorovatel v Pillars of Eternity, Srdce v Dishonored, černá skříňka v SOMA. Mechanismem je pravidlo, pointou minulost, kterou hráč slyší, proto kruh 3 („také: Čin“ jen tam, kde pointou je samotná schopnost).

### Kruh 4: Čin

*Otázka: Musí převyprávění zmínit pravidla nebo to, co hráč ve světě dělá?* Kruh simulace (Ryanová), procedurální rétoriky (Bogost) a hráčových činů uvnitř fikce (Gallowayův dromenon).

- **Pravidla, která vyprávějí**: pravidlo samo je výpověď. Chůze s nákladem v Death Stranding, vědomostní zámky v Outer Wilds, Myšlenkový kabinet v Disco Elysium, trvalá smrt a pouta v XCOM. Bogost (co hra dovolí a co ne), Juul (poloreálnost), Koenitz (pravidla jako součást protopříběhu), Calleja (pravidla jako stroj skutečnosti), Arjoranta (výběrová simulace).
- **Volba a následky**: rozhodnutí, která svět opravdu promění. Odložené následky v Zaklínači, chaos v Dishonored, neviditelné volby v Silent Hillu, mýtické cesty v Pathfinderu. Ryanová (ontologická interaktivita), Aarseth (dynamická jádra), Murrayová (dramatické jednání).
- **Slovo jako čin** (nový způsob): řeč řízená pravidly, která má váhu činu. Slovní souboje v Deus Ex, Krize v Tides of Numenera, boj jako rozhovor v Undertale, lež, která se v Planescape zhmotní. Kniha rozhovor podá, ale neumí ho prohrát. Způsob vyšel z dat atlasu, v pramenech ho nejblíž popisuje Domsch (aktivně uzlové formy) a Thon (herní funkce slova).

Dosavadní způsob **Příběhy, které napíše hráč** se rozpouští: není to způsob, ale vznikající režim. XCOM patří k Pravidlům, která vyprávějí, Death Stranding k Cizím hráčům.

### Kruh 5: Zákulisí

*Otázka: Musí převyprávění zmínit smrt ve hře, uložení, nový průchod, rozhraní nebo herní konvenci?* Kruh zfikčnění (oddíl 3.5).

**Proč Zákulisí** (název zvolen 2026-11-25, dřív pracovně Soustrojí): smrt a nové nahrání, ukládání, menu a ukazatele jsou to, co hra běžně drží za scénou. Nástroje tohoto kruhu je vynášejí na jeviště a dělají z nich příběh. „Mechanika“ by splývala s kruhem 4, protože pravidla, která vyprávějí, jsou právě herní mechaniky. Herní konvence se tu nestydí za to, že je konvence. Stala se materiálem příběhu.

- **Smrt a návrat**: smrt není konec hry, ale krok příběhu. Hades, Planescape: Torment, kráter ve světě Death Stranding, labyrint mysli v Tides of Numenera. Juul (*The Art of Failure*: mírnější tresty udělaly ze smrti vyprávěcí materiál), Galloway (smrt jako znemožňující čin stroje).
- **Paměť hry**: uložení, návrat na začátek, další průchod a přenos mezi díly jako součást příběhu. Undertale pamatuje, že jsi hru nahrál znovu. NieR: Automata staví příběh z cest A až E. Dračí zlom v Elder Scrolls kanonizuje všechny konce. Mass Effect přenáší rozhodnutí mezi díly, Resident Evil propojuje scénáře A a B. Koenitz (problém mnoha průchodů), Murrayová (mnohotvarý příběh), Galloway (ukládání a nahrávání jako hráčův čin mimo fikci).
- **Rozhraní uvnitř příběhu**: ukazatele, menu a deník patří do fikce. Animus, čipy v NieR, Metro bez ukazatelů, palubní deník Outer Wilds, viditelný hod kostkou v Baldur's Gate, Inscryption, kde se vypravěčem stává sám žánr a engine. Jørgensenová (povýšení ludického na fikční; jen když povýšení nese příběh), Galloway.
- **Převrácené konvence**: hra si bere za téma vlastní konvence nebo konvence svého žánru. Planescape převrací klišé stolního Dungeons & Dragons, Mass Effect se směje vlastním výtahům a tanci. Juul (nesoulad pravidel a fikce jako nástroj, parodie). Kandidát: potvrdit dalšími světy.

### Kruh 6: Hráč

*Otázka: Musí převyprávění zmínit tebe, hráče, nebo jiné skutečné lidi?*

- **Hrdina jako maska**: prázdné místo, do kterého hráč vstoupí. Mlčící Gordon Freeman, voják bez tváře v Halo, trik kontinuity v SOMA, Velitel v XCOM, na kterého se postavy dívají. Pearce (napůl prázdný avatar), Arjoranta (ztělesněná fokalizace), Dubbelman (hráč hrdinou je × hrdinu řídí), Galloway (první osoba jako aktivní vidění), Jørgensenová (avatar jako liminální bytost).
- **Záměna rolí** (nový způsob): hra hráče postaví na druhou stranu. Arbiter v Halo 2, obě strany ve Warcraftu, hráč jako netvor v Doomu. Román může vyprávět z pohledu nepřítele, ale nemůže čtenáře přimět, aby za nepřítele bojoval. Juul (zrcadlení hráče a protagonisty), Ryanová (vnitřní účast).
- **Spoluvina** (nový způsob): hráč se dozví, k čemu se propůjčil, nebo musí ublížit sám. „Would you kindly“ v BioShocku, etické pasti v SOMA. Juul (*The Art of Failure*: zážitek, který zprostředkují jen hry). Dosud byl BioShock pod Čtvrtou stěnou.
- **Průnik** (dosud Čtvrtá stěna): ontologická metalepse, fikce sáhne na skutečného hráče. Inscryption, Soukromý pokoj v Death Stranding, zcizovací efekty v Pathologic. Ryanová, Galloway (Psycho Mantis), Jørgensenová (stěnu boří jen porušení premisy). Oslovení hráče samo o sobě nástroj není (pravidlo 3).
- **Cizí hráči**: příběh nesou skuteční jiní lidé. Žebříky a lana od cizích hráčů v Death Stranding, smazání vlastní uložené hry pro neznámého v NieR: Automata. Schröter a Thon (třetí způsob zobrazení: komunikace mezi hráči), Fernández-Vara (stopy pro jiné hráče). Kandidát: v kronikách se dál objevují zprávy a skvrny v Dark Souls, ale ne v oddílu nástrojů.

---

## 5. Režim: z druhé osy pomocná značka

Režim říká, **kdo napsal výsledek a kdy**: autor dřív a rozmístil to (**vložený**), autor dřív a spustí to teď (**inscenovaný**), nebo nikdo konkrétně, vzešlo to z pravidel a hráčova jednání (**vznikající**). Opora: LeBlanc přes Salena a Zimmermana, Jenkins, Ryanová (příběhy objevování, postupu a vznikání), Domsch (pasivní, aktivně uzlové a dynamické formy), Aarseth (pevná a dynamická jádra), Juulův test herního průvodce.

**Co ukázala zkouška na datech:**

| Kruh | vložený | inscenovaný | vznikající |
|---|---|---|---|
| 1 Slovo a stavba | 7 | 28 | 0 |
| 2 Obraz a zvuk | 0 | 23 | 0 |
| 3 Prostor a stopy | 36 | 2 | 0 |
| 4 Čin | 1 | 20 | 5 |
| 5 Zákulisí | 2 | 12 | 3 |
| 6 Hráč | 0 | 15 | 2 |

Kdo zná kruh, uhodne režim ve 134 ze 156 případů (86 %). U stylu (hudba, výtvarný jazyk) režim nic nerozlišuje. Vznikajících nástrojů je jen 10. To odpovídá Ryanové: většina světů atlasu stojí na předem daném příběhu s variantami a ostrůvky vznikání. Je to fakt o žánru, ne nedostatek.

**Doporučení:**
- Na stránce režim jako druhou osu (mřížku 6 × 3) neukazovat.
- V datech ho u každého nástroje vést, protože pomáhá při rozboru a hlídá zařazení (vložený nástroj v kruhu 4 nebo vznikající v kruhu 1 je signál ke kontrole).
- Na stránce nanejvýš drobná značka **„vzniká při hraní“** u deseti vznikajících nástrojů. To je jediné rozlišení, které kruh nepředpoví.

**Námitka, se kterou metodika počítá.** Aarseth (2012) i Juul (*Half-Real*) kritizují Jenkinsovo vznikající vyprávění jako rozmělnění pojmu. Režim atlasu proto neříká, *že* je něco vyprávěním (to rozhodla kronika), jen *kdo napsal výsledek*. Vznikající je jen to, co nenapsal autor.

---

## 6. Co do kruhů nepatří

**Vlastnosti světa.** Zákony světa (fyzika, metafyzika, biologie) jsou to, *co* se vypráví, ne *jak*. Doležel je popisuje jako modální systém fikčního světa, Suvin jako novum, Pearce jako metapříběh. Ze šesti nástrojů dosavadního způsobu Zákony světa model tři přesunul, protože jejich pointa stojí na vyprávění:
- lež, která se v Planescape zhmotní → kruh 4 (Slovo jako čin): vynucuje ji rozhovor;
- převrácení klišé D&D v Planescape → kruh 5 (Převrácené konvence);
- nespolehlivá archeologie Numenery → kruh 3 (Předměty a popisky).

Čtyři nástroje zůstávají vlastností světa a ze stránky by odešly (v kronice zůstanou beze změny): vědecké pojetí duše v Pillars of Eternity, slovanský folklór jako biologie v Zaklínači, dehumanizace jazykem a tělem ve Warhammeru 40k a paměť omezená životním cyklem v Xenoblade (dosud vedená jako Smrt a návrat). Jejich místo je na kartě světa a ve Faktografii. Otevřená otázka 5.

**Konvence.** Postava, která hlásí plný inventář, nebo ukazatel zdraví zdůvodněný přilbou je běžná řeč her (Jørgensenová, Thonův princip shovívavosti). Do kruhu 5 patří konvence jen tehdy, když se stane materiálem příběhu.

**Evokativní prostor.** Místo, které připomene jiný příběh (Jenkins), je odkaz na mýtus nebo žánr. V atlasu ho nesou Témata a Putování.

---

## 7. Pravidla zařazení

1. **Najdi pointu** v odstavci kroniky: proč ho kronika vybrala.
2. **Zkus ji převyprávět** do knihy, filmu nebo procházky místem. Přežije-li, rozhoduje umění, které ji unese: text → 1, obraz a zvuk → 2, místo a stopy → 3.
3. **Nepřežije-li, zeptej se, co převyprávění musí zmínit:** pravidla nebo hráčovo jednání ve světě → 4, herní zařízení a konvence → 5, skutečného hráče nebo jiné lidi → 6.
4. **Rozhoduje nejvzdálenější nutná věc.** Přenos rozhodnutí v Mass Effectu potřebuje volby (4) i uložení (5), proto 5. Smazání uložené hry v NieR potřebuje uložení (5) i skutečného cizího hráče (6), proto 6.
5. **Materiál nerozhoduje.** Nahrávka je text, ale když je pointou skládání minulosti z nalezených útržků, patří do kruhu 3. Rozhovor je slovo, ale když se dá prohrát podle pravidel, patří do kruhu 4.
6. **Konvence nejsou nástroje** (oddíl 6).
7. **Hraniční případ** dostane poznámku „také: …“ (v testu 19 nástrojů), jako v Galerii triád.
8. **Režim** se určí otázkou z oddílu 5 a zapíše do dat.
9. **Díl ságy** uvést, když se nástroj týká jen některého dílu.
10. **Text kroniky se nemění.** Když odstavec nestačí, rozhodne Anatomie vyprávění. Sporný případ do `docs/stav.md`.
11. **Způsob** existuje, když má aspoň dva nástroje. Nový způsob vznikne, jen když se v kronikách opakuje.

**Rozpracované příklady:**
- Popisky předmětů v Dark Souls: text, ale pointou je skládání dějin z útržků → kruh 3, vložený.
- Chůze s nákladem v Death Stranding: převyprávění musí říct, že hráč balancuje a padá → kruh 4, vznikající.
- Smrt v Hadovi: princ se vrací Styxem domů. V knize by to šlo, ztratila by se ale pointa: každé hráčovo selhání je princova smrt a hra z herní smyčky udělala příběh → kruh 5.
- Databáze replik v Hadovi: postavy komentují, co se právě stalo. V knize by to šlo (smrti jsou ve fikci), pointou jsou postavy → kruh 1, hraniční („také: Zákulisí“ by šlo zvážit).
- Neviditelné volby v Silent Hillu: hra sleduje, co hráč dělá s fotografií Mary → kruh 4, „také: Hráč“.

---

## 8. Slovník

| Pojem | EN | Význam v atlasu | Opora |
|---|---|---|---|
| nástroj vyprávění | narrative device | konkrétní postup, který kronika vyzdvihla u světa (jednotka dat) | kroniky, oddíl 5 |
| pointa nástroje | point | to, kvůli čemu kronika nástroj vybrala | – |
| kruh | ring | jedna ze šesti skupin podle toho, co pointa potřebuje ze hry | Juul (test), Galloway, Ryanová |
| způsob | technique | typ nástroje uvnitř kruhu, aspoň dva nástroje | – |
| z umění vyprávění × z hraní | from the narrative arts × from play | kruhy 1–3 × kruhy 4–6 | Calleja (dva rodokmeny) |
| pantový kruh | hinge ring | Prostor a stopy: sdílený s architekturou, ale ergodický | Domsch, Aarseth, Ryanová |
| zfikčnění | diegetisation | herní konvence nebo zařízení se stane součástí světa | Jørgensenová (povýšení), Galloway, Juul |
| průnik | breach | fikce sáhne na skutečného hráče (ontologická metalepse) | Ryanová, Galloway, Jørgensenová |
| konvence | convention | běžná řeč her, kterou hráč odfiltruje | Jørgensenová, Thon |
| režim | mode | kdo napsal výsledek a kdy: vložený, inscenovaný, vznikající | LeBlanc, Jenkins, Ryanová, Domsch |
| vlastnost světa | world property | co se vypráví, ne jak (zákony, novum) | Doležel, Suvin, Pearce |
| vypravěčský podpis | narrative signature | kombinace kruhů a způsobů u jednoho světa | – |

Slovo **rejstřík** z dosavadní stránky nahradí **kruh** (schváleno 2026-11-25, „okruh“ zamítnut). „Nosič“ z verze 0.1 se nepoužije.

---

## 9. Opora v pramenech a kde se od nich model odchyluje

| Pramen | Co dává modelu |
|---|---|
| Juul, *Half-Real* | test převyprávění a jeho tři výluky (kruhy 4–6), poloreálnost, nesoudržné světy, test herního průvodce (režim), kritika „vznikajícího vyprávění“ |
| Juul, *The Art of Failure* | Smrt a návrat, Spoluvina, tragický okamžik jako ztráta moci nad postavou |
| Galloway, *Gaming* | stroj, software, operátor; diegetické × nediegetické činy; umožňující a znemožňující činy převlečené do fikce; metalepse; první osoba |
| Ryanová, *Avatars of Story* a 2005 | diegetický, mimetický a simulační mód (kruhy 1, 2, 4); objevování, postup, vznikání (režim); rétorická × ontologická metalepse (Průnik); cibule a odmítnutí žebříčku |
| Aarseth, *Cybertext* a 2012 | ergodická funkce průzkumu (pant), aporie a epifanie, postava jako hlavní autorský nástroj, prostor příběhovost nenese, kritika Jenkinse |
| Jørgensenová | herní svět jako rozhraní, povýšení ludického na fikční (zfikčnění), metareference jako konvence, liminální avatar |
| Thon; Schröter a Thon | typy herních vypravěčů, rámec výslechu, nespolehlivý vypravěč uvnitř světa, princip shovívavosti; vyprávění × simulace × komunikace (Cizí hráči) |
| Koenitz a INDCOR | systém, proces, produkt; pravidla jako protopříběh; problém mnoha průchodů (Paměť hry); pokora verzované taxonomie |
| Jenkins 2004, Carson, Fernández-Vara | kruh 3: paměťový palác, příčina a následek, indexy, dějiny světa a dějiny hráče, melodrama (Krajina jako výraz) |
| Domsch, *Storyplaying* a *Ludotopia* | hra jako metamédium, pasivní, aktivně uzlové a dynamické formy, spouštěče, prostor jako přínos her (pant), Lotmanova hranice (Vrstvy a sestup) |
| Calleja 2011 a 2017 | dva rodokmeny herního vyprávění (obě poloviny modelu), tažený a tlačený příběh, alterbiografie, pravidla jako stroj skutečnosti |
| Pearce, Murrayová, Bogost | prožitý příběh všude, napůl prázdný avatar; čtyři vlastnosti digitálního média, kaleidoskop, jednání; procedurální rétorika |
| Arjoranta | fokalizace a ztělesněná fokalizace (Hrdina jako maska), zrnitost a výběrová simulace, nespolehlivý vypravěč v pravidlech |
| Salen a Zimmerman | vložené × vznikající (LeBlanc), příběhové deskriptory, omyl ponoření |
| Howard, *Quests* | úkol jako struktura uskutečňovaná hráčem; v datech zatím jediný nástroj (povídková stavba Zaklínače, kruh 1), samostatný způsob proto nevzniká |
| Doležel, Suvin, Iser | vlastnost světa, novum, autentizace; řízená prázdná místa |

**Kde je model vlastní konstrukcí atlasu** (a musí to říkat):
- kruhy jako takové a jejich pořadí;
- přenesení Juulova testu na nástroje a čtení jeho tří výluk jako kruhů 4 až 6;
- pravidlo nejvzdálenější nutné věci;
- přiřazení Gallowayových kvadrantů ke kruhům je přibližné, ne totožné;
- odsunutí režimu na pomocnou značku jde proti tradici Jenkinse a LeBlanca, kde je dvojice vložené a vznikající ústřední. Opora je v datech atlasu, ne v pramenech;
- způsoby Krajina jako výraz, Slovo jako čin, Záměna rolí a Cizí hráči vyšly z dat, prameny je jen podpírají.

**Slabá místa, která zná:**
- Kruhy 1 a 2 se v herní praxi prolínají (namluvený dialog je slovo i zvuk). Rozhoduje pointa, ne médium, a hraniční případy dostanou „také“.
- Hranice mezi kruhy 4 a 5 je nejjemnější: smrt je ve fikci i v zákulisí. Pravidlo: když pointou je, že *konvence* (návrat po smrti, uložení, rozhraní) dostala příběh, je to kruh 5.
- Hrdina jako maska stojí na pomezí kruhů 1 a 6: román ve druhé osobě existuje. Pointou masky je ale prázdné místo vyplněné hráčovým jednáním, ne gramatická osoba.

---

## 10. Zkouška na datech

Všech 160 nástrojů dostalo zkusmo místo (příloha `docs/metodika-vypraveni-zarazeni.md`):

- 156 v kruzích, 4 mimo ně (vlastnost světa);
- 19 hraničních případů s poznámkou „také“;
- každý způsob má aspoň dva nástroje;
- 36 ze 43 světů má aspoň jeden nástroj v kruzích 4 až 6. Bez nich si vystačí Control, Diablo, Dragon Age, Elden Ring, Horizon, StarCraft a Warhammer 40k;
- nově pojmenované věci: Krajina jako výraz (10), Slovo jako čin (4), Záměna rolí (3), Spoluvina (2), Cizí hráči (2), Převrácené konvence (2), Víc pohledů (2);
- rozpuštěné: Příběhy, které napíše hráč (je to režim), Zákony světa (tři nástroje přesunuté, čtyři mimo kruhy), Víc průchodů a pohledů (rozdělen na Paměť hry, Víc pohledů a Záměnu rolí).

**Hraniční případy, které stojí za pohled majitele:** databáze replik v Hadovi (1 nebo 5), deník Metra v načítacích obrazovkách (1 nebo 5), opakování a variace v Pathologic (1 nebo 5), proměny kamery v NieR (2 nebo 5), Stiltonovo sídlo v Dishonored 2 (4 nebo 3), ruiny Lordaeronu ve Warcraftu (3 nebo 6), dvojí závěr SOMA (1 nebo 6), Arbiter v Halo 2 (6 nebo 1), Dračí zlom (5 nebo mimo kruhy), sebeparodie Mass Effectu (5 nebo 1).

---

## 11. Co se mění oproti sedmi rejstříkům

| Dosud | Nově |
|---|---|
| Slovo (Dialogy, Knihy a dokumenty, Nespolehliví vypravěči, Vypravěčský rámec, Zrcadlení a ozvěny, Zákony světa) | **Slovo a stavba**: totéž bez Zákonů světa, navíc Víc pohledů |
| Obraz a zvuk | **Obraz a zvuk** beze změny |
| Prostor + Stopy | **Prostor a stopy**: znovu spojené, protože stopy jsou postavení hráče, ne materiál; z Prostorového vyprávění se oddělila Krajina jako výraz; Svět, který se mění se rozešel do Krajiny jako výrazu (mysl) a Volby a následků (hráčovy činy) |
| Pravidla | **Čin**: Pravidla, která vyprávějí, Volba a následky, nově Slovo jako čin; Rozhraní uvnitř příběhu odešlo do Zákulisí, Příběhy, které napíše hráč, se rozpustily v režimu |
| Opakování | **Zákulisí**: Smrt a návrat, Paměť hry, Rozhraní uvnitř příběhu, Převrácené konvence |
| Hráč | **Hráč**: Hrdina jako maska, Průnik (dřív Čtvrtá stěna), nově Záměna rolí, Spoluvina, Cizí hráči |

Úsek stránky „Od slova ke hře“ by se jmenoval **„Od slova k hráči“**.

---

## 12. Odkud to známe

U každého způsobu jeden řádek o tom, které hry, studia nebo žánry ho proslavily. Psát „proslavil“, „zavedl do hlavního proudu“, „vzorový příklad“, ne „vynalezl“. Každé tvrzení s pramenem. Přednost mají příklady z atlasu, původ může ležet mimo něj.

Kandidáti z přečtených pramenů (před zveřejněním ověřit):

| Způsob | Odkud to známe | Pramen | Ověřit |
|---|---|---|---|
| Stopy v prostoru | pojem ze zábavních parků Disney (Carson 2000); rané hry Myst, Half-Life | Carson, Jenkins | |
| Film a režie (skriptované scény v hraní) | Half-Life (Valve 1998) z nich udělal základ | Domsch | |
| Cizí hráči | zprávy a skvrny v Demon's Souls (FromSoftware 2009), pak Dark Souls | Fernández-Vara | |
| Zápisky a záznamy | BioShock (2007) jako vzorový příklad | Fernández-Vara | starší System Shock a Looking Glass |
| vznikající režim | The Sims (Maxis 2000); pojem LeBlanc (GDC 1999/2000), souběžně Doug Church | Pearce, Jenkins, Ryanová, Salen a Zimmerman | |
| Průnik | Psycho Mantis v Metal Gear Solid (1998) | Galloway, Conway | |
| Vypravěč a rámec (vypravěč komentuje hráčovy činy) | Bastion (Supergiant 2011), týž tým pak Hades | Arjoranta | |
| Pravidla, která vyprávějí (trvalá smrt) | režim Ironman v XCOM: Enemy Unknown (2012) | Arjoranta | starší tradice roguelike |
| Slovo jako čin / nespolehlivý vypravěč v pravidlech | Call of Juarez: Gunslinger (2013) | Arjoranta | |
| Vypravěč a rámec (rámec výslechu) | Hitman: Blood Money, Zaklínač 2, Dragon Age II | Thon | ověřit proti kronikám |
| Nespolehlivé dějiny (vypravěč uvnitř světa) | Atlas (BioShock), 343 Guilty Spark (Halo), GLaDOS (Portal) | Thon | ověřit proti kronikám |
| Spoluvina | Shadow of the Colossus (2005), deskovka Train (2009); opuštění spojence bez volby už Planetfall (1983) a Final Fantasy VII (1997) | Juul, *The Art of Failure* | |
| kruh 6 (tragický okamžik: ztráta moci nad postavou) | Red Dead Redemption (2010) | Juul, *The Art of Failure* | zařazení ověřit |
| Volba a následky (quick time events) | Dragon's Lair (1983), pojem ze Shenmue | Domsch | ověřit obojí |
| Postavy a rozhovory (stromy rozhovorů) | Fallout, Mass Effect | Domsch | starší RPG |
| Rozhraní uvnitř příběhu | přilba v Metroid Prime, magnetofony k uložení v The Thing | Jørgensenová, Galloway | ověřit, starší příklady |

Zbylé způsoby (Krajina jako výraz, Předměty a popisky, Vrstvy a sestup, Hrdina jako maska, Paměť hry a další) potřebují vlastní dohledání.

---

## 13. Prameny

**Přečtené** (výtahy v `docs/prameny/`): Juul *Half-Real* (z knihy), Juul *The Art of Failure* (německý překlad), Galloway *Gaming*, Ryanová *Avatars of Story* (kap. 1, 5, 8, 9), *Narrative as Virtual Reality* (část) a 2005, Aarseth *Cybertext* a 2012 (originál), sborník *Ludotopia* (Aarseth a Günzel), Jørgensenová *Gameworld Interfaces*, Thon *Transmedial Narratology* (oddíly o hrách), Schröter a Thon 2014, Koenitz a INDCOR, Jenkins 2004 a *Convergence Culture*, Carson 2000, Fernández-Vara 2011, Pearce 2004, Domsch *Storyplaying* (kap. 1–3), Calleja *In-Game* a 2017, Arjoranta 2017, Salen a Zimmerman *Rules of Play* (kap. 26, 27), Murrayová, Bogost, Howard *Quests*, k tomu Iser, Doležel, Wolf a Suvin.

Část výtahů vznikla přes nástroj pro čtení webu z podrobného shrnutí, ne čtením stránka po stránce. Doslovné citace a čísla stran se před použitím v eseji musí ověřit v originálu.

**Z druhé ruky** (`docs/prameny/drobne-prameny.md`), stojí za dočtení: Domsch, *Storyplaying*, kap. 4–7; Conway, „A Circular Wall?“ (2009); LeBlancova přednáška na GDC.

**Teoretické zázemí** (`content/essays/teoreticke-zazemi.md`) a kapitola Jak světy vyprávějí v Anatomii herního lore se doplní, až majitel model schválí, spolu s přestavbou stránky.

---

## 14. Otevřené otázky pro majitele

1. **Model šesti kruhů:** sedí základní otázka (co pointa potřebuje ze hry) a pořadí kruhů?
2. **Názvy kruhů:** Slovo a stavba · Obraz a zvuk · Prostor a stopy · Čin · Zákulisí · Hráč. Rozhodnuto 2026-11-25: „Zákulisí“ místo pracovního „Soustrojí“ (majitel navrhl Mechaniku, ta by splývala s kruhem 4). Zbývá „Čin“ (alternativa: Pravidla).
3. **Slovo „kruh“:** rozhodnuto 2026-11-25 se souhlasem majitele, „kruh“, ne „okruh“. Okruh zní jako tematický okruh nebo okruh přátel a ztrácí obraz soustředných kruhů od příběhu k hráči i ozvěnu magického kruhu. Na stránce tedy kruhy místo rejstříků a úsek „Od slova k hráči“.
4. **Režim:** souhlas, že na stránce nebude mřížka 6 × 3, nanejvýš značka „vzniká při hraní“?
5. **Vlastnosti světa:** čtyři nástroje (Pillars, Zaklínač, Warhammer, Xenoblade) by ze stránky odešly a zůstaly jen v kronikách. Souhlas, nebo pro ně najít místo (třeba okraj stránky „Svět jako výpověď“)?
6. **Nové způsoby:** Krajina jako výraz, Slovo jako čin, Záměna rolí, Spoluvina. A dva kandidáti na hraně pravidla (Cizí hráči, Převrácené konvence): nechat, nebo počkat na další světy?
7. **Hraniční případy** z oddílu 10.
8. **Poslední část stránky** (dnes Jak vypráví který svět): Vypravěčský podpis světů, řazení podle archetypu a abecedy, bez skupin podle podílu (dohodnuto v zásadě).

## 15. Další postup

1. Majitel projde model a hraniční případy.
2. Úprava modelu podle připomínek (verze 0.3 nebo 1.0).
3. Nové zařazení v `data/meta/narrative-tools.json` (kruh, způsob, režim, „také“) s testem a kontrolou proti kronikám.
4. Přestavba stránky, karty světa a filtru atlasu. Doplnění Teoretického zázemí a kapitoly Jak světy vyprávějí v Anatomii herního lore.
5. Dohledání „Odkud to známe“ pro všechny způsoby.
