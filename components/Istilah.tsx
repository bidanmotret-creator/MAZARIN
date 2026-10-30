"use client";
import { useState, useId } from "react";
import { GLOSARIUM, type IdIstilah } from "@/lib/glossary";

type Props = {
  id: IdIstilah;
  /** "judul" = besar untuk judul halaman, "label" = ukuran teks biasa (default) */
  ukuran?: "judul" | "label";
  /** sembunyikan baris arti (tetap ada tooltip "?") untuk tempat sempit seperti kepala tabel */
  ringkas?: boolean;
};

// Warna mengikuti tema gelap yang sudah ada; ubah variabel CSS di globals.css bila perlu.
const C = {
  teks: "var(--mos-teks, #f3ede7)",
  redup: "var(--mos-redup, #a89e95)",
  aksen: "var(--mos-aksen, #ff7a45)",
  kartu: "var(--mos-kartu, #2a221d)",
  garis: "var(--mos-garis, #3a312b)",
};

export default function Istilah({ id, ukuran = "label", ringkas = false }: Props) {
  const e = GLOSARIUM[id];
  const [buka, setBuka] = useState(false);
  const tipId = useId();
  const besar = ukuran === "judul";

  return (
    <span style={{ display: "inline-block", position: "relative", maxWidth: "100%" }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <strong style={{ color: C.teks, fontSize: besar ? 28 : 14, fontWeight: 700, letterSpacing: besar ? "-0.01em" : 0 }}>
          {e.istilah}
        </strong>
        <button
          type="button"
          aria-label={`Arti ${e.istilah}`}
          aria-expanded={buka}
          aria-controls={tipId}
          onClick={() => setBuka((v) => !v)}
          onBlur={() => setBuka(false)}
          style={{
            width: 18, height: 18, borderRadius: 9, border: `1px solid ${C.garis}`,
            background: "transparent", color: C.aksen, fontSize: 11, lineHeight: "16px",
            cursor: "pointer", padding: 0, flex: "none",
          }}
        >
          ?
        </button>
      </span>
      {!ringkas && (
        <span style={{ display: "block", color: C.redup, fontSize: besar ? 15 : 12, marginTop: 2, lineHeight: 1.4 }}>
          {e.arti}
        </span>
      )}
      {buka && (
        <span
          id={tipId}
          role="tooltip"
          style={{
            position: "absolute", zIndex: 20, left: 0, top: "100%", marginTop: 6, width: 280, maxWidth: "80vw",
            background: C.kartu, border: `1px solid ${C.garis}`, borderRadius: 10, padding: "10px 12px",
            color: C.teks, fontSize: 13, lineHeight: 1.45, boxShadow: "0 8px 24px rgba(0,0,0,.35)",
          }}
        >
          {e.arti}
          {e.contoh && <span style={{ display: "block", color: C.redup, marginTop: 6 }}>{e.contoh}</span>}
        </span>
      )}
    </span>
  );
}
