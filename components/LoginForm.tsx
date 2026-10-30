"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const res = await signIn("credentials", { email, password, redirect: false });
    setBusy(false);
    if (res?.ok && !res.error) {
      window.location.href = "/";
    } else {
      setErr("Email atau kata sandi tidak cocok, atau akun terkunci sementara. Coba lagi beberapa menit lagi.");
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <label className="f">Email
        <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="f">Kata sandi
        <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      {err && <p className="banner alert" role="alert" style={{ margin: 0 }}>{err}</p>}
      <button className="btn" disabled={busy}>{busy ? "Memeriksa…" : "Masuk"}</button>
    </form>
  );
}
