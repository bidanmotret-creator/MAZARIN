import { redirect } from "next/navigation";
import Topbar from "@/components/Topbar";
import Istilah from "@/components/Istilah";
import TodoBoard from "@/components/TodoBoard";
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
        <h1><Istilah id="todo" ukuran="judul" /></h1>
        {error && <p className="banner alert" role="alert">Data belum bisa dimuat: {error}</p>}
        {data && <TodoBoard data={data} awalIssue={awalIssue} />}
      </main>
    </>
  );
}