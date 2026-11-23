---
title: Spam Blocker
description: Gehoste spamdetectie voor Bitsocial-communities, met risicoscores, CAPTCHA- en aanmeldcontroles en verbindingsbeleid.
sidebar_position: 1
---

# Spam Blocker

Spam Blocker kent berichten, reacties en stemmen een spamrisicoscore toe voordat een community ze accepteert. Een community installeert het uitdagingspakket, dat elke publicatie naar een spamblokkeringsdienst stuurt. Bitsocial draait er een op `spamblocker.bitsocial.net`.

- **`@bitsocial/spam-blocker-challenge`** is het opensource-uitdagingspakket dat communities installeren. Het integratiecontract, de gedeelde schema's en de API ervan zijn openbaar.
- **De gehoste dienst** beoordeelt publicaties en levert de CAPTCHA- en aanmeldpagina's. De gedetailleerde gewichten en heuristieken ervan zijn privé, zoals het [bronbeleid](https://github.com/bitsocialnet/spam-blocker/blob/master/docs/architecture/hosted-service-source-policy.md) uitlegt.

**Broncode:** [github.com/bitsocialnet/spam-blocker](https://github.com/bitsocialnet/spam-blocker)

## Hoe een publicatie wordt gecontroleerd

1. De uitdaging van de community stuurt de ondertekende publicatie naar de dienst, die een risicoscore tussen 0 en 1 teruggeeft.
2. Onder de drempel voor automatisch accepteren van de community komt de publicatie erdoor. Op of boven de drempel voor automatisch afwijzen wordt ze afgewezen en ziet de auteur waarom.
3. Daartussen wordt de onthouden aanmelding van de auteur hergebruikt als die volstaat. Anders krijgt de auteur een verificatiepagina: een CAPTCHA als een CAPTCHA alleen kan volstaan, en anders een aanmelding. Via een VPN-, proxy- of datacenterverbinding die de community beperkt, heeft de auteur bij elke score onder de drempel voor automatisch afwijzen een aanmelding nodig, tenzij een vrijstelling onder Verbindingsbeleid van toepassing is.
4. Daarna controleert de community het resultaat bij de dienst en past ze haar eigen regels toe voor land, IP-risico en verbindingstype.

Voordat een bijgevoegd bestand wordt geüpload, kan een client dezelfde controle als voorcontrole uitvoeren, waardoor de meeste auteurs die afgewezen zouden worden een upload bespaard blijft. De publicatie wordt opnieuw gecontroleerd wanneer ze wordt gepubliceerd, dus ze kan alsnog worden afgewezen nadat een voorcontrole is geslaagd.

## Risicoscore

| Signaal              | Beschrijving                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Accountleeftijd      | Nieuwere accounts ontvangen hogere risicoscores.                                                                         |
| Karma                | Geaccumuleerd karma van de community vermindert het risico.                                                              |
| Reputatie van auteur | Gegevens van een achtergrondindexer die bijhoudt welke auteurs in communities worden geaccepteerd, verwijderd of geband. |
| Inhoud en links      | Tekst- en linkanalyse, inclusief herhaalde inhoud.                                                                       |
| Snelheid             | Snel opeenvolgende berichten van dezelfde auteur verhogen het risico.                                                    |
| IP-intelligentie     | Verbindingstype (Tor, VPN, proxy, datacenter) en IP-risico. Onbewerkte IP-adressen worden nooit gedeeld met communities. |
| Gekoppelde accounts  | Veel accounts die vanaf één netwerk posten, verhogen het risico stapsgewijs.                                             |
| Sociale verificatie  | Eerdere aanmeldingen op het account van de auteur verlagen het risico.                                                   |

## Verificatie

Elke voltooide stap vermenigvuldigt de risicoscore, en de publicatie komt erdoor wanneer het resultaat onder 0.4 ligt.

| Stap                                      | Vermenigvuldiger |
| ----------------------------------------- | ---------------- |
| CAPTCHA (Cloudflare Turnstile)            | × 0.7            |
| Aanmelden met Google, Apple of Telegram   | × 0.6            |
| Aanmelden met een tweede, andere provider | nog eens × 0.5   |

Een CAPTCHA die niet volstaat, wordt gevolgd door een aanmelding. Een aanmelding die niet volstaat, wordt gevolgd door een CAPTCHA als die de controle afrondt, en anders door een aanmelding bij een tweede provider.

### Onthouden aanmeldingen

De dienst onthoudt het account waarmee een auteur zich het laatst heeft aangemeld. Een later bericht dat verificatie nodig heeft, hergebruikt dat account alsof de auteur zich opnieuw had aangemeld, als een van de berichten van de auteur het in de afgelopen 30 dagen heeft gebruikt. Een hergebruik telt als zo'n bericht, dus de 30 dagen beginnen bij elk hergebruik opnieuw. Als dat volstaat, komt het bericht erdoor zonder CAPTCHA. Een ban in de community die aan het account gekoppeld is, maakt hier een einde aan, en hetzelfde geldt als de provider van het account uit de dienst wordt verwijderd.

## Verbindingsbeleid

Communities kunnen publicaties beperken die binnenkomen via Tor, VPN (inclusief iCloud Private Relay), proxy's en datacenterverbindingen. Op de gehoste dienst geldt:

- **VPN-, proxy- en datacenterverbindingen** kunnen posten na een aanmelding. De pagina legt uit waarom de aanmelding nodig is en hoe er zonder aanmelding gepost kan worden door de VPN uit te zetten. Een ban in de community geldt dan ook voor het account waarmee is aangemeld.
- **Gevestigde accounts** zijn vrijgesteld van de VPN-, proxy- en datacenterbeperkingen, maar niet van die voor Tor. Een account is gevestigd nadat het op 3 verschillende dagen vanaf onbeperkte verbindingen een CAPTCHA of aanmelding heeft doorstaan; berichten die zonder een van beide erdoor kwamen, tellen niet mee. Een netwerk telt maar voor één account mee: zodra een ander account er een controle doorstaat, telt het voor geen van beide mee. In een community die een account op een van die netwerken heeft geband, telt niets van die geschiedenis mee.
- **Tor** blijft beperkt, behalve voor auteurs met een vrijstelling die de community heeft ingesteld: een moderatorrol, de whitelist van de community of een geverifieerde `.bso`-naam.

Bijgevoegde bestanden die naar Forge Images worden geüpload, volgen dezelfde regels. Via een VPN-, proxy- of datacenterverbinding vereist de upload een voorcontrole die met een aanmelding is geslaagd, of een gevestigd account. Via Tor is een geverifieerde vrijstelling nodig.

## Privacy

- **De beheerder** slaat onbewerkte IP-adressen en publicatie-inhoud op om misbruik te detecteren, en stuurt IP-adressen ter classificatie naar een externe aanbieder (standaard proxycheck.io).
- **Communities** ontvangen alleen de landcode, het IP-risico, de schatting van het verbindingstype en het resultaat (geslaagd of mislukt). Ze ontvangen nooit het onbewerkte IP-adres of het account waarmee is aangemeld.
- **Aanmeldingen** vragen geen profielgegevens op. De dienst ontvangt alleen een account-ID van Google, Apple of Telegram, nooit een naam, e-mailadres of foto. De dienst bewaart het ID bij het bericht, zonder automatische verwijdering, zodat een ban ook voor het account geldt.
- **Auteurs op een VPN** houden hun echte IP-adres verborgen wanneer ze zich aanmelden: de dienst ziet alleen het adres van de VPN.

## Snelheidsbegrenzing

Nog vóór het beoordelen weigert de dienst auteurs die hun uur- of dagbudget voor berichten, reacties en stemmen overschrijden. Budgetten groeien met de accountleeftijd en een goede reputatie, en krimpen na bans of verwijderingen.

## API

De belangrijkste routes, relatief ten opzichte van `spamblocker.bitsocial.net/api/v1`:

| Route                    | Aanroeper                    | Doel                                                      |
| ------------------------ | ---------------------------- | --------------------------------------------------------- |
| `POST /evaluate`         | Uitdagings-iframe, community | Een publicatie beoordelen en de sessie ervan aanmaken     |
| `POST /challenge/verify` | Community                    | De uitkomst van de sessie en de IP-intelligentie uitlezen |
| `POST /precheck`         | Voorcontrole-iframe          | Een concept vóór het uploaden beoordelen                  |
| `GET /iframe/:sessionId` | Browser van de auteur        | Verificatiepagina                                         |
| `POST /upload/authorize` | Client van de auteur         | Een bijgevoegd bestand autoriseren voor Forge Images      |

Het volledige contract, inclusief het ondertekenen van verzoeken en de responsschema's, staat in de [README van spam-blocker](https://github.com/bitsocialnet/spam-blocker#api-contract).
