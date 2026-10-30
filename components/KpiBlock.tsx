import { L } from "@/lib/labels";
import type { KpiRow } from "@/lib/types";

const cls = (t?: string) => (t === "ON TRACK" ? "ok" : t === "WARNING" ? "warn" : t === "OFF TRACK" ? "bad" : "na");
const fmt = (n: number) => new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(n);

export default function KpiBlock({ title, rows }: { title: string; rows: KpiRow[] }) {
  return (
    <section className="card block" aria-label={title}>
      <h2>{title}</h2>
      {rows.map((k) => (
        <div className="kpi" key={k.department + k.kpiName}>
          <div>
            <div className="name">{k.kpiName}</div>
            <div className="meta">
              {k.owner || "Belum ada penanggung jawab"} · tercapai {k.hitRate.hit}/{k.hitRate.total} minggu
              {k.isStale ? " · belum diperbarui" : ""}
            </div>
          </div>
          <div className="nums">
            <b>{fmt(k.actual)}</b> <span className="muted">/ {fmt(k.target)}</span>
            <div><span className={`chip ${cls(k.status?.text)}`}>{L.status[k.status?.text] ?? k.status?.text}</span></div>
          </div>
          <div className="spark" role="img" aria-label={`Riwayat ${k.history.length} minggu terakhir`}>
            {k.history.map((h, i) => (
              <i key={i} className={h.hasData ? cls(h.status?.text) : ""}
                 title={`${h.dateFull}: ${h.hasData ? `${fmt(h.actual ?? 0)} dari ${fmt(h.target ?? 0)}` : "belum ada data"}`} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
