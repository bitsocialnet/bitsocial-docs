---
title: Spam Blocker
description: Hostet spamdeteksjon for Bitsocial-fellesskap, med risikoscoring, CAPTCHA- og innloggingskontroller og tilkoblingsregler.
sidebar_position: 1
---

# Spam Blocker

Spam Blocker gir innlegg, svar og stemmer en risikoscore for spam før et fellesskap godtar dem. Et fellesskap installerer utfordringspakken, som sender hver publikasjon til en spamblokkeringstjeneste. Bitsocial driver én på `spamblocker.bitsocial.net`.

- **`@bitsocial/spam-blocker-challenge`** er utfordringspakken med åpen kildekode som fellesskap installerer. Integrasjonskontrakten, de delte skjemaene og API-et er offentlige.
- **Den hostede tjenesten** scorer publikasjoner og leverer CAPTCHA- og innloggingssidene. De detaljerte vektene og heuristikkene er private, slik [kildepolicyen](https://github.com/bitsocialnet/spam-blocker/blob/master/docs/architecture/hosted-service-source-policy.md) forklarer.

**Kildekode:** [github.com/bitsocialnet/spam-blocker](https://github.com/bitsocialnet/spam-blocker)

## Hvordan en publikasjon kontrolleres

1. Fellesskapets utfordring sender den signerte publikasjonen til tjenesten, som returnerer en risikoscore mellom 0 og 1.
2. Under fellesskapets terskel for automatisk godkjenning slipper publikasjonen gjennom. På eller over terskelen for automatisk avvisning blir den avvist, og forfatteren ser hvorfor.
3. Mellom de to tersklene gjenbrukes forfatterens huskede innlogging når den er nok. Ellers får forfatteren en verifiseringsside: en CAPTCHA når en CAPTCHA alene kan være nok, ellers en innlogging. Via en VPN-, proxy- eller datasentertilkobling som fellesskapet begrenser, trenger forfatteren en innlogging ved enhver score under terskelen for automatisk avvisning, med mindre et unntak under Tilkoblingsregler gjelder.
4. Fellesskapet kontrollerer deretter resultatet hos tjenesten og bruker sine egne regler for land, IP-risiko og tilkoblingstype.

Før en vedlagt fil lastes opp, kan en klient kjøre den samme kontrollen som en forhåndskontroll, slik at de fleste forfattere som ville blitt avvist, slipper å laste opp. Publikasjonen kontrolleres på nytt når den publiseres, så den kan fortsatt bli avvist etter at en forhåndskontroll er bestått.

## Risikoscore

| Signal              | Beskrivelse                                                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Kontoalder          | Nyere kontoer får høyere risikoscore.                                                                                                 |
| Karma               | Akkumulert fellesskapskarma reduserer risikoen.                                                                                       |
| Forfatteromdømme    | Data fra en bakgrunnsindekserer som følger med på hvilke forfattere som blir godtatt, fjernet eller utestengt på tvers av fellesskap. |
| Innhold og lenker   | Tekst- og lenkeanalyse, inkludert gjentatt innhold.                                                                                   |
| Hastighet           | Raske påfølgende innlegg fra samme forfatter øker risikoen.                                                                           |
| IP-intelligens      | Tilkoblingstype (Tor, VPN, proxy, datasenter) og IP-risiko. Rå IP-adresser deles aldri med fellesskap.                                |
| Koblede kontoer     | Mange kontoer som publiserer fra ett nettverk, øker risikoen gradvis.                                                                 |
| Sosial verifisering | Tidligere innlogginger på forfatterens konto senker risikoen.                                                                         |

## Verifisering

Hvert fullførte trinn multipliserer risikoscoren, og publikasjonen godkjennes når resultatet er under 0.4.

| Trinn                                        | Multiplikator     |
| -------------------------------------------- | ----------------- |
| CAPTCHA (Cloudflare Turnstile)               | × 0.7             |
| Innlogging med Google, Apple eller Telegram  | × 0.6             |
| Innlogging med en annen leverandør i tillegg | ytterligere × 0.5 |

En CAPTCHA som ikke er nok, etterfølges av en innlogging. En innlogging som ikke er nok, etterfølges av en CAPTCHA når det fullfører kontrollen, og ellers av en innlogging hos en leverandør til.

### Huskede innlogginger

Tjenesten husker kontoen en forfatter sist logget inn med. Et senere innlegg som krever verifisering, gjenbruker den som om forfatteren hadde logget inn på nytt, når et av forfatterens innlegg har brukt den i løpet av de siste 30 dagene. Når kontoen gjenbrukes, teller det som et slikt innlegg, så de 30 dagene starter på nytt hver gang. Når det er nok, godkjennes innlegget uten CAPTCHA. En utestengelse i fellesskapet som er knyttet til kontoen, avslutter dette, og det samme gjør det å fjerne kontoens leverandør fra tjenesten.

## Tilkoblingsregler

Fellesskap kan begrense publikasjoner som kommer via Tor, VPN (inkludert iCloud Private Relay), proxyer og datasentre. På den hostede tjenesten gjelder følgende:

- **VPN-, proxy- og datasentertilkoblinger** kan publisere etter en innlogging. Siden forklarer hvorfor innloggingen trengs, og hvordan man kan publisere uten å logge inn ved å slå av VPN-en. En utestengelse i fellesskapet gjelder da også kontoen som ble brukt til å logge inn.
- **Etablerte kontoer** er unntatt fra begrensningene for VPN, proxy og datasentre, men ikke fra begrensningen for Tor. En konto blir etablert etter at den har bestått en CAPTCHA eller innlogging på 3 ulike dager fra ubegrensede tilkoblinger; innlegg som slapp gjennom uten noen av delene, teller ikke. Et nettverk teller bare for én konto: så snart en annen konto består en kontroll fra det, teller det for ingen av dem. I et fellesskap som har utestengt en konto på et av disse nettverkene, teller ingenting av historikken.
- **Tor** forblir begrenset, bortsett fra for forfattere med et unntak som fellesskapet har konfigurert: en moderatorrolle, fellesskapets hviteliste eller et verifisert `.bso`-navn.

Vedlagte filer som lastes opp til Forge Images, følger de samme reglene. Via en VPN-, proxy- eller datasentertilkobling krever opplastingen en forhåndskontroll som ble bestått med en innlogging, eller en etablert konto. Via Tor krever den et verifisert unntak.

## Personvern

- **Operatøren** lagrer rå IP-adresser og publikasjonsinnhold for å oppdage misbruk, og sender IP-adresser til en ekstern leverandør for klassifisering (proxycheck.io som standard).
- **Fellesskap** mottar bare landskoden, IP-risikoen, anslaget over tilkoblingstypen og resultatet (bestått eller ikke bestått). De mottar aldri den rå IP-adressen eller innloggingskontoen.
- **Innlogginger** ber ikke om profildata. Tjenesten mottar bare en konto-ID fra Google, Apple eller Telegram, aldri navn, e-post eller bilde. Den lagrer ID-en sammen med innlegget, uten automatisk sletting, slik at en utestengelse også gjelder kontoen.
- **Forfattere på VPN** holder den ekte IP-adressen sin skjult når de logger inn: tjenesten ser bare VPN-ens adresse.

## Hastighetsbegrensning

Før scoring avviser tjenesten forfattere som overskrider time- eller døgnbudsjettet sitt for innlegg, svar og stemmer. Budsjettene vokser med kontoalder og godt omdømme, og krymper etter utestengelser eller fjerninger.

## API

De viktigste rutene, relativt til `spamblocker.bitsocial.net/api/v1`:

| Rute                     | Kaller                         | Formål                                               |
| ------------------------ | ------------------------------ | ---------------------------------------------------- |
| `POST /evaluate`         | Utfordrings-iframe, fellesskap | Gi en publikasjon en score og opprette økten for den |
| `POST /challenge/verify` | Fellesskap                     | Lese utfallet av økten og IP-intelligensen           |
| `POST /precheck`         | Forhåndskontroll-iframe        | Gi et utkast en score før opplasting                 |
| `GET /iframe/:sessionId` | Forfatterens nettleser         | Verifiseringsside                                    |
| `POST /upload/authorize` | Forfatterens klient            | Autorisere en vedlagt fil for Forge Images           |

Hele kontrakten, inkludert signering av forespørsler og svarskjemaer, finnes i [README-en for spam-blocker](https://github.com/bitsocialnet/spam-blocker#api-contract).
