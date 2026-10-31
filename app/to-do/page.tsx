import { redirect } from "next/navigation";
import Topbar from "@/components/Topbar";
import Istilah from "@/components/Istilah";
import TodoBoard from "@/components/TodoBoard";
import PanelAnalitik from "@/components/PanelAnalitik";
import { Hero } from "@/components/Visual";
import { currentUser } from "@/lib/auth";
import { callApi } from "@/lib/api";
import type { WorkData } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TodoPage({ searchParams }: { searchParams: { issue?: string } }) {
  const user = await currentUser();
  if (!user) redirect("/login");

  let data: WorkData | null = null;
  let error = "";
  try {
    data = await callApi<WorkData>("work.list", user.email, {});
  } catch (e: any) {
    error = e.message;
  }
  const awalIssue = String(searchParams.issue ?? "").slice(0, 40);
  return (
    <>
      <Topbar user={user} active="todo" />
      <main className="wrap">
        <Hero kicker="Mazarin Operational System · Eksekusi" teks="Tugas 7 hari, lengkap dengan penanggung jawab dan tenggat.">
          <Istilah id="todo" ukuran="judul" />
        </Hero>
        {error && <p className="banner alert" role="alert">Data belum bisa dimuat: {error}</p>}
        {data && (
          <>
            <PanelAnalitik data={data} fokus="todo" />
            <TodoBoard data={data} awalIssue={awalIssue} />
          </>
        )}
      </main>
    </>
  );
}