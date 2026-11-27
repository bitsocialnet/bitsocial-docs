---
title: SpamBlocker
description: Hostad spamdetektering för Bitsocial-communities, med riskpoäng, CAPTCHA- och inloggningskontroller samt anslutningspolicyer.
sidebar_position: 1
---

# SpamBlocker

SpamBlocker bedömer spamrisken i inlägg, svar och röster innan en community godkänner dem. En community installerar utmaningspaketet, som skickar varje publikation till en SpamBlocker-tjänst. Bitsocial driver en sådan tjänst på `spamblocker.bitsocial.net`.

- **`@bitsocial/spam-blocker-challenge`** är utmaningspaketet med öppen källkod som communities installerar. Dess integrationskontrakt, delade scheman och API är offentliga.
- **Den hostade tjänsten** sätter riskpoäng på publikationer och tillhandahåller sidorna för CAPTCHA och inloggning. Dess detaljerade vikter och heuristik är privata, vilket [källkodspolicyn](https://github.com/bitsocialnet/spamblocker/blob/master/docs/architecture/hosted-service-source-policy.md) förklarar.

**Källkod:** [github.com/bitsocialnet/spamblocker](https://github.com/bitsocialnet/spamblocker)

## Så kontrolleras en publikation

1. Communityns utmaning skickar den signerade publikationen till tjänsten, som returnerar en riskpoäng mellan 0 och 1.
2. Under communityns tröskel för automatiskt godkännande går publikationen igenom. På eller över tröskeln för automatiskt avslag avvisas den, och författaren får se varför.
3. Däremellan återanvänds författarens ihågkomna inloggning om den räcker. Annars får författaren en verifieringssida: en CAPTCHA när enbart en CAPTCHA kan räcka, annars en inloggning. Via en VPN-, proxy- eller datacenteranslutning som communityn begränsar behöver författaren en inloggning vid varje poäng under tröskeln för automatiskt avslag, om inte ett undantag under Anslutningspolicyer gäller.
4. Communityn kontrollerar sedan resultatet med tjänsten och tillämpar sina egna regler för land, IP-risk och anslutningstyp.

Innan en bifogad fil laddas upp kan en klient köra samma kontroll som en förkontroll, vilket besparar de flesta författare som skulle avvisas en uppladdning. Publikationen kontrolleras igen när den publiceras, så den kan fortfarande avvisas trots att en förkontroll klarades.

## Riskpoäng

| Signal              | Beskrivning                                                                                                                      |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Kontoålder          | Nyare konton får högre riskpoäng.                                                                                                |
| Karma               | Upparbetad karma i communityn sänker risken.                                                                                     |
| Författarens rykte  | Data från en bakgrundsindexerare som håller reda på vilka författare som godkänns, tas bort eller stängs av i olika communities. |
| Innehåll och länkar | Analys av text och länkar, inklusive upprepat innehåll.                                                                          |
| Publiceringstakt    | Många inlägg i snabb följd från samma författare ökar risken.                                                                    |
| IP-analys           | Anslutningstyp (Tor, VPN, proxy, datacenter) och IP-risk. Råa IP-adresser delas aldrig med communities.                          |
| Länkade konton      | Många konton som publicerar från samma nätverk höjer risken successivt.                                                          |
| Social verifiering  | Tidigare inloggningar kopplade till författarens konto sänker risken.                                                            |

## Verifiering

Varje genomfört steg multiplicerar riskpoängen med en faktor, och publikationen godkänns när resultatet är under 0.4.

| Steg                                        | Multiplikator     |
| ------------------------------------------- | ----------------- |
| CAPTCHA (Cloudflare Turnstile)              | × 0.7             |
| Inloggning med Google, Apple eller Telegram | × 0.6             |
| Inloggning med en andra, annan leverantör   | ytterligare × 0.5 |

Om en CAPTCHA inte räcker följer en inloggning. Om en inloggning inte räcker följer en CAPTCHA när den slutför kontrollen, och annars en inloggning med en andra leverantör.

### Ihågkomna inloggningar

Tjänsten kommer ihåg vilket konto en författare senast loggade in med. Ett senare inlägg som behöver verifieras återanvänder det, som om författaren hade loggat in igen, om något av författarens inlägg har använt det under de senaste 30 dagarna. En återanvändning räknas som ett sådant inlägg, så de 30 dagarna börjar om vid varje återanvändning. När det räcker godkänns inlägget utan CAPTCHA. En avstängning i communityn som är kopplad till kontot avslutar detta, och det gör även att kontots leverantör tas bort från tjänsten.

## Anslutningspolicyer

Communities kan begränsa publikationer som kommer via Tor, VPN (inklusive iCloud Private Relay), proxy eller datacenter. På den hostade tjänsten gäller följande:

- **VPN-, proxy- och datacenteranslutningar** kan publicera efter en inloggning. Sidan förklarar varför inloggningen behövs och hur man kan publicera utan den genom att stänga av sitt VPN. En avstängning i communityn gäller då även kontot som användes för inloggningen.
- **Etablerade konton** är undantagna från begränsningarna för VPN, proxy och datacenter, men inte från Tor-begränsningen. Ett konto blir etablerat när det har klarat en CAPTCHA eller inloggning på 3 olika dagar från obegränsade anslutningar; inlägg som godkändes utan någon av dem räknas inte. Ett nätverk räknas bara för ett konto: när ett annat konto klarar en kontroll från det räknas det för inget av dem. I en community som har stängt av ett konto på något av dessa nätverk räknas ingen del av historiken.
- **Tor** förblir begränsat, utom för författare med ett undantag som communityn har konfigurerat: en moderatorsroll, communityns vitlista eller ett verifierat `.bso`-namn.

Bifogade filer som laddas upp till Forge Images följer samma regler. Via en VPN-, proxy- eller datacenteranslutning kräver uppladdningen en förkontroll som klarades med en inloggning, eller ett etablerat konto. Via Tor krävs ett verifierat undantag.

## Integritet

- **Operatören** lagrar råa IP-adresser och publikationers innehåll för att upptäcka missbruk, och skickar IP-adresser till en extern leverantör för klassificering (som standard proxycheck.io).
- **Communities** får bara landskoden, IP-risken, uppskattningen av anslutningstypen och resultatet godkänd eller underkänd. De får aldrig den råa IP-adressen eller inloggningskontot.
- **Inloggningar** begär inga profiluppgifter. Tjänsten får bara ett konto-ID från Google, Apple eller Telegram, aldrig namn, e-postadress eller foto. Den sparar ID:t tillsammans med inlägget, utan automatisk radering, så att en avstängning även gäller kontot.
- **Författare som använder VPN** håller sin riktiga IP-adress dold när de loggar in: tjänsten ser bara VPN:ets adress.

## Hastighetsbegränsning

Innan poängsättningen avvisar tjänsten författare som överskrider sin kvot per timme eller per dag för inlägg, svar och röster. Kvoterna växer med kontots ålder och gott rykte, och krymper efter avstängningar eller borttagningar.

## API

De viktigaste rutterna, relativt till `spamblocker.bitsocial.net/api/v1`:

| Rutt                     | Anropare                    | Syfte                                                   |
| ------------------------ | --------------------------- | ------------------------------------------------------- |
| `POST /evaluate`         | Utmanings-iframe, community | Sätt riskpoäng på en publikation och skapa dess session |
| `POST /challenge/verify` | Community                   | Läs sessionens utfall och IP-analys                     |
| `POST /precheck`         | Förkontroll-iframe          | Sätt riskpoäng på ett utkast före uppladdning           |
| `GET /iframe/:sessionId` | Författarens webbläsare     | Verifieringssida                                        |
| `POST /upload/authorize` | Författarens klient         | Auktorisera en bifogad fil för Forge Images             |

Hela kontraktet, inklusive signering av förfrågningar och svarsscheman, finns i [README-filen för spamblocker](https://github.com/bitsocialnet/spamblocker#api-contract).
