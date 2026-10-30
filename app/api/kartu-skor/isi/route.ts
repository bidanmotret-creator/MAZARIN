import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { callApi } from "@/lib/api";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, message: "Silakan masuk lagi." }, { status: 401 });

  let body: { week?: string; scores?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Data tidak terbaca." }, { status: 400 });
  }

  // Bersihkan: hanya angka yang lolos, kunci harus berbentuk "Departemen||Nama KPI".
  const scores: Record<string, number> = {};
  for (const [k, v] of Object.entries(body.scores ?? {})) {
    if (!k.includes("||") || v === "" || v === null || v === undefined) continue;
    const n = Number(v);
    if (Number.isFinite(n)) scores[k] = n;
  }
  const week = /^\d{4}-\d{2}-\d{2}$/.test(body.week ?? "") ? body.week : "";

  try {
    const data = await callApi("scorecard.submit", user.email, { scores, week });
    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 502 });
  }
}
