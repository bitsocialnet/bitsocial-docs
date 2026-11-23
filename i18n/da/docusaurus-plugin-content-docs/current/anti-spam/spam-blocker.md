---
title: Spam Blocker
description: Hostet spamdetektion til Bitsocial-fællesskaber med risikoscoring, CAPTCHA- og login-tjek samt forbindelsespolitikker.
sidebar_position: 1
---

# Spam Blocker

Spam Blocker vurderer spamrisikoen for opslag, svar og stemmer, før et fællesskab accepterer dem. Et fællesskab installerer udfordringspakken, som sender hver publikation til en Spam Blocker-tjeneste. Bitsocial driver en sådan tjeneste på `spamblocker.bitsocial.net`.

- **`@bitsocial/spam-blocker-challenge`** er den open source-udfordringspakke, som fællesskaber installerer. Dens integrationskontrakt, fælles skemaer og API er offentlige.
- **Den hostede tjeneste** scorer publikationer og leverer CAPTCHA- og login-siderne. Dens detaljerede vægte og heuristikker er private, som [kildekodepolitikken](https://github.com/bitsocialnet/spam-blocker/blob/master/docs/architecture/hosted-service-source-policy.md) forklarer.

**Kildekode:** [github.com/bitsocialnet/spam-blocker](https://github.com/bitsocialnet/spam-blocker)

## Sådan tjekkes en publikation

1. Fællesskabets udfordring sender den signerede publikation til tjenesten, som returnerer en risikoscore mellem 0 og 1.
2. Under fællesskabets tærskel for automatisk accept går publikationen igennem. På eller over dets tærskel for automatisk afvisning bliver den afvist, og forfatteren kan se hvorfor.
3. Imellem de to genbruges forfatterens huskede login, når det er nok. Ellers får forfatteren en verifikationsside: en CAPTCHA, når en CAPTCHA alene kan være nok til at bestå, eller ellers et login. Via en VPN-, proxy- eller datacenterforbindelse, som fællesskabet begrænser, skal forfatteren logge ind ved enhver score under tærsklen for automatisk afvisning, medmindre en undtagelse under Forbindelsespolitikker gælder.
4. Derefter tjekker fællesskabet resultatet hos tjenesten og anvender sine egne regler for land, IP-risiko og forbindelsestype.

Før en vedhæftet fil uploades, kan en klient køre det samme tjek som et forhåndstjek, hvilket sparer de fleste forfattere, der ville blive afvist, for en upload. Publikationen tjekkes igen, når den publiceres, så den kan stadig blive afvist, selvom et forhåndstjek er bestået.

## Risikoscore

| Signal               | Beskrivelse                                                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Kontoens alder       | Nyere konti får højere risikoscore.                                                                                                        |
| Karma                | Akkumuleret fællesskabskarma reducerer risikoen.                                                                                           |
| Forfatterens omdømme | Data fra en baggrundsindekser, der registrerer, hvilke forfattere der bliver accepteret, fjernet eller udelukket på tværs af fællesskaber. |
| Indhold og links     | Tekst- og linkanalyse, herunder gentaget indhold.                                                                                          |
| Hastighed            | Hurtige på hinanden følgende opslag fra samme forfatter øger risikoen.                                                                     |
| IP-intelligens       | Forbindelsestype (Tor, VPN, proxy, datacenter) og IP-risiko. Rå IP-adresser deles aldrig med fællesskaber.                                 |
| Forbundne konti      | Mange konti, der poster fra det samme netværk, øger risikoen gradvist.                                                                     |
| Social verifikation  | Tidligere logins på forfatterens konto sænker risikoen.                                                                                    |

## Verifikation

Hvert gennemført trin ganger risikoscoren, og publikationen går igennem, når resultatet er under 0.4.

| Trin                                      | Multiplikator    |
| ----------------------------------------- | ---------------- |
| CAPTCHA (Cloudflare Turnstile)            | × 0.7            |
| Login med Google, Apple eller Telegram    | × 0.6            |
| Login med en anden udbyder end den første | yderligere × 0.5 |

En CAPTCHA, der ikke er nok, efterfølges af et login. Et login, der ikke er nok, efterfølges af en CAPTCHA, når den afslutter tjekket, og ellers af et login hos en anden udbyder.

### Huskede logins

Tjenesten husker den konto, en forfatter senest loggede ind med. Et senere opslag, der kræver verifikation, genbruger den, som om forfatteren havde logget ind igen, når et af forfatterens opslag har brugt den inden for de seneste 30 dage. Et genbrug tæller som et sådant opslag, så de 30 dage starter forfra med hvert af dem. Når det er nok, går opslaget igennem uden CAPTCHA. Det ophører, hvis fællesskabet udsteder en udelukkelse, der er knyttet til kontoen, og ligeledes hvis kontoens udbyder fjernes fra tjenesten.

## Forbindelsespolitikker

Fællesskaber kan begrænse publikationer fra Tor-, VPN- (inklusive iCloud Private Relay), proxy- og datacenterforbindelser. På den hostede tjeneste gælder:

- **VPN-, proxy- og datacenterforbindelser** kan poste efter et login. Siden forklarer, hvorfor login er nødvendigt, og hvordan man kan poste uden ved at slå VPN'en fra. En udelukkelse i fællesskabet gælder derefter også for den konto, der blev brugt til at logge ind.
- **Etablerede konti** er undtaget fra begrænsningerne for VPN, proxy og datacentre, men ikke fra begrænsningen for Tor. En konto bliver etableret, når den har bestået en CAPTCHA eller et login på 3 forskellige dage fra forbindelser uden begrænsninger; opslag, der gik igennem uden nogen af delene, tæller ikke. Et netværk tæller kun for én konto: Når en anden konto består et tjek fra det, tæller det for ingen af dem. I et fællesskab, der har udelukket en konto på et af disse netværk, tæller intet af historikken.
- **Tor** forbliver begrænset, undtagen for forfattere med en undtagelse, som fællesskabet har konfigureret: en moderatorrolle, fællesskabets hvidliste eller et verificeret `.bso`-navn.

Vedhæftede filer, der uploades til Forge Images, følger de samme regler. Via en VPN-, proxy- eller datacenterforbindelse kræver uploadet et forhåndstjek, der er bestået med et login, eller en etableret konto. Via Tor kræver det en verificeret undtagelse.

## Privatliv

- **Operatøren** gemmer rå IP-adresser og publikationsindhold for at opdage misbrug og sender IP-adresser til en ekstern udbyder til klassificering (som standard proxycheck.io).
- **Fællesskaber** modtager kun landekoden, IP-risikoen, estimatet af forbindelsestypen og resultatet (bestået eller ikke bestået). De modtager aldrig den rå IP-adresse eller login-kontoen.
- **Logins** anmoder ikke om profildata. Tjenesten modtager kun et konto-ID fra Google, Apple eller Telegram, aldrig et navn, en e-mail eller et foto. Den gemmer ID'et sammen med opslaget uden automatisk sletning, så en udelukkelse også gælder for kontoen.
- **Forfattere på en VPN** holder deres rigtige IP-adresse skjult, når de logger ind: Tjenesten ser kun VPN'ens adresse.

## Hastighedsbegrænsning

Før scoringen afviser tjenesten forfattere, der overskrider deres time- eller dagsbudget for opslag, svar og stemmer. Budgetterne vokser med kontoens alder og et godt omdømme og skrumper efter udelukkelser eller fjernelser.

## API

De vigtigste ruter, relativt til `spamblocker.bitsocial.net/api/v1`:

| Rute                     | Kalder                         | Formål                                         |
| ------------------------ | ------------------------------ | ---------------------------------------------- |
| `POST /evaluate`         | Udfordrings-iframe, fællesskab | Scorer en publikation og opretter dens session |
| `POST /challenge/verify` | Fællesskab                     | Læser sessionens udfald og IP-intelligens      |
| `POST /precheck`         | Forhåndstjek-iframe            | Scorer et udkast før upload                    |
| `GET /iframe/:sessionId` | Forfatterens browser           | Verifikationsside                              |
| `POST /upload/authorize` | Forfatterens klient            | Godkender en vedhæftet fil til Forge Images    |

Den fulde kontrakt, herunder signering af anmodninger og svarskemaer, findes i [README'en for spam-blocker](https://github.com/bitsocialnet/spam-blocker#api-contract).
