---
title: Spam Blocker
description: Bitsocial toplulukları için risk puanlaması, CAPTCHA ve oturum açma denetimleri ile bağlantı politikaları sunan barındırılan spam tespiti.
sidebar_position: 1
---

# Spam Blocker

Spam Blocker, bir topluluk kabul etmeden önce gönderileri, yanıtları ve oyları spam riski açısından puanlar. Topluluk, her yayını bir Spam Blocker hizmetine gönderen sınama paketini kurar. Bitsocial böyle bir hizmeti `spamblocker.bitsocial.net` adresinde çalıştırır.

- **`@bitsocial/spam-blocker-challenge`**, toplulukların kurduğu açık kaynaklı sınama paketidir. Entegrasyon sözleşmesi, ortak şemaları ve API'si herkese açıktır.
- **Barındırılan hizmet** yayınları puanlar ve CAPTCHA ile oturum açma sayfalarını sunar. Ayrıntılı ağırlıkları ve sezgisel kuralları, [kaynak politikasında](https://github.com/bitsocialnet/spam-blocker/blob/master/docs/architecture/hosted-service-source-policy.md) açıklandığı gibi gizlidir.

**Kaynak kodu:** [github.com/bitsocialnet/spam-blocker](https://github.com/bitsocialnet/spam-blocker)

## Bir yayın nasıl denetlenir

1. Topluluğun sınaması imzalı yayını hizmete gönderir; hizmet 0 ile 1 arasında bir risk puanı döndürür.
2. Puan topluluğun otomatik kabul eşiğinin altındaysa yayın geçer. Otomatik ret eşiğinde ya da üzerindeyse yayın reddedilir ve yazar nedenini görür.
3. İkisinin arasındaysa, yazarın son 30 gün içindeki oturum açması yeterliyse yeniden kullanılır. Aksi hâlde yazara bir doğrulama sayfası gösterilir: tek başına bir CAPTCHA yetebiliyorsa CAPTCHA, yetmiyorsa oturum açma.
4. Ardından topluluk sonucu hizmetle denetler ve ülke, IP riski ve bağlantı türü için kendi kurallarını uygular.

Ekli bir dosya yüklenmeden önce istemci aynı denetimi bir ön kontrol olarak çalıştırabilir; böylece reddedilecek yazarlar hiç yükleme yapmaz.

## Risk puanı

| Sinyal                | Açıklama                                                                                                                                            |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hesap yaşı            | Yeni açılmış hesaplar daha yüksek risk puanı alır.                                                                                                  |
| Karma                 | Biriken topluluk karması riski azaltır.                                                                                                             |
| Yazar itibarı         | Topluluklar genelinde hangi yazarların kabul edildiğini, kaldırıldığını veya yasaklandığını izleyen bir arka plan indeksleyicisinden gelen veriler. |
| İçerik ve bağlantılar | Tekrarlanan içerik dâhil metin ve bağlantı analizi.                                                                                                 |
| Hız                   | Aynı yazardan art arda gelen hızlı gönderiler riski artırır.                                                                                        |
| IP istihbaratı        | Bağlantı türü (Tor, VPN, proxy, veri merkezi) ve IP riski. Ham IP adresleri topluluklarla asla paylaşılmaz.                                         |
| İlişkili hesaplar     | Tek bir ağdan gönderi yapan çok sayıda hesap riski kademeli olarak artırır.                                                                         |
| Sosyal doğrulama      | Yazarın hesabıyla daha önce yapılmış oturum açmalar riski düşürür.                                                                                  |

## Doğrulama

Tamamlanan her adım risk puanını bir çarpanla çarpar ve sonuç 0.4'ün altında olduğunda yayın geçer.

| Adım                                        | Çarpan          |
| ------------------------------------------- | --------------- |
| CAPTCHA (Cloudflare Turnstile)              | × 0.7           |
| Google, Apple veya Telegram ile oturum açma | × 0.6           |
| İkinci, farklı bir sağlayıcıyla oturum açma | ek olarak × 0.5 |

Yetmeyen bir CAPTCHA'nın ardından oturum açma gelir. Yetmeyen bir oturum açmanın ardından, denetimi tamamlayacaksa bir CAPTCHA, aksi hâlde ikinci bir sağlayıcıyla oturum açma gelir.

### Hatırlanan oturum açmalar

Hizmet, yazarın en son hangi hesapla oturum açtığını hatırlar. Yazar bu hesapla en az 30 günde bir gönderi yapmaya devam ettiği sürece, doğrulama gerektiren sonraki bir gönderi bu hesabı, yazar tekrar oturum açmış gibi yeniden kullanır. Bu yeterli olduğunda gönderi CAPTCHA olmadan geçer. Toplulukta hesaba bağlanan bir yasak bu durumu sona erdirir; hesabın sağlayıcısının hizmetten kaldırılması da öyle.

## Bağlantı politikaları

Topluluklar Tor, VPN (iCloud Private Relay dâhil), proxy ve veri merkezi bağlantılarından gelen yayınları kısıtlayabilir. Barındırılan hizmette:

- **VPN, proxy ve veri merkezi bağlantıları** oturum açtıktan sonra gönderi yapabilir. Sayfa, oturum açmanın neden gerektiğini ve VPN kapatılarak oturum açmadan nasıl gönderi yapılabileceğini açıklar. Bu durumda topluluktaki bir yasak, oturum açmak için kullanılan hesaba da uygulanır.
- **Köklü hesaplar**, yani kısıtlanmamış bağlantılardan 3 ayrı günde bir denetimi geçmiş hesaplar, muaftır.
- **Tor** kısıtlı kalır; yalnızca topluluğun yapılandırdığı bir muafiyete sahip yazarlar bunun dışındadır: moderatör rolü, topluluğun beyaz listesi ya da doğrulanmış bir `.bso` adı.

Forge Images'a yüklenen ekli dosyalar da aynı kurallara tabidir. VPN, proxy veya veri merkezi bağlantısı üzerinden yükleme için oturum açılarak geçilmiş bir ön kontrol ya da köklü bir hesap gerekir. Tor üzerinden ise doğrulanmış bir muafiyet gerekir.

## Gizlilik

- **Operatör**, kötüye kullanımı tespit etmek için ham IP adreslerini ve yayın içeriğini saklar ve sınıflandırma için IP adreslerini üçüncü taraf bir sağlayıcıya gönderir (varsayılan olarak proxycheck.io).
- **Topluluklar** yalnızca ülke kodunu, IP riskini, bağlantı türü tahminini ve geçti ya da kaldı sonucunu alır. Ham IP'yi veya oturum açılan hesabı asla almazlar.
- **Oturum açma** hiçbir profil verisi istemez. Hizmet Google, Apple veya Telegram'dan yalnızca bir hesap kimliği alır; ad, e-posta veya fotoğraf asla almaz. Kimliği otomatik silme olmadan gönderiyle birlikte saklar; böylece bir yasak hesaba da uygulanır.
- **VPN kullanan yazarlar**, oturum açtıklarında gerçek IP adreslerini gizli tutar: hizmet yalnızca VPN'in adresini görür.

## Hız sınırlama

Hizmet, puanlamadan önce gönderiler, yanıtlar ve oylar için saatlik ya da günlük kotasını aşan yazarları reddeder. Kotalar hesap yaşı ve iyi itibarla büyür, yasaklar ya da kaldırmalardan sonra küçülür.

## API

`spamblocker.bitsocial.net/api/v1` adresine göre ana rotalar:

| Rota                     | Çağıran                   | Amaç                                             |
| ------------------------ | ------------------------- | ------------------------------------------------ |
| `POST /evaluate`         | Sınama iframe'i, topluluk | Bir yayını puanlar ve oturumunu oluşturur        |
| `POST /challenge/verify` | Topluluk                  | Oturum sonucunu ve IP istihbaratını okur         |
| `POST /precheck`         | Ön kontrol iframe'i       | Bir taslağı yüklemeden önce puanlar              |
| `GET /iframe/:sessionId` | Yazarın tarayıcısı        | Doğrulama sayfası                                |
| `POST /upload/authorize` | Yazarın istemcisi         | Ekli bir dosyayı Forge Images için yetkilendirir |

İstek imzalama ve yanıt şemaları dâhil tam sözleşme, [spam-blocker README'sinde](https://github.com/bitsocialnet/spam-blocker#api-contract) yer alır.
