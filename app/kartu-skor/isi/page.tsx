import { redirect } from "next/navigation";
import Topbar from "@/components/Topbar";
import WeeklyForm from "@/components/WeeklyForm";
import { currentUser } from "@/lib/auth";
import { callApi } from "@/lib/api";
import { L } from "@/lib/labels";
import type { WeeklyList } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function InputPage({ searchParams }: { searchParams: { week?: string } }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const week = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.week ?? "") ? searchParams.week : "";

  let data: WeeklyList | null = null;
  let error = "";
  try {
    data = await callApi<WeeklyList>("scorecard.weekly", user.email, { week });
  } catch (e: any) {
    error = e.message;
  }
  return (
    <>
      <Topbar user={user} active="input" />
      <main className="wrap">
        <h1>{L.scorecardInput}</h1>
        {error && <p className="banner alert" role="alert">Data belum bisa dimuat: {error}</p>}
        {data && <WeeklyForm key={data.weekDateStr} data={data} />}
      </main>
    </>
  );
}
