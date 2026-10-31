import Link from "next/link";
import { L } from "@/lib/labels";
import { MENU } from "@/lib/menu";
import type { SessionUser } from "@/lib/types";
import SignOutButton from "./SignOutButton";

export default function Topbar({ user, active }: { user: SessionUser; active?: string }) {
  return (
    <header className="topbar">
      <div className="in">
        <Link href="/" className="brand">{L.app}</Link>
        <nav aria-label="Menu utama">
          {MENU.map((i) => {
            const cls = [active === i.key ? "on" : "", i.soon ? "soon" : ""].filter(Boolean).join(" ");
            return (
              <Link key={i.key} href={i.href} className={cls} aria-current={active === i.key ? "page" : undefined}>
                {i.label}
              </Link>
            );
          })}
        </nav>
        <div className="who">
          <span>{user.name}{user.role ? ` \u00B7 ${user.role}` : ""}</span>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}