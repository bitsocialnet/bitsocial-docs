---
title: Spam Blocker
description: Detecció de correu brossa allotjada per a comunitats de Bitsocial, amb puntuació de risc, comprovacions amb CAPTCHA i inici de sessió, i polítiques de connexió.
sidebar_position: 1
---

# Spam Blocker

Spam Blocker puntua el risc de correu brossa de les publicacions, les respostes i els vots abans que una comunitat els accepti. Una comunitat instal·la el paquet de repte, que envia cada publicació a un servei de Spam Blocker. Bitsocial n'opera un a `spamblocker.bitsocial.net`.

- **`@bitsocial/spam-blocker-challenge`** és el paquet de repte de codi obert que instal·len les comunitats. El seu contracte d'integració, els esquemes compartits i l'API són públics.
- **El servei allotjat** puntua les publicacions i serveix les pàgines de CAPTCHA i d'inici de sessió. Els seus pesos i heurístiques detallats són privats, tal com explica la [política de codi font](https://github.com/bitsocialnet/spam-blocker/blob/master/docs/architecture/hosted-service-source-policy.md).

**Codi font:** [github.com/bitsocialnet/spam-blocker](https://github.com/bitsocialnet/spam-blocker)

## Com es comprova una publicació

1. El repte de la comunitat envia la publicació signada al servei, que retorna una puntuació de risc entre 0 i 1.
2. Per sota del llindar d'acceptació automàtica de la comunitat, la publicació s'accepta. En el seu llindar de rebuig automàtic o per sobre, es rebutja i l'autor en veu el motiu.
3. Entre tots dos llindars, es reutilitza l'inici de sessió recordat de l'autor quan és suficient. Altrament, l'autor rep una pàgina de verificació: un CAPTCHA quan un CAPTCHA sol pot bastar per aprovar, o bé un inici de sessió. A través d'una connexió VPN, proxy o de centre de dades que la comunitat restringeix, l'autor necessita un inici de sessió amb qualsevol puntuació inferior al llindar de rebuig automàtic, tret que s'hi apliqui alguna exempció descrita a Polítiques de connexió.
4. Després, la comunitat comprova el resultat amb el servei i aplica les seves pròpies regles de país, risc d'IP i tipus de connexió.

Abans de pujar un fitxer adjunt, un client pot executar la mateixa comprovació com a comprovació prèvia, cosa que estalvia la pujada a la majoria dels autors que serien rebutjats. La publicació es torna a comprovar quan es publica, de manera que encara es pot rebutjar després d'haver superat una comprovació prèvia.

## Puntuació de risc

| Senyal               | Descripció                                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Edat del compte      | Els comptes més nous reben puntuacions de risc més altes.                                                                                   |
| Karma                | El karma de la comunitat acumulat redueix el risc.                                                                                          |
| Reputació d'autor    | Dades d'un indexador en segon pla que registra quins autors són acceptats, eliminats o expulsats a les diverses comunitats.                 |
| Contingut i enllaços | Anàlisi de text i d'enllaços, inclòs el contingut repetit.                                                                                  |
| Velocitat            | Les publicacions successives ràpides del mateix autor augmenten el risc.                                                                    |
| Intel·ligència IP    | Tipus de connexió (Tor, VPN, proxy, centre de dades) i risc d'IP. Les adreces IP sense processar no es comparteixen mai amb les comunitats. |
| Comptes vinculats    | Molts comptes que publiquen des d'una mateixa xarxa augmenten el risc de manera progressiva.                                                |
| Verificació social   | Els inicis de sessió anteriors al compte de l'autor redueixen el risc.                                                                      |

## Verificació

Cada pas completat multiplica la puntuació de risc, i la publicació s'accepta quan el resultat és inferior a 0.4.

| Pas                                             | Multiplicador  |
| ----------------------------------------------- | -------------- |
| CAPTCHA (Cloudflare Turnstile)                  | × 0.7          |
| Inici de sessió amb Google, Apple o Telegram    | × 0.6          |
| Inici de sessió amb un segon proveïdor diferent | un altre × 0.5 |

Si un CAPTCHA no és suficient, el segueix un inici de sessió. Si un inici de sessió no és suficient, el segueix un CAPTCHA quan amb això es completa la comprovació i, si no, un inici de sessió amb un segon proveïdor.

### Inicis de sessió recordats

El servei recorda el compte amb què un autor va iniciar sessió per última vegada. Una publicació posterior que necessiti verificació el reutilitza, com si l'autor hagués tornat a iniciar sessió, si alguna publicació de l'autor l'ha fet servir en els últims 30 dies. Cada reutilització compta com una d'aquestes publicacions, de manera que els 30 dies tornen a començar amb cadascuna. Quan això és suficient, la publicació s'accepta sense CAPTCHA. Això s'acaba si la comunitat aplica una expulsió vinculada al compte, i també si es retira el seu proveïdor del servei.

## Polítiques de connexió

Les comunitats poden restringir les publicacions que arriben des de connexions Tor, VPN (inclòs iCloud Private Relay), proxy i de centres de dades. Al servei allotjat:

- **Les connexions VPN, proxy i de centres de dades** poden publicar després d'iniciar sessió. La pàgina explica per què cal iniciar sessió i com publicar sense fer-ho desactivant la VPN. A partir d'aleshores, una expulsió a la comunitat també s'aplica al compte amb què s'ha iniciat sessió.
- **Els comptes consolidats** estan exempts de les restriccions de VPN, proxy i centres de dades, però no de la de Tor. Un compte passa a estar consolidat després de superar un CAPTCHA o un inici de sessió en 3 dies diferents des de connexions sense restriccions; les publicacions acceptades sense cap dels dos no compten. Una xarxa només compta per a un compte: quan un altre compte supera una comprovació des d'aquesta xarxa, ja no compta per a cap dels dos. En una comunitat que ha expulsat un compte en una d'aquestes xarxes, no compta res d'aquest historial.
- **Tor** continua restringit, excepte per als autors amb una exempció configurada per la comunitat: un rol de moderador, la llista blanca de la comunitat o un nom `.bso` verificat.

Els fitxers adjunts que es pugen a Forge Images segueixen les mateixes regles. A través d'una connexió VPN, proxy o de centre de dades, la pujada necessita una comprovació prèvia superada amb un inici de sessió, o bé un compte consolidat. A través de Tor, necessita una exempció verificada.

## Privadesa

- **L'operador** emmagatzema les adreces IP sense processar i el contingut de les publicacions per detectar abusos, i envia les adreces IP a un proveïdor extern perquè les classifiqui (proxycheck.io per defecte).
- **Les comunitats** només reben el codi de país, el risc de la IP, l'estimació del tipus de connexió i el resultat d'aprovat o rebutjat. No reben mai la IP sense processar ni el compte d'inici de sessió.
- **Els inicis de sessió** no sol·liciten dades de perfil. El servei només rep un identificador de compte de Google, Apple o Telegram, mai un nom, un correu electrònic o una foto. Desa l'identificador amb la publicació, sense supressió automàtica, de manera que una expulsió també s'aplica al compte.
- **Els autors que fan servir una VPN** mantenen oculta la seva adreça IP real quan inicien sessió: el servei només veu l'adreça de la VPN.

## Limitació de freqüència

Abans de puntuar, el servei rebutja els autors que superen la seva quota horària o diària de publicacions, respostes i vots. Les quotes augmenten amb l'edat del compte i la bona reputació, i es redueixen després d'expulsions o eliminacions.

## API

Les rutes principals, relatives a `spamblocker.bitsocial.net/api/v1`:

| Ruta                     | Qui la crida                 | Finalitat                                              |
| ------------------------ | ---------------------------- | ------------------------------------------------------ |
| `POST /evaluate`         | Iframe del repte, comunitat  | Puntuar una publicació i crear-ne la sessió            |
| `POST /challenge/verify` | Comunitat                    | Llegir el resultat de la sessió i la intel·ligència IP |
| `POST /precheck`         | Iframe de comprovació prèvia | Puntuar un esborrany abans de pujar-lo                 |
| `GET /iframe/:sessionId` | Navegador de l'autor         | Pàgina de verificació                                  |
| `POST /upload/authorize` | Client de l'autor            | Autoritzar un fitxer adjunt per a Forge Images         |

El contracte complet, incloses la signatura de sol·licituds i els esquemes de resposta, és al [README de spam-blocker](https://github.com/bitsocialnet/spam-blocker#api-contract).
