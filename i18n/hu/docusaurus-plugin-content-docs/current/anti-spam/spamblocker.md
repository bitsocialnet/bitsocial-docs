---
title: SpamBlocker
description: Hosztolt spamészlelés Bitsocial közösségek számára kockázati pontozással, CAPTCHA- és bejelentkezéses ellenőrzéssel, valamint kapcsolati szabályokkal.
sidebar_position: 1
---

# SpamBlocker

A SpamBlocker pontozza a bejegyzések, válaszok és szavazatok spamkockázatát, mielőtt egy közösség elfogadná őket. A közösség telepíti a kihíváscsomagot, amely minden közzétételt elküld egy SpamBlocker szolgáltatásnak. A Bitsocial egy ilyen szolgáltatást üzemeltet a `spamblocker.bitsocial.net` címen.

- **`@bitsocial/spam-blocker-challenge`** az a nyílt forráskódú kihíváscsomag, amelyet a közösségek telepítenek. Integrációs szerződése, közös sémái és API-ja nyilvánosak.
- **A hosztolt szolgáltatás** pontozza a közzétételeket, és kiszolgálja a CAPTCHA- és bejelentkezési oldalakat. Részletes súlyai és heurisztikái nem nyilvánosak, ahogy azt a [forráskód-szabályzat](https://github.com/bitsocialnet/spamblocker/blob/master/docs/architecture/hosted-service-source-policy.md) elmagyarázza.

**Forráskód:** [github.com/bitsocialnet/spamblocker](https://github.com/bitsocialnet/spamblocker)

## Hogyan történik egy közzététel ellenőrzése

1. A közösség kihívása elküldi az aláírt közzétételt a szolgáltatásnak, amely 0 és 1 közötti kockázati pontszámot ad vissza.
2. A közösség automatikus elfogadási küszöbe alatt a közzététel átmegy. Az automatikus elutasítási küszöbén vagy afölött elbukik, és a szerző látja, miért.
3. A kettő között a rendszer újra felhasználja a szerző megjegyzett bejelentkezését, ha az elegendő. Ellenkező esetben a szerző ellenőrző oldalt kap: CAPTCHA-t, ha egy CAPTCHA önmagában elég lehet az átjutáshoz, különben bejelentkezést. Ha a szerző olyan VPN-, proxy- vagy adatközponti kapcsolatot használ, amelyet a közösség korlátoz, az automatikus elutasítási küszöb alatti bármely pontszámnál bejelentkezésre van szüksége, kivéve, ha a Kapcsolati szabályok részben leírt mentességek valamelyike vonatkozik rá.
4. Ezután a közösség ellenőrzi az eredményt a szolgáltatásnál, és alkalmazza a saját szabályait az országra, az IP-kockázatra és a kapcsolattípusra.

Csatolt fájl feltöltése előtt a kliens ugyanezt az ellenőrzést előzetes ellenőrzésként is lefuttathatja, ami a legtöbb szerzőt, akit elutasítanának, megkíméli a feltöltéstől. A rendszer a közzétételt közzétételkor újra ellenőrzi, ezért az akkor is elbukhat, ha az előzetes ellenőrzésen átment.

## Kockázati pontszám

| Jel                         | Leírás                                                                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Fiók kora                   | Az újabb fiókok magasabb kockázati pontszámot kapnak.                                                                                       |
| Karma                       | A felhalmozott közösségi karma csökkenti a kockázatot.                                                                                      |
| A szerző hírneve            | Egy háttérben futó indexelő adatai, amely követi, hogy mely szerzőket fogadják el, távolítják el vagy tiltják ki a különböző közösségekben. |
| Tartalom és linkek          | Szöveg- és linkelemzés, beleértve az ismétlődő tartalmat.                                                                                   |
| Sebesség                    | Az ugyanattól a szerzőtől származó gyors, egymást követő bejegyzések növelik a kockázatot.                                                  |
| IP-információk              | Kapcsolattípus (Tor, VPN, proxy, adatközpont) és IP-kockázat. A nyers IP-címeket soha nem osztjuk meg a közösségekkel.                      |
| Összekapcsolt fiókok        | Ha sok fiók ugyanarról a hálózatról posztol, a kockázat fokozatosan nő.                                                                     |
| Közösségi fiókos ellenőrzés | A szerző fiókjával korábban végzett bejelentkezések csökkentik a kockázatot.                                                                |

## Ellenőrzés

Minden elvégzett lépés megszorozza a kockázati pontszámot, és a közzététel akkor megy át, ha az eredmény 0.4 alatt van.

| Lépés                                             | Szorzó        |
| ------------------------------------------------- | ------------- |
| CAPTCHA (Cloudflare Turnstile)                    | × 0.7         |
| Bejelentkezés Google, Apple vagy Telegram fiókkal | × 0.6         |
| Bejelentkezés egy második, eltérő szolgáltatóval  | további × 0.5 |

Ha egy CAPTCHA nem elég, bejelentkezés következik. Ha egy bejelentkezés nem elég, CAPTCHA következik, amennyiben az lezárja az ellenőrzést, ellenkező esetben bejelentkezés egy második szolgáltatóval.

### Megjegyzett bejelentkezések

A szolgáltatás megjegyzi, melyik fiókkal jelentkezett be a szerző legutóbb. Egy későbbi, ellenőrzést igénylő bejegyzés újra felhasználja azt, mintha a szerző ismét bejelentkezett volna, ha az elmúlt 30 napban a szerző valamelyik bejegyzése használta. Az újrafelhasználás is ilyen bejegyzésnek számít, így a 30 nap minden újrafelhasználással újraindul. Ha ez elég, a bejegyzés CAPTCHA nélkül átmegy. Ennek véget vet a közösségben kiszabott, a fiókhoz kötött kitiltás, és az is, ha a fiók szolgáltatóját eltávolítják a szolgáltatásból.

## Kapcsolati szabályok

A közösségek korlátozhatják a Tor-, VPN- (beleértve az iCloud Private Relay szolgáltatást), proxy- és adatközponti kapcsolatokról érkező közzétételeket. A hosztolt szolgáltatáson:

- **VPN-, proxy- és adatközponti kapcsolatokról** bejelentkezés után lehet posztolni. Az oldal elmagyarázza, miért szükséges a bejelentkezés, és hogyan lehet nélküle posztolni a VPN kikapcsolásával. Ezután a közösségi kitiltás a bejelentkezéshez használt fiókra is vonatkozik.
- **A bejáratott fiókok** mentesülnek a VPN-, proxy- és adatközponti korlátozások alól, a Tor-korlátozás alól azonban nem. Egy fiók akkor válik bejáratottá, ha 3 különböző napon teljesít egy CAPTCHA-t vagy bejelentkezést korlátozás alá nem eső kapcsolatokról; a CAPTCHA vagy bejelentkezés nélkül átjutott bejegyzések nem számítanak. Egy hálózat csak egy fióknál számít: amint egy másik fiók is átmegy róla egy ellenőrzésen, egyiknél sem számít. Abban a közösségben, amely kitiltott egy fiókot az egyik ilyen hálózaton, ebből az előzményből semmi sem számít.
- **A Tor** korlátozott marad, kivéve azokat a szerzőket, akiknek a közösség által beállított mentességük van: moderátori szerepkör, a közösség engedélyezőlistája vagy ellenőrzött `.bso` név.

A Forge Images szolgáltatásba feltöltött csatolt fájlokra ugyanezek a szabályok vonatkoznak. VPN-, proxy- vagy adatközponti kapcsolaton keresztül a feltöltéshez bejelentkezéssel teljesített előzetes ellenőrzés vagy bejáratott fiók szükséges. Tor hálózaton keresztül ellenőrzött mentesség kell hozzá.

## Adatvédelem

- **Az üzemeltető** a visszaélések felderítéséhez tárolja a nyers IP-címeket és a közzétételek tartalmát, az IP-címeket pedig besorolásra elküldi egy külső szolgáltatónak (alapértelmezés szerint a proxycheck.io-nak).
- **A közösségek** csak az országkódot, az IP-kockázatot, a kapcsolattípus becslését és a megfelelt/nem felelt meg eredményt kapják meg. A nyers IP-címet és a bejelentkezéshez használt fiókot soha nem kapják meg.
- **A bejelentkezések** nem kérnek profiladatokat. A szolgáltatás csak egy fiókazonosítót kap a Google, az Apple vagy a Telegram szolgáltatástól, soha nem nevet, e-mail-címet vagy fényképet. Az azonosítót a bejegyzéssel együtt tárolja, automatikus törlés nélkül, így a kitiltás a fiókra is vonatkozik.
- **A VPN-t használó szerzők** valódi IP-címe bejelentkezéskor is rejtve marad: a szolgáltatás csak a VPN címét látja.

## Sebességkorlátozás

A pontozás előtt a szolgáltatás elutasítja azokat a szerzőket, akik túllépik a bejegyzésekre, válaszokra és szavazatokra vonatkozó óránkénti vagy napi keretüket. A keretek a fiók korával és a jó hírnévvel nőnek, kitiltások vagy eltávolítások után pedig csökkennek.

## API

A fő útvonalak, a `spamblocker.bitsocial.net/api/v1` címhez viszonyítva:

| Útvonal                  | Hívó                             | Cél                                                          |
| ------------------------ | -------------------------------- | ------------------------------------------------------------ |
| `POST /evaluate`         | A kihívás iframe-je, közösség    | Közzététel pontozása és a munkamenet létrehozása             |
| `POST /challenge/verify` | Közösség                         | A munkamenet eredményének és az IP-információknak a lekérése |
| `POST /precheck`         | Az előzetes ellenőrzés iframe-je | Piszkozat pontozása feltöltés előtt                          |
| `GET /iframe/:sessionId` | A szerző böngészője              | Ellenőrző oldal                                              |
| `POST /upload/authorize` | A szerző kliense                 | Csatolt fájl engedélyezése a Forge Images számára            |

A teljes szerződés, beleértve a kérések aláírását és a válaszsémákat, a [spamblocker README-ben](https://github.com/bitsocialnet/spamblocker#api-contract) található.
