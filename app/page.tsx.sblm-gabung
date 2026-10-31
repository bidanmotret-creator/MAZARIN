import Link from "next/link";
import { redirect } from "next/navigation";
import Topbar from "@/components/Topbar";
import Istilah from "@/components/Istilah";
import { currentUser } from "@/lib/auth";
import { MENU } from "@/lib/menu";

export default async function Home() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const kartu = MENU.filter((m) => m.kartu);
  return (
    <>
      <Topbar user={user} active="home" />
      <main className="wrap">
        <h1>Halo, {user.name.split(" ")[0]} {"\u{1F44B}"}</h1>
        <p className="muted">Mau mulai dari mana hari ini?</p>
        <div className="grid menu">
          {kartu.map((m) =>
            !m.soon ? (
              <Link key={m.key} href={m.href} className="card">
                <div className="emoji">{m.emoji}</div>
                <h2>{m.istilah ? <Istilah id={m.istilah} /> : m.label}</h2>
                <p className="muted">{m.text}</p>
              </Link>
            ) : (
              <Link key={m.key} href={m.href} className="card soon">
                <div className="emoji">{m.emoji}</div>
                <h2>
                  {m.istilah ? <Istilah id={m.istilah} /> : m.label}
                  <span className="tag">segera</span>
                </h2>
                <p className="muted">{m.text}</p>
              </Link>
            )
          )}
        </div>
      </main>
    </>
  );
}