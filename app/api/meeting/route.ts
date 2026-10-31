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
  const masuk = str(b.action, 20);
  switch (masuk) {
    case "save":
    case "finish": {
      const rating = Math.round(Number(b.rating) || 0);
      payload = {
        id: str(b.id, 40), segue: str(b.segue, 2000), customerHeadlines: str(b.customerHeadlines, 2000),
        employeeHeadlines: str(b.employeeHeadlines, 2000), notes: str(b.notes, 2000), decision: str(b.decision, 2000),
        cascading: str(b.cascading, 2000), rating: rating >= 1 && rating <= 10 ? rating : 0,
      };
      if (!payload.id) return gagal("Meeting tidak dikenal.");
      if (masuk === "finish" && !payload.rating) return gagal("Beri rating 1 sampai 10 sebelum menutup meeting.");
      aksi = masuk === "finish" ? "meeting.finish" : "meeting.save";
      break;
    }
    case "issue.add": {
      aksi = "issues.save";
      payload = {
        id: "", rockId: str(b.rockId, 40), title: str(b.title, 200), description: "", priority: str(b.priority, 10),
        owner: str(b.owner, 120), due: tanggal(b.due), rootCause: "", meetingId: str(b.meetingId, 40),
      };
      if ((payload.title as string).length < 3 || !payload.owner || !payload.due || !PRIORITAS.includes(payload.priority as string)) {
        return gagal("Lengkapi judul, prioritas, penanggung jawab, dan tenggat.");
      }
      if (!payload.rockId) return gagal("Pilih Rock terkait.");
      break;
    }
    case "todo.add": {
      aksi = "todos.save";
      payload = {
        id: "", issueId: str(b.issueId, 40), task: str(b.task, 300), description: "",
        owner: str(b.owner, 120), due: tanggal(b.due), meetingId: str(b.meetingId, 40),
      };
      if ((payload.task as string).length < 3 || !payload.owner || !payload.due) return gagal("Lengkapi tugas, penanggung jawab, dan tenggat.");
      if (!payload.issueId) return gagal("Pilih Issue terkait.");
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