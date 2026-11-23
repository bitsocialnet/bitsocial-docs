---
title: Spam Blocker
description: Detecção de spam hospedada para comunidades Bitsocial, com pontuação de risco, verificações por CAPTCHA e login e políticas de conexão.
sidebar_position: 1
---

# Spam Blocker

O Spam Blocker avalia o risco de spam de postagens, respostas e votos antes que uma comunidade os aceite. A comunidade instala o pacote de desafio, que envia cada publicação a um serviço de bloqueio de spam. O Bitsocial mantém um em `spamblocker.bitsocial.net`.

- **`@bitsocial/spam-blocker-challenge`** é o pacote de desafio de código aberto que as comunidades instalam. Seu contrato de integração, seus esquemas compartilhados e sua API são públicos.
- **O serviço hospedado** pontua as publicações e fornece as páginas de CAPTCHA e de login. Seus pesos e heurísticas detalhados são privados, como explica a [política de código-fonte](https://github.com/bitsocialnet/spam-blocker/blob/master/docs/architecture/hosted-service-source-policy.md).

**Código-fonte:** [github.com/bitsocialnet/spam-blocker](https://github.com/bitsocialnet/spam-blocker)

## Como uma publicação é verificada

1. O desafio da comunidade envia a publicação assinada ao serviço, que retorna uma pontuação de risco entre 0 e 1.
2. Abaixo do limiar de aceitação automática da comunidade, a publicação passa. No limiar de rejeição automática ou acima dele, ela é rejeitada e o autor vê o motivo.
3. Entre os dois limiares, o login lembrado do autor é reaproveitado quando basta. Caso contrário, o autor recebe uma página de verificação: um CAPTCHA, quando só um CAPTCHA pode bastar, ou um login. Por uma conexão VPN, proxy ou datacenter que a comunidade restringe, o autor precisa de um login com qualquer pontuação abaixo do limiar de rejeição automática, a menos que se aplique uma isenção descrita em Políticas de conexão.
4. Em seguida, a comunidade confere o resultado com o serviço e aplica suas próprias regras de país, risco do IP e tipo de conexão.

Antes de enviar um arquivo anexado, um cliente pode executar a mesma verificação como pré-verificação, o que poupa a maioria dos autores que seriam rejeitados de fazer o upload. A publicação é verificada de novo quando é publicada, então ainda pode ser rejeitada depois de passar em uma pré-verificação.

## Pontuação de risco

| Sinal              | Descrição                                                                                                                     |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Idade da conta     | Contas mais recentes recebem pontuações de risco mais altas.                                                                  |
| Karma              | O karma acumulado na comunidade reduz o risco.                                                                                |
| Reputação do autor | Dados de um indexador em segundo plano que acompanha quais autores são aceitos, removidos ou banidos nas comunidades.         |
| Conteúdo e links   | Análise de texto e de links, incluindo conteúdo repetido.                                                                     |
| Velocidade         | Publicações sucessivas e rápidas do mesmo autor aumentam o risco.                                                             |
| Inteligência de IP | Tipo de conexão (Tor, VPN, proxy, datacenter) e risco do IP. Endereços IP brutos nunca são compartilhados com as comunidades. |
| Contas vinculadas  | Muitas contas publicando a partir de uma mesma rede aumentam o risco progressivamente.                                        |
| Verificação social | Logins anteriores na conta do autor reduzem o risco.                                                                          |

## Verificação

Cada etapa concluída multiplica a pontuação de risco, e a publicação passa quando o resultado fica abaixo de 0.4.

| Etapa                                    | Multiplicador |
| ---------------------------------------- | ------------- |
| CAPTCHA (Cloudflare Turnstile)           | × 0.7         |
| Login com Google, Apple ou Telegram      | × 0.6         |
| Login com um segundo provedor, diferente | mais × 0.5    |

Um CAPTCHA que não basta é seguido de um login. Um login que não basta é seguido de um CAPTCHA, quando isso conclui a verificação, ou, caso contrário, de um login com um segundo provedor.

### Logins lembrados

O serviço lembra a conta com a qual o autor fez login pela última vez. Uma postagem posterior que precise de verificação reaproveita essa conta, como se o autor tivesse feito login de novo, quando alguma postagem do autor a usou nos últimos 30 dias. Um reaproveitamento conta como uma postagem desse tipo, então os 30 dias recomeçam a cada um. Quando isso basta, a postagem passa sem CAPTCHA. Um banimento na comunidade vinculado à conta encerra esse reaproveitamento, assim como a remoção do provedor dessa conta do serviço.

## Políticas de conexão

As comunidades podem restringir publicações vindas de conexões Tor, VPN (incluindo o iCloud Private Relay), proxy e datacenter. No serviço hospedado:

- **Conexões por VPN, proxy e datacenter** podem publicar após um login. A página explica por que o login é necessário e como publicar sem ele desligando a VPN. Um banimento na comunidade passa então a valer também para a conta usada no login.
- **Contas estabelecidas** ficam isentas das restrições de VPN, proxy e datacenter, mas não da restrição do Tor. Uma conta se torna estabelecida depois de passar por um CAPTCHA ou login em 3 dias diferentes a partir de conexões sem restrição; postagens aprovadas sem nenhum dos dois não contam. Uma rede só vale para uma conta: quando outra conta passa por uma verificação a partir dela, ela não vale para nenhuma das duas. Em uma comunidade que baniu uma conta em uma dessas redes, nada desse histórico conta.
- **Tor** continua restrito, exceto para autores com uma isenção configurada pela comunidade: um cargo de moderador, a lista de permissões da comunidade ou um nome `.bso` verificado.

Arquivos anexados enviados ao Forge Images seguem as mesmas regras. Por uma conexão VPN, proxy ou datacenter, o upload exige uma pré-verificação aprovada com login, ou uma conta estabelecida. Pelo Tor, exige uma isenção verificada.

## Privacidade

- **O operador** armazena endereços IP brutos e o conteúdo das publicações para detectar abusos, e envia os endereços IP a um provedor terceirizado para classificação (proxycheck.io por padrão).
- **As comunidades** recebem apenas o código do país, o risco do IP, a estimativa do tipo de conexão e o resultado de aprovação ou reprovação. Nunca recebem o IP bruto nem a conta de login.
- **Os logins** não solicitam dados de perfil. O serviço recebe apenas um ID de conta do Google, da Apple ou do Telegram, nunca nome, e-mail ou foto. Ele guarda o ID junto com a postagem, sem exclusão automática, para que um banimento também se aplique à conta.
- **Autores em uma VPN** mantêm o IP real oculto ao fazer login: o serviço vê apenas o endereço da VPN.

## Limitação de taxa

Antes de pontuar, o serviço rejeita autores que excedem o orçamento por hora ou por dia de postagens, respostas e votos. Os orçamentos crescem com a idade da conta e a boa reputação, e diminuem após banimentos ou remoções.

## API

As principais rotas, relativas a `spamblocker.bitsocial.net/api/v1`:

| Rota                     | Chamador                      | Finalidade                                       |
| ------------------------ | ----------------------------- | ------------------------------------------------ |
| `POST /evaluate`         | Iframe do desafio, comunidade | Pontuar uma publicação e criar a sessão dela     |
| `POST /challenge/verify` | Comunidade                    | Ler o resultado da sessão e a inteligência de IP |
| `POST /precheck`         | Iframe da pré-verificação     | Pontuar um rascunho antes do upload              |
| `GET /iframe/:sessionId` | Navegador do autor            | Página de verificação                            |
| `POST /upload/authorize` | Cliente do autor              | Autorizar um arquivo anexado para o Forge Images |

O contrato completo, incluindo a assinatura das requisições e os esquemas de resposta, está no [README do spam-blocker](https://github.com/bitsocialnet/spam-blocker#api-contract).
