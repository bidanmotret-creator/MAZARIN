"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { IssueRow, WorkData } from "@/lib/types";
import { tgl, lewatTenggat } from "@/lib/tanggal";

const PRIORITAS = ["Low", "Medium", "High", "Critical"];
const NAMA: Record<string, string> = { Low: "Rendah", Medium: "Sedang", High: "Tinggi", Critical: "Kritis" };
const CHIP: Record<string, string> = { Low: "na", Medium: "warn", High: "bad", Critical: "bad" };

type Form = { id: string; rockId: string; title: string; description: string; priority: string; owner: string; due: string; rootCause: string };
const kosong = (rockId: string): Form => ({ id: "", rockId, title: "", description: "", priority: "Medium", owner: "", due: "", rootCause: "" });
const dari = (i: IssueRow): Form => ({ id: i.id, rockId: i.rockId, title: i.title, description: i.description, priority: i.priority, owner: i.owner, due: i.due, rootCause: i.rootCause });

export default function IssuesBoard({ data }: { data: WorkData }) {
  const router = useRouter();
  const [saring, setSaring] = useState<"buka" | "selesai" | "semua">("buka");
  const [form, setForm] = useState<Form | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const rockAktif = data.rocks.filter((r) => !r.done);
  const urut = [...data.issues].sort((a, b) => (a.status === b.status ? a.due.localeCompare(b.due) : a.status === "Open" ? -1 : 1));
  const tampil = urut.filter((i) => saring === "semua" || (saring === "buka" ? i.status === "Open" : i.status === "Done"));
  const buka = data.issues.filter((i) => i.status === "Open");
  const penting = buka.filter((i) => i.priority === "High" || i.priority === "Critical").length;
  const ubah = (k: keyof Form, v: string) => setForm((f) => (f ? { ...f, [k]: v } : f));
  const pemilik = Array.from(new Set(data.owners.concat(form && form.owner ? [form.owner] : [])));
  const pilihanRock = rockAktif.concat(form && form.id ? data.rocks.filter((r) => r.id === form.rockId && r.done) : []);

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
            <option value="buka">Masih berjalan</option>
            <option value="selesai">Selesai</option>
            <option value="semua">Semua</option>
          </select>
        </label>
        <button type="button" className="btn" disabled={rockAktif.length === 0} onClick={() => { setMsg(null); setForm(kosong(rockAktif[0]?.id ?? "")); }}>
          + Tambah Issue
        </button>
      </div>

      {rockAktif.length === 0 && <div className="banner rule">Belum ada Rock yang berjalan. Buat dulu di halaman Rocks, karena tiap Issue terhubung ke satu Rock.</div>}

      <div className="grid tiles">
        <div className="card tile"><div className="n">{data.issues.length}</div><div className="l">Total Issues</div></div>
        <div className="card tile"><div className="n">{buka.length}</div><div className="l">Masih berjalan</div></div>
        <div className="card tile"><div className="n">{data.issues.length - buka.length}</div><div className="l">Selesai</div></div>
        <div className="card tile"><div className="n">{penting}</div><div className="l">Prioritas tinggi</div></div>
      </div>

      {form && (
        <form className="card block" onSubmit={(e) => { e.preventDefault(); kirim({ action: "issue.save", ...form }, form.id ? "Perubahan tersimpan." : "Issue baru tersimpan."); }}>
          <h2>{form.id ? "Ubah Issue" : "Issue baru"}</h2>
          <div className="formgrid" style={{ marginTop: 12 }}>
            <label className="f">Rock terkait
              <select required disabled={!!form.id} value={form.rockId} onChange={(e) => ubah("rockId", e.target.value)}>
                {pilihanRock.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </label>
            <label className="f">Judul masalah
              <input type="text" required maxLength={200} value={form.title} onChange={(e) => ubah("title", e.target.value)} placeholder="Contoh: Chat sering telat dibalas malam hari" />
            </label>
            <label className="f">Prioritas
              <select value={form.priority} onChange={(e) => ubah("priority", e.target.value)}>
                {PRIORITAS.map((p) => <option key={p} value={p}>{NAMA[p]}</option>)}
              </select>
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
          <label className="f" style={{ marginTop: 12 }}>Catatan
            <textarea rows={2} maxLength={1000} value={form.description} onChange={(e) => ubah("description", e.target.value)} />
          </label>
          <label className="f" style={{ marginTop: 12 }}>Akar masalah (opsional)
            <textarea rows={2} maxLength={1000} value={form.rootCause} onChange={(e) => ubah("rootCause", e.target.value)} />
          </label>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button className="btn" disabled={busy}>{busy ? "Menyimpan..." : "Simpan Issue"}</button>
            <button type="button" className="btn ghost" onClick={() => setForm(null)}>Batal</button>
          </div>
        </form>
      )}

      {tampil.length === 0 && !form && <div className="empty">Tidak ada Issue untuk pilihan ini.</div>}

      {tampil.map((i) => {
        const tugas = data.todos.filter((t) => t.issueId === i.id);
        const beres = tugas.filter((t) => t.status === "Done").length;
        const telat = lewatTenggat(i.due, i.status === "Done");
        return (
          <article className="card rock" key={i.id}>
            <div className="top">
              <div>
                <div className="judul">{i.title}</div>
                <div className="muted meta">{i.owner} · Tenggat {tgl(i.due)}{telat ? " (lewat)" : ""} · {i.rockLabel}</div>
              </div>
              <span className={`chip ${i.status === "Done" ? "ok" : CHIP[i.priority]}`}>
                {i.status === "Done" ? "Selesai" : `Prioritas ${NAMA[i.priority]}`}
              </span>
            </div>
            {i.description && <p className="muted">{i.description}</p>}
            {i.rootCause && <p className="muted">Akar masalah: {i.rootCause}</p>}
            <div className="meter" role="progressbar" aria-valuenow={i.progress} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${i.progress}%` }} /></div>
            <div className="aksi">
              <span className="muted">{i.progress}% · To-Do {beres}/{tugas.length}</span>
              <button type="button" className="btn ghost" onClick={() => { setMsg(null); setForm(dari(i)); }}>Ubah</button>
              {i.status !== "Done" && <Link href={`/to-do?issue=${i.id}`} className="btn ghost">+ To-Do</Link>}
              {i.status !== "Done" && (
                <button type="button" className="btn ghost" disabled={busy} onClick={() => { if (window.confirm("Tandai Issue ini selesai?")) kirim({ action: "issue.solve", id: i.id }, "Issue ditandai selesai."); }}>
                  Selesai
                </button>
              )}
            </div>
          </article>
        );
      })}

      {msg && <div className={`toast ${msg.ok ? "ok" : "err"}`} role="status">{msg.text}</div>}
    </>
  );
}