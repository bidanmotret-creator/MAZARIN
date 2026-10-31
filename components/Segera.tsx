import Link from "next/link";
import { redirect } from "next/navigation";
import Topbar from "@/components/Topbar";
import Istilah from "@/components/Istilah";
import { currentUser } from "@/lib/auth";
import { MENU, type MenuKey } from "@/lib/menu";

export default async function Segera({ menuKey }: { menuKey: MenuKey }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const m = MENU.find((x) => x.key === menuKey);
  if (!m) redirect("/");
  return (
    <>
      <Topbar user={user} active={m.key} />
      <main className="wrap">
        <h1>{m.istilah ? <Istilah id={m.istilah} ukuran="judul" /> : m.label}</h1>
        <p className="muted">{m.text}</p>
        <p className="muted">Halaman ini belum tersedia di versi uji.</p>
        <p><Link href="/">Kembali ke Beranda</Link></p>
      </main>
    </>
  );
}