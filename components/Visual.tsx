import type { ReactNode } from "react";
import Logo from "./Logo";
import type { Beban, Segmen, Wawasan } from "@/lib/analitik";

export function Hero({ kicker, teks, children }: { kicker: string; teks?: string; children: ReactNode }) {
  return (
    <section className="hero">
      <Logo ukuran={190} className="hero-art" />
      <div className="kicker">{kicker}</div>
      <h1>{children}</h1>
      {teks && <p className="muted">{teks}</p>}
    </section>
  );
}

export function Cincin({ nilai, label, sub }: { nilai: number; label: string; sub?: string }) {
  const r = 42;
  const k = 2 * Math.PI * r;
  const n = Math.max(0, Math.min(100, nilai));
  const warna = n >= 70 ? "#1D9E75" : n >= 40 ? "#F2A33A" : "#C0392B";
  return (
    <div className="cincin">
      <svg viewBox="0 0 100 100" role="img" aria-label={`${label} ${n}%`}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="#E7E4D9" strokeWidth="9" />
        {n > 0 && (
          <circle cx="50" cy="50" r={r} fill="none" stroke={warna} strokeWidth="9" strokeLinecap="round"
            strokeDasharray={`${(k * n) / 100} ${k}`} transform="rotate(-90 50 50)" />
        )}
        <text x="50" y="57" textAnchor="middle" className="cincin-n">{n}%</text>
      </svg>
      <div>
        <div className="cincin-l">{label}</div>
        {sub && <div className="muted meta">{sub}</div>}
      </div>
    </div>
  );
}

export function Batang({ judul, segmen, kosong }: { judul: string; segmen: Segmen[]; kosong: string }) {
  const total = segmen.reduce((a, s) => a + s.n, 0);
  return (
    <div>
      <div className="pj">{judul}</div>
      {total === 0 ? (
        <div className="muted meta">{kosong}</div>
      ) : (
        <>
          <div className="stack" role="img" aria-label={segmen.map((s) => `${s.label} ${s.n}`).join(", ")}>
            {segmen.filter((s) => s.n > 0).map((s) => (
              <i key={s.label} style={{ width: `${(s.n / total) * 100}%`, background: s.warna }} title={`${s.label}: ${s.n}`} />
            ))}
          </div>
          <ul className="legenda">
            {segmen.map((s) => (
              <li key={s.label}><span className="dot" style={{ background: s.warna }} />{s.label} <b>{s.n}</b></li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export function BebanPemilik({ baris }: { baris: Beban[] }) {
  if (baris.length === 0) return <div className="muted meta">Belum ada yang berjalan.</div>;
  const maks = Math.max(1, ...baris.map((b) => b.total));
  return (
    <>
      <div className="beban">
        {baris.map((b) => (
          <div className="beban-baris" key={b.nama}>
            <span className="beban-nama" title={b.nama}>{b.nama}</span>
            <div className="beban-isi" style={{ width: `${(b.total / maks) * 100}%` }}>
              <i style={{ flex: b.total - b.telat, background: "#1D9E75" }} />
              <i style={{ flex: b.telat, background: "#C0392B" }} />
            </div>
            <span className="beban-angka">{b.total}</span>
          </div>
        ))}
      </div>
      <ul className="legenda">
        <li><span className="dot" style={{ background: "#1D9E75" }} />Tepat waktu</li>
        <li><span className="dot" style={{ background: "#C0392B" }} />Lewat tenggat</li>
      </ul>
    </>
  );
}

const IKON = { ok: "✓", warn: "!", bad: "✕" };
export function Evaluasi({ butir }: { butir: Wawasan[] }) {
  return (
    <ul className="wawasan">
      {butir.map((b, i) => (
        <li key={i} className={b.nada}>
          <span className="ikon" aria-hidden="true">{IKON[b.nada]}</span>
          <span>{b.teks}</span>
        </li>
      ))}
    </ul>
  );
}