---
title: Spam Blocker
description: Naka-host na pag-detect ng spam para sa mga komunidad ng Bitsocial, na may pagmamarka ng panganib, mga pagsusuri sa pamamagitan ng CAPTCHA at pag-sign in, at mga patakaran sa koneksyon.
sidebar_position: 1
---

# Spam Blocker

Binibigyan ng Spam Blocker ng marka ng panganib sa spam ang mga post, reply at boto bago tanggapin ng isang komunidad ang mga ito. Nag-i-install ang isang komunidad ng pakete ng hamon, na nagpapadala ng bawat publikasyon sa isang serbisyo ng Spam Blocker. Nagpapatakbo ang Bitsocial ng isa sa `spamblocker.bitsocial.net`.

- **`@bitsocial/spam-blocker-challenge`** ang open-source na pakete ng hamon na ini-install ng mga komunidad. Pampubliko ang integration contract, mga shared schema at API nito.
- **Ang naka-host na serbisyo** ang nagmamarka sa mga publikasyon at naghahatid ng mga pahina ng CAPTCHA at pag-sign in. Pribado ang mga detalyadong timbang at heuristic nito, gaya ng ipinapaliwanag ng [patakaran sa source code](https://github.com/bitsocialnet/spam-blocker/blob/master/docs/architecture/hosted-service-source-policy.md).

**Source code:** [github.com/bitsocialnet/spam-blocker](https://github.com/bitsocialnet/spam-blocker)

## Paano sinusuri ang isang publikasyon

1. Ipinapadala ng hamon ng komunidad ang nilagdaang publikasyon sa serbisyo, na nagbabalik ng marka ng panganib sa pagitan ng 0 at 1.
2. Kapag mas mababa sa auto-accept threshold ng komunidad, papasa ang publikasyon. Kapag nasa o lampas sa auto-reject threshold nito, babagsak ito at makikita ng may-akda kung bakit.
3. Sa pagitan ng dalawang ito, muling ginagamit ang pag-sign in ng may-akda sa nakaraang 30 araw kapag sapat na ito. Kung hindi, makakatanggap ang may-akda ng pahina ng pag-verify: isang CAPTCHA kapag kayang makapasa sa CAPTCHA lamang, o isang pag-sign in.
4. Pagkatapos, sinusuri ng komunidad ang resulta sa serbisyo at inilalapat ang sarili nitong mga panuntunan para sa bansa, IP risk at uri ng koneksyon.

Bago mag-upload ng naka-attach na file, maaaring patakbuhin ng isang client ang parehong pagsusuri bilang paunang pagsusuri, para hindi na kailanman makapag-upload ang mga may-akdang tatanggihan.

## Marka ng panganib

| Signal                   | Paglalarawan                                                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Edad ng account          | Ang mga bagong account ay tumatanggap ng mas mataas na marka ng panganib.                                                                   |
| Karma                    | Ang naipon na karma ng komunidad ay nagpapababa ng panganib.                                                                                |
| Reputasyon ng may-akda   | Data mula sa isang background indexer na sumusubaybay kung aling mga may-akda ang tinatanggap, inaalis o bina-ban sa iba't ibang komunidad. |
| Nilalaman at mga link    | Pagsusuri ng teksto at mga link, kasama ang paulit-ulit na nilalaman.                                                                       |
| Bilis                    | Ang mabilis na sunud-sunod na mga post mula sa parehong may-akda ay nagpapataas ng panganib.                                                |
| IP intelligence          | Uri ng koneksyon (Tor, VPN, proxy, datacenter) at IP risk. Ang mga hilaw na IP address ay hindi kailanman ibinabahagi sa mga komunidad.     |
| Mga naka-link na account | Unti-unting tumataas ang panganib kapag maraming account ang nagpo-post mula sa iisang network.                                             |
| Social na pag-verify     | Pinabababa ng mga naunang pag-sign in sa account ng may-akda ang panganib.                                                                  |

## Pag-verify

Minu-multiply ng bawat natapos na hakbang ang marka ng panganib, at papasa ang publikasyon kapag mas mababa sa 0.4 ang resulta.

| Hakbang                                           | Multiplier        |
| ------------------------------------------------- | ----------------- |
| CAPTCHA (Cloudflare Turnstile)                    | × 0.7             |
| Pag-sign in gamit ang Google, Apple o Telegram    | × 0.6             |
| Pag-sign in gamit ang pangalawa at ibang provider | karagdagang × 0.5 |

Kapag hindi sapat ang CAPTCHA, susundan ito ng pag-sign in. Kapag hindi sapat ang pag-sign in, susundan ito ng CAPTCHA kung iyon na ang tatapos sa pagsusuri, at kung hindi, ng pag-sign in gamit ang pangalawang provider.

### Mga naaalalang pag-sign in

Naaalala ng serbisyo ang account na huling ginamit ng may-akda sa pag-sign in. Muli itong ginagamit ng susunod na post na nangangailangan ng pag-verify, na para bang nag-sign in muli ang may-akda, basta't patuloy na nagpo-post ang may-akda gamit ito nang hindi bababa sa isang beses kada 30 araw. Kapag sapat na iyon, papasa ang post nang walang CAPTCHA. Natatapos ito kapag may ban sa komunidad na naka-link sa account, at gayundin kapag inalis ang provider nito sa serbisyo.

## Mga patakaran sa koneksyon

Maaaring higpitan ng mga komunidad ang mga publikasyon mula sa mga koneksyong Tor, VPN (kasama ang iCloud Private Relay), proxy at datacenter. Sa naka-host na serbisyo:

- **Ang mga koneksyong VPN, proxy at datacenter** ay maaaring mag-post pagkatapos mag-sign in. Ipinapaliwanag ng pahina kung bakit kailangan ang pag-sign in at kung paano mag-post nang wala nito sa pamamagitan ng pag-off sa VPN. Pagkatapos nito, nalalapat din ang ban sa komunidad sa account na ginamit sa pag-sign in.
- **Ang mga matatag na account**, na pumasa sa isang pagsusuri sa 3 magkakahiwalay na araw mula sa mga koneksyong walang paghihigpit, ay hindi saklaw ng paghihigpit.
- **Ang Tor** ay nananatiling may paghihigpit, maliban sa mga may-akdang may exemption na na-configure ng komunidad: role ng moderator, whitelist ng komunidad, o na-verify na pangalang `.bso`.

Sinusunod ng mga naka-attach na file na ina-upload sa Forge Images ang parehong mga panuntunan. Sa pamamagitan ng koneksyong VPN, proxy o datacenter, kailangan ng upload ang isang paunang pagsusuri na pumasa gamit ang pag-sign in, o isang matatag na account. Sa pamamagitan ng Tor, kailangan nito ang isang na-verify na exemption.

## Pagkapribado

- **Ang operator** ay nag-iimbak ng mga hilaw na IP address at nilalaman ng mga publikasyon para matukoy ang pang-aabuso, at ipinapadala ang mga IP address sa isang third-party na provider para ma-classify (proxycheck.io bilang default).
- **Ang mga komunidad** ay tumatanggap lamang ng country code, IP risk, tantiya ng uri ng koneksyon at resulta kung pumasa o bumagsak. Hindi nila kailanman natatanggap ang hilaw na IP o ang account na ginamit sa pag-sign in.
- **Ang mga pag-sign in** ay hindi humihingi ng anumang data ng profile. Account ID lamang mula sa Google, Apple o Telegram ang natatanggap ng serbisyo, hindi kailanman pangalan, email o larawan. Itinatago nito ang ID kasama ng post, nang walang awtomatikong pagbura, kaya nalalapat din ang ban sa account.
- **Ang mga may-akdang naka-VPN** ay nananatiling nakatago ang tunay na IP address kapag nag-sign in: ang address lang ng VPN ang nakikita ng serbisyo.

## Paglilimita sa rate

Bago magmarka, tinatanggihan ng serbisyo ang mga may-akdang lumampas sa kanilang oras-oras o araw-araw na budget para sa mga post, reply at boto. Lumalaki ang mga budget habang tumatanda ang account at gumaganda ang reputasyon, at lumiliit pagkatapos ng mga ban o pag-aalis.

## API

Ang mga pangunahing ruta, kaugnay ng `spamblocker.bitsocial.net/api/v1`:

| Ruta                     | Tumatawag                   | Layunin                                                         |
| ------------------------ | --------------------------- | --------------------------------------------------------------- |
| `POST /evaluate`         | Iframe ng hamon, komunidad  | Markahan ang isang publikasyon at gumawa ng session nito        |
| `POST /challenge/verify` | Komunidad                   | Basahin ang resulta ng session at ang IP intelligence           |
| `POST /precheck`         | Iframe ng paunang pagsusuri | Markahan ang isang draft bago i-upload                          |
| `GET /iframe/:sessionId` | Browser ng may-akda         | Pahina ng pag-verify                                            |
| `POST /upload/authorize` | Client ng may-akda          | Pahintulutan ang isang naka-attach na file para sa Forge Images |

Nasa [README ng spam-blocker](https://github.com/bitsocialnet/spam-blocker#api-contract) ang buong kontrata, kasama ang paglagda sa mga request at ang mga schema ng response.
