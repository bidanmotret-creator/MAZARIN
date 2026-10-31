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