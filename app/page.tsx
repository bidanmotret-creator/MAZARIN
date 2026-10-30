import Link from "next/link";
import { redirect } from "next/navigation";
import Topbar from "@/components/Topbar";
import Istilah from "@/components/Istilah";
import { currentUser } from "@/lib/auth";
import { L } from "@/lib/labels";
import type { IdIstilah } from "@/lib/glossary";

type Modul = {
  href?: string;
  emoji: string;
  title: string;
  istilah?: IdIstilah;
  text: string;
  soon?: boolean;
};

const modules: Modul[] = [
  { href: "/kartu-skor", emoji: "📊", title: L.scorecard, istilah: "scorecard", text: "Angka mingguan: mana yang sesuai jalur, mana yang perlu dibahas." },
  { href: "/kartu-skor/isi", emoji: "✏️", title: L.scorecardInput, text: "Isi angka minggu ini dalam beberapa menit." },
  { emoji: "📝", title: L.daily, text: "Ringkasan harian siap kirim ke klien.", soon: true },
  { emoji: "🤝", title: L.meeting, istilah: "level10", text: "Agenda 90 menit, tersimpan rapi.", soon: true },
  { emoji: "🎯", title: L.focus, istilah: "rocks", text: "Prioritas 90 hari dan progresnya.", soon: true },
  { emoji: "🧭", title: L.direction, istilah: "vto", text: "Tujuan, target, dan janji utama dalam satu halaman.", soon: true },
];

export default async function Home() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return (
    <>
      <Topbar user={user} active="home" />
      <main className="wrap">
        <h1>Halo, {user.name.split(" ")[0]} 👋</h1>
        <p className="muted">Mau mulai dari mana hari ini?</p>
        <div className="grid menu">
          {modules.map((m) =>
            m.href ? (
              <Link key={m.title} href={m.href} className="card">
                <div className="emoji">{m.emoji}</div>
                <h2>{m.istilah ? <Istilah id={m.istilah} /> : m.title}</h2>
                <p className="muted">{m.text}</p>
              </Link>
            ) : (
              <div key={m.title} className="card soon" aria-disabled="true">
                <div className="emoji">{m.emoji}</div>
                <h2>
                  {m.istilah ? <Istilah id={m.istilah} /> : m.title}
                  <span className="tag">segera</span>
                </h2>
                <p className="muted">{m.text}</p>
              </div>
            )
          )}
        </div>
      </main>
    </>
  );
}