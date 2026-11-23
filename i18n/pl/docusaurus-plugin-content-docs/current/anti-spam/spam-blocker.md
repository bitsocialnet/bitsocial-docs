---
title: Spam Blocker
description: Hostowana usługa wykrywania spamu dla społeczności Bitsocial z punktacją ryzyka, weryfikacją przez CAPTCHA i logowanie oraz zasadami dotyczącymi połączeń.
sidebar_position: 1
---

# Spam Blocker

Spam Blocker ocenia ryzyko spamu we wpisach, odpowiedziach i głosach, zanim społeczność je przyjmie. Społeczność instaluje pakiet wyzwania, który wysyła każdą publikację do usługi blokowania spamu. Bitsocial prowadzi jedną taką usługę pod adresem `spamblocker.bitsocial.net`.

- **`@bitsocial/spam-blocker-challenge`** to otwartoźródłowy pakiet wyzwania, który instalują społeczności. Jego kontrakt integracyjny, wspólne schematy i API są publiczne.
- **Usługa hostowana** ocenia publikacje i udostępnia strony CAPTCHA oraz logowania. Jej szczegółowe wagi i heurystyki są prywatne, co wyjaśnia [polityka dotycząca kodu źródłowego](https://github.com/bitsocialnet/spam-blocker/blob/master/docs/architecture/hosted-service-source-policy.md).

**Kod źródłowy:** [github.com/bitsocialnet/spam-blocker](https://github.com/bitsocialnet/spam-blocker)

## Jak sprawdzana jest publikacja

1. Wyzwanie społeczności wysyła podpisaną publikację do usługi, która zwraca punktację ryzyka od 0 do 1.
2. Poniżej progu automatycznej akceptacji ustalonego przez społeczność publikacja przechodzi. Na progu automatycznego odrzucenia lub powyżej niego zostaje odrzucona, a autor widzi powód.
3. Pomiędzy tymi progami ponownie wykorzystywane jest logowanie autora z ostatnich 30 dni, jeśli wystarcza. W przeciwnym razie autor dostaje stronę weryfikacji: CAPTCHA, jeśli sama CAPTCHA może wystarczyć, albo logowanie.
4. Następnie społeczność sprawdza wynik w usłudze i stosuje własne reguły dotyczące kraju, ryzyka IP i typu połączenia.

Przed przesłaniem załączonego pliku klient może uruchomić tę samą kontrolę jako kontrolę wstępną, dzięki czemu autorzy, którzy zostaliby odrzuceni, w ogóle nie przesyłają pliku.

## Punktacja ryzyka

| Sygnał                      | Opis                                                                                                                              |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Wiek konta                  | Nowsze konta dostają wyższą punktację ryzyka.                                                                                     |
| Karma                       | Zgromadzona karma w społeczności obniża ryzyko.                                                                                   |
| Reputacja autora            | Dane z działającego w tle indeksera, który śledzi, którzy autorzy są akceptowani, usuwani lub banowani w różnych społecznościach. |
| Treść i linki               | Analiza tekstu i linków, w tym powtarzających się treści.                                                                         |
| Tempo publikowania          | Szybkie serie wpisów od tego samego autora podnoszą ryzyko.                                                                       |
| Dane o adresach IP          | Typ połączenia (Tor, VPN, proxy, centrum danych) i ryzyko IP. Surowe adresy IP nigdy nie trafiają do społeczności.                |
| Powiązane konta             | Wiele kont publikujących z jednej sieci stopniowo podnosi ryzyko.                                                                 |
| Weryfikacja społecznościowa | Wcześniejsze logowania na koncie autora obniżają ryzyko.                                                                          |

## Weryfikacja

Każdy ukończony krok mnoży punktację ryzyka, a publikacja przechodzi, gdy wynik spadnie poniżej 0.4.

| Krok                                       | Mnożnik         |
| ------------------------------------------ | --------------- |
| CAPTCHA (Cloudflare Turnstile)             | × 0.7           |
| Logowanie przez Google, Apple lub Telegram | × 0.6           |
| Logowanie przez drugiego, innego dostawcę  | dodatkowo × 0.5 |

Jeśli CAPTCHA nie wystarcza, po niej następuje logowanie. Jeśli logowanie nie wystarcza, po nim następuje CAPTCHA, o ile to kończy sprawdzanie, a w przeciwnym razie logowanie przez drugiego dostawcę.

### Zapamiętane logowania

Usługa zapamiętuje konto, którym autor ostatnio się zalogował. Późniejszy wpis wymagający weryfikacji wykorzystuje je ponownie, tak jakby autor zalogował się jeszcze raz, o ile autor nadal publikuje z tego konta co najmniej raz na 30 dni. Jeśli to wystarcza, wpis przechodzi bez CAPTCHA. Zapamiętanie przestaje działać po banie w społeczności powiązanym z tym kontem, a także po usunięciu jego dostawcy z usługi.

## Zasady dotyczące połączeń

Społeczności mogą ograniczać publikacje przychodzące przez Tor, VPN (w tym iCloud Private Relay), serwery proxy i centra danych. W usłudze hostowanej:

- **Połączenia przez VPN, proxy i z centrów danych** mogą publikować po zalogowaniu. Strona wyjaśnia, dlaczego logowanie jest potrzebne i jak publikować bez niego, wyłączając VPN. Ban w społeczności obejmuje wtedy również konto użyte do logowania.
- **Konta o ugruntowanej pozycji**, które przeszły kontrolę w 3 różnych dniach z nieograniczonych połączeń, są zwolnione z ograniczeń.
- **Tor** pozostaje ograniczony, z wyjątkiem autorów objętych zwolnieniem skonfigurowanym przez społeczność: rolą moderatora, białą listą społeczności lub zweryfikowaną nazwą `.bso`.

Załączone pliki przesyłane do Forge Images podlegają tym samym zasadom. Przez VPN, proxy lub połączenie z centrum danych przesłanie wymaga kontroli wstępnej zaliczonej z logowaniem albo konta o ugruntowanej pozycji. Przez Tor wymaga zweryfikowanego zwolnienia.

## Prywatność

- **Operator** przechowuje surowe adresy IP i treść publikacji w celu wykrywania nadużyć oraz wysyła adresy IP do klasyfikacji zewnętrznemu dostawcy (domyślnie proxycheck.io).
- **Społeczności** otrzymują tylko kod kraju, ryzyko IP, szacowany typ połączenia oraz wynik: zaliczone lub niezaliczone. Nigdy nie otrzymują surowego adresu IP ani konta użytego do logowania.
- **Logowania** nie żądają żadnych danych profilu. Usługa otrzymuje od Google, Apple lub Telegram wyłącznie identyfikator konta; nigdy nie dostaje nazwy, adresu e-mail ani zdjęcia. Przechowuje ten identyfikator razem z wpisem, bez automatycznego usuwania, dzięki czemu ban obejmuje również konto.
- **Autorzy korzystający z VPN** zachowują swój prawdziwy adres IP w ukryciu podczas logowania: usługa widzi tylko adres VPN.

## Ograniczanie liczby żądań

Jeszcze przed oceną usługa odrzuca autorów, którzy przekroczyli godzinowy lub dzienny budżet wpisów, odpowiedzi i głosów. Budżety rosną wraz z wiekiem konta i dobrą reputacją, a maleją po banach lub usunięciach.

## API

Główne trasy, względem `spamblocker.bitsocial.net/api/v1`:

| Trasa                    | Wywołujący                   | Przeznaczenie                              |
| ------------------------ | ---------------------------- | ------------------------------------------ |
| `POST /evaluate`         | Iframe wyzwania, społeczność | Ocenia publikację i tworzy jej sesję       |
| `POST /challenge/verify` | Społeczność                  | Odczytuje wynik sesji i dane o adresie IP  |
| `POST /precheck`         | Iframe kontroli wstępnej     | Ocenia szkic przed przesłaniem             |
| `GET /iframe/:sessionId` | Przeglądarka autora          | Strona weryfikacji                         |
| `POST /upload/authorize` | Klient autora                | Autoryzuje załączony plik dla Forge Images |

Pełny kontrakt, w tym podpisywanie żądań i schematy odpowiedzi, znajduje się w [README repozytorium spam-blocker](https://github.com/bitsocialnet/spam-blocker#api-contract).
