"use client";
import { useState } from "react";

export default function ChangePasswordForm() {
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (next.length < 10) return setMsg({ ok: false, text: "Kata sandi baru minimal 10 karakter." });
    if (next.length > 72) return setMsg({ ok: false, text: "Kata sandi baru maksimal 72 karakter." });
    if (next !== again) return setMsg({ ok: false, text: "Pengulangan kata sandi tidak sama." });
    setBusy(true);
    try {
      const res = await fetch("/api/akun/sandi", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current: cur, next }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message);
      setMsg({ ok: true, text: "Kata sandi sudah diganti." });
      setCur(""); setNext(""); setAgain("");
    } catch (err: any) {
      setMsg({ ok: false, text: err.message || "Gagal mengganti kata sandi." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <label className="f">Kata sandi sekarang
        <input type="password" autoComplete="current-password" required value={cur} onChange={(e) => setCur(e.target.value)} />
      </label>
      <label className="f">Kata sandi baru
        <input type="password" autoComplete="new-password" required value={next} onChange={(e) => setNext(e.target.value)} />
      </label>
      <label className="f">Ulangi kata sandi baru
        <input type="password" autoComplete="new-password" required value={again} onChange={(e) => setAgain(e.target.value)} />
      </label>
      <p className="hint">Minimal 10 karakter. Kalimat panjang yang mudah diingat lebih kuat daripada kata pendek yang rumit.</p>
      <button className="btn" disabled={busy}>{busy ? "Menyimpan…" : "Ganti kata sandi"}</button>
      {msg && <div className={`toast ${msg.ok ? "ok" : "err"}`} role="status">{msg.text}</div>}
    </form>
  );
}
