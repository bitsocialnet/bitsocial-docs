---
title: Spam Blocker
description: Gehostete Spam-Erkennung für Bitsocial-Communities mit Risikobewertung, CAPTCHA- und Anmeldeprüfungen sowie Verbindungsrichtlinien.
sidebar_position: 1
---

# Spam Blocker

Spam Blocker bewertet Beiträge, Antworten und Votes auf ihr Spam-Risiko, bevor eine Community sie annimmt. Eine Community installiert das Challenge-Paket, das jede Veröffentlichung an einen Spam-Blocker-Dienst sendet. Bitsocial betreibt einen solchen Dienst unter `spamblocker.bitsocial.net`.

- **`@bitsocial/spam-blocker-challenge`** ist das Open-Source-Challenge-Paket, das Communities installieren. Sein Integrationsvertrag, die gemeinsamen Schemas und die API sind öffentlich.
- **Der gehostete Dienst** bewertet Veröffentlichungen und stellt die CAPTCHA- und Anmeldeseiten bereit. Seine genauen Gewichtungen und Heuristiken sind nicht öffentlich, wie die [Quellcode-Richtlinie](https://github.com/bitsocialnet/spam-blocker/blob/master/docs/architecture/hosted-service-source-policy.md) erklärt.

**Quellcode:** [github.com/bitsocialnet/spam-blocker](https://github.com/bitsocialnet/spam-blocker)

## So wird eine Veröffentlichung geprüft

1. Die Challenge der Community sendet die signierte Veröffentlichung an den Dienst, der eine Risikobewertung zwischen 0 und 1 zurückgibt.
2. Liegt sie unter der Schwelle der Community für automatisches Akzeptieren, wird die Veröffentlichung angenommen. Erreicht oder überschreitet sie die Schwelle für automatische Ablehnung, wird sie abgelehnt, und der Autor sieht den Grund.
3. Dazwischen wird die Anmeldung des Autors aus den letzten 30 Tagen wiederverwendet, wenn sie ausreicht. Andernfalls erhält der Autor eine Verifizierungsseite: ein CAPTCHA, wenn ein CAPTCHA allein zum Bestehen reichen kann, sonst eine Anmeldung.
4. Anschließend prüft die Community das Ergebnis beim Dienst und wendet ihre eigenen Regeln für Land, IP-Risiko und Verbindungstyp an.

Vor dem Hochladen einer angehängten Datei kann ein Client dieselbe Prüfung als Vorabprüfung ausführen, sodass Autoren, die abgelehnt würden, gar nicht erst hochladen.

## Risikobewertung

| Signal                | Beschreibung                                                                                                                      |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Kontoalter            | Neuere Konten erhalten höhere Risikobewertungen.                                                                                  |
| Karma                 | Angesammeltes Gemeinschaftskarma reduziert das Risiko.                                                                            |
| Ruf des Autors        | Daten eines Hintergrund-Indexers, der verfolgt, welche Autoren über Communities hinweg angenommen, entfernt oder gesperrt werden. |
| Inhalte und Links     | Text- und Linkanalyse, einschließlich wiederholter Inhalte.                                                                       |
| Geschwindigkeit       | Schnell aufeinanderfolgende Beiträge desselben Autors erhöhen das Risiko.                                                         |
| IP-Intelligenz        | Verbindungstyp (Tor, VPN, Proxy, Rechenzentrum) und IP-Risiko. Rohe IP-Adressen werden niemals an Communities weitergegeben.      |
| Verknüpfte Konten     | Viele Konten, die aus demselben Netzwerk posten, erhöhen das Risiko schrittweise.                                                 |
| Soziale Verifizierung | Frühere Anmeldungen für das Konto des Autors senken das Risiko.                                                                   |

## Verifizierung

Jeder abgeschlossene Schritt multipliziert die Risikobewertung, und die Veröffentlichung wird angenommen, wenn das Ergebnis unter 0.4 liegt.

| Schritt                                       | Multiplikator    |
| --------------------------------------------- | ---------------- |
| CAPTCHA (Cloudflare Turnstile)                | × 0.7            |
| Anmeldung mit Google, Apple oder Telegram     | × 0.6            |
| Anmeldung bei einem zweiten, anderen Anbieter | zusätzlich × 0.5 |

Reicht ein CAPTCHA nicht aus, folgt eine Anmeldung. Reicht eine Anmeldung nicht aus, folgt ein CAPTCHA, wenn dieses die Prüfung abschließt, andernfalls eine Anmeldung bei einem zweiten Anbieter.

### Gespeicherte Anmeldungen

Der Dienst merkt sich das Konto, mit dem sich ein Autor zuletzt angemeldet hat. Ein späterer Beitrag, der eine Verifizierung benötigt, verwendet es wieder, als hätte sich der Autor erneut angemeldet, solange der Autor mindestens einmal alle 30 Tage damit postet. Reicht das aus, wird der Beitrag ohne CAPTCHA angenommen. Das endet, wenn die Community eine mit dem Konto verknüpfte Sperre verhängt, und ebenso, wenn der Anbieter des Kontos aus dem Dienst entfernt wird.

## Verbindungsrichtlinien

Communities können Veröffentlichungen über Tor-, VPN- (einschließlich iCloud Private Relay), Proxy- und Rechenzentrumsverbindungen einschränken. Beim gehosteten Dienst gilt:

- **VPN-, Proxy- und Rechenzentrumsverbindungen** können nach einer Anmeldung posten. Die Seite erklärt, warum die Anmeldung nötig ist und wie man ohne sie postet, indem man das VPN ausschaltet. Eine Sperre in der Community gilt dann auch für das Konto, mit dem man sich angemeldet hat.
- **Etablierte Konten**, die an 3 verschiedenen Tagen eine Prüfung über nicht eingeschränkte Verbindungen bestanden haben, sind ausgenommen.
- **Tor** bleibt eingeschränkt, außer für Autoren mit einer Ausnahme, die die Community konfiguriert hat: eine Moderatorrolle, die Whitelist der Community oder ein verifizierter `.bso`-Name.

Angehängte Dateien, die zu Forge Images hochgeladen werden, folgen denselben Regeln. Über eine VPN-, Proxy- oder Rechenzentrumsverbindung benötigt der Upload eine Vorabprüfung, die mit einer Anmeldung bestanden wurde, oder ein etabliertes Konto. Über Tor benötigt er eine verifizierte Ausnahme.

## Privatsphäre

- **Der Betreiber** speichert rohe IP-Adressen und Inhalte von Veröffentlichungen zur Missbrauchserkennung und sendet IP-Adressen zur Klassifizierung an einen externen Anbieter (standardmäßig proxycheck.io).
- **Communities** erhalten nur den Ländercode, das IP-Risiko, die Schätzung des Verbindungstyps und das Ergebnis (bestanden oder nicht bestanden). Sie erhalten nie die rohe IP-Adresse oder das Anmeldekonto.
- **Anmeldungen** fordern keine Profildaten an. Der Dienst erhält von Google, Apple oder Telegram nur eine Konto-ID, nie einen Namen, eine E-Mail-Adresse oder ein Foto. Er speichert die ID ohne automatische Löschung zusammen mit dem Beitrag, damit eine Sperre auch für das Konto gilt.
- **Autoren mit VPN** halten ihre echte IP-Adresse verborgen, wenn sie sich anmelden: Der Dienst sieht nur die Adresse des VPN.

## Ratenbegrenzung

Vor der Bewertung lehnt der Dienst Autoren ab, die ihr stündliches oder tägliches Budget für Beiträge, Antworten und Votes überschreiten. Die Budgets wachsen mit dem Kontoalter und einem guten Ruf und schrumpfen nach Sperren oder Entfernungen.

## API

Die wichtigsten Routen, relativ zu `spamblocker.bitsocial.net/api/v1`:

| Route                    | Aufrufer                    | Zweck                                                     |
| ------------------------ | --------------------------- | --------------------------------------------------------- |
| `POST /evaluate`         | Challenge-iframe, Community | Eine Veröffentlichung bewerten und ihre Sitzung erstellen |
| `POST /challenge/verify` | Community                   | Sitzungsergebnis und IP-Intelligenz abrufen               |
| `POST /precheck`         | Vorabprüfungs-iframe        | Einen Entwurf vor dem Upload bewerten                     |
| `GET /iframe/:sessionId` | Browser des Autors          | Verifizierungsseite                                       |
| `POST /upload/authorize` | Client des Autors           | Eine angehängte Datei für Forge Images autorisieren       |

Den vollständigen Vertrag, einschließlich der Signierung von Anfragen und der Antwortschemas, finden Sie in der [README von spam-blocker](https://github.com/bitsocialnet/spam-blocker#api-contract).
