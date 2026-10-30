"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { WeeklyList } from "@/lib/types";

export default function WeeklyForm({ data }: { data: WeeklyList }) {
  const router = useRouter();
  const [week, setWeek] = useState(data.weekDateStr);
  const [vals, setVals] = useState<Record<string, string>>(
    Object.fromEntries(data.kpis.map((k) => [k.key, k.currentActual === null ? "" : String(k.currentActual)]))
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const groups = data.kpis.reduce<Record<string, typeof data.kpis>>((acc, k) => {
    (acc[k.department] ||= []).push(k);
    return acc;
  }, {});

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/kartu-skor/isi", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ week, scores: vals }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message);
      setMsg({ ok: true, text: `Tersimpan: ${json.data.updated} diperbarui, ${json.data.added} ditambahkan.` });
      router.refresh();
    } catch (err: any) {
      setMsg({ ok: false, text: err.message || "Gagal menyimpan." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save}>
      <div className="toolbar">
        <label className="f">Pekan yang diisi
          <input type="date" value={week} onChange={(e) => setWeek(e.target.value)} />
        </label>
        <button type="button" className="btn ghost" onClick={() => router.push(`/kartu-skor/isi?week=${week}`)}>
          Tampilkan pekan ini
        </button>
        <span className="muted">{data.weekLabel} · {data.weekRange}</span>
      </div>
      {Object.entries(groups).map(([dept, kpis]) => (
        <section className="card block" key={dept}>
          <h2>{dept}</h2>
          {kpis.map((k) => (
            <div className="row" key={k.key}>
              <label htmlFor={k.key}>
                <div style={{ fontWeight: 650 }}>{k.kpiName}</div>
                <div className="muted" style={{ fontSize: ".83rem" }}>Target {k.target}{k.owner ? ` · ${k.owner}` : ""}</div>
              </label>
              <input id={k.key} type="number" step="any" inputMode="decimal" value={vals[k.key] ?? ""}
                     onChange={(e) => setVals({ ...vals, [k.key]: e.target.value })} />
            </div>
          ))}
        </section>
      ))}
      {data.kpis.length === 0 && <div className="empty">Belum ada angka bertipe manual.</div>}
      <div style={{ marginTop: 20 }}><button className="btn" disabled={busy || data.kpis.length === 0}>{busy ? "Menyimpan…" : "Simpan angka"}</button></div>
      {msg && <div className={`toast ${msg.ok ? "ok" : "err"}`} role="status">{msg.text}</div>}
    </form>
  );
}
