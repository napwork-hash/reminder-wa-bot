# 🤖 WhatsApp Reminder Bot

[![CI/CD](https://github.com/napwork-hash/reminder-wa-bot/actions/workflows/deploy.yml/badge.svg)](https://github.com/napwork-hash/reminder-wa-bot/actions/workflows/deploy.yml)
[![Docker Registry](https://img.shields.io/badge/Container%20Registry-GHCR-blue.svg)](https://github.com/napwork-hash/reminder-wa-bot/pkgs/container/reminder-wa-bot)
[![Node.js](https://img.shields.io/badge/Node.js-22--alpine-green.svg)](https://nodejs.org/)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](https://opensource.org/licenses/ISC)

WhatsApp Reminder Bot otomatis dengan database MySQL. Bot ini dideploy di Kubernetes (K3s) dan dikoordinasikan menggunakan CI/CD melalui GitHub Actions ke **GitHub Container Registry (GHCR)**.

---

## ✨ Fitur Utama
- **⏰ Notifikasi 3-Fase per Reminder**:
  1. **Sebelum (T - 5 menit)**: Mengingatkan sebagai persiapan (*heads-up*).
  2. **Tepat Waktu (T)**: Mengirimkan pesan utama reminder.
  3. **Sesudah (T + 5 menit)**: Mengirimkan pesan follow-up/konfirmasi.
- **📅 Jadwal Fleksibel**: Mendukung tipe reminder harian (*daily*) maupun hari tertentu saja (misal: Senin, Rabu, Jumat).
- **📝 Perintah WhatsApp Lengkap**:
  - `/setReminder [notes] [HH.mm]` - Membuat reminder baru.
  - `/list` - Melihat daftar semua reminder aktif.
  - `/editReminder [nomor] [notes] [HH.mm]` - Mengedit reminder.
  - `/deleteReminder [nomor]` - Menghapus reminder.
  - `/help` - Menampilkan bantuan.
- **☁️ Cloud-Native & Stateless**: Session WhatsApp disimpan di database MySQL menggunakan custom Baileys authentication state, sehingga container bot di Kubernetes aman direstart kapan saja tanpa kehilangan sesi login (tidak butuh PVC/Volume).

---

## 🏗️ Arsitektur & Struktur
- **Teknologi**: Node.js 22, Baileys Library (tanpa Puppeteer/Chrome, sangat ringan!).
- **Database**: MySQL untuk menyimpan reminder sekaligus kredensial autentikasi WhatsApp (`baileys_auth`).
- **CI/CD**: GitHub Actions otomatis build & push Docker image ke `ghcr.io` setiap ada push di branch `main`, lalu deploy ke K3s.

---

## 🚀 Instalasi & Jalankan Lokal

### 1. Prasyarat
- Node.js v22 atau lebih baru.
- **PNPM** package manager.
- MySQL Server yang berjalan.

### 2. Konfigurasi Environment
Salin file `.env.example` menjadi `.env` dan sesuaikan nilainya:
```env
DATABASE_URL=mysql://username:password@localhost:3306/wa_reminder
```

### 3. Jalankan Aplikasi
```bash
# Install dependensi
pnpm install

# Jalankan migrasi database
pnpm migrate

# Jalankan bot
pnpm start
```
*Scan QR code yang muncul di terminal menggunakan WhatsApp di HP Anda untuk melakukan autentikasi.*

---

## 🐳 Docker Setup
Untuk build image secara lokal:
```bash
docker build -t ghcr.io/napwork-hash/reminder-wa-bot:latest .
```

---

## ☸️ K3s (Kubernetes) Deployment

### 1. Buat Kubernetes Secret
Pastikan Anda membuat secret berisi `DATABASE_URL` di namespace `wa-bot` terlebih dahulu sebelum melakukan deployment:
```bash
kubectl create secret generic wa-bot-secret \
  --from-literal=DATABASE_URL="mysql://avnadmin:PASSWORD@HOST:PORT/defaultdb" \
  -n wa-bot
```

```
kubectl create secret generic wa-bot-secret --from-env-file=/home/user/reminder-wa-bot/.env -n wa-bot
```

### 2. Terapkan Manifest K3s
Gunakan manifest yang ada di folder `k3s/`:
```bash
kubectl apply -f k3s/deploy.yaml
```

---

## 🚀 CI/CD Pipeline (GitHub Actions)

Workflow CI/CD diatur di file `.github/workflows/deploy.yml` dan bekerja secara otomatis ketika terjadi push ke branch `main`.

### Proses Workflow:
1. **Build & Push**: Membangun image Docker dan mempublikasikannya ke **GitHub Container Registry (GHCR)** sebagai `ghcr.io/napwork-hash/reminder-wa-bot:latest`.
2. **Deploy**: Menghubungi cluster K3s Anda, menerapkan manifest terbaru, lalu merestart deployment untuk menggunakan image terbaru.

### Konfigurasi GitHub Secrets yang Diperlukan:
Agar pipeline deploy berhasil dijalankan oleh GitHub Actions, tambahkan secret berikut pada repositori GitHub Anda:

| Secret | Deskripsi / Cara Mengisi |
|---|---|
| `KUBECONFIG` | Isi dengan data file kubeconfig K3s Anda yang sudah di-base64. |

Cara mendapatkan string base64 dari kubeconfig K3s server Anda:
```bash
cat /etc/rancher/k3s/k3s.yaml | base64 -w 0
```
*Catatan: Pastikan `server` IP di dalam kubeconfig menggunakan IP publik server Anda yang dapat diakses oleh runner GitHub Actions.*