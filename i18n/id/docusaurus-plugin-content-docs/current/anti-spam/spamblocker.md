---
title: SpamBlocker
description: Deteksi spam yang di-hosting untuk komunitas Bitsocial, dengan penilaian risiko, pemeriksaan CAPTCHA dan login, serta kebijakan koneksi.
sidebar_position: 1
---

# SpamBlocker

SpamBlocker memberi skor risiko spam pada postingan, balasan, dan suara sebelum komunitas menerimanya. Komunitas memasang paket tantangan, yang mengirim setiap publikasi ke layanan SpamBlocker. Bitsocial menjalankan satu layanan tersebut di `spamblocker.bitsocial.net`.

- **`@bitsocial/spam-blocker-challenge`** adalah paket tantangan sumber terbuka yang dipasang oleh komunitas. Kontrak integrasi, skema bersama, dan API-nya bersifat publik.
- **Layanan yang di-hosting** memberi skor pada publikasi serta menyajikan halaman CAPTCHA dan login. Bobot dan heuristik terperincinya bersifat privat, sebagaimana dijelaskan dalam [kebijakan kode sumber](https://github.com/bitsocialnet/spamblocker/blob/master/docs/architecture/hosted-service-source-policy.md).

**Kode sumber:** [github.com/bitsocialnet/spamblocker](https://github.com/bitsocialnet/spamblocker)

## Cara publikasi diperiksa

1. Tantangan komunitas mengirim publikasi yang telah ditandatangani ke layanan, yang mengembalikan skor risiko antara 0 dan 1.
2. Di bawah ambang batas terima otomatis komunitas, publikasi lolos. Pada atau di atas ambang batas tolak otomatisnya, publikasi gagal dan penulis melihat alasannya.
3. Di antara keduanya, login penulis yang diingat digunakan kembali jika sudah cukup. Jika tidak, penulis mendapat halaman verifikasi: CAPTCHA jika CAPTCHA saja sudah bisa meloloskan publikasi, atau login. Melalui koneksi VPN, proxy, atau pusat data yang dibatasi komunitas, penulis perlu login pada skor berapa pun di bawah ambang batas tolak otomatis, kecuali berlaku pengecualian yang dijelaskan di bagian Kebijakan koneksi.
4. Komunitas lalu memeriksa hasilnya ke layanan dan menerapkan aturannya sendiri untuk negara, risiko IP, dan jenis koneksi.

Sebelum mengunggah berkas lampiran, klien dapat menjalankan pemeriksaan yang sama sebagai pra-pemeriksaan, sehingga sebagian besar penulis yang akan ditolak tidak perlu mengunggah. Publikasi diperiksa lagi saat dipublikasikan, jadi publikasi tetap bisa gagal meskipun pra-pemeriksaan sudah lolos.

## Skor risiko

| Sinyal            | Deskripsi                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Usia akun         | Akun yang lebih baru menerima skor risiko yang lebih tinggi.                                                             |
| Karma             | Akumulasi karma komunitas mengurangi risiko.                                                                             |
| Reputasi penulis  | Data dari pengindeks latar belakang yang melacak penulis mana yang diterima, dihapus, atau di-ban di berbagai komunitas. |
| Konten dan tautan | Analisis teks dan tautan, termasuk konten yang berulang.                                                                 |
| Kecepatan         | Postingan beruntun yang cepat dari penulis yang sama meningkatkan risiko.                                                |
| Intelijen IP      | Jenis koneksi (Tor, VPN, proxy, pusat data) dan risiko IP. Alamat IP mentah tidak pernah dibagikan kepada komunitas.     |
| Akun tertaut      | Banyak akun yang memposting dari satu jaringan menaikkan risiko secara bertahap.                                         |
| Verifikasi sosial | Login sebelumnya pada akun penulis menurunkan risiko.                                                                    |

## Verifikasi

Setiap langkah yang diselesaikan mengalikan skor risiko, dan publikasi lolos ketika hasilnya di bawah 0.4.

| Langkah                                   | Pengali    |
| ----------------------------------------- | ---------- |
| CAPTCHA (Cloudflare Turnstile)            | × 0.7      |
| Login dengan Google, Apple, atau Telegram | × 0.6      |
| Login dengan penyedia kedua yang berbeda  | × 0.5 lagi |

CAPTCHA yang tidak cukup dilanjutkan dengan login. Login yang tidak cukup dilanjutkan dengan CAPTCHA jika itu menyelesaikan pemeriksaan, dan jika tidak, dengan login melalui penyedia kedua.

### Login yang diingat

Layanan mengingat akun yang terakhir digunakan penulis untuk login. Postingan berikutnya yang memerlukan verifikasi menggunakannya kembali, seolah-olah penulis login lagi, jika salah satu postingan penulis menggunakannya dalam 30 hari terakhir. Penggunaan kembali dihitung sebagai postingan semacam itu, sehingga 30 hari dimulai ulang pada setiap penggunaan kembali. Jika itu sudah cukup, postingan lolos tanpa CAPTCHA. Ban di komunitas yang terkait dengan akun tersebut mengakhiri hal ini, begitu pula penghapusan penyedianya dari layanan.

## Kebijakan koneksi

Komunitas dapat membatasi publikasi dari koneksi Tor, VPN (termasuk iCloud Private Relay), proxy, dan pusat data. Pada layanan yang di-hosting:

- **Koneksi VPN, proxy, dan pusat data** dapat memposting setelah login. Halaman tersebut menjelaskan mengapa login diperlukan dan cara memposting tanpa login dengan mematikan VPN. Setelah itu, ban di komunitas juga berlaku untuk akun yang digunakan untuk login.
- **Akun mapan** dikecualikan dari pembatasan VPN, proxy, dan pusat data, tetapi tidak dari pembatasan Tor. Sebuah akun menjadi mapan setelah lolos CAPTCHA atau login pada 3 hari berbeda dari koneksi yang tidak dibatasi; postingan yang lolos tanpa CAPTCHA maupun login tidak dihitung. Sebuah jaringan hanya dihitung untuk satu akun: begitu akun lain lolos pemeriksaan dari jaringan itu, jaringan tersebut tidak dihitung untuk akun mana pun dari keduanya. Di komunitas yang menjatuhkan ban kepada akun di salah satu jaringan tersebut, tidak ada satu pun dari riwayat tersebut yang dihitung.
- **Tor** tetap dibatasi, kecuali bagi penulis dengan pengecualian yang dikonfigurasi komunitas: peran moderator, daftar putih komunitas, atau nama `.bso` yang terverifikasi.

Berkas lampiran yang diunggah ke Forge Images mengikuti aturan yang sama. Melalui koneksi VPN, proxy, atau pusat data, unggahan memerlukan pra-pemeriksaan yang lolos dengan login, atau akun mapan. Melalui Tor, unggahan memerlukan pengecualian yang terverifikasi.

## Privasi

- **Operator** menyimpan alamat IP mentah dan konten publikasi untuk mendeteksi penyalahgunaan, serta mengirim alamat IP ke penyedia pihak ketiga untuk diklasifikasikan (secara default proxycheck.io).
- **Komunitas** hanya menerima kode negara, risiko IP, perkiraan jenis koneksi, dan hasil lolos atau gagal. Komunitas tidak pernah menerima IP mentah atau akun yang digunakan untuk login.
- **Login** tidak meminta data profil apa pun. Layanan hanya menerima ID akun dari Google, Apple, atau Telegram, tidak pernah nama, email, atau foto. Layanan menyimpan ID tersebut bersama postingan, tanpa penghapusan otomatis, sehingga ban juga berlaku untuk akun tersebut.
- **Penulis yang menggunakan VPN** tetap menyembunyikan alamat IP aslinya saat login: layanan hanya melihat alamat VPN.

## Pembatasan laju

Sebelum memberi skor, layanan menolak penulis yang melebihi jatah per jam atau per hari mereka untuk postingan, balasan, dan suara. Jatah bertambah seiring usia akun dan reputasi yang baik, dan berkurang setelah ban atau penghapusan.

## API

Rute utama, relatif terhadap `spamblocker.bitsocial.net/api/v1`:

| Rute                     | Pemanggil                   | Tujuan                                           |
| ------------------------ | --------------------------- | ------------------------------------------------ |
| `POST /evaluate`         | Iframe tantangan, komunitas | Memberi skor pada publikasi dan membuat sesinya  |
| `POST /challenge/verify` | Komunitas                   | Membaca hasil sesi dan intelijen IP              |
| `POST /precheck`         | Iframe pra-pemeriksaan      | Memberi skor pada draf sebelum diunggah          |
| `GET /iframe/:sessionId` | Peramban penulis            | Halaman verifikasi                               |
| `POST /upload/authorize` | Klien penulis               | Mengotorisasi berkas lampiran untuk Forge Images |

Kontrak lengkap, termasuk penandatanganan permintaan dan skema respons, ada di [README spamblocker](https://github.com/bitsocialnet/spamblocker#api-contract).
