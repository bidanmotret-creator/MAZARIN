import Link from "next/link";
import { redirect } from "next/navigation";
import Topbar from "@/components/Topbar";
import KpiBlock from "@/components/KpiBlock";
import { currentUser } from "@/lib/auth";
import { callApi } from "@/lib/api";
import { L } from "@/lib/labels";
import type { ScorecardData } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ScorecardPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  let data: ScorecardData | null = null;
  let error = "";
  try {
    data = await callApi<ScorecardData>("scorecard.get", user.email);
  } catch (e: any) {
    error = e.message;
  }

  return (
    <>
      <Topbar user={user} active="scorecard" />
      <main className="wrap">
        <h1>{L.scorecard}</h1>
        {error && <p className="banner alert" role="alert">Data belum bisa dimuat: {error}</p>}
        {data && (
          <>
            <p className="muted">{data.week} · diperbarui {data.updatedAt}</p>
            <div className="grid tiles">
              <div className="card tile">
                <div className="n">{data.summary.health}%</div>
                <div className="l">Angka sesuai jalur</div>
                <div className="meter" aria-hidden><i style={{ width: `${data.summary.health}%` }} /></div>
              </div>
              <div className="card tile"><div className="n">{data.summary.total}</div><div className="l">Total angka</div></div>
              <div className="card tile"><div className="n" style={{ color: "var(--ok)" }}>{data.summary.onTrack}</div><div className="l">{L.status["ON TRACK"]}</div></div>
              <div className="card tile"><div className="n" style={{ color: "var(--warn)" }}>{data.summary.warning}</div><div className="l">{L.status["WARNING"]}</div></div>
              <div className="card tile"><div className="n" style={{ color: "var(--bad)" }}>{data.summary.offTrack}</div><div className="l">{L.status["OFF TRACK"]}</div></div>
            </div>
            {data.alertMessage && <div className="banner alert">{data.alertMessage}</div>}
            {data.ruleWarning && <div className="banner rule">{data.ruleWarning}</div>}
            {data.company.length > 0 && <KpiBlock title="Angka Utama Bisnis" rows={data.company} />}
            {Object.entries(data.departments).map(([dept, rows]) => (
              <KpiBlock key={dept} title={dept} rows={rows} />
            ))}
            {data.summary.total === 0 && (
              <div className="empty">Belum ada angka. <Link href="/kartu-skor/isi" style={{ color: "var(--brand)" }}>Isi angka pertama</Link>.</div>
            )}
          </>
        )}
      </main>
    </>
  );
}
