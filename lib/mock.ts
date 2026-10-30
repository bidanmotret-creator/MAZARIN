import type { KpiRow, ScorecardData, WeeklyList } from "./types";

const st = (t: string) => ({ text: t, icon: "" });
const mk = (dept: string, name: string, owner: string, target: number, vals: (number | null)[]): KpiRow => {
  const last = [...vals].reverse().find((v) => v !== null) ?? 0;
  const pct = target ? (last / target) * 100 : 0;
  const status = st(pct >= 100 ? "ON TRACK" : pct >= 80 ? "WARNING" : "OFF TRACK");
  return {
    department: dept, kpiName: name, owner, linkedRock: "", source: "MANUAL", target, actual: last, status,
    trend: null, consecutiveOffTrack: 0, isStale: false,
    hitRate: { hit: vals.filter((v) => v !== null && v >= target).length, total: vals.filter((v) => v !== null).length },
    history: vals.map((v, i) => ({
      dateLabel: `${String(i + 3).padStart(2, "0")}/08`, dateFull: `${i + 3} Agu 2026`, hasData: v !== null,
      actual: v, target, status: v === null ? null : st(v >= target ? "ON TRACK" : v >= target * 0.8 ? "WARNING" : "OFF TRACK"),
    })),
  };
};

const company = [
  mk("COMPANY", "Lead masuk", "Karvien", 120, [90, 100, null, 110, 125, 118, 130, 121, 119, 140, 128, 135]),
  mk("COMPANY", "Closing rate (%)", "Admin Order", 25, [18, 20, 19, 22, 21, 24, 23, 26, 22, 20, 19, 18]),
  mk("COMPANY", "ROAS", "Marketing", 4, [3.1, 3.4, 3.9, 4.2, 4.4, 4.1, 3.8, 3.5, 3.2, 2.9, 3.0, 2.7]),
];
const departments = {
  "Penjualan/CS": [mk("Penjualan/CS", "SLA balas chat (menit)", "CS", 10, [12, 11, 9, 8, 9, 10, 8, 7, 9, 11, 10, 9])],
  Marketing: [mk("Marketing", "Biaya per lead (Rp ribu)", "Marketing", 15, [14, 16, 15, 17, 18, 16, 15, 14, 19, 20, 17, 16])],
};
const all = [...company, ...Object.values(departments).flat()];
const count = (t: string) => all.filter((k) => k.status.text === t).length;

export const mockScorecard: ScorecardData = {
  week: "Minggu 44 2026",
  updatedAt: "30 Okt 2026, 14:00",
  summary: {
    total: all.length, onTrack: count("ON TRACK"), warning: count("WARNING"), offTrack: count("OFF TRACK"),
    health: Math.round((count("ON TRACK") / all.length) * 100),
  },
  alertMessage: "2 angka melenceng 3+ minggu berturut-turut dan otomatis masuk Daftar Masalah untuk dibahas minggu ini.",
  ruleWarning: null,
  company,
  departments,
};

export const mockWeekly: WeeklyList = {
  weekLabel: "Minggu 44 2026",
  weekRange: "26 Okt – 01 Nov 2026",
  weekDateStr: "2026-10-30",
  kpis: all.map((k) => ({
    key: `${k.department}||${k.kpiName}`, department: k.department, kpiName: k.kpiName,
    target: k.target, owner: k.owner, linkedRock: "", currentActual: null,
  })),
};
