"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TodoRow, WorkData } from "@/lib/types";
import { tgl, lewatTenggat, jatuhHariIni } from "@/lib/tanggal";

type Form = { id: string; issueId: string; task: string; description: string; owner: string; due: string };
const kosong = (issueId: string): Form => ({ id: "", issueId, task: "", description: "", owner: "", due: "" });
const dari = (t: TodoRow): Form => ({ id: t.id, issueId: t.issueId, task: t.task, description: t.description, owner: t.owner, due: t.due });

export default function TodoBoard({ data, awalIssue }: { data: WorkData; awalIssue: string }) {
  const router = useRouter();
  const [saring, setSaring] = useState<"buka" | "selesai" | "semua">("buka");
  const [form, setForm] = useState<Form | null>(awalIssue && data.issues.some((i) => i.id === awalIssue) ? kosong(awalIssue) : null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const issueBuka = data.issues.filter((i) => i.status === "Open");
  const urut = [...data.todos].sort((a, b) => (a.status === b.status ? a.due.localeCompare(b.due) : a.status === "Open" ? -1 : 1));
  const tampil = urut.filter((t) => saring === "semua" || (saring === "buka" ? t.status === "Open" : t.status === "Done"));
  const buka = data.todos.filter((t) => t.status === "Open");
  const hariIni = buka.filter((t) => jatuhHariIni(t.due, false)).length;
  const telat = buka.filter((t) => lewatTenggat(t.due, false)).length;
  const ubah = (k: keyof Form, v: string) => setForm((f) => (f ? { ...f, [k]: v } : f));
  const pemilik = Array.from(new Set(data.owners.concat(form && form.owner ? [form.owner] : [])));
  const pilihanIssue = issueBuka.concat(form && form.id ? data.issues.filter((i) => i.id === form.issueId && i.status === "Done") : []);

  async function kirim(body: Record<string, unknown>, ok: string) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/kerja", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message);
      setMsg({ ok: true, text: ok });
      setForm(null);
      router.refresh();
    } catch (err: any) {
      setMsg({ ok: false, text: err.message || "Gagal menyimpan." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="toolbar">
        <label className="f">Tampilkan
          <select value={saring} onChange={(e) => setSaring(e.target.value as "buka" | "selesai" | "semua")}>
            <option value="buka">Belum selesai</option>
            <option value="selesai">Selesai</option>
            <option value="semua">Semua</option>
          </select>
        </label>
        <button type="button" className="btn" disabled={issueBuka.length === 0} onClick={() => { setMsg(null); setForm(kosong(issueBuka[0]?.id ?? "")); }}>
          + Tambah To-Do
        </button>
      </div>

      {issueBuka.length === 0 && <div className="banner rule">Belum ada Issue yang berjalan. Buat dulu di halaman Issues, karena tiap To-Do terhubung ke satu Issue.</div>}

      <div className="grid tiles">
        <div className="card tile"><div className="n">{buka.length}</div><div className="l">Belum selesai</div></div>
        <div className="card tile"><div className="n">{hariIni}</div><div className="l">Jatuh tempo hari ini</div></div>
        <div className="card tile"><div className="n">{telat}</div><div className="l">Lewat tenggat</div></div>
        <div className="card tile"><div className="n">{data.todos.length - buka.length}</div><div className="l">Selesai</div></div>
      </div>

      {form && (
        <form className="card block" onSubmit={(e) => { e.preventDefault(); kirim({ action: "todo.save", ...form }, form.id ? "Perubahan tersimpan." : "To-Do baru tersimpan."); }}>
          <h2>{form.id ? "Ubah To-Do" : "To-Do baru"}</h2>
          <div className="formgrid" style={{ marginTop: 12 }}>
            <label className="f">Issue terkait
              <select required disabled={!!form.id} value={form.issueId} onChange={(e) => ubah("issueId", e.target.value)}>
                {pilihanIssue.map((i) => <option key={i.id} value={i.id}>{i.title}</option>)}
              </select>
            </label>
            <label className="f">Tugas
              <input type="text" required maxLength={300} value={form.task} onChange={(e) => ubah("task", e.target.value)} placeholder="Contoh: Susun jadwal jaga chat malam" />
            </label>
            <label className="f">Penanggung jawab
              <select required value={form.owner} onChange={(e) => ubah("owner", e.target.value)}>
                <option value="">Pilih nama...</option>
                {pemilik.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <label className="f">Tenggat
              <input type="date" required value={form.due} onChange={(e) => ubah("due", e.target.value)} />
            </label>
          </div>
          <label className="f" style={{ marginTop: 12 }}>Catatan (opsional)
            <textarea rows={2} maxLength={1000} value={form.description} onChange={(e) => ubah("description", e.target.value)} />
          </label>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button className="btn" disabled={busy}>{busy ? "Menyimpan..." : "Simpan To-Do"}</button>
            <button type="button" className="btn ghost" onClick={() => setForm(null)}>Batal</button>
          </div>
        </form>
      )}

      {tampil.length === 0 && !form && <div className="empty">Tidak ada To-Do untuk pilihan ini.</div>}

      {tampil.map((t) => {
        const selesai = t.status === "Done";
        const lewat = lewatTenggat(t.due, selesai);
        const hari = jatuhHariIni(t.due, selesai);
        return (
          <article className="card rock" key={t.id}>
            <div className="top">
              <div>
                <div className="judul">{t.task}</div>
                <div className="muted meta">{t.owner} · Tenggat {tgl(t.due)} · {t.issueLabel}</div>
              </div>
              <span className={`chip ${selesai ? "ok" : lewat ? "bad" : hari ? "warn" : "na"}`}>
                {selesai ? "Selesai" : lewat ? "Lewat tenggat" : hari ? "Hari ini" : "Belum selesai"}
              </span>
            </div>
            {t.description && <p className="muted">{t.description}</p>}
            {selesai && t.completed && <p className="muted">Selesai pada {tgl(t.completed)}</p>}
            {!selesai && (
              <div className="aksi">
                <button type="button" className="btn ghost" onClick={() => { setMsg(null); setForm(dari(t)); }}>Ubah</button>
                <button type="button" className="btn" disabled={busy} onClick={() => kirim({ action: "todo.finish", id: t.id }, "To-Do ditandai selesai.")}>Tandai selesai</button>
              </div>
            )}
          </article>
        );
      })}

      {msg && <div className={`toast ${msg.ok ? "ok" : "err"}`} role="status">{msg.text}</div>}
    </>
  );
}