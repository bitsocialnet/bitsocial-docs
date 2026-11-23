---
title: Spam Blocker
description: Servizio ospitato di rilevamento dello spam per le comunità Bitsocial, con punteggio di rischio, verifiche tramite CAPTCHA e accesso, e criteri per le connessioni.
sidebar_position: 1
---

# Spam Blocker

Spam Blocker assegna a post, risposte e voti un punteggio di rischio spam prima che una comunità li accetti. Una comunità installa il pacchetto della sfida, che invia ogni pubblicazione a un servizio Spam Blocker. Bitsocial ne gestisce uno su `spamblocker.bitsocial.net`.

- **`@bitsocial/spam-blocker-challenge`** è il pacchetto open source della sfida che le comunità installano. Il suo contratto di integrazione, gli schemi condivisi e l'API sono pubblici.
- **Il servizio ospitato** assegna il punteggio alle pubblicazioni e fornisce le pagine del CAPTCHA e di accesso. I suoi pesi e le sue euristiche di dettaglio sono privati, come spiega la [policy sul codice sorgente](https://github.com/bitsocialnet/spam-blocker/blob/master/docs/architecture/hosted-service-source-policy.md).

**Codice sorgente:** [github.com/bitsocialnet/spam-blocker](https://github.com/bitsocialnet/spam-blocker)

## Come viene verificata una pubblicazione

1. La sfida della comunità invia la pubblicazione firmata al servizio, che restituisce un punteggio di rischio compreso tra 0 e 1.
2. Sotto la soglia di accettazione automatica della comunità, la pubblicazione passa. Alla soglia di rifiuto automatico o sopra, viene respinta e l'autore ne vede il motivo.
3. Nella fascia intermedia, se basta, viene riutilizzato l'accesso memorizzato dell'autore. Altrimenti l'autore riceve una pagina di verifica: un CAPTCHA quando un CAPTCHA da solo può bastare a passare, oppure un accesso. Tramite una connessione VPN, proxy o datacenter che la comunità limita, l'autore deve effettuare l'accesso con qualsiasi punteggio inferiore alla soglia di rifiuto automatico, a meno che non si applichi un'esenzione prevista nella sezione Criteri per le connessioni.
4. La comunità verifica poi il risultato con il servizio e applica le proprie regole su paese, rischio dell'IP e tipo di connessione.

Prima di caricare un file allegato, un client può eseguire lo stesso controllo come controllo preliminare, che risparmia il caricamento alla maggior parte degli autori che verrebbero respinti. La pubblicazione viene verificata di nuovo quando viene pubblicata, quindi può comunque essere respinta anche dopo un controllo preliminare superato.

## Punteggio di rischio

| Segnale                 | Descrizione                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Anzianità dell'account  | Gli account più recenti ricevono punteggi di rischio più alti.                                                                       |
| Karma                   | Il karma accumulato nella comunità riduce il rischio.                                                                                |
| Reputazione dell'autore | Dati di un indicizzatore in background che tiene traccia di quali autori vengono accettati, rimossi o bannati nelle varie comunità.  |
| Contenuto e link        | Analisi del testo e dei link, compresi i contenuti ripetuti.                                                                         |
| Frequenza               | Pubblicazioni ravvicinate dallo stesso autore aumentano il rischio.                                                                  |
| Informazioni sull'IP    | Tipo di connessione (Tor, VPN, proxy, datacenter) e rischio dell'IP. Gli indirizzi IP grezzi non sono mai condivisi con le comunità. |
| Account collegati       | Molti account che pubblicano dalla stessa rete fanno salire il rischio in modo progressivo.                                          |
| Verifica social         | Gli accessi precedenti sull'account dell'autore abbassano il rischio.                                                                |

## Verifica

Ogni passaggio completato moltiplica il punteggio di rischio, e la pubblicazione passa quando il risultato è inferiore a 0.4.

| Passaggio                                          | Moltiplicatore     |
| -------------------------------------------------- | ------------------ |
| CAPTCHA (Cloudflare Turnstile)                     | × 0.7              |
| Accesso con Google, Apple o Telegram               | × 0.6              |
| Accesso con un secondo provider, diverso dal primo | un ulteriore × 0.5 |

Se un CAPTCHA non basta, segue un accesso. Se un accesso non basta, segue un CAPTCHA quando questo completa la verifica, altrimenti un accesso con un secondo provider.

### Accessi memorizzati

Il servizio ricorda l'account con cui un autore ha effettuato l'ultimo accesso. Un post successivo che richiede una verifica lo riutilizza, come se l'autore avesse effettuato di nuovo l'accesso, se uno dei post dell'autore l'ha usato negli ultimi 30 giorni. Anche un riutilizzo conta come post di questo tipo, quindi i 30 giorni ripartono da capo a ogni riutilizzo. Quando basta, il post passa senza CAPTCHA. Un ban nella comunità collegato all'account pone fine a questo meccanismo, così come la rimozione del relativo provider dal servizio.

## Criteri per le connessioni

Le comunità possono limitare le pubblicazioni provenienti da connessioni Tor, VPN (compreso iCloud Private Relay), proxy e datacenter. Sul servizio ospitato:

- **Le connessioni VPN, proxy e datacenter** possono pubblicare dopo un accesso. La pagina spiega perché l'accesso è necessario e come pubblicare senza, disattivando la VPN. Un ban nella comunità si applica poi anche all'account usato per l'accesso.
- **Gli account consolidati** sono esenti dalle limitazioni per VPN, proxy e datacenter, ma non da quella per Tor. Un account diventa consolidato dopo aver completato un CAPTCHA o un accesso in 3 giorni diversi da connessioni non soggette a limitazioni; i post accettati senza nessuno dei due non contano. Una rete conta per un solo account: appena un altro account supera un controllo da quella rete, non conta più per nessuno dei due. In una comunità che ha bannato un account su una di quelle reti, nessuna parte di questo storico conta.
- **Tor** resta soggetto a limitazioni, tranne per gli autori con un'esenzione configurata dalla comunità: un ruolo di moderatore, la whitelist della comunità o un nome `.bso` verificato.

I file allegati caricati su Forge Images seguono le stesse regole. Tramite una connessione VPN, proxy o datacenter, il caricamento richiede un controllo preliminare superato con un accesso, oppure un account consolidato. Tramite Tor, richiede un'esenzione verificata.

## Privacy

- **L'operatore** conserva gli indirizzi IP grezzi e il contenuto delle pubblicazioni per rilevare gli abusi, e invia gli indirizzi IP a un fornitore esterno per classificarli (proxycheck.io per impostazione predefinita).
- **Le comunità** ricevono solo il codice paese, il rischio dell'IP, la stima del tipo di connessione e l'esito positivo o negativo. Non ricevono mai l'IP grezzo né l'account usato per l'accesso.
- **Gli accessi** non richiedono dati del profilo. Il servizio riceve solo un ID account da Google, Apple o Telegram, mai un nome, un'email o una foto. Conserva l'ID insieme al post, senza eliminazione automatica, così un ban si applica anche all'account.
- **Gli autori su VPN** mantengono nascosto il proprio indirizzo IP reale quando effettuano l'accesso: il servizio vede solo l'indirizzo della VPN.

## Limitazione della frequenza

Prima di calcolare il punteggio, il servizio respinge gli autori che superano la propria quota oraria o giornaliera di post, risposte e voti. Le quote crescono con l'anzianità dell'account e una buona reputazione, e si riducono dopo ban o rimozioni.

## API

Le route principali, relative a `spamblocker.bitsocial.net/api/v1`:

| Route                    | Chiamante                        | Scopo                                                          |
| ------------------------ | -------------------------------- | -------------------------------------------------------------- |
| `POST /evaluate`         | Iframe della sfida, comunità     | Assegna il punteggio a una pubblicazione e ne crea la sessione |
| `POST /challenge/verify` | Comunità                         | Legge l'esito della sessione e le informazioni sull'IP         |
| `POST /precheck`         | Iframe del controllo preliminare | Assegna il punteggio a una bozza prima del caricamento         |
| `GET /iframe/:sessionId` | Browser dell'autore              | Pagina di verifica                                             |
| `POST /upload/authorize` | Client dell'autore               | Autorizza un file allegato per Forge Images                    |

Il contratto completo, compresi la firma delle richieste e gli schemi delle risposte, si trova nel [README di spam-blocker](https://github.com/bitsocialnet/spam-blocker#api-contract).
