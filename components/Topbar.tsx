import Link from "next/link";
import { L } from "@/lib/labels";
import type { SessionUser } from "@/lib/types";
import SignOutButton from "./SignOutButton";

export default function Topbar({ user, active }: { user: SessionUser; active?: string }) {
  const items = [
    { href: "/", label: "Beranda", key: "home" },
    { href: "/kartu-skor", label: L.scorecard, key: "scorecard" },
    { href: "/kartu-skor/isi", label: "Isi Angka", key: "input" },
    { href: "/akun", label: "Akun", key: "account" },
  ];
  return (
    <header className="topbar">
      <div className="in">
        <Link href="/" className="brand">{L.app}</Link>
        <nav aria-label="Menu utama">
          {items.map((i) => (
            <Link key={i.key} href={i.href} className={active === i.key ? "on" : ""} aria-current={active === i.key ? "page" : undefined}>
              {i.label}
            </Link>
          ))}
        </nav>
        <div className="who">
          <span>{user.name}{user.role ? ` · ${user.role}` : ""}</span>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
