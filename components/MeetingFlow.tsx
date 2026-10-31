"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { MeetingData } from "@/lib/types";
import { tgl, lewatTenggat, jatuhHariIni } from "@/lib/tanggal";
import { analitikMeeting } from "@/lib/analitik";
import { Evaluasi } from "./Visual";

const LANGKAH = [
  { nama: "Segue", menit: 5, tujuan: "Buka dengan kabar baik pribadi dan bisnis supaya semua hadir sepenuhnya." },
  { nama: "Scorecard", menit: 5, tujuan: "Lihat angka mingguan. Yang sesuai jalur dilewati, yang melenceng masuk ke IDS." },
  { nama: "Rocks", menit: 5, tujuan: "Cek tiap Rock: sesuai jalur atau tidak. Ini bukan tempat membahas solusi." },
  { nama: "Headlines", menit: 5, tujuan: "Kabar singkat dari pelanggan dan tim. Kalau perlu dibahas, pindahkan ke IDS." },
  { nama: "To-Do", menit: 5, tujuan: "Tinjau tugas minggu lalu: selesai atau belum, tanpa diskusi panjang." },
  { nama: "IDS", menit: 60, tujuan: "Identify, Discuss, Solve. Selesaikan satu per satu mulai dari yang terpenting, lalu ubah jadi To-Do." },
  { nama: "Tutup", menit: 5, tujuan: "Rekap, pesan untuk tim, dan beri rating meeting 1 sampai 10." },
];
const PRIORITAS = ["Low", "Medium", "High", "Critical"];
const NAMA: Record<string, string> = { Low: "Rendah", Medium: "Sedang", High: "Tinggi", Critical: "Kritis" };
const CHIP: Record<string, string> = { Low: "na", Medium: "warn", High: "bad", Critical: "bad" };
const URUT: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

type Isi = { segue: string; customerHeadlines: string; employeeHeadlines: string; notes: string; decision: string; cascading: string; rating: number };
type FIssue = { rockId: string; title: string; priority: string; owner: string; due: string };
type FTodo = { issueId: string; task: string; owner: string; due: string };

export default function MeetingFlow({ data }: { data: MeetingData }) {
  const router = useRouter();
  const m = data.meeting;
  const work = data.work;
  const kunci = m.status === "Completed";

  const [langkah, setLangkah] = useState(0);
  const [isi, setIsi] = useState<Isi>({
    segue: m.segue, customerHeadlines: m.customerHeadlines, employeeHeadlines: m.employeeHeadlines,
    notes: m.notes, decision: m.decision, cascading: m.cascading, rating: m.rating,
  });
  const [kotor, setKotor] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [fIssue, setFIssue] = useState<FIssue | null>(null);
  const [fTodo, setFTodo] = useState<FTodo | null>(null);
  const [baru, setBaru] = useState({ issue: data.recap.issues, todo: data.recap.todos, issueSelesai: 0, todoSelesai: 0 });

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 4000);
    return () => clearTimeout(t);
  }, [msg]);
  useEffect(() => {
    if (!kotor) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [kotor]);

  const rw = analitikMeeting(data.history);
  const rocksAktif = work.rocks.filter((r) => !r.done);
  const rata = rocksAktif.length ? Math.round(rocksAktif.reduce((a, r) => a + (r.progress ?? 0), 0) / rocksAktif.length) : 0;
  const issueBuka = work.issues
    .filter((i) => i.status === "Open")
    .sort((a, b) => (URUT[a.priority] ?? 9) - (URUT[b.priority] ?? 9) || a.due.localeCompare(b.due));
  const todoBuka = work.todos.filter((t) => t.status === "Open").sort((a, b) => a.due.localeCompare(b.due));
  const telat = todoBuka.filter((t) => lewatTenggat(t.due, false)).length;
  const hariIni = todoBuka.filter((t) => jatuhHariIni(t.due, false)).length;
  const opsiPemilik = (cur: string) => Array.from(new Set(work.owners.concat(cur ? [cur] : [])));
  const sc = data.scorecard;

  function set<K extends keyof Isi>(k: K, v: Isi[K]) {
    setIsi((s) => ({ ...s, [k]: v }));
    setKotor(true);
  }
  const ubahI = (k: keyof FIssue, v: string) => setFIssue((f) => (f ? { ...f, [k]: v } : f));
  const ubahT = (k: keyof FTodo, v: string) => setFTodo((f) => (f ? { ...f, [k]: v } : f));

  async function panggil(url: string, body: Record<string, unknown>) {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = await res.json();
    if (!json.ok) throw new Error(json.message);
  }
  async function aksi(url: string, body: Record<string, unknown>, ok: string, sesudah?: () => void) {
    setBusy(true);
    setMsg(null);
    try {
      await panggil(url, body);
      sesudah?.();
      setMsg({ ok: true, text: ok });
      router.refresh();
    } catch (err: any) {
      setMsg({ ok: false, text: err.message || "Gagal menyimpan." });
    } finally {
      setBusy(false);
    }
  }
  async function simpan(tutup: boolean, diam = false) {
    if (kunci) return;
    if (!diam) { setBusy(true); setMsg(null); }
    try {
      await panggil("/api/meeting", { action: tutup ? "finish" : "save", id: m.id, ...isi });
      setKotor(false);
      if (!diam) setMsg({ ok: true, text: tutup ? "Meeting selesai disimpan." : "Draf tersimpan." });
      if (tutup) router.refresh();
    } catch (err: any) {
      if (!diam) setMsg({ ok: false, text: err.message || "Gagal menyimpan." });
    } finally {
      if (!diam) setBusy(false);
    }
  }
  function pindah(n: number) {
    if (kotor && !kunci) void simpan(false, true);
    setLangkah(Math.max(0, Math.min(LANGKAH.length - 1, n)));
  }

  const L = LANGKAH[langkah];

  return (
    <>
      <section className="analitik" aria-label="Ringkasan meeting">
        <div className="card">
          <div className="judul-kartu">Meeting minggu ini</div>
          <div className="cincin-l">Minggu {m.week}, {m.year}</div>
          <div className="muted meta">{m.quarter} · {m.facilitator || "Tanpa fasilitator"} · {tgl(m.date)}</div>
          <div style={{ marginTop: 12 }}>
            <span className={`chip ${kunci ? "ok" : "warn"}`}>{kunci ? `Selesai, rating ${m.rating || "-"}` : "Sedang berjalan"}</span>
          </div>
          <div className="muted meta" style={{ marginTop: 10 }}>Agenda 90 menit, tujuh langkah.</div>
        </div>
        <div className="card">
          <div className="judul-kartu">Rating meeting terakhir</div>
          {rw.seri.length === 0 ? (
            <div className="muted meta">Belum ada meeting yang diberi rating.</div>
          ) : (
            <div className="seri" role="img" aria-label={rw.seri.map((s) => `${s.label}: ${s.rating}`).join(", ")}>
              {rw.seri.map((s) => (
                <div key={s.label}>
                  <span><b>{s.rating}</b></span>
                  <i style={{ height: `${s.rating * 8}px`, background: s.rating >= 8 ? "#1D9E75" : s.rating >= 6 ? "#F2A33A" : "#C0392B" }} />
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card evaluasi">
          <div className="judul-kartu">Evaluasi</div>
          <Evaluasi butir={rw.butir} />
        </div>
      </section>

      <nav className="langkah" aria-label="Agenda Level 10">
        {LANGKAH.map((l, i) => (
          <button key={l.nama} type="button" className={[i === langkah ? "on" : "", i < langkah ? "lewat" : ""].join(" ").trim()}
            aria-current={i === langkah ? "step" : undefined} onClick={() => pindah(i)}>
            <span className="no">{i + 1}</span>
            <span className="nm">{l.nama}</span>
            <span className="mn">{l.menit} menit</span>
          </button>
        ))}
      </nav>

      <section className="panel">
        <h2>{langkah + 1}. {L.nama}</h2>
        <p className="tujuan">{L.tujuan}</p>
        {kunci && <div className="banner rule">Meeting minggu ini sudah ditutup, jadi isinya hanya bisa dibaca.</div>}

        {langkah === 0 && (
          <label className="f">Kabar baik minggu ini (pribadi dan bisnis)
            <textarea rows={4} maxLength={2000} disabled={kunci} value={isi.segue} onChange={(e) => set("segue", e.target.value)} placeholder="Contoh: closing klien baru, ulang tahun anak, dll." />
          </label>
        )}

        {langkah === 1 && (
          <>
            <div className="grid tiles">
              <div className="card tile" style={{ borderTopColor: "#1D9E75" }}><div className="n">{sc.onTrack}</div><div className="l">Sesuai jalur</div></div>
              <div className="card tile" style={{ borderTopColor: "#F2A33A" }}><div className="n">{sc.warning}</div><div className="l">Perlu perhatian</div></div>
              <div className="card tile" style={{ borderTopColor: "#C0392B" }}><div className="n">{sc.offTrack}</div><div className="l">Melenceng</div></div>
            </div>
            <p className="muted">
              {sc.offTrack > 0
                ? `${sc.offTrack} angka melenceng. Catat tiap angka itu sebagai Issue di langkah IDS.`
                : "Tidak ada angka yang melenceng."}{" "}
              <Link href="/kartu-skor" target="_blank">Buka Scorecard</Link>
            </p>
          </>
        )}

        {langkah === 2 && (
          rocksAktif.length === 0 ? <div className="empty">Belum ada Rock yang berjalan.</div> : (
            <>
              <div className="muted meta">Rata-rata progres {rata}% · {rocksAktif.length} Rock berjalan</div>
              <div className="meter" role="progressbar" aria-valuenow={rata} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${rata}%` }} /></div>
              <div style={{ marginTop: 8 }}>
                {rocksAktif.map((r) => {
                  const p = r.progress ?? 0;
                  const lewat = lewatTenggat(r.due ?? "", false);
                  return (
                    <div className="item" key={r.id}>
                      <div className="isi" style={{ flex: 1 }}>
                        <div className="judul">{r.label}</div>
                        <div className="meter" role="progressbar" aria-valuenow={p} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${p}%` }} /></div>
                      </div>
                      <span className={`chip ${lewat ? "bad" : p >= 70 ? "ok" : "warn"}`}>{p}%{lewat ? " · lewat" : ""}</span>
                    </div>
                  );
                })}
              </div>
              <p className="muted meta"><Link href="/rocks" target="_blank">Buka halaman Rocks</Link> untuk mengubah progres.</p>
            </>
          )
        )}

        {langkah === 3 && (
          <div className="formgrid">
            <label className="f">Customer Headlines
              <textarea rows={5} maxLength={2000} disabled={kunci} value={isi.customerHeadlines} onChange={(e) => set("customerHeadlines", e.target.value)} placeholder="Kabar dari pelanggan minggu ini..." />
            </label>
            <label className="f">Employee Headlines
              <textarea rows={5} maxLength={2000} disabled={kunci} value={isi.employeeHeadlines} onChange={(e) => set("employeeHeadlines", e.target.value)} placeholder="Kabar dari tim minggu ini..." />
            </label>
          </div>
        )}

        {langkah === 4 && (
          <>
            <div className="grid tiles">
              <div className="card tile"><div className="n">{todoBuka.length}</div><div className="l">Belum selesai</div></div>
              <div className="card tile"><div className="n">{hariIni}</div><div className="l">Jatuh tempo hari ini</div></div>
              <div className="card tile"><div className="n">{telat}</div><div className="l">Lewat tenggat</div></div>
            </div>
            {todoBuka.length === 0 && <div className="empty">Semua To-Do sudah selesai.</div>}
            {todoBuka.map((t) => {
              const lewat = lewatTenggat(t.due, false);
              const hari = jatuhHariIni(t.due, false);
              return (
                <div className="item" key={t.id}>
                  <div className="isi">
                    <div className="judul">{t.task}</div>
                    <div className="muted meta">{t.owner} · Tenggat {tgl(t.due)} · {t.issueLabel}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span className={`chip ${lewat ? "bad" : hari ? "warn" : "na"}`}>{lewat ? "Lewat tenggat" : hari ? "Hari ini" : "Belum selesai"}</span>
                    {!kunci && (
                      <button type="button" className="btn ghost" disabled={busy}
                        onClick={() => aksi("/api/kerja", { action: "todo.finish", id: t.id }, "To-Do ditandai selesai.", () => setBaru((b) => ({ ...b, todoSelesai: b.todoSelesai + 1 })))}>
                        Tandai selesai
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {langkah === 5 && (
          <>
            {issueBuka.length === 0 && <div className="empty">Belum ada Issue yang berjalan. Tambahkan di bawah.</div>}
            {issueBuka.map((i) => {
              const n = work.todos.filter((t) => t.issueId === i.id && t.status === "Open").length;
              const lewat = lewatTenggat(i.due, false);
              return (
                <div key={i.id}>
                  <div className="item">
                    <div className="isi">
                      <div className="judul">{i.title}</div>
                      <div className="muted meta">{i.owner} · Tenggat {tgl(i.due)}{lewat ? " (lewat)" : ""} · {i.rockLabel}</div>
                      {i.rootCause && <div className="muted meta">Akar masalah: {i.rootCause}</div>}
                      <div className="muted meta">To-Do berjalan: {n}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <span className={`chip ${CHIP[i.priority] ?? "na"}`}>{NAMA[i.priority] ?? i.priority}</span>
                      {!kunci && <button type="button" className="btn ghost" onClick={() => { setMsg(null); setFTodo({ issueId: i.id, task: "", owner: i.owner, due: "" }); }}>+ To-Do</button>}
                      {!kunci && (
                        <button type="button" className="btn ghost" disabled={busy}
                          onClick={() => { if (window.confirm("Tandai Issue ini selesai?")) aksi("/api/kerja", { action: "issue.solve", id: i.id }, "Issue ditandai selesai.", () => setBaru((b) => ({ ...b, issueSelesai: b.issueSelesai + 1 }))); }}>
                          Selesai
                        </button>
                      )}
                    </div>
                  </div>
                  {fTodo && fTodo.issueId === i.id && (
                    <form className="subform" onSubmit={(e) => { e.preventDefault(); aksi("/api/meeting", { action: "todo.add", meetingId: m.id, ...fTodo }, "To-Do baru tersimpan.", () => { setFTodo(null); setBaru((b) => ({ ...b, todo: b.todo + 1 })); }); }}>
                      <div className="formgrid">
                        <label className="f">Tugas
                          <input type="text" required maxLength={300} value={fTodo.task} onChange={(e) => ubahT("task", e.target.value)} placeholder="Contoh: Susun jadwal jaga chat malam" />
                        </label>
                        <label className="f">Penanggung jawab
                          <select required value={fTodo.owner} onChange={(e) => ubahT("owner", e.target.value)}>
                            <option value="">Pilih nama...</option>
                            {opsiPemilik(fTodo.owner).map((n) => <option key={n} value={n}>{n}</option>)}
                          </select>
                        </label>
                        <label className="f">Tenggat
                          <input type="date" required value={fTodo.due} onChange={(e) => ubahT("due", e.target.value)} />
                        </label>
                      </div>
                      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                        <button className="btn" disabled={busy}>{busy ? "Menyimpan..." : "Simpan To-Do"}</button>
                        <button type="button" className="btn ghost" onClick={() => setFTodo(null)}>Batal</button>
                      </div>
                    </form>
                  )}
                </div>
              );
            })}

            {!kunci && !fIssue && (
              <div style={{ marginTop: 14 }}>
                <button type="button" className="btn" disabled={rocksAktif.length === 0} onClick={() => { setMsg(null); setFIssue({ rockId: rocksAktif[0]?.id ?? "", title: "", priority: "Medium", owner: "", due: "" }); }}>
                  + Issue baru
                </button>
                {rocksAktif.length === 0 && <span className="muted meta"> Buat Rock dulu, karena tiap Issue terhubung ke satu Rock.</span>}
              </div>
            )}
            {!kunci && fIssue && (
              <form className="subform" onSubmit={(e) => { e.preventDefault(); aksi("/api/meeting", { action: "issue.add", meetingId: m.id, ...fIssue }, "Issue baru tersimpan.", () => { setFIssue(null); setBaru((b) => ({ ...b, issue: b.issue + 1 })); }); }}>
                <div className="formgrid">
                  <label className="f">Rock terkait
                    <select required value={fIssue.rockId} onChange={(e) => ubahI("rockId", e.target.value)}>
                      {rocksAktif.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                    </select>
                  </label>
                  <label className="f">Judul masalah
                    <input type="text" required maxLength={200} value={fIssue.title} onChange={(e) => ubahI("title", e.target.value)} placeholder="Contoh: Chat sering telat dibalas malam hari" />
                  </label>
                  <label className="f">Prioritas
                    <select value={fIssue.priority} onChange={(e) => ubahI("priority", e.target.value)}>
                      {PRIORITAS.map((p) => <option key={p} value={p}>{NAMA[p]}</option>)}
                    </select>
                  </label>
                  <label className="f">Penanggung jawab
                    <select required value={fIssue.owner} onChange={(e) => ubahI("owner", e.target.value)}>
                      <option value="">Pilih nama...</option>
                      {opsiPemilik(fIssue.owner).map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </label>
                  <label className="f">Tenggat
                    <input type="date" required value={fIssue.due} onChange={(e) => ubahI("due", e.target.value)} />
                  </label>
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                  <button className="btn" disabled={busy}>{busy ? "Menyimpan..." : "Simpan Issue"}</button>
                  <button type="button" className="btn ghost" onClick={() => setFIssue(null)}>Batal</button>
                </div>
              </form>
            )}
          </>
        )}

        {langkah === 6 && (
          <>
            <div className="grid tiles">
              <div className="card tile"><div className="n">{baru.todo}</div><div className="l">To-Do baru</div></div>
              <div className="card tile"><div className="n">{baru.issue}</div><div className="l">Issue baru</div></div>
              <div className="card tile"><div className="n">{baru.issueSelesai}</div><div className="l">Issue selesai (sesi ini)</div></div>
              <div className="card tile"><div className="n">{baru.todoSelesai}</div><div className="l">To-Do selesai (sesi ini)</div></div>
            </div>
            <label className="f" style={{ marginTop: 6 }}>Catatan tambahan
              <textarea rows={3} maxLength={2000} disabled={kunci} value={isi.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Poin-poin diskusi lain..." />
            </label>
            <label className="f" style={{ marginTop: 12 }}>Keputusan penting
              <textarea rows={3} maxLength={2000} disabled={kunci} value={isi.decision} onChange={(e) => set("decision", e.target.value)} placeholder="Keputusan besar yang diambil hari ini..." />
            </label>
            <label className="f" style={{ marginTop: 12 }}>Cascading message (pesan untuk tim yang tidak hadir)
              <textarea rows={3} maxLength={2000} disabled={kunci} value={isi.cascading} onChange={(e) => set("cascading", e.target.value)} placeholder="Apa yang perlu disampaikan ke tim lain..." />
            </label>
            <div className="f" style={{ marginTop: 12 }}>
              <span>Rating meeting ini (1 sampai 10)</span>
              <div className="rating" role="group" aria-label="Rating meeting">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <button key={n} type="button" disabled={kunci} className={isi.rating === n ? "on" : ""} aria-pressed={isi.rating === n} onClick={() => set("rating", n)}>{n}</button>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="bawah">
          <button type="button" className="btn ghost" disabled={langkah === 0} onClick={() => pindah(langkah - 1)}>Sebelumnya</button>
          {langkah < LANGKAH.length - 1 && <button type="button" className="btn" onClick={() => pindah(langkah + 1)}>Berikutnya</button>}
          <span className="spasi" />
          {kotor && !kunci && <span className="muted meta">Ada perubahan belum disimpan</span>}
          {!kunci && <button type="button" className="btn ghost" disabled={busy || !kotor} onClick={() => simpan(false)}>Simpan draf</button>}
          {!kunci && langkah === LANGKAH.length - 1 && (
            <button type="button" className="btn" disabled={busy || isi.rating < 1}
              onClick={() => { if (window.confirm("Tutup meeting minggu ini? Setelah ditutup isinya tidak bisa diubah.")) void simpan(true); }}>
              {busy ? "Menyimpan..." : "Selesai meeting"}
            </button>
          )}
        </div>
      </section>

      {msg && <div className={`toast ${msg.ok ? "ok" : "err"}`} role="status">{msg.text}</div>}
    </>
  );
}