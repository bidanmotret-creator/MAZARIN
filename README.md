# Irama Kerja MAZARIN (tampilan Vercel)

Next.js 14 (App Router) + login Google (NextAuth). Data tetap di Google Sheets lewat API Apps Script.
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

## 3. Login Google
Google Cloud Console → APIs & Services → Credentials → **OAuth client ID** (Web application).
Authorized redirect URI: `http://localhost:3000/api/auth/callback/google` dan
`https://NAMA-ANDA.vercel.app/api/auth/callback/google`.
Salin Client ID/Secret ke `.env.local`.

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

## Satu repo = satu klien?
Aturan Anda: satu salinan spreadsheet per klien. Praktisnya: satu proyek Vercel per klien (repo sama,
env berbeda: `APPS_SCRIPT_URL`/`SECRET` klien tersebut). Data klien tetap terpisah.

## Istilah
Semua istilah tampilan ada di `lib/labels.ts`. Teks dari backend lama yang masih memuat istilah asli
dibersihkan di `apps-script/Api.js` (`neutralize_`).

## Berikutnya
Laporan Harian (Tahap 4), Rapat Mingguan baru (Tahap 5), kolom Channel di Kartu Skor (Tahap 6),
lalu pindahkan Lembar Arah, Fokus 90 Hari, Daftar Masalah, Tugas 7 Hari.
