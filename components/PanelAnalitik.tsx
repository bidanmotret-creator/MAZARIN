import type { WorkData } from "@/lib/types";
import { analitikIssues, analitikTodo, type Hasil } from "@/lib/analitik";
import { Cincin, Batang, BebanPemilik, Evaluasi } from "./Visual";

export default function PanelAnalitik({ data, fokus, hasil }: { data?: WorkData; fokus?: "issues" | "todo"; hasil?: Hasil }) {
  const h = hasil ?? (fokus === "issues" ? analitikIssues(data as WorkData) : analitikTodo(data as WorkData));
  return (
    <section className="analitik" aria-label="Evaluasi">
      <div className="card">
        <div className="judul-kartu">Capaian</div>
        <Cincin nilai={h.tingkat} label={h.label} sub={h.sub} />
      </div>
      <div className="card">
        <div className="judul-kartu">Sebaran</div>
        <div className="dua">
          <Batang judul={h.judulA} segmen={h.segA} kosong={h.kosongA} />
          <Batang judul={h.judulB} segmen={h.segB} kosong={h.kosongB} />
        </div>
      </div>
      <div className="card">
        <div className="judul-kartu">Beban penanggung jawab</div>
        <BebanPemilik baris={h.beban} />
      </div>
      <div className="card evaluasi">
        <div className="judul-kartu">Evaluasi</div>
        <Evaluasi butir={h.wawasan} />
      </div>
    </section>
  );
}