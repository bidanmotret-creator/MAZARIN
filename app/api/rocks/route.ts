import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { callApi } from "@/lib/api";

const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, message: "Silakan masuk lagi." }, { status: 401 });

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Data tidak terbaca." }, { status: 400 });
  }

  const due = str(b.due, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(due)) {
    return NextResponse.json({ ok: false, message: "Tenggat tidak valid." }, { status: 400 });
  }
  const progress = Number(b.progress);
  const payload = {
    id: str(b.id, 40),
    name: str(b.name, 200),
    quarter: str(b.quarter, 40),
    department: str(b.department, 80),
    owner: str(b.owner, 120),
    target: str(b.target, 500),
    due,
    progress: Number.isFinite(progress) ? Math.max(0, Math.min(100, Math.round(progress))) : 0,
  };
  if (payload.name.length < 3 || !payload.quarter || !payload.owner || !payload.target) {
    return NextResponse.json({ ok: false, message: "Lengkapi nama, kuartal, penanggung jawab, dan target." }, { status: 400 });
  }

  try {
    const data = await callApi("rocks.save", user.email, payload);
    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 502 });
  }
}