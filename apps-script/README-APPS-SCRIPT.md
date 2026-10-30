# Memasang API di Apps Script

Kerjakan di **salinan uji** dulu (bukan spreadsheet klien asli).

1. Salin `Api.js` ke folder proyek clasp Anda.
2. Di `WebAppController.js`, ubah baris `function doGet(e) {` menjadi `function doGetLegacy_(e) {`.
   Halaman HTML lama tidak lagi bisa dibuka lewat tautan `/exec` (ini yang kita inginkan).
3. Di editor Apps Script: **Project Settings → Script Properties → Add**
   `API_SECRET` = teks acak ≥ 32 karakter (contoh: `openssl rand -base64 32`).
4. `clasp push`, lalu **Deploy → New deployment → Web app**:
   Execute as **Me**, Who has access **Anyone**. Salin tautan `/exec` → itu `APPS_SCRIPT_URL` di Vercel.
5. Nonaktifkan deployment lama (**Manage deployments → Archive**). Tautan lama pernah dibagikan, anggap bocor.
6. Pastikan `MASTER_USER` berisi email Google tiap pengguna dengan `Status = Active`.

Catatan keamanan: "Anyone" diperlukan agar server Vercel bisa memanggil tanpa login Google.
Pintunya dikunci oleh `API_SECRET` + pemeriksaan email ke `MASTER_USER` di setiap panggilan.
Jangan pernah menaruh `API_SECRET` di GitHub atau membagikan tautan `/exec` ke klien.
