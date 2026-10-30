import type { ScorecardData, WeeklyList } from "./types";
import { mockScorecard, mockWeekly } from "./mock";

const devMock = process.env.DEV_MOCK === "1" && process.env.NODE_ENV !== "production";

type ApiResult<T> = { ok: true; data: T } | { ok: false; code: string; message: string };

/** Panggilan server-ke-server ke Apps Script. Rahasia tidak pernah dikirim ke browser. */
export async function callApi<T>(action: string, email: string, payload: unknown = {}): Promise<T> {
  if (devMock) return mockHandler(action, payload) as T;

  const url = process.env.APPS_SCRIPT_URL;
  const secret = process.env.APPS_SCRIPT_SECRET;
  if (!url || !secret) throw new Error("APPS_SCRIPT_URL / APPS_SCRIPT_SECRET belum diisi.");

  const res = await fetch(url, {
    method: "POST",
    // text/plain menghindari preflight CORS dan memang yang diharapkan Apps Script
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ secret, email, action, payload }),
    redirect: "follow",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Apps Script membalas ${res.status}`);

  let json: ApiResult<T>;
  try {
    json = await res.json();
  } catch {
    throw new Error("Balasan Apps Script bukan JSON (cek deployment dan hak akses).");
  }
  if (!json.ok) throw new Error(json.message || json.code);
  return json.data;
}

function mockHandler(action: string, payload: any): unknown {
  switch (action) {
    case "whoami":
      return { allowed: true, name: "Karvien (uji)", role: "Owner" };
    case "auth.get":
      return { allowed: true, name: "Karvien (uji)", role: "Owner", hash: "", locked: false };
    case "auth.fail":
    case "auth.clear":
    case "auth.setPassword":
      return {};
    case "scorecard.get":
      return mockScorecard;
    case "scorecard.weekly":
      return { ...mockWeekly, weekDateStr: payload?.week || mockWeekly.weekDateStr };
    case "scorecard.submit":
      return { updated: Object.keys(payload?.scores || {}).length, added: 0 };
    default:
      throw new Error("Aksi tidak dikenal: " + action);
  }
}

export type { ScorecardData, WeeklyList };
