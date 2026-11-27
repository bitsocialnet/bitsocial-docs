---
title: SpamBlocker
description: Hosted spam detection for Bitsocial communities, with risk scoring, CAPTCHA and sign-in checks, and connection policies.
sidebar_position: 1
---

# SpamBlocker

SpamBlocker scores posts, replies and votes for spam risk before a community accepts them. A community installs the challenge package, which sends each publication to a spam blocker service. Bitsocial runs one at `spamblocker.bitsocial.net`.

- **`@bitsocial/spam-blocker-challenge`** is the open-source challenge package that communities install. Its integration contract, shared schemas and API are public.
- **The hosted service** scores publications and serves the CAPTCHA and sign-in pages. Its detailed weights and heuristics are private, as the [source policy](https://github.com/bitsocialnet/spamblocker/blob/master/docs/architecture/hosted-service-source-policy.md) explains.

**Source code:** [github.com/bitsocialnet/spamblocker](https://github.com/bitsocialnet/spamblocker)

## How a publication is checked

1. The community's challenge sends the signed publication to the service, which returns a risk score between 0 and 1.
2. Below the community's auto-accept threshold, the publication passes. At or above its auto-reject threshold, it fails and the author sees why.
3. In between, the author's remembered sign-in is reused when it is enough. Otherwise the author gets a verification page: a CAPTCHA when a CAPTCHA alone can pass, or a sign-in. Through a VPN, proxy or datacenter connection the community restricts, the author needs a sign-in at any score below the auto-reject threshold, unless an exemption under Connection policies applies.
4. The community then checks the result with the service and applies its own rules for country, IP risk and connection type.

Before uploading an attached file, a client can run the same check as a pre-check, which spares most authors who would be rejected an upload. The publication is checked again when it is published, so it can still fail after a pre-check passed.

## Risk score

| Signal              | Description                                                                                                    |
| ------------------- | -------------------------------------------------------------------------------------------------------------- |
| Account age         | Newer accounts receive higher risk scores.                                                                     |
| Karma               | Accumulated community karma reduces risk.                                                                      |
| Author reputation   | Data from a background indexer that tracks which authors get accepted, removed or banned across communities.   |
| Content and links   | Text and link analysis, including repeated content.                                                            |
| Velocity            | Rapid successive posts from the same author increase risk.                                                     |
| IP intelligence     | Connection type (Tor, VPN, proxy, datacenter) and IP risk. Raw IP addresses are never shared with communities. |
| Linked accounts     | Many accounts posting from one network raise risk progressively.                                               |
| Social verification | Earlier sign-ins on the author's account lower risk.                                                           |

## Verification

Each completed step multiplies the risk score, and the publication passes when the result is below 0.4.

| Step                                      | Multiplier    |
| ----------------------------------------- | ------------- |
| CAPTCHA (Cloudflare Turnstile)            | × 0.7         |
| Sign-in with Google, Apple or Telegram    | × 0.6         |
| Sign-in with a second, different provider | another × 0.5 |

A CAPTCHA that is not enough is followed by a sign-in. A sign-in that is not enough is followed by a CAPTCHA when that finishes the check, and otherwise by a second provider.

### Remembered sign-ins

The service remembers the account an author last signed in with. A later post that needs verification reuses it, as if the author had signed in again, when one of the author's posts used it in the past 30 days. A reuse counts as such a post, so the 30 days restart with each one. When that is enough, the post passes with no CAPTCHA. This stops when a ban in the community is tied to the account, or when the service stops offering its provider.

## Connection policies

Communities can restrict publications from Tor, VPN (including iCloud Private Relay), proxy and datacenter connections. On the hosted service:

- **VPN, proxy and datacenter connections** can post after a sign-in. The page explains why the sign-in is needed and how to post without one by turning off the VPN. A ban in the community then also applies to the account used to sign in.
- **Established accounts** are exempt from the VPN, proxy and datacenter restrictions, but not from Tor's. An account is established after it passes a CAPTCHA or sign-in on 3 separate days from unrestricted connections; posts that passed without one do not count. A network counts toward only one account: once another account passes a check from it, it counts for neither. In a community that banned an account on one of those networks, none of the history counts.
- **Tor** stays restricted, except for authors with an exemption the community has configured: a moderator role, the community's whitelist, or a verified `.bso` name.

Attached files uploaded to Forge Images follow the same rules. Through a VPN, proxy or datacenter connection, the upload needs a pre-check that passed with a sign-in, or an established account. Through Tor, it needs a verified exemption.

## Privacy

- **The operator** stores raw IP addresses and publication content for abuse detection, and sends IP addresses to a third-party provider for classification (proxycheck.io by default).
- **Communities** receive only the country code, the IP risk, the connection type estimate and the pass or fail result. They never receive the raw IP or the sign-in account.
- **Sign-ins** request no profile data. The service receives only an account ID from Google, Apple or Telegram, never a name, email or photo. It keeps the ID with the post, with no automatic deletion, so a ban also applies to the account.
- **Authors on a VPN** keep their real IP address hidden when they sign in: the service sees only the VPN's address.

## Rate limiting

Before scoring, the service rejects authors who exceed their hourly or daily budget for posts, replies and votes. Budgets grow with account age and good reputation, and shrink after bans or removals.

## API

The main routes, relative to `spamblocker.bitsocial.net/api/v1`:

| Route                    | Caller                      | Purpose                                      |
| ------------------------ | --------------------------- | -------------------------------------------- |
| `POST /evaluate`         | Challenge iframe, community | Score a publication and create its session   |
| `POST /challenge/verify` | Community                   | Read the session outcome and IP intelligence |
| `POST /precheck`         | Pre-check iframe            | Score a draft before upload                  |
| `GET /iframe/:sessionId` | Author's browser            | Verification page                            |
| `POST /upload/authorize` | Author's client             | Authorize an attached file for Forge Images  |

The full contract, including request signing and response schemas, is in the [spamblocker README](https://github.com/bitsocialnet/spamblocker#api-contract).
