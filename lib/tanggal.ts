export function tgl(s: string) {
  if (!s) return "-";
  const [y, m, d] = s.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(y, m - 1, d));
}
function awalHari(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
}
function hariIniMs() {
  const h = new Date();
  h.setHours(0, 0, 0, 0);
  return h.getTime();
}
export function lewatTenggat(due: string, selesai: boolean) {
  return !selesai && !!due && awalHari(due) < hariIniMs();
}
export function jatuhHariIni(due: string, selesai: boolean) {
  return !selesai && !!due && awalHari(due) === hariIniMs();
}
const JKT = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" });
export function hariTerlambat(due: string) {
  if (!due) return 0;
  const [y, m, d] = due.split("-").map(Number);
  const [hy, hm, hd] = JKT.format(new Date()).split("-").map(Number);
  return Math.round((Date.UTC(hy, hm - 1, hd) - Date.UTC(y, m - 1, d)) / 86400000);
}
