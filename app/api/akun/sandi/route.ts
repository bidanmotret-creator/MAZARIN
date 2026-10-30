import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { currentUser, verifyPassword, MIN_PASSWORD, MAX_PASSWORD } from "@/lib/auth";
import { callApi } from "@/lib/api";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, message: "Silakan masuk lagi." }, { status: 401 });

  let body: { current?: unknown; next?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Data tidak terbaca." }, { status: 400 });
  }
  const current = typeof body.current === "string" ? body.current : "";
  const next = typeof body.next === "string" ? body.next : "";

  if (next.length < MIN_PASSWORD || next.length > MAX_PASSWORD)
    return NextResponse.json({ ok: false, message: `Kata sandi baru harus ${MIN_PASSWORD}-${MAX_PASSWORD} karakter.` }, { status: 400 });
  if (next === current)
    return NextResponse.json({ ok: false, message: "Kata sandi baru harus berbeda dari yang lama." }, { status: 400 });

  const ok = await verifyPassword(user.email, current);
  if (!ok) return NextResponse.json({ ok: false, message: "Kata sandi sekarang salah." }, { status: 400 });

  try {
    const hash = await bcrypt.hash(next, 12);
    await callApi("auth.setPassword", user.email, { hash });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message || "Gagal menyimpan." }, { status: 502 });
  }
}
