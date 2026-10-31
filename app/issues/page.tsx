import { redirect } from "next/navigation";
import Topbar from "@/components/Topbar";
import Istilah from "@/components/Istilah";
import IssuesBoard from "@/components/IssuesBoard";
import PanelAnalitik from "@/components/PanelAnalitik";
import { Hero } from "@/components/Visual";
import { currentUser } from "@/lib/auth";
import { callApi } from "@/lib/api";
import type { WorkData } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function IssuesPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  let data: WorkData | null = null;
  let error = "";
  try {
    data = await callApi<WorkData>("work.list", user.email, {});
  } catch (e: any) {
    error = e.message;
  }
  return (
    <>
      <Topbar user={user} active="issues" />
      <main className="wrap">
        <Hero kicker="Mazarin Operational System · IDS" teks="Cara IDS: angkat masalahnya, bahas singkat, lalu selesaikan jadi To-Do dengan nama dan tenggat.">
          <Istilah id="issues" ukuran="judul" />
        </Hero>
        {error && <p className="banner alert" role="alert">Data belum bisa dimuat: {error}</p>}
        {data && (
          <>
            <PanelAnalitik data={data} fokus="issues" />
            <IssuesBoard data={data} />
          </>
        )}
      </main>
    </>
  );
}