import { redirect } from "next/navigation";
import Topbar from "@/components/Topbar";
import Istilah from "@/components/Istilah";
import MeetingFlow from "@/components/MeetingFlow";
import { Hero } from "@/components/Visual";
import { currentUser } from "@/lib/auth";
import { callApi } from "@/lib/api";
import type { MeetingData } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Level10Page() {
  const user = await currentUser();
  if (!user) redirect("/login");

  let data: MeetingData | null = null;
  let error = "";
  try {
    data = await callApi<MeetingData>("meeting.workspace", user.email, {});
  } catch (e: any) {
    error = e.message;
  }
  return (
    <>
      <Topbar user={user} active="meeting" />
      <main className="wrap">
        <Hero kicker="Mazarin Operational System · Level 10" teks="Agenda 90 menit dalam satu alur, dari Segue sampai rating. Hasilnya tersimpan di sheet.">
          <Istilah id="level10" ukuran="judul" />
        </Hero>
        {error && <p className="banner alert" role="alert">Data belum bisa dimuat: {error}</p>}
        {data && <MeetingFlow data={data} />}
      </main>
    </>
  );
}