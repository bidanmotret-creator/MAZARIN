export type IdIstilah =
  | "vto" | "coreValues" | "coreFocus" | "target10" | "gambar3" | "rencana1" | "marketingStrategy"
  | "rocks" | "scorecard" | "level10" | "segue" | "headlines" | "issues" | "ids" | "todo" | "conclude"
  | "accountabilityChart" | "gwc" | "visionary" | "integrator" | "delegateElevate" | "quarterly" | "annual"
  | "cpl" | "roas" | "matchRate" | "closingRate" | "slaCs" | "leadMenggantung" | "repeatOrder"
  | "kodeLeads" | "commentToDm" | "leadMagnet" | "pixelCapi";

// Sumber tunggal istilah + arti pendukung untuk UMKM. Hanya istilah MOS yang boleh dipakai di sini.
export type Entri = {
  istilah: string; // tampil tebal
  arti: string; // satu kalimat, tampil abu-abu di bawah istilah
  contoh?: string; // tampil di tooltip "?"
};

export const GLOSARIUM: Record<IdIstilah, Entri> = {
  vto: { istilah: "Vision/Traction Organizer (V/TO)", arti: "Satu halaman berisi ke mana bisnis mau dibawa dan langkah 90 hari ke depan. Seperti peta perjalanan bisnis Anda.", contoh: "Contoh: toko online hijab ingin 500 pesanan per bulan tahun depan." },
  coreValues: { istilah: "Core Values", arti: "Pegangan sikap kerja yang dijaga bersama, misalnya jujur dan cepat membalas." },
  coreFocus: { istilah: "Core Focus", arti: "Satu hal yang paling menjadi keunggulan bisnis Anda dan jadi fokus utama." },
  target10: { istilah: "10-Year Target", arti: "Cita-cita besar jangka panjang. Arah, bukan janji." },
  gambar3: { istilah: "3-Year Picture", arti: "Gambaran bisnis 3 tahun lagi: omzet, tim, dan cara kerjanya." },
  rencana1: { istilah: "1-Year Plan", arti: "Target tahun ini yang bisa dicek angka dan hasilnya." },
  marketingStrategy: { istilah: "Marketing Strategy", arti: "Siapa pelanggan ideal, apa yang ditawarkan, dan janji utama ke pelanggan." },
  rocks: { istilah: "Rocks", arti: "3 sampai 5 prioritas besar 90 hari ke depan yang jelas selesai atau belum. Bukan daftar kerja harian.", contoh: "Contoh: 'Balasan chat di bawah 5 menit' atau 'Luncurkan paket bundling baru'." },
  scorecard: { istilah: "Scorecard", arti: "Papan angka mingguan, 6 sampai 10 angka, masing-masing ada penanggung jawab. Cepat terlihat mana yang aman, perlu perhatian, atau melenceng." },
  level10: { istilah: "Level 10 Meeting", arti: "Rapat mingguan 90 menit dengan agenda tetap, supaya singkat, terarah, dan menghasilkan keputusan." },
  segue: { istilah: "Segue", arti: "Pembuka rapat: tiap orang berbagi satu kabar baik (pribadi dan kerja)." },
  headlines: { istilah: "Headlines", arti: "Kabar singkat dari pelanggan dan tim yang perlu diketahui bersama." },
  issues: { istilah: "Issues", arti: "Daftar masalah atau ganjalan yang perlu dibereskan." },
  ids: { istilah: "IDS (Identify, Discuss, Solve)", arti: "Cara membereskan masalah dalam tiga langkah: Angkat (apa masalahnya), Bahas (singkat), Selesaikan (jadi tugas dengan nama dan tenggat)." },
  todo: { istilah: "To-Do (Tugas 7 Hari)", arti: "Tugas yang harus beres dalam 7 hari, dengan nama penanggung jawab dan tenggat." },
  conclude: { istilah: "Conclude", arti: "Penutup rapat: ulangi tugas, siapa yang mengerjakan, dan kapan selesai." },
  accountabilityChart: { istilah: "Accountability Chart", arti: "Bagan siapa memegang peran apa dan siapa bertanggung jawab atas apa. Satu peran, satu penanggung jawab." },
  gwc: { istilah: "GWC", arti: "Tiga pertanyaan menilai kecocokan orang dengan perannya: paham perannya (Get it), mau menjalaninya (Want it), mampu dan punya waktu (Capacity)." },
  visionary: { istilah: "Visionary", arti: "Pemimpin arah: orang yang memikirkan tujuan dan peluang bisnis." },
  integrator: { istilah: "Integrator", arti: "Pelaksana harian: orang yang memastikan rencana benar-benar berjalan setiap hari." },
  delegateElevate: { istilah: "Delegate & Elevate", arti: "Latihan membagi tugas yang bisa dikerjakan orang lain, supaya pemilik fokus ke hal yang paling bernilai." },
  quarterly: { istilah: "Quarterly", arti: "Pertemuan evaluasi tiap 90 hari untuk menilai hasil dan menetapkan arah berikutnya." },
  annual: { istilah: "Annual", arti: "Pertemuan evaluasi tiap tahun untuk menilai hasil dan menetapkan arah tahun depan." },
  cpl: { istilah: "CPL (Cost per Lead)", arti: "Biaya iklan untuk mendapatkan satu calon pembeli yang menghubungi." },
  roas: { istilah: "ROAS", arti: "Berapa rupiah omzet yang kembali dari tiap Rp1 biaya iklan.", contoh: "ROAS 4 artinya Rp1 iklan menghasilkan Rp4 omzet." },
  matchRate: { istilah: "Match Rate", arti: "Seberapa banyak data pembeli yang berhasil dikenali Meta. Makin tinggi, makin akurat pelacakannya." },
  closingRate: { istilah: "Closing rate", arti: "Dari 100 orang yang chat, berapa yang akhirnya membeli." },
  slaCs: { istilah: "SLA CS", arti: "Batas waktu CS membalas chat pelanggan, misalnya maksimal 5 menit." },
  leadMenggantung: { istilah: "Lead menggantung", arti: "Calon pembeli yang sudah chat tapi belum dibalas atau belum ditindaklanjuti." },
  repeatOrder: { istilah: "Repeat order", arti: "Pelanggan lama yang membeli lagi." },
  kodeLeads: { istilah: "Kode Leads", arti: "Kode unik di pesan chat agar tiap pembeli bisa dilacak berasal dari iklan atau jalur mana." },
  commentToDm: { istilah: "Comment-to-DM", arti: "Pelanggan komentar kata kunci di postingan, lalu otomatis dikirimi pesan pribadi." },
  leadMagnet: { istilah: "Lead magnet", arti: "Hadiah gratis (template, e-book, kelas mini) yang ditukar dengan kontak calon pembeli." },
  pixelCapi: { istilah: "Pixel / CAPI", arti: "Alat pelacak yang melaporkan pembelian ke Meta supaya iklan belajar menemukan pembeli yang mirip." },
};



