// Dipanggil oleh tools/set-password.ps1. Kata sandi dibaca dari variabel lingkungan, bukan argumen
// (supaya tidak tercatat di riwayat perintah).
import bcrypt from "bcryptjs";

const pw = process.env.IRAMA_PASSWORD ?? "";
if (pw.length < 10 || pw.length > 72) {
  console.error("Kata sandi harus 10-72 karakter.");
  process.exit(1);
}
console.log(bcrypt.hashSync(pw, 12));
