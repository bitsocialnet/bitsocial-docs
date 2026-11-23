---
title: Spam Blocker
description: Zbulim i spamit i strehuar për komunitetet e Bitsocial, me vlerësim rreziku, kontrolle me CAPTCHA dhe me hyrje në llogari, si dhe politika për lidhjet.
sidebar_position: 1
---

# Spam Blocker

Spam Blocker u vë pikë rreziku spami postimeve, përgjigjeve dhe votave përpara se një komunitet t'i pranojë. Komuniteti instalon paketën e sfidës, e cila e dërgon çdo publikim te një shërbim bllokimi spami. Bitsocial drejton një të tillë në `spamblocker.bitsocial.net`.

- **`@bitsocial/spam-blocker-challenge`** është paketa e sfidës me burim të hapur që instalojnë komunitetet. Kontrata e saj e integrimit, skemat e përbashkëta dhe API-ja janë publike.
- **Shërbimi i strehuar** vlerëson publikimet dhe ofron faqet për CAPTCHA dhe për hyrjen në llogari. Peshat dhe heuristikat e tij të hollësishme janë private, siç e shpjegon [politika e kodit burimor](https://github.com/bitsocialnet/spam-blocker/blob/master/docs/architecture/hosted-service-source-policy.md).

**Kodi burimor:** [github.com/bitsocialnet/spam-blocker](https://github.com/bitsocialnet/spam-blocker)

## Si kontrollohet një publikim

1. Sfida e komunitetit e dërgon publikimin e nënshkruar te shërbimi, i cili kthen një pikë rreziku nga 0 deri në 1.
2. Nën pragun e pranimit automatik të komunitetit, publikimi kalon. Në pragun e refuzimit automatik ose mbi të, ai dështon dhe autori sheh arsyen.
3. Ndërmjet dy pragjeve, hyrja e mbajtur mend e autorit ripërdoret kur mjafton. Përndryshe autori merr një faqe verifikimi: një CAPTCHA, kur mjafton vetëm një CAPTCHA për të kaluar, ose një hyrje. Përmes një lidhjeje VPN, proxy ose nga qendër të dhënash që komuniteti e kufizon, autorit i duhet një hyrje për çdo pikë nën pragun e refuzimit automatik, përveç nëse zbatohet një përjashtim nga Politikat për lidhjet.
4. Më pas komuniteti e kontrollon rezultatin te shërbimi dhe zbaton rregullat e veta për shtetin, rrezikun e IP-së dhe llojin e lidhjes.

Para ngarkimit të një skedari të bashkëngjitur, klienti mund të ekzekutojë të njëjtin kontroll si parakontroll, gjë që shumicës së autorëve që do të refuzoheshin ua kursen ngarkimin. Publikimi kontrollohet sërish kur publikohet, prandaj mund të dështojë edhe pasi një parakontroll ka kaluar.

## Pikët e rrezikut

| Sinjali                 | Përshkrimi                                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Mosha e llogarisë       | Llogaritë më të reja marrin pikë rreziku më të larta.                                                                                 |
| Karma                   | Karma e grumbulluar në komunitet e ul rrezikun.                                                                                       |
| Reputacioni i autorit   | Të dhëna nga një indeksues në sfond që ndjek se cilët autorë pranohen, hiqen ose ndalohen nëpër komunitete.                           |
| Përmbajtja dhe lidhjet  | Analizë e tekstit dhe e lidhjeve, përfshirë përmbajtjen e përsëritur.                                                                 |
| Shpejtësia e publikimit | Postimet e njëpasnjëshme e të shpejta nga i njëjti autor e rrisin rrezikun.                                                           |
| Të dhënat për IP-në     | Lloji i lidhjes (Tor, VPN, proxy, qendër të dhënash) dhe rreziku i IP-së. Adresat IP të papërpunuara nuk ndahen kurrë me komunitetet. |
| Llogaritë e ndërlidhura | Shumë llogari që postojnë nga i njëjti rrjet e rrisin rrezikun gradualisht.                                                           |
| Verifikimi social       | Hyrjet e mëparshme në llogarinë e autorit e ulin rrezikun.                                                                            |

## Verifikimi

Çdo hap i përfunduar e shumëzon pikën e rrezikut, dhe publikimi kalon kur rezultati bie nën 0.4.

| Hapi                                     | Shumëzuesi |
| ---------------------------------------- | ---------- |
| CAPTCHA (Cloudflare Turnstile)           | × 0.7      |
| Hyrje me Google, Apple ose Telegram      | × 0.6      |
| Hyrje me një ofrues të dytë, të ndryshëm | edhe × 0.5 |

Një CAPTCHA që nuk mjafton pasohet nga një hyrje. Një hyrje që nuk mjafton pasohet nga një CAPTCHA kur kjo e përfundon kontrollin, dhe përndryshe nga një hyrje me një ofrues të dytë.

### Hyrjet e mbajtura mend

Shërbimi mban mend llogarinë me të cilën autori hyri për herë të fundit. Një postim i mëvonshëm që ka nevojë për verifikim e ripërdor atë, sikur autori të kishte hyrë sërish, kur një nga postimet e autorit e ka përdorur në 30 ditët e fundit. Një ripërdorim vlen si një postim i tillë, prandaj 30 ditët nisin nga e para me secilin ripërdorim. Kur kjo mjafton, postimi kalon pa CAPTCHA. Kjo përfundon nëse në komunitet vendoset një ndalim i lidhur me llogarinë, si dhe nëse ofruesi i llogarisë hiqet nga shërbimi.

## Politikat për lidhjet

Komunitetet mund të kufizojnë publikimet që vijnë nga lidhje Tor, VPN (përfshirë iCloud Private Relay), proxy dhe qendra të dhënash. Në shërbimin e strehuar:

- **Lidhjet VPN, proxy dhe nga qendra të dhënash** mund të postojnë pas një hyrjeje. Faqja shpjegon pse nevojitet hyrja dhe si mund të postohet pa të duke e fikur VPN-në. Një ndalim në komunitet vlen më pas edhe për llogarinë e përdorur për hyrjen.
- **Llogaritë e konsoliduara** përjashtohen nga kufizimet për VPN, proxy dhe qendra të dhënash, por jo nga kufizimi për Tor. Një llogari bëhet e konsoliduar pasi kalon një CAPTCHA ose hyrje në 3 ditë të ndryshme nga lidhje të pakufizuara; postimet që kaluan pa asnjërën prej tyre nuk llogariten. Një rrjet vlen vetëm për një llogari: sapo një llogari tjetër kalon një kontroll prej tij, ai nuk vlen për asnjërën prej tyre. Në një komunitet që ka ndaluar një llogari në një nga ato rrjete, asgjë nga ky historik nuk vlen.
- **Tor** mbetet i kufizuar, përveç autorëve me një përjashtim që e ka konfiguruar komuniteti: rolin e moderatorit, listën e bardhë të komunitetit ose një emër `.bso` të verifikuar.

Skedarët e bashkëngjitur që ngarkohen në Forge Images ndjekin të njëjtat rregulla. Përmes një lidhjeje VPN, proxy ose nga qendër të dhënash, ngarkimi kërkon një parakontroll të kaluar me hyrje, ose një llogari të konsoliduar. Përmes Tor, kërkon një përjashtim të verifikuar.

## Privatësia

- **Operatori** ruan adresat IP të papërpunuara dhe përmbajtjen e publikimeve për zbulimin e abuzimeve, dhe i dërgon adresat IP te një ofrues i jashtëm për klasifikim (si parazgjedhje proxycheck.io).
- **Komunitetet** marrin vetëm kodin e shtetit, rrezikun e IP-së, vlerësimin e llojit të lidhjes dhe rezultatin (kaloi ose dështoi). Ato nuk marrin kurrë IP-në e papërpunuar ose llogarinë e hyrjes.
- **Hyrjet** nuk kërkojnë asnjë të dhënë profili. Shërbimi merr vetëm një ID llogarie nga Google, Apple ose Telegram, kurrë emër, email ose foto. Ai e ruan ID-në bashkë me postimin, pa fshirje automatike, kështu që një ndalim vlen edhe për llogarinë.
- **Autorët në një VPN** e mbajnë të fshehur adresën e tyre të vërtetë IP kur hyjnë: shërbimi sheh vetëm adresën e VPN-së.

## Kufizimi i shpeshtisë

Para vlerësimit, shërbimi refuzon autorët që tejkalojnë buxhetin e tyre për orë ose për ditë për postime, përgjigje dhe vota. Buxhetet rriten me moshën e llogarisë dhe reputacionin e mirë, dhe zvogëlohen pas ndalimeve ose heqjeve.

## API

Rrugët kryesore, në raport me `spamblocker.bitsocial.net/api/v1`:

| Rruga                    | Thirrësi                      | Qëllimi                                                |
| ------------------------ | ----------------------------- | ------------------------------------------------------ |
| `POST /evaluate`         | Iframe-i i sfidës, komuniteti | Vlerëson një publikim dhe krijon seancën e tij         |
| `POST /challenge/verify` | Komuniteti                    | Lexon rezultatin e seancës dhe të dhënat për IP-në     |
| `POST /precheck`         | Iframe-i i parakontrollit     | Vlerëson një skicë para ngarkimit                      |
| `GET /iframe/:sessionId` | Shfletuesi i autorit          | Faqja e verifikimit                                    |
| `POST /upload/authorize` | Klienti i autorit             | Autorizon një skedar të bashkëngjitur për Forge Images |

Kontrata e plotë, përfshirë nënshkrimin e kërkesave dhe skemat e përgjigjeve, gjendet te [README-ja e spam-blocker](https://github.com/bitsocialnet/spam-blocker#api-contract).
