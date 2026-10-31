export type Status = { text: string; icon: string };
export type HistoryPoint = {
  dateLabel: string;
  dateFull: string;
  hasData: boolean;
  actual: number | null;
  target: number | null;
  status: Status | null;
};
export type KpiRow = {
  department: string;
  kpiName: string;
  owner: string;
  linkedRock: string;
  source: string;
  target: number;
  actual: number;
  status: Status;
  trend: unknown;
  consecutiveOffTrack: number;
  isStale: boolean;
  hitRate: { hit: number; total: number };
  history: HistoryPoint[];
};
export type ScorecardData = {
  week: string;
  updatedAt: string;
  summary: { total: number; onTrack: number; warning: number; offTrack: number; health: number };
  alertMessage: string | null;
  ruleWarning: string | null;
  company: KpiRow[];
  departments: Record<string, KpiRow[]>;
};
export type WeeklyKpi = {
  key: string;
  department: string;
  kpiName: string;
  target: number;
  owner: string;
  linkedRock: string;
  currentActual: number | null;
};
export type WeeklyList = {
  weekLabel: string;
  weekRange: string;
  weekDateStr: string;
  kpis: WeeklyKpi[];
};
export type SessionUser = { email: string; name: string; role: string };

export type RockRow = {
  id: string;
  name: string;
  quarter: string;
  department: string;
  target: string;
  owner: string;
  start: string;
  due: string;
  progress: number;
  status: "Open" | "Done";
  auto?: boolean;
};
export type RocksData = { rocks: RockRow[]; owners: string[] };

export type IssueRow = {
  id: string; rockId: string; rockLabel: string; title: string; description: string;
  priority: string; owner: string; due: string; progress: number; status: "Open" | "Done"; rootCause: string;
};
export type TodoRow = {
  id: string; issueId: string; issueLabel: string; rockLabel: string; task: string; description: string;
  department: string; owner: string; due: string; status: "Open" | "Done"; completed: string;
};
export type WorkData = {
  issues: IssueRow[]; todos: TodoRow[]; rocks: { id: string; label: string; done: boolean }[]; owners: string[];
};
