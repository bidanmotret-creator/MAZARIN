import type { IdIstilah } from "@/lib/glossary";

export type MenuKey =
  | "home" | "scorecard" | "input" | "daily" | "meeting" | "rocks"
  | "vto" | "issues" | "todo" | "roles" | "account";

export type MenuItem = {
  key: MenuKey;
  href: string;
  label: string; // teks di navbar
  istilah?: IdIstilah; // judul kartu dan halaman memakai istilah + arti pendukung
  emoji?: string;
  text?: string;
  soon?: boolean; // halaman belum jadi
  kartu?: boolean; // tampil sebagai kartu di Beranda
};

// Satu-satunya daftar menu. Navbar dan Beranda dibuat dari sini.
export const MENU: MenuItem[] = [
  { key: "home", href: "/", label: "Beranda" },
  { key: "scorecard", href: "/kartu-skor", label: "Scorecard", istilah: "scorecard", emoji: "\u{1F4CA}", text: "Angka mingguan: mana yang sesuai jalur, mana yang perlu dibahas.", kartu: true },
  { key: "input", href: "/kartu-skor/isi", label: "Isi Scorecard", emoji: "\u270F\uFE0F", text: "Isi angka minggu ini dalam beberapa menit.", kartu: true },
  { key: "daily", href: "/laporan-harian", label: "Laporan Harian", emoji: "\u{1F4DD}", text: "Ringkasan harian siap kirim ke klien.", soon: true, kartu: true },
  { key: "meeting", href: "/level-10", label: "Level 10", istilah: "level10", emoji: "\u{1F91D}", text: "Agenda 90 menit, tersimpan rapi.", soon: true, kartu: true },
  { key: "rocks", href: "/rocks", label: "Rocks", istilah: "rocks", emoji: "\u{1F3AF}", text: "Prioritas 90 hari dan progresnya.", kartu: true },
  { key: "vto", href: "/vto", label: "V/TO", istilah: "vto", emoji: "\u{1F9ED}", text: "Tujuan, target, dan janji utama dalam satu halaman.", soon: true, kartu: true },
  { key: "issues", href: "/issues", label: "Issues", istilah: "issues", emoji: "\u{1F4CC}", text: "Daftar masalah yang perlu dibereskan, dengan cara IDS.", soon: true, kartu: true },
  { key: "todo", href: "/to-do", label: "To-Do", istilah: "todo", emoji: "\u2705", text: "Tugas 7 hari, lengkap dengan penanggung jawab dan tenggat.", soon: true, kartu: true },
  { key: "roles", href: "/accountability-chart", label: "Accountability Chart", istilah: "accountabilityChart", emoji: "\u{1F465}", text: "Siapa memegang peran apa, satu peran satu penanggung jawab.", soon: true, kartu: true },
  { key: "account", href: "/akun", label: "Akun" },
];