---
title: Spam Blocker
description: Hostovaná detekce spamu pro komunity Bitsocial s hodnocením rizika, kontrolami pomocí CAPTCHA a přihlášení a zásadami pro připojení.
sidebar_position: 1
---

# Spam Blocker

Spam Blocker hodnotí riziko spamu u příspěvků, odpovědí a hlasů dřív, než je komunita přijme. Komunita si nainstaluje balíček výzvy, který každou publikaci odešle službě Spam Blocker. Bitsocial jednu takovou službu provozuje na `spamblocker.bitsocial.net`.

- **`@bitsocial/spam-blocker-challenge`** je open-source balíček výzvy, který komunity instalují. Jeho integrační kontrakt, sdílená schémata a API jsou veřejné.
- **Hostovaná služba** hodnotí publikace a poskytuje stránky s CAPTCHA a přihlášením. Její podrobné váhy a heuristiky jsou neveřejné, jak vysvětlují [zásady pro zdrojový kód](https://github.com/bitsocialnet/spam-blocker/blob/master/docs/architecture/hosted-service-source-policy.md).

**Zdrojový kód:** [github.com/bitsocialnet/spam-blocker](https://github.com/bitsocialnet/spam-blocker)

## Jak se publikace kontroluje

1. Výzva komunity odešle podepsanou publikaci službě, která vrátí skóre rizika mezi 0 a 1.
2. Pod prahem automatického přijetí komunity publikace projde. Na prahu automatického odmítnutí nebo nad ním neprojde a autor uvidí proč.
3. Mezi těmito prahy se znovu použije zapamatované přihlášení autora, pokud stačí. Jinak autor dostane ověřovací stránku: CAPTCHA, pokud k průchodu může stačit samotná CAPTCHA, jinak přihlášení. Přes VPN, proxy nebo připojení z datacentra, které komunita omezuje, potřebuje autor přihlášení při jakémkoli skóre pod prahem automatického odmítnutí, pokud neplatí některá výjimka uvedená v části Zásady pro připojení.
4. Komunita pak výsledek ověří u služby a uplatní vlastní pravidla pro zemi, riziko IP a typ připojení.

Před nahráním přiloženého souboru může klient spustit stejnou kontrolu jako předběžnou kontrolu, čímž většině autorů, kteří by byli odmítnuti, ušetří nahrávání. Při zveřejnění se publikace kontroluje znovu, takže může neprojít, i když předběžná kontrola prošla.

## Skóre rizika

| Signál           | Popis                                                                                                                  |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Stáří účtu       | Novější účty dostávají vyšší skóre rizika.                                                                             |
| Karma            | Nahromaděná komunitní karma snižuje riziko.                                                                            |
| Pověst autora    | Data z indexátoru na pozadí, který sleduje, kteří autoři jsou napříč komunitami přijímáni, odstraňováni nebo banováni. |
| Obsah a odkazy   | Analýza textu a odkazů, včetně opakovaného obsahu.                                                                     |
| Rychlost         | Rychle po sobě jdoucí příspěvky od stejného autora zvyšují riziko.                                                     |
| IP inteligence   | Typ připojení (Tor, VPN, proxy, datacentrum) a riziko IP. Nezpracované IP adresy nejsou nikdy sdíleny s komunitami.    |
| Propojené účty   | Mnoho účtů přispívajících z jedné sítě postupně zvyšuje riziko.                                                        |
| Sociální ověření | Dřívější přihlášení u účtu autora snižují riziko.                                                                      |

## Ověření

Každý dokončený krok vynásobí skóre rizika a publikace projde, když je výsledek nižší než 0.4.

| Krok                                             | Násobitel   |
| ------------------------------------------------ | ----------- |
| CAPTCHA (Cloudflare Turnstile)                   | × 0.7       |
| Přihlášení přes Google, Apple nebo Telegram      | × 0.6       |
| Přihlášení přes druhého, odlišného poskytovatele | další × 0.5 |

Pokud CAPTCHA nestačí, následuje přihlášení. Pokud nestačí přihlášení, následuje CAPTCHA, pokud tím kontrola skončí, a jinak přihlášení přes druhého poskytovatele.

### Zapamatovaná přihlášení

Služba si pamatuje účet, se kterým se autor naposledy přihlásil. Pozdější příspěvek, který vyžaduje ověření, jej znovu použije, jako by se autor přihlásil znovu, pokud jej některý z autorových příspěvků použil v posledních 30 dnech. Každé opětovné použití se počítá jako takový příspěvek, takže lhůta 30 dní s každým z nich začíná znovu. Pokud to stačí, příspěvek projde bez CAPTCHA. Platnost končí, když komunita uloží ban spojený s tímto účtem, a také když je jeho poskytovatel ze služby odebrán.

## Zásady pro připojení

Komunity mohou omezit publikace z připojení přes Tor, VPN (včetně iCloud Private Relay), proxy a datacentra. V hostované službě platí:

- **Připojení přes VPN, proxy a datacentra** mohou přispívat po přihlášení. Stránka vysvětluje, proč je přihlášení potřeba a jak lze přispívat bez něj vypnutím VPN. Ban v komunitě se pak vztahuje i na účet použitý k přihlášení.
- **Zavedené účty** mají výjimku z omezení pro VPN, proxy a datacentra, ale ne z omezení pro Tor. Účet se stane zavedeným, když ve 3 různých dnech projde CAPTCHA nebo přihlášením z neomezených připojení; příspěvky, které prošly bez CAPTCHA i bez přihlášení, se nezapočítávají. Síť se započítává jen jednomu účtu: jakmile z ní projde kontrolou jiný účet, nezapočítává se ani jednomu z nich. V komunitě, která uložila ban účtu v některé z těchto sítí, se z této historie nezapočítává nic.
- **Tor** zůstává omezený, s výjimkou autorů, pro které komunita nastavila výjimku: roli moderátora, seznam povolených autorů komunity nebo ověřené jméno `.bso`.

Přiložené soubory nahrávané do Forge Images se řídí stejnými pravidly. Přes VPN, proxy nebo připojení z datacentra vyžaduje nahrání předběžnou kontrolu, která prošla s přihlášením, nebo zavedený účet. Přes Tor vyžaduje ověřenou výjimku.

## Soukromí

- **Provozovatel** ukládá nezpracované IP adresy a obsah publikací kvůli odhalování zneužití a posílá IP adresy ke klasifikaci externímu poskytovateli (ve výchozím nastavení proxycheck.io).
- **Komunity** dostávají pouze kód země, riziko IP, odhad typu připojení a výsledek (prošlo, nebo neprošlo). Nikdy nedostanou nezpracovanou IP adresu ani účet použitý k přihlášení.
- **Přihlášení** nevyžadují žádné profilové údaje. Služba od Google, Apple nebo Telegram dostane pouze ID účtu, nikdy jméno, e-mail ani fotografii. ID uchovává spolu s příspěvkem bez automatického mazání, aby se ban vztahoval i na účet.
- **Autoři používající VPN** při přihlášení skryjí svou skutečnou IP adresu: služba vidí pouze adresu VPN.

## Omezení četnosti

Před hodnocením služba odmítá autory, kteří překročí svůj hodinový nebo denní limit příspěvků, odpovědí a hlasů. Limity rostou se stářím účtu a dobrou pověstí a snižují se po banech nebo odstraněních.

## API

Hlavní cesty, relativní k `spamblocker.bitsocial.net/api/v1`:

| Cesta                    | Volající                  | Účel                                          |
| ------------------------ | ------------------------- | --------------------------------------------- |
| `POST /evaluate`         | Iframe výzvy, komunita    | Ohodnotit publikaci a vytvořit její relaci    |
| `POST /challenge/verify` | Komunita                  | Načíst výsledek relace a IP inteligenci       |
| `POST /precheck`         | Iframe předběžné kontroly | Ohodnotit koncept před nahráním               |
| `GET /iframe/:sessionId` | Prohlížeč autora          | Ověřovací stránka                             |
| `POST /upload/authorize` | Klient autora             | Autorizovat přiložený soubor pro Forge Images |

Úplný kontrakt včetně podepisování požadavků a schémat odpovědí najdete v [README spam-blocker](https://github.com/bitsocialnet/spam-blocker#api-contract).
