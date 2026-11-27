---
title: SpamBlocker
description: Détection du spam hébergée pour les communautés Bitsocial, avec score de risque, vérifications par CAPTCHA et par authentification, et règles selon le type de connexion.
sidebar_position: 1
---

# SpamBlocker

SpamBlocker attribue aux posts, réponses et votes un score de risque de spam avant qu'une communauté les accepte. Une communauté installe le package de défi, qui envoie chaque publication à un service SpamBlocker. Bitsocial en exploite un sur `spamblocker.bitsocial.net`.

- **`@bitsocial/spam-blocker-challenge`** est le package de défi open source que les communautés installent. Son contrat d'intégration, ses schémas partagés et son API sont publics.
- **Le service hébergé** attribue les scores aux publications et fournit les pages de CAPTCHA et d'authentification. Ses pondérations et heuristiques détaillées sont privées, comme l'explique la [politique relative au code source](https://github.com/bitsocialnet/spamblocker/blob/master/docs/architecture/hosted-service-source-policy.md).

**Code source :** [github.com/bitsocialnet/spamblocker](https://github.com/bitsocialnet/spamblocker)

## Comment une publication est vérifiée

1. Le défi de la communauté envoie la publication signée au service, qui renvoie un score de risque compris entre 0 et 1.
2. En dessous du seuil d'acceptation automatique de la communauté, la publication est acceptée. À partir de son seuil de rejet automatique, elle est refusée et l'auteur en voit la raison.
3. Entre les deux, l'authentification mémorisée de l'auteur est réutilisée si elle suffit. Sinon, l'auteur reçoit une page de vérification : un CAPTCHA lorsqu'un CAPTCHA seul peut suffire, ou une authentification. Via une connexion VPN, proxy ou centre de données que la communauté restreint, l'auteur doit s'authentifier pour tout score inférieur au seuil de rejet automatique, sauf si une exemption prévue dans la section Règles selon le type de connexion s'applique.
4. La communauté vérifie ensuite le résultat auprès du service et applique ses propres règles concernant le pays, le risque IP et le type de connexion.

Avant de téléverser un fichier joint, un client peut lancer la même vérification sous forme de pré-vérification, ce qui évite un téléversement à la plupart des auteurs qui seraient rejetés. La publication est de nouveau vérifiée au moment où elle est publiée, si bien qu'elle peut encore échouer après une pré-vérification réussie.

## Score de risque

| Signal                 | Description                                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Âge du compte          | Les comptes les plus récents reçoivent des scores de risque plus élevés.                                                                   |
| Karma                  | Le karma communautaire accumulé réduit le risque.                                                                                          |
| Réputation de l'auteur | Données d'un indexeur en arrière-plan qui suit quels auteurs sont acceptés, supprimés ou bannis dans les différentes communautés.          |
| Contenu et liens       | Analyse du texte et des liens, y compris le contenu répété.                                                                                |
| Vitesse                | Les publications successives rapides du même auteur augmentent le risque.                                                                  |
| Renseignements IP      | Type de connexion (Tor, VPN, proxy, centre de données) et risque IP. Les adresses IP brutes ne sont jamais partagées avec les communautés. |
| Comptes liés           | De nombreux comptes publiant depuis un même réseau augmentent progressivement le risque.                                                   |
| Vérification sociale   | Les authentifications précédentes sur le compte de l'auteur réduisent le risque.                                                           |

## Vérification

Chaque étape réussie multiplie le score de risque, et la publication est acceptée lorsque le résultat est inférieur à 0.4.

| Étape                                                             | Multiplicateur       |
| ----------------------------------------------------------------- | -------------------- |
| CAPTCHA (Cloudflare Turnstile)                                    | × 0.7                |
| Authentification avec Google, Apple ou Telegram                   | × 0.6                |
| Authentification avec un second fournisseur, différent du premier | × 0.5 supplémentaire |

Un CAPTCHA insuffisant est suivi d'une authentification. Une authentification insuffisante est suivie d'un CAPTCHA si celui-ci suffit à terminer la vérification, et sinon d'une authentification avec un second fournisseur.

### Authentifications mémorisées

Le service mémorise le compte avec lequel un auteur s'est authentifié en dernier. Une publication ultérieure qui nécessite une vérification le réutilise, comme si l'auteur s'était de nouveau authentifié, si l'une des publications de l'auteur l'a utilisé au cours des 30 derniers jours. Une réutilisation compte comme une telle publication, si bien que les 30 jours repartent à zéro à chaque réutilisation. Lorsque cela suffit, la publication est acceptée sans CAPTCHA. Un bannissement dans la communauté lié au compte y met fin, tout comme le retrait de son fournisseur du service.

## Règles selon le type de connexion

Les communautés peuvent restreindre les publications provenant de connexions Tor, VPN (y compris iCloud Private Relay), proxy et centre de données. Sur le service hébergé :

- **Les connexions VPN, proxy et centre de données** permettent de publier après une authentification. La page explique pourquoi l'authentification est nécessaire et comment publier sans elle en désactivant le VPN. Un bannissement dans la communauté s'applique alors aussi au compte utilisé pour s'authentifier.
- **Les comptes établis** sont exemptés des restrictions VPN, proxy et centre de données, mais pas de celle visant Tor. Un compte devient établi après avoir réussi un CAPTCHA ou une authentification à 3 jours différents depuis des connexions non restreintes ; les publications acceptées sans l'un ni l'autre ne comptent pas. Un réseau ne compte que pour un seul compte : dès qu'un autre compte réussit une vérification depuis ce réseau, celui-ci ne compte plus pour aucun des deux. Dans une communauté qui a banni un compte sur l'un de ces réseaux, rien de cet historique ne compte.
- **Tor** reste restreint, sauf pour les auteurs bénéficiant d'une exemption configurée par la communauté : un rôle de modérateur, la liste blanche de la communauté ou un nom `.bso` vérifié.

Les fichiers joints téléversés sur Forge Images suivent les mêmes règles. Via une connexion VPN, proxy ou centre de données, le téléversement nécessite une pré-vérification réussie avec une authentification, ou un compte établi. Via Tor, il nécessite une exemption vérifiée.

## Confidentialité

- **L'opérateur** stocke les adresses IP brutes et le contenu des publications pour détecter les abus, et envoie les adresses IP à un fournisseur tiers pour les classer (proxycheck.io par défaut).
- **Les communautés** reçoivent uniquement le code pays, le risque IP, l'estimation du type de connexion et le résultat (réussite ou échec). Elles ne reçoivent jamais l'adresse IP brute ni le compte utilisé pour l'authentification.
- **Les authentifications** ne demandent aucune donnée de profil. Le service reçoit uniquement un identifiant de compte de Google, Apple ou Telegram, jamais de nom, d'adresse e-mail ni de photo. Il conserve l'identifiant avec la publication, sans suppression automatique, de sorte qu'un bannissement s'applique aussi au compte.
- **Les auteurs derrière un VPN** gardent leur véritable adresse IP cachée lorsqu'ils s'authentifient : le service ne voit que l'adresse du VPN.

## Limitation du débit

Avant de calculer le score, le service rejette les auteurs qui dépassent leur quota horaire ou quotidien de posts, de réponses et de votes. Les quotas augmentent avec l'âge du compte et une bonne réputation, et diminuent après des bannissements ou des suppressions.

## API

Les principales routes, relatives à `spamblocker.bitsocial.net/api/v1` :

| Route                    | Appelant                   | Rôle                                                     |
| ------------------------ | -------------------------- | -------------------------------------------------------- |
| `POST /evaluate`         | Iframe du défi, communauté | Attribuer un score à une publication et créer sa session |
| `POST /challenge/verify` | Communauté                 | Lire le résultat de la session et les renseignements IP  |
| `POST /precheck`         | Iframe de pré-vérification | Attribuer un score à un brouillon avant le téléversement |
| `GET /iframe/:sessionId` | Navigateur de l'auteur     | Page de vérification                                     |
| `POST /upload/authorize` | Client de l'auteur         | Autoriser un fichier joint pour Forge Images             |

Le contrat complet, y compris la signature des requêtes et les schémas de réponse, se trouve dans le [README de spamblocker](https://github.com/bitsocialnet/spamblocker#api-contract).
