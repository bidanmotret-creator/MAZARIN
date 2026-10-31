import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { callApi } from "@/lib/api";

const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
const tanggal = (v: unknown) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v ?? "")) ? String(v) : "");
const PRIORITAS = ["Low", "Medium", "High", "Critical"];
const gagal = (message: string, status = 400) => NextResponse.json({ ok: false, message }, { status });

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return gagal("Silakan masuk lagi.", 401);

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return gagal("Data tidak terbaca.");
  }

  let aksi = "";
  let payload: Record<string, unknown> = {};
  switch (str(b.action, 20)) {
    case "issue.save": {
      aksi = "issues.save";
      payload = {
        id: str(b.id, 40), rockId: str(b.rockId, 40), title: str(b.title, 200), description: str(b.description, 1000),
        priority: str(b.priority, 10), owner: str(b.owner, 120), due: tanggal(b.due), rootCause: str(b.rootCause, 1000),
      };
      if ((payload.title as string).length < 3 || !payload.owner || !payload.due || !PRIORITAS.includes(payload.priority as string)) {
        return gagal("Lengkapi judul, prioritas, penanggung jawab, dan tenggat.");
      }
      if (!payload.id && !payload.rockId) return gagal("Pilih Rock terkait.");
      break;
    }
    case "issue.solve": {
      aksi = "issues.solve";
      payload = { id: str(b.id, 40) };
      if (!payload.id) return gagal("Issue tidak dikenal.");
      break;
    }
    case "todo.save": {
      aksi = "todos.save";
      payload = {
        id: str(b.id, 40), issueId: str(b.issueId, 40), task: str(b.task, 300), description: str(b.description, 1000),
        owner: str(b.owner, 120), due: tanggal(b.due),
      };
      if ((payload.task as string).length < 3 || !payload.owner || !payload.due) return gagal("Lengkapi tugas, penanggung jawab, dan tenggat.");
      if (!payload.id && !payload.issueId) return gagal("Pilih Issue terkait.");
      break;
    }
    case "todo.finish": {
      aksi = "todos.finish";
      payload = { id: str(b.id, 40) };
      if (!payload.id) return gagal("To-Do tidak dikenal.");
      break;
    }
    default:
      return gagal("Aksi tidak dikenal.");
  }

  try {
    const data = await callApi(aksi, user.email, payload);
    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return gagal(e.message, 502);
  }
}