---
title: Spam Blocker
description: Detección de spam alojada para comunidades de Bitsocial, con puntuación de riesgo, comprobaciones con CAPTCHA e inicio de sesión, y políticas de conexión.
sidebar_position: 1
---

# Spam Blocker

Spam Blocker asigna a las publicaciones, respuestas y votos una puntuación de riesgo de spam antes de que una comunidad los acepte. Una comunidad instala el paquete de desafío, que envía cada publicación a un servicio de Spam Blocker. Bitsocial gestiona uno en `spamblocker.bitsocial.net`.

- **`@bitsocial/spam-blocker-challenge`** es el paquete de desafío de código abierto que instalan las comunidades. Su contrato de integración, sus esquemas compartidos y su API son públicos.
- **El servicio alojado** puntúa las publicaciones y sirve las páginas de CAPTCHA y de inicio de sesión. Sus ponderaciones y heurísticas detalladas son privadas, como explica la [política de código fuente](https://github.com/bitsocialnet/spam-blocker/blob/master/docs/architecture/hosted-service-source-policy.md).

**Código fuente:** [github.com/bitsocialnet/spam-blocker](https://github.com/bitsocialnet/spam-blocker)

## Cómo se comprueba una publicación

1. El desafío de la comunidad envía la publicación firmada al servicio, que devuelve una puntuación de riesgo entre 0 y 1.
2. Por debajo del umbral de aceptación automática de la comunidad, la publicación se acepta. En su umbral de rechazo automático o por encima de él, se rechaza y el autor ve el motivo.
3. Entre ambos umbrales, se reutiliza el inicio de sesión del autor de los últimos 30 días cuando basta. De lo contrario, el autor recibe una página de verificación: un CAPTCHA cuando un CAPTCHA por sí solo puede bastar para aprobar, o un inicio de sesión.
4. Después, la comunidad comprueba el resultado con el servicio y aplica sus propias reglas de país, riesgo de IP y tipo de conexión.

Antes de subir un archivo adjunto, un cliente puede ejecutar la misma comprobación como verificación previa, de modo que los autores que serían rechazados nunca llegan a subirlo.

## Puntuación de riesgo

| Señal                   | Descripción                                                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Antigüedad de la cuenta | Las cuentas más nuevas reciben puntuaciones de riesgo más altas.                                                                            |
| Karma                   | El karma comunitario acumulado reduce el riesgo.                                                                                            |
| Reputación del autor    | Datos de un indexador en segundo plano que registra qué autores son aceptados, eliminados o expulsados en las distintas comunidades.        |
| Contenido y enlaces     | Análisis de texto y enlaces, incluido el contenido repetido.                                                                                |
| Velocidad               | Las publicaciones sucesivas y rápidas del mismo autor aumentan el riesgo.                                                                   |
| Inteligencia de IP      | Tipo de conexión (Tor, VPN, proxy, centro de datos) y riesgo de IP. Las direcciones IP sin procesar nunca se comparten con las comunidades. |
| Cuentas vinculadas      | Muchas cuentas que publican desde una misma red aumentan el riesgo de forma progresiva.                                                     |
| Verificación social     | Los inicios de sesión anteriores en la cuenta del autor reducen el riesgo.                                                                  |

## Verificación

Cada paso completado multiplica la puntuación de riesgo, y la publicación se acepta cuando el resultado es inferior a 0.4.

| Paso                                               | Multiplicador |
| -------------------------------------------------- | ------------- |
| CAPTCHA (Cloudflare Turnstile)                     | × 0.7         |
| Inicio de sesión con Google, Apple o Telegram      | × 0.6         |
| Inicio de sesión con un segundo proveedor distinto | otro × 0.5    |

Si un CAPTCHA no basta, le sigue un inicio de sesión. Si un inicio de sesión no basta, le sigue un CAPTCHA cuando con eso se completa la comprobación y, si no, un inicio de sesión con un segundo proveedor.

### Inicios de sesión recordados

El servicio recuerda la cuenta con la que un autor inició sesión por última vez. Una publicación posterior que necesite verificación la reutiliza, como si el autor hubiera vuelto a iniciar sesión, siempre que el autor siga publicando con ella al menos una vez cada 30 días. Cuando eso basta, la publicación se acepta sin CAPTCHA. Esto termina si la comunidad aplica una expulsión vinculada a la cuenta, y también si se retira su proveedor del servicio.

## Políticas de conexión

Las comunidades pueden restringir las publicaciones procedentes de conexiones Tor, VPN (incluido iCloud Private Relay), proxy y de centros de datos. En el servicio alojado:

- **Las conexiones VPN, proxy y de centros de datos** pueden publicar tras iniciar sesión. La página explica por qué hace falta iniciar sesión y cómo publicar sin hacerlo desactivando la VPN. A partir de entonces, una expulsión en la comunidad también se aplica a la cuenta usada para iniciar sesión.
- **Las cuentas consolidadas**, que superaron una comprobación en 3 días distintos desde conexiones sin restricciones, están exentas.
- **Tor** sigue restringido, salvo para los autores con una exención configurada por la comunidad: un rol de moderador, la lista blanca de la comunidad o un nombre `.bso` verificado.

Los archivos adjuntos que se suben a Forge Images siguen las mismas reglas. A través de una conexión VPN, proxy o de centro de datos, la subida necesita una verificación previa superada con un inicio de sesión, o una cuenta consolidada. A través de Tor, necesita una exención verificada.

## Privacidad

- **El operador** almacena las direcciones IP sin procesar y el contenido de las publicaciones para detectar abusos, y envía las direcciones IP a un proveedor externo para clasificarlas (proxycheck.io de forma predeterminada).
- **Las comunidades** solo reciben el código de país, el riesgo de la IP, la estimación del tipo de conexión y el resultado de aprobado o rechazado. Nunca reciben la IP sin procesar ni la cuenta de inicio de sesión.
- **Los inicios de sesión** no solicitan datos de perfil. El servicio solo recibe un ID de cuenta de Google, Apple o Telegram, nunca un nombre, un correo electrónico ni una foto. Guarda el ID junto con la publicación, sin eliminación automática, para que una expulsión también se aplique a la cuenta.
- **Los autores que usan una VPN** mantienen oculta su dirección IP real al iniciar sesión: el servicio solo ve la dirección de la VPN.

## Limitación de tasa

Antes de puntuar, el servicio rechaza a los autores que superan su cupo horario o diario de publicaciones, respuestas y votos. Los cupos aumentan con la antigüedad de la cuenta y la buena reputación, y se reducen tras expulsiones o eliminaciones.

## API

Las rutas principales, relativas a `spamblocker.bitsocial.net/api/v1`:

| Ruta                     | Quién la llama                | Propósito                                              |
| ------------------------ | ----------------------------- | ------------------------------------------------------ |
| `POST /evaluate`         | Iframe del desafío, comunidad | Puntuar una publicación y crear su sesión              |
| `POST /challenge/verify` | Comunidad                     | Leer el resultado de la sesión y la inteligencia de IP |
| `POST /precheck`         | Iframe de verificación previa | Puntuar un borrador antes de subirlo                   |
| `GET /iframe/:sessionId` | Navegador del autor           | Página de verificación                                 |
| `POST /upload/authorize` | Cliente del autor             | Autorizar un archivo adjunto para Forge Images         |

El contrato completo, incluidos la firma de solicitudes y los esquemas de respuesta, está en el [README de spam-blocker](https://github.com/bitsocialnet/spam-blocker#api-contract).
