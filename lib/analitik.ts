import type { RockRow, WorkData } from "@/lib/types";
import { hariTerlambat } from "@/lib/tanggal";

export type Nada = "ok" | "warn" | "bad";
export type Wawasan = { nada: Nada; teks: string };
export type Segmen = { label: string; n: number; warna: string };
export type Beban = { nama: string; total: number; telat: number };
export type Hasil = {
  tingkat: number; sub: string; label: string;
  judulA: string; segA: Segmen[]; kosongA: string;
  judulB: string; segB: Segmen[]; kosongB: string;
  beban: Beban[]; wawasan: Wawasan[];
};

const C = { ok: "#1D9E75", navy: "#0F2A3D", amber: "#F2A33A", bad: "#C0392B", pudar: "#5B6F7D", muda: "#C9D3D9" };
const persen = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);
const nadaTingkat = (t: number): Nada => (t >= 70 ? "ok" : t >= 40 ? "warn" : "bad");

function hitungBeban(baris: { owner: string; telat: boolean }[]): Beban[] {
  const m = new Map<string, Beban>();
  for (const b of baris) {
    const nama = b.owner || "Tanpa nama";
    const x = m.get(nama) ?? { nama, total: 0, telat: 0 };
    x.total += 1;
    if (b.telat) x.telat += 1;
    m.set(nama, x);
  }
  return Array.from(m.values()).sort((a, b) => b.total - a.total).slice(0, 6);
}

export function analitikIssues(d: WorkData): Hasil {
  const buka = d.issues.filter((i) => i.status === "Open");
  const selesai = d.issues.length - buka.length;
  const telat = buka.filter((i) => hariTerlambat(i.due) > 0);
  const penting = buka.filter((i) => i.priority === "High" || i.priority === "Critical");
  const tanpaTodo = buka.filter((i) => !d.todos.some((t) => t.issueId === i.id));
  const tingkat = persen(selesai, d.issues.length);
  const w: Wawasan[] = [];

  if (d.issues.length === 0) {
    w.push({ nada: "warn", teks: "Belum ada Issue. Mulai dari satu masalah terbesar minggu ini, lalu pecah jadi To-Do." });
  } else {
    w.push({ nada: nadaTingkat(tingkat), teks: `Tingkat selesai ${tingkat}%: ${selesai} dari ${d.issues.length} Issue sudah beres.` });
    if (telat.length > 0) {
      const tertua = [...telat].sort((a, b) => hariTerlambat(b.due) - hariTerlambat(a.due))[0];
      w.push({ nada: "bad", teks: `${telat.length} dari ${buka.length} Issue berjalan sudah lewat tenggat. Yang paling lama: "${tertua.title}", terlambat ${hariTerlambat(tertua.due)} hari.` });
    }
    if (penting.length > 0) w.push({ nada: "warn", teks: `${penting.length} Issue prioritas tinggi atau kritis belum selesai. Bahas lebih dulu di sesi IDS berikutnya.` });
    if (tanpaTodo.length > 0) w.push({ nada: "warn", teks: `${tanpaTodo.length} Issue belum punya To-Do. Masalah baru dianggap selesai dibahas kalau sudah jadi tugas dengan nama dan tenggat.` });
    if (buka.length > 0 && telat.length === 0 && tanpaTodo.length === 0) w.push({ nada: "ok", teks: "Semua Issue berjalan tepat waktu dan sudah punya To-Do. Pertahankan ritmenya." });
    if (buka.length === 0) w.push({ nada: "ok", teks: `Semua ${d.issues.length} Issue sudah selesai.` });
  }

  const hitung = (p: string) => buka.filter((i) => i.priority === p).length;
  return {
    tingkat, label: "Issue selesai", sub: `${selesai} dari ${d.issues.length} Issue`,
    judulA: "Status Issue", kosongA: "Belum ada Issue.",
    segA: [
      { label: "Selesai", n: selesai, warna: C.ok },
      { label: "Berjalan", n: buka.length - telat.length, warna: C.navy },
      { label: "Lewat tenggat", n: telat.length, warna: C.bad },
    ],
    judulB: "Prioritas Issue yang berjalan", kosongB: "Tidak ada Issue berjalan.",
    segB: [
      { label: "Kritis", n: hitung("Critical"), warna: C.bad },
      { label: "Tinggi", n: hitung("High"), warna: C.amber },
      { label: "Sedang", n: hitung("Medium"), warna: C.pudar },
      { label: "Rendah", n: hitung("Low"), warna: C.muda },
    ],
    beban: hitungBeban(buka.map((i) => ({ owner: i.owner, telat: hariTerlambat(i.due) > 0 }))),
    wawasan: w,
  };
}

export function analitikTodo(d: WorkData): Hasil {
  const buka = d.todos.filter((t) => t.status === "Open");
  const selesai = d.todos.length - buka.length;
  const telat = buka.filter((t) => hariTerlambat(t.due) > 0);
  const hariIni = buka.filter((t) => hariTerlambat(t.due) === 0);
  const tingkat = persen(selesai, d.todos.length);
  const beban = hitungBeban(buka.map((t) => ({ owner: t.owner, telat: hariTerlambat(t.due) > 0 })));
  const w: Wawasan[] = [];

  if (d.todos.length === 0) {
    w.push({ nada: "warn", teks: "Belum ada To-Do. Ubah tiap Issue jadi tugas kecil dengan nama dan tenggat." });
  } else {
    w.push({ nada: nadaTingkat(tingkat), teks: `Tingkat selesai ${tingkat}%: ${selesai} dari ${d.todos.length} To-Do sudah beres.` });
    if (telat.length > 0) {
      const tertua = [...telat].sort((a, b) => hariTerlambat(b.due) - hariTerlambat(a.due))[0];
      w.push({ nada: "bad", teks: `${telat.length} dari ${buka.length} To-Do berjalan lewat tenggat. Yang paling lama: "${tertua.task}" (${tertua.owner}), terlambat ${hariTerlambat(tertua.due)} hari.` });
    }
    if (hariIni.length > 0) w.push({ nada: "warn", teks: `${hariIni.length} To-Do jatuh tempo hari ini.` });
    const telatTerbanyak = [...beban].sort((a, b) => b.telat - a.telat)[0];
    if (telatTerbanyak && telatTerbanyak.telat >= 2) {
      w.push({ nada: "warn", teks: `${telatTerbanyak.nama} memegang ${telatTerbanyak.telat} dari ${telat.length} To-Do yang lewat tenggat. Cek apakah bebannya terlalu besar.` });
    }
    const teratas = beban[0];
    if (teratas && beban.length > 1 && buka.length >= 4 && teratas.total / buka.length >= 0.5) {
      w.push({ nada: "warn", teks: `${teratas.nama} memegang ${persen(teratas.total, buka.length)}% dari To-Do yang berjalan. Pertimbangkan membagi tugas.` });
    }
    if (buka.length > 0 && telat.length === 0 && hariIni.length === 0) w.push({ nada: "ok", teks: "Semua To-Do berjalan tepat waktu." });
    if (buka.length === 0) w.push({ nada: "ok", teks: `Semua ${d.todos.length} To-Do sudah selesai.` });
  }

  const hari = telat.map((t) => hariTerlambat(t.due));
  return {
    tingkat, label: "To-Do selesai", sub: `${selesai} dari ${d.todos.length} To-Do`,
    judulA: "Status To-Do", kosongA: "Belum ada To-Do.",
    segA: [
      { label: "Selesai", n: selesai, warna: C.ok },
      { label: "Berjalan", n: buka.length - telat.length - hariIni.length, warna: C.navy },
      { label: "Hari ini", n: hariIni.length, warna: C.amber },
      { label: "Lewat tenggat", n: telat.length, warna: C.bad },
    ],
    judulB: "Umur keterlambatan", kosongB: "Tidak ada To-Do yang terlambat.",
    segB: [
      { label: "1 sampai 3 hari", n: hari.filter((h) => h <= 3).length, warna: C.amber },
      { label: "4 sampai 7 hari", n: hari.filter((h) => h > 3 && h <= 7).length, warna: "#E07B39" },
      { label: "Lebih dari 7 hari", n: hari.filter((h) => h > 7).length, warna: C.bad },
    ],
    beban, wawasan: w,
  };
}

export function analitikRocks(rocks: RockRow[], kuartal: string): Hasil {
  const selesai = rocks.filter((r) => r.status === "Done");
  const buka = rocks.filter((r) => r.status !== "Done");
  const telat = buka.filter((r) => hariTerlambat(r.due) > 0);
  const harapan = (r: RockRow) => {
    const total = hariTerlambat(r.start) - hariTerlambat(r.due);
    if (!r.start || !r.due || total <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((hariTerlambat(r.start) / total) * 100)));
  };
  const tertinggal = buka.filter((r) => hariTerlambat(r.due) <= 0 && r.progress < harapan(r) - 20);
  const rata = rocks.length ? Math.round(rocks.reduce((a, r) => a + r.progress, 0) / rocks.length) : 0;
  const w: Wawasan[] = [];

  if (rocks.length === 0) {
    w.push({ nada: "warn", teks: "Belum ada Rock untuk pilihan ini. Tetapkan 3 sampai 5 prioritas besar untuk 90 hari ke depan." });
  } else {
    w.push({ nada: nadaTingkat(rata), teks: `Rata-rata progres ${rata}%: ${selesai.length} dari ${rocks.length} Rock sudah selesai.` });
    if (!kuartal.startsWith("semua") && (rocks.length < 3 || rocks.length > 5)) {
      w.push({ nada: "warn", teks: `Ada ${rocks.length} Rock di ${kuartal}. Aturan MOS menyarankan 3 sampai 5 supaya fokus tetap terjaga.` });
    }
    if (telat.length > 0) {
      const t = [...telat].sort((a, b) => hariTerlambat(b.due) - hariTerlambat(a.due))[0];
      w.push({ nada: "bad", teks: `${telat.length} dari ${buka.length} Rock berjalan lewat tenggat. Yang paling lama: "${t.name}" (${t.owner}), terlambat ${hariTerlambat(t.due)} hari.` });
    }
    if (tertinggal.length > 0) {
      const t = [...tertinggal].sort((a, b) => (harapan(b) - b.progress) - (harapan(a) - a.progress))[0];
      w.push({ nada: "warn", teks: `"${t.name}" baru ${t.progress}% padahal waktunya sudah terpakai ${harapan(t)}%. Cek hambatannya sebelum terlambat.` });
    }
    if (buka.length > 0 && telat.length === 0 && tertinggal.length === 0) w.push({ nada: "ok", teks: "Semua Rock berjalan sesuai jalur waktu." });
    if (buka.length === 0) w.push({ nada: "ok", teks: `Semua ${rocks.length} Rock sudah selesai.` });
  }

  const band = (a: number, b: number) => buka.filter((r) => r.progress >= a && r.progress <= b).length;
  return {
    tingkat: rata, label: "Rata-rata progres", sub: `${selesai.length} dari ${rocks.length} Rock selesai`,
    judulA: "Status Rock", kosongA: "Belum ada Rock.",
    segA: [
      { label: "Selesai", n: selesai.length, warna: C.ok },
      { label: "Sesuai jalur", n: buka.length - telat.length - tertinggal.length, warna: C.navy },
      { label: "Tertinggal", n: tertinggal.length, warna: C.amber },
      { label: "Lewat tenggat", n: telat.length, warna: C.bad },
    ],
    judulB: "Progres Rock yang berjalan", kosongB: "Tidak ada Rock berjalan.",
    segB: [
      { label: "0 sampai 25%", n: band(0, 25), warna: C.bad },
      { label: "26 sampai 50%", n: band(26, 50), warna: C.amber },
      { label: "51 sampai 75%", n: band(51, 75), warna: C.navy },
      { label: "76 sampai 99%", n: band(76, 99), warna: C.ok },
    ],
    beban: hitungBeban(buka.map((r) => ({ owner: r.owner, telat: hariTerlambat(r.due) > 0 }))),
    wawasan: w,
  };
}

type RiwayatMeeting = { week: number; year: number; rating: number; issues: number; todos: number };

function isoMinggu(d: Date) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const n = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - n);
  const awal = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return { minggu: Math.ceil(((t.getTime() - awal.getTime()) / 86400000 + 1) / 7), tahun: t.getUTCFullYear() };
}

export function analitikMeeting(hist: RiwayatMeeting[]) {
  const urut = [...hist].sort((a, b) => a.year * 100 + a.week - (b.year * 100 + b.week));
  const bernilai = urut.filter((x) => x.rating > 0);
  const seri = bernilai.slice(-8).map((x) => ({ label: "M" + x.week, rating: x.rating }));
  const rata = (a: RiwayatMeeting[]) => (a.length ? Math.round((a.reduce((s, x) => s + x.rating, 0) / a.length) * 10) / 10 : 0);
  const butir: Wawasan[] = [];

  if (urut.length === 0) {
    butir.push({ nada: "warn", teks: "Belum ada meeting yang selesai. Rating dan tren muncul setelah meeting pertama ditutup." });
  } else {
    const empat = bernilai.slice(-4);
    if (empat.length > 0) {
      const r = rata(empat);
      butir.push({ nada: r >= 8 ? "ok" : r >= 6 ? "warn" : "bad", teks: `Rata-rata rating ${empat.length} meeting terakhir: ${r} dari 10. Target EOS: 8 atau lebih.` });
    }
    if (bernilai.length >= 2) {
      const akhir = bernilai[bernilai.length - 1].rating;
      const sebelum = bernilai[bernilai.length - 2].rating;
      if (akhir < sebelum) butir.push({ nada: "warn", teks: `Rating turun dari ${sebelum} ke ${akhir}. Tanyakan apa yang mengganggu jalannya meeting.` });
      else if (akhir > sebelum) butir.push({ nada: "ok", teks: `Rating naik dari ${sebelum} ke ${akhir}.` });
    }
    let ada = 0;
    const sekarang = Date.now();
    for (let i = 0; i < 8; i++) {
      const w = isoMinggu(new Date(sekarang - i * 7 * 86400000));
      if (urut.some((x) => x.week === w.minggu && x.year === w.tahun)) ada += 1;
    }
    butir.push({ nada: ada >= 7 ? "ok" : ada >= 5 ? "warn" : "bad", teks: `${ada} dari 8 minggu terakhir ada meeting yang selesai. Ritme mingguan adalah kuncinya.` });
    const terakhir = urut[urut.length - 1];
    if (terakhir.issues + terakhir.todos > 0) {
      butir.push({ nada: "ok", teks: `Meeting terakhir (minggu ${terakhir.week}) melahirkan ${terakhir.issues} Issue dan ${terakhir.todos} To-Do.` });
    }
  }
  return { butir, seri };
}