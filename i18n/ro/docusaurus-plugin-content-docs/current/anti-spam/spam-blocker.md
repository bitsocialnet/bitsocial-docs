---
title: Spam Blocker
description: Detectare găzduită a spamului pentru comunitățile Bitsocial, cu punctarea riscului, verificări prin CAPTCHA și autentificare și politici de conexiune.
sidebar_position: 1
---

# Spam Blocker

Spam Blocker evaluează riscul de spam al postărilor, răspunsurilor și voturilor înainte ca o comunitate să le accepte. Comunitatea instalează pachetul de provocare, care trimite fiecare publicare către un serviciu de blocare a spamului. Bitsocial operează unul la `spamblocker.bitsocial.net`.

- **`@bitsocial/spam-blocker-challenge`** este pachetul de provocare open-source pe care îl instalează comunitățile. Contractul său de integrare, schemele partajate și API-ul sunt publice.
- **Serviciul găzduit** punctează publicările și servește paginile de CAPTCHA și de autentificare. Ponderile și euristicile sale detaliate sunt private, după cum explică [politica privind codul sursă](https://github.com/bitsocialnet/spam-blocker/blob/master/docs/architecture/hosted-service-source-policy.md).

**Cod sursă:** [github.com/bitsocialnet/spam-blocker](https://github.com/bitsocialnet/spam-blocker)

## Cum este verificată o publicare

1. Provocarea comunității trimite publicarea semnată către serviciu, care returnează un scor de risc între 0 și 1.
2. Sub pragul de acceptare automată al comunității, publicarea trece. La pragul de respingere automată sau peste acesta, este respinsă, iar autorul vede motivul.
3. Între cele două praguri, autentificarea memorată a autorului este refolosită atunci când este suficientă. Altfel, autorul primește o pagină de verificare: un CAPTCHA, când un CAPTCHA singur poate fi suficient, sau o autentificare. Printr-o conexiune VPN, proxy sau din centru de date pe care comunitatea o restricționează, autorul are nevoie de o autentificare la orice scor sub pragul de respingere automată, dacă nu se aplică o exceptare din Politici de conexiune.
4. Apoi comunitatea verifică rezultatul la serviciu și aplică propriile reguli privind țara, riscul IP și tipul de conexiune.

Înainte de a încărca un fișier atașat, un client poate rula aceeași verificare ca verificare preliminară, ceea ce îi scutește de încărcare pe cei mai mulți autori care ar fi respinși. Publicarea este verificată din nou când este publicată, așa că poate fi totuși respinsă după ce a trecut o verificare preliminară.

## Scorul de risc

| Semnal               | Descriere                                                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Vechimea contului    | Conturile mai noi primesc scoruri de risc mai mari.                                                                               |
| Karma                | Karma acumulată în comunitate reduce riscul.                                                                                      |
| Reputația autorului  | Date de la un indexator care rulează în fundal și urmărește ce autori sunt acceptați, eliminați sau banați în comunități.         |
| Conținut și linkuri  | Analiza textului și a linkurilor, inclusiv a conținutului repetat.                                                                |
| Ritmul de publicare  | Postările rapide și succesive ale aceluiași autor cresc riscul.                                                                   |
| Informații despre IP | Tipul de conexiune (Tor, VPN, proxy, centru de date) și riscul IP. Adresele IP brute nu sunt niciodată partajate cu comunitățile. |
| Conturi legate       | Multe conturi care postează din aceeași rețea cresc treptat riscul.                                                               |
| Verificare socială   | Autentificările anterioare pe contul autorului reduc riscul.                                                                      |

## Verificare

Fiecare pas finalizat înmulțește scorul de risc, iar publicarea trece când rezultatul scade sub 0.4.

| Pas                                             | Multiplicator |
| ----------------------------------------------- | ------------- |
| CAPTCHA (Cloudflare Turnstile)                  | × 0.7         |
| Autentificare cu Google, Apple sau Telegram     | × 0.6         |
| Autentificare cu un al doilea furnizor, diferit | încă × 0.5    |

Un CAPTCHA care nu este suficient este urmat de o autentificare. O autentificare care nu este suficientă este urmată de un CAPTCHA, atunci când acesta încheie verificarea, iar altfel de o autentificare cu un al doilea furnizor.

### Autentificări memorate

Serviciul reține contul cu care un autor s-a autentificat ultima dată. O postare ulterioară care necesită verificare îl refolosește, ca și cum autorul s-ar fi autentificat din nou, dacă una dintre postările autorului l-a folosit în ultimele 30 de zile. O refolosire contează ca o astfel de postare, așa că cele 30 de zile reîncep cu fiecare refolosire. Când acest lucru este suficient, postarea trece fără CAPTCHA. Un ban în comunitate legat de cont pune capăt acestui mecanism, la fel ca eliminarea furnizorului contului din serviciu.

## Politici de conexiune

Comunitățile pot restricționa publicările care vin prin Tor, VPN (inclusiv iCloud Private Relay), proxy și conexiuni din centre de date. Pe serviciul găzduit:

- **Conexiunile prin VPN, proxy și din centre de date** pot posta după o autentificare. Pagina explică de ce este necesară autentificarea și cum se poate posta fără ea, prin dezactivarea VPN-ului. Un ban în comunitate se aplică apoi și contului folosit la autentificare.
- **Conturile consacrate** sunt exceptate de la restricțiile pentru VPN, proxy și centre de date, dar nu și de la cea pentru Tor. Un cont devine consacrat după ce trece un CAPTCHA sau o autentificare în 3 zile diferite de pe conexiuni nerestricționate; postările care au trecut fără niciunul dintre acestea nu contează. O rețea contează pentru un singur cont: odată ce un alt cont trece o verificare de pe ea, nu mai contează pentru niciunul dintre ele. Într-o comunitate care a banat un cont de pe una dintre acele rețele, nimic din acest istoric nu contează.
- **Tor** rămâne restricționat, cu excepția autorilor care au o exceptare configurată de comunitate: un rol de moderator, lista albă a comunității sau un nume `.bso` verificat.

Fișierele atașate încărcate în Forge Images urmează aceleași reguli. Printr-o conexiune VPN, proxy sau din centru de date, încărcarea necesită o verificare preliminară trecută cu autentificare sau un cont consacrat. Prin Tor, necesită o exceptare verificată.

## Confidențialitate

- **Operatorul** stochează adresele IP brute și conținutul publicărilor pentru detectarea abuzurilor și trimite adresele IP unui furnizor terț pentru clasificare (implicit proxycheck.io).
- **Comunitățile** primesc doar codul țării, riscul IP, estimarea tipului de conexiune și rezultatul (trecut sau respins). Nu primesc niciodată adresa IP brută sau contul de autentificare.
- **Autentificările** nu solicită date de profil. Serviciul primește doar un ID de cont de la Google, Apple sau Telegram, niciodată un nume, un e-mail sau o fotografie. Păstrează ID-ul împreună cu postarea, fără ștergere automată, astfel încât un ban se aplică și contului.
- **Autorii care folosesc un VPN** își păstrează adresa IP reală ascunsă când se autentifică: serviciul vede doar adresa VPN-ului.

## Limitarea ratei

Înainte de punctare, serviciul respinge autorii care își depășesc bugetul orar sau zilnic de postări, răspunsuri și voturi. Bugetele cresc odată cu vechimea contului și cu reputația bună și scad după banuri sau eliminări.

## API

Rutele principale, relative la `spamblocker.bitsocial.net/api/v1`:

| Rută                     | Apelant                           | Scop                                                  |
| ------------------------ | --------------------------------- | ----------------------------------------------------- |
| `POST /evaluate`         | Iframe-ul provocării, comunitatea | Punctează o publicare și îi creează sesiunea          |
| `POST /challenge/verify` | Comunitatea                       | Citește rezultatul sesiunii și informațiile despre IP |
| `POST /precheck`         | Iframe-ul verificării preliminare | Punctează o ciornă înainte de încărcare               |
| `GET /iframe/:sessionId` | Browserul autorului               | Pagina de verificare                                  |
| `POST /upload/authorize` | Clientul autorului                | Autorizează un fișier atașat pentru Forge Images      |

Contractul complet, inclusiv semnarea cererilor și schemele de răspuns, se află în [README-ul spam-blocker](https://github.com/bitsocialnet/spam-blocker#api-contract).
