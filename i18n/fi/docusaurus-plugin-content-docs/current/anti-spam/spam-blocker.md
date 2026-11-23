---
title: Spam Blocker
description: Isännöity roskapostin tunnistus Bitsocial-yhteisöille, jossa on riskipisteytys, CAPTCHA- ja kirjautumistarkistukset sekä yhteyskäytännöt.
sidebar_position: 1
---

# Spam Blocker

Spam Blocker pisteyttää viestien, vastausten ja äänten roskapostiriskin ennen kuin yhteisö hyväksyy ne. Yhteisö asentaa haastepaketin, joka lähettää jokaisen julkaisun Spam Blocker -palveluun. Bitsocial ylläpitää yhtä tällaista palvelua osoitteessa `spamblocker.bitsocial.net`.

- **`@bitsocial/spam-blocker-challenge`** on avoimen lähdekoodin haastepaketti, jonka yhteisöt asentavat. Sen integraatiosopimus, jaetut skeemat ja API ovat julkisia.
- **Isännöity palvelu** pisteyttää julkaisut ja tarjoaa CAPTCHA- ja kirjautumissivut. Sen yksityiskohtaiset painotukset ja heuristiikat eivät ole julkisia, kuten [lähdekoodikäytäntö](https://github.com/bitsocialnet/spam-blocker/blob/master/docs/architecture/hosted-service-source-policy.md) selittää.

**Lähdekoodi:** [github.com/bitsocialnet/spam-blocker](https://github.com/bitsocialnet/spam-blocker)

## Miten julkaisu tarkistetaan

1. Yhteisön haaste lähettää allekirjoitetun julkaisun palveluun, joka palauttaa riskipisteen 0:n ja 1:n väliltä.
2. Jos pisteet jäävät yhteisön automaattisen hyväksynnän kynnyksen alle, julkaisu hyväksytään. Jos ne ovat automaattisen hylkäyksen kynnyksellä tai sen yli, julkaisu hylätään ja kirjoittaja näkee syyn.
3. Näiden välillä käytetään uudelleen kirjoittajan muistettua kirjautumista, jos se riittää. Muuten kirjoittaja saa vahvistussivun: CAPTCHAn, kun pelkkä CAPTCHA voi riittää läpäisyyn, tai kirjautumisen. Jos kirjoittaja käyttää VPN-, välityspalvelin- tai datakeskusyhteyttä, jota yhteisö rajoittaa, hän tarvitsee kirjautumisen millä tahansa automaattisen hylkäyksen kynnyksen alittavalla pistemäärällä, ellei jokin kohdassa Yhteyskäytännöt kuvattu poikkeus päde.
4. Lopuksi yhteisö tarkistaa tuloksen palvelulta ja soveltaa omia sääntöjään maan, IP-riskin ja yhteystyypin osalta.

Ennen liitetiedoston lähettämistä asiakasohjelma voi suorittaa saman tarkistuksen esitarkistuksena, jolloin useimmat kirjoittajat, jotka hylättäisiin, välttyvät tiedoston lähettämiseltä. Julkaisu tarkistetaan uudelleen, kun se julkaistaan, joten se voidaan silti hylätä, vaikka esitarkistus olisi läpäisty.

## Riskipisteet

| Signaali              | Kuvaus                                                                                                                                       |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Tilin ikä             | Uudemmat tilit saavat korkeammat riskipisteet.                                                                                               |
| Karma                 | Kertynyt yhteisökarma vähentää riskiä.                                                                                                       |
| Tekijän maine         | Tiedot taustalla toimivalta indeksoijalta, joka seuraa, mitkä kirjoittajat hyväksytään, poistetaan tai saavat porttikiellon eri yhteisöissä. |
| Sisältö ja linkit     | Tekstin ja linkkien analyysi, mukaan lukien toistuva sisältö.                                                                                |
| Nopeus                | Saman kirjoittajan nopeasti peräkkäiset viestit lisäävät riskiä.                                                                             |
| IP-tiedustelu         | Yhteystyyppi (Tor, VPN, välityspalvelin, datakeskus) ja IP-riski. Raakoja IP-osoitteita ei koskaan jaeta yhteisöille.                        |
| Linkitetyt tilit      | Useat samasta verkosta julkaisevat tilit nostavat riskiä asteittain.                                                                         |
| Sosiaalinen vahvistus | Aiemmat kirjautumiset kirjoittajan tilillä laskevat riskiä.                                                                                  |

## Vahvistus

Jokainen suoritettu vaihe kertoo riskipisteet kertoimella, ja julkaisu hyväksytään, kun tulos on alle 0.4.

| Vaihe                                              | Kerroin       |
| -------------------------------------------------- | ------------- |
| CAPTCHA (Cloudflare Turnstile)                     | × 0.7         |
| Kirjautuminen Googlella, Applella tai Telegramilla | × 0.6         |
| Kirjautuminen toisella, eri palveluntarjoajalla    | lisäksi × 0.5 |

Jos CAPTCHA ei riitä, sitä seuraa kirjautuminen. Jos kirjautuminen ei riitä, sitä seuraa CAPTCHA, jos se viimeistelee tarkistuksen, ja muuten kirjautuminen toisella palveluntarjoajalla.

### Muistetut kirjautumiset

Palvelu muistaa tilin, jolla kirjoittaja on viimeksi kirjautunut. Myöhempi vahvistusta vaativa viesti käyttää sitä uudelleen, ikään kuin kirjoittaja olisi kirjautunut uudestaan, jos jokin kirjoittajan viesteistä on käyttänyt sitä viimeisten 30 päivän aikana. Uudelleenkäyttökin lasketaan tällaiseksi viestiksi, joten 30 päivän jakso alkaa alusta jokaisesta uudelleenkäytöstä. Kun se riittää, viesti hyväksytään ilman CAPTCHAa. Tämä päättyy, jos yhteisössä annetaan tiliin liitetty porttikielto, ja samoin, jos tilin palveluntarjoaja poistetaan palvelusta.

## Yhteyskäytännöt

Yhteisöt voivat rajoittaa julkaisuja Tor-, VPN- (myös iCloud Private Relay), välityspalvelin- ja datakeskusyhteyksistä. Isännöidyssä palvelussa:

- **VPN-, välityspalvelin- ja datakeskusyhteyksistä** voi julkaista kirjautumisen jälkeen. Sivu kertoo, miksi kirjautuminen tarvitaan ja miten voi julkaista ilman sitä poistamalla VPN:n käytöstä. Yhteisön porttikielto koskee tämän jälkeen myös kirjautumiseen käytettyä tiliä.
- **Vakiintuneet tilit** on vapautettu VPN-, välityspalvelin- ja datakeskusyhteyksien rajoituksista, mutta ei Torin rajoituksesta. Tili on vakiintunut, kun se on läpäissyt CAPTCHAn tai kirjautumisen 3 eri päivänä rajoittamattomista yhteyksistä; viestejä, jotka hyväksyttiin ilman kumpaakaan, ei lasketa. Verkko lasketaan vain yhden tilin hyväksi: kun toinen tili läpäisee tarkistuksen siitä, sitä ei lasketa kummankaan hyväksi. Jos yhteisö on antanut porttikiellon tilille jossakin näistä verkoista, siinä yhteisössä mitään tästä historiasta ei lasketa.
- **Tor** pysyy rajoitettuna, paitsi kirjoittajilla, joilla on yhteisön määrittämä poikkeus: moderaattorin rooli, yhteisön sallittujen lista tai vahvistettu `.bso`-nimi.

Forge Images -palveluun lähetetyt liitetiedostot noudattavat samoja sääntöjä. VPN-, välityspalvelin- tai datakeskusyhteyden kautta lähettäminen edellyttää kirjautumisella läpäistyä esitarkistusta tai vakiintunutta tiliä. Torin kautta se edellyttää vahvistettua poikkeusta.

## Yksityisyys

- **Ylläpitäjä** tallentaa raaka-IP-osoitteet ja julkaisujen sisällön väärinkäytösten havaitsemiseksi ja lähettää IP-osoitteet luokiteltaviksi ulkopuoliselle palveluntarjoajalle (oletuksena proxycheck.io).
- **Yhteisöt** saavat vain maakoodin, IP-riskin, arvion yhteystyypistä sekä tiedon siitä, läpäisikö julkaisu tarkistuksen. Ne eivät koskaan saa raakaa IP-osoitetta tai kirjautumiseen käytettyä tiliä.
- **Kirjautumiset** eivät pyydä profiilitietoja. Palvelu saa Googlelta, Applelta tai Telegramilta vain tilin tunnisteen, ei koskaan nimeä, sähköpostiosoitetta tai kuvaa. Se säilyttää tunnisteen viestin yhteydessä ilman automaattista poistoa, joten porttikielto koskee myös tiliä.
- **VPN:ää käyttävien kirjoittajien** todellinen IP-osoite pysyy piilossa heidän kirjautuessaan: palvelu näkee vain VPN:n osoitteen.

## Nopeusrajoitukset

Ennen pisteytystä palvelu hylkää kirjoittajat, jotka ylittävät viestien, vastausten ja äänten tunti- tai päiväkohtaisen kiintiönsä. Kiintiöt kasvavat tilin iän ja hyvän maineen myötä ja pienenevät porttikieltojen tai poistojen jälkeen.

## API

Tärkeimmät reitit suhteessa osoitteeseen `spamblocker.bitsocial.net/api/v1`:

| Reitti                   | Kutsuja                     | Tarkoitus                                             |
| ------------------------ | --------------------------- | ----------------------------------------------------- |
| `POST /evaluate`         | Haasteen iframe, yhteisö    | Pisteyttää julkaisun ja luo sille istunnon            |
| `POST /challenge/verify` | Yhteisö                     | Lukee istunnon lopputuloksen ja IP-tiedustelun tiedot |
| `POST /precheck`         | Esitarkistuksen iframe      | Pisteyttää luonnoksen ennen lähettämistä              |
| `GET /iframe/:sessionId` | Kirjoittajan selain         | Vahvistussivu                                         |
| `POST /upload/authorize` | Kirjoittajan asiakasohjelma | Valtuuttaa liitetiedoston Forge Imagesia varten       |

Koko sopimus, mukaan lukien pyyntöjen allekirjoitus ja vastausten skeemat, löytyy [spam-blockerin README-tiedostosta](https://github.com/bitsocialnet/spam-blocker#api-contract).
