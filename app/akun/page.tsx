import { redirect } from "next/navigation";
import Topbar from "@/components/Topbar";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import { currentUser } from "@/lib/auth";

export default async function AccountPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return (
    <>
      <Topbar user={user} active="account" />
      <main className="wrap">
        <h1>Akun saya</h1>
        <p className="muted">{user.email}{user.role ? ` · ${user.role}` : ""}</p>
        <div className="card narrow" style={{ marginTop: 16 }}>
          <h2>Ganti kata sandi</h2>
          <ChangePasswordForm />
        </div>
      </main>
    </>
  );
}
