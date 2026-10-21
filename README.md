# 🚀 IndexNow Auto-Submit (Google Apps Script)

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg?style=for-the-badge)](https://www.gnu.org/licenses/gpl-3.0)
[![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-4285F4?logo=google&logoColor=white&style=for-the-badge)](#)
[![JavaScript](https://img.shields.io/badge/JavaScript-100%25-F7DF1E?logo=javascript&logoColor=black&style=for-the-badge)](#)
[![Repo stars](https://img.shields.io/github/stars/MinatoAka/IndexNow?style=for-the-badge)](https://github.com/MinatoAka/IndexNow/stargazers)
[![Forks](https://img.shields.io/github/forks/MinatoAka/IndexNow?style=for-the-badge)](https://github.com/MinatoAka/IndexNow/network/members)
[![Issues](https://img.shields.io/github/issues/MinatoAka/IndexNow?style=for-the-badge)](https://github.com/MinatoAka/IndexNow/issues)
[![Last Commit](https://img.shields.io/github/last-commit/MinatoAka/IndexNow?style=for-the-badge)](https://github.com/MinatoAka/IndexNow/commits)

Auto-submit URL ke API IndexNow (Bing, Yandex, dll) menggunakan Google Apps Script (GAS), lengkap dengan pencatatan log ke Google Sheets untuk keperluan monitoring, debugging, dan audit.

## ✨ Fitur Utama

- ⚡ **Submit Otomatis:** Berjalan otomatis via *Time-Driven Trigger* (misal: setiap 6 jam) untuk mengecek `sitemap.xml`.
- 🛠️ **Submit Manual:** Fungsi khusus untuk mem- *force* submit semua URL (termasuk halaman statis) kapan saja.
- 📦 **Batch Processing:** Memotong daftar URL menjadi beberapa *batch* (maksimal 500 per *request*) agar tidak kena limit API.
- 🛡️ **Anti-Bentrok (LockService):** Mencegah *race condition* antara trigger otomatis dan submit manual.
- 📊 **Audit Log:** Semua respons (HTTP 200/202/4xx) dicatat rapi di Google Sheets.
- 🧹 **Auto-Cleanup:** Menghapus log yang berumur lebih dari 7 hari secara otomatis.

## ⚙️ Alur Kerja

```text
[ Sitemap.xml ] ➡️ [ GAS: Sitemap Parser ] ➡️ [ GAS: API Kurir ]
                                                    ⬇️
[ Google Sheets Log ] ⬅️ [ Response Code ] ⬅️ [ IndexNow API ]
```

## 📂 Struktur Project

Project ini dibangun dengan prinsip *Modular Architecture* agar mudah di-*maintain*:

- `Config.gs` : Pusat konfigurasi, validasi, dan inisialisasi *Script Properties*.
- `Main.gs`   : Fungsi eksekutor utama yang dipanggil oleh *trigger* atau manual.
- `Api.gs`    : Fungsi kurir yang menangani *request* HTTP, *retry logic*, dan *chunking* URL.
- `Sitemap.gs`: Fungsi intelijen untuk mengambil dan mem- *parsing* `sitemap.xml` / `sitemap-pages.xml`.
- `Utils.gs`  : Fungsi bantu (*LockService*, pembersihan log, dan manajemen cache).

## Persyaratan

Sebelum menggunakan project ini, pastikan Anda sudah memiliki:
- Akun Google
- Google Apps Script
- Google Sheets
- API Key IndexNow dari Bing
- Akses ke spreadsheet untuk mencatat log

## Setup

### 1. Buat API Key IndexNow
Dapatkan API key Anda di:
https://www.bing.com/indexnow/getstarted

### 2. Siapkan spreadsheet
Buat spreadsheet baru atau gunakan spreadsheet yang sudah ada, lalu catat:
- Spreadsheet ID
- Nama sheet yang digunakan untuk menyimpan log

### 3. Atur Script Properties
Buka Google Apps Script, lalu masuk ke:
- Project Settings
- Script properties

Tambahkan properti berikut:

- `IndexNow_KEY`: `YOUR_INDEXNOW_KEY`
- `SPREADSHEETS_ID`: `YOUR_SPREADSHEET_ID`
- `TARGET_POINTS`: `["https://api.indexnow.org/indexnow", "https://yandex.com/indexnow"]`
- `idx_cache_final`: `[]`

Catatan penting:
- Jangan pernah menyimpan API key asli di repository publik.
- Gunakan placeholder atau variable environment untuk dokumentasi.

## Struktur Properti

```javascript
const scriptProperties = {
  IndexNow_KEY: "YOUR_INDEXNOW_KEY",
  SPREADSHEETS_ID: "YOUR_SPREADSHEET_ID",
  TARGET_POINTS: [
    "https://api.indexnow.org/indexnow",
    "https://yandex.com/indexnow"
  ],
  idx_cache_final: []
};
```

## 🚀 Cara Penggunaan

### Submit URL Manual
Jika ingin menembak URL secara manual tanpa menunggu trigger, jalankan salah satu fungsi berikut di editor GAS:
- `submitToIndexNowWithLog()` : Mengecek sitemap dan hanya mengirim URL baru (dalam 6 jam terakhir).
- `forceSubmitAllToIndexNow()` : **Maksa** kirim semua URL artikel dari `sitemap.xml` (mengabaikan cache).
- `submitPagesToIndexNow()` : Mengirim semua halaman statis dari `sitemap-pages.xml`.

### Submit URL Otomatis
Jalankan fungsi `setupTriggerFinal()` satu kali di editor GAS untuk mengaktifkan trigger otomatis setiap 6 jam.

### Catat Log ke Spreadsheet
Setiap request akan dicatat ke spreadsheet, termasuk Waktu, URL, Status HTTP, dan Response dari API.

## Kode Status Respons IndexNow

| HTTP Code | Status | Keterangan |
|-----------|--------|-----------|
| 200 | OK | URL submitted successfully |
| 202 | Accepted | URL received. IndexNow key validation pending |
| 400 | Bad request | Invalid format |
| 403 | Forbidden | Key is not valid |
| 422 | Unprocessable Entity | URL does not belong to the host or key mismatch |
| 429 | Too Many Requests | Potential spam |

## Catatan Penting

- Pastikan URL yang dikirim sesuai dengan host yang valid.
- API key harus sesuai dengan domain yang digunakan.
- Hindari pengiriman URL secara berulang tanpa kontrol, karena dapat memicu rate limiting.
- Jangan membagikan Spreadsheet ID atau API key di repository publik.

## Lisensi

Proyek ini dibuat untuk kebutuhan penggunaan pribadi dan internal. Jika Anda ingin membagikan project ini secara publik, sesuaikan lisensi sesuai kebutuhan.

## Kontribusi

Kontribusi dan saran sangat diterima. Jika Anda ingin memperbaiki atau menambahkan fitur baru, silakan buka pull request atau buat issue di repository ini.

## Kontak

Untuk pertanyaan atau kolaborasi, silakan hubungi maintainer melalui profil GitHub atau kanal komunikasi yang tersedia.
