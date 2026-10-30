# Irama Kerja MAZARIN (tampilan Vercel)

Next.js 14 (App Router) + login email/kata sandi (NextAuth Credentials). Data tetap di Google Sheets lewat API Apps Script.
Tahap ini: kerangka, login terbatas, istilah baru, **Kartu Skor** + **Isi Kartu Skor Mingguan**.

## 1. Jalankan lokal
```bash
npm install
cp .env.example .env.local     # isi nilainya, atau pakai DEV_MOCK=1 untuk data contoh tanpa Google
npm run dev                    # http://localhost:3000
```
`DEV_MOCK=1` hanya jalan di mode development; di produksi diabaikan.

## 2. Pasang API Apps Script
Ikuti `apps-script/README-APPS-SCRIPT.md`.

## 3. Login email + kata sandi
- Daftar pengguna ada di sheet `MASTER_USER` (Email, Role, Status = Active). Kolom `Password_Hash` dibuat otomatis.
- Atur kata sandi pengguna (admin menjalankan di folder proyek):
  ```powershell
  powershell -ExecutionPolicy Bypass -File .\tools\set-password.ps1 -Email nama@contoh.com
  ```
  Yang tersimpan hanya hash (bcrypt), bukan kata sandi asli. Pengguna bisa menggantinya sendiri di menu **Akun**.
- 5 kali salah berturut-turut mengunci email itu selama 15 menit. Kata sandi 10-72 karakter.
- Batasi akses edit spreadsheet ke pemilik saja: kolom `Password_Hash` memang hash, tapi tetap data sensitif.

## 4. GitHub
```bash
git init && git add . && git commit -m "Kerangka Irama Kerja MAZARIN"
git branch -M main
git remote add origin https://github.com/USERNAME/irama-kerja-mazarin.git   # buat repo PRIVATE dulu
git push -u origin main
```
`.env*` sudah di `.gitignore`. Jangan pernah meng-commit `.env.local` atau `.clasprc.json`.

## 5. Vercel
1. vercel.com → **Add New → Project** → impor repo GitHub tadi.
2. Environment Variables: semua isi `.env.example` (kecuali `DEV_MOCK`). `NEXTAUTH_URL` = alamat Vercel Anda.
3. Deploy. Setiap `git push` ke `main` otomatis deploy ulang.

## Satu bisnis = satu salinan lengkap
Tiap bisnis/klien punya salinannya sendiri, jadi data dan rahasia tidak pernah tercampur:
1. Spreadsheet: File > Make a copy (skrip Apps Script ikut tersalin). Isi `MASTER_USER`.
2. Folder kode Apps Script: `.clasp.json` baru dengan Script ID salinan itu, `clasp push`.
3. Script Property `API_SECRET` BARU (jangan pakai ulang), deployment web app baru.
4. Folder proyek ini disalin ke folder baru; `.env.local` baru (URL, secret, `NEXTAUTH_SECRET` baru).
5. Atur kata sandi pengguna dengan `tools/set-password.ps1`.
6. Repo GitHub + proyek Vercel sendiri, dengan environment variable bisnis itu.

## Istilah
Semua istilah tampilan ada di `lib/labels.ts`. Teks dari backend lama yang masih memuat istilah asli
dibersihkan di `apps-script/Api.js` (`neutralize_`).

## Berikutnya
Laporan Harian (Tahap 4), Rapat Mingguan baru (Tahap 5), kolom Channel di Kartu Skor (Tahap 6),
lalu pindahkan Lembar Arah, Fokus 90 Hari, Daftar Masalah, Tugas 7 Hari.
