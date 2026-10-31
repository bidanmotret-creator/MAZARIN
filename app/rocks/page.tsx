import { redirect } from "next/navigation";
import Topbar from "@/components/Topbar";
import Istilah from "@/components/Istilah";
import RocksBoard from "@/components/RocksBoard";
import { currentUser } from "@/lib/auth";
import { callApi } from "@/lib/api";
import type { RocksData } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RocksPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  let data: RocksData | null = null;
  let error = "";
  try {
    data = await callApi<RocksData>("rocks.list", user.email, {});
  } catch (e: any) {
    error = e.message;
  }
  return (
    <>
      <Topbar user={user} active="rocks" />
      <main className="wrap">
        <h1><Istilah id="rocks" ukuran="judul" /></h1>
        {error && <p className="banner alert" role="alert">Data belum bisa dimuat: {error}</p>}
        {data && <RocksBoard data={data} />}
      </main>
    </>
  );
}