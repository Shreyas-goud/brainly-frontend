import { api } from "./api";
import type { Content } from "../hooks/useContent";

export type RunAction = "done" | "got" | "plan" | "pass" | "later" | "let_go" | "undo";
export type RunReason = "planned" | "due" | "throwback" | "quick" | "fill";

export type RunItem = {
  contentId: string;
  reason: RunReason;
  result: Exclude<RunAction, "undo"> | null;
  at: string | null;
  content: Content;
};

export type Run = {
  _id: string;
  dayKey: string;
  kind: "daily" | "bonus";
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
  estSecondsLeft: number;
  items: RunItem[];
};

export type StreakView = {
  current: number;
  best: number;
  freezes: number;
  lastDayKey: string | null;
  doneToday: boolean;
  atRisk: boolean;
};

export type RunSettings = { runSize: 3 | 5 | 7; ritualTime: string; timezone: string };

export type TodayRun = {
  today: string;
  timezone: string;
  settings: RunSettings;
  run: Run | null;
  bonus: Run | null;
  bonusAvailable: boolean;
  streak: StreakView;
  week: string[];
  backlog: { waiting: number; active: number; clearedThisWeek: number };
};

export type FinishResult = {
  run: Run;
  counts: Partial<Record<Exclude<RunAction, "undo">, number>>;
  streak: StreakView;
  streakUpdate: { extended: boolean; usedFreezes: number; earnedFreeze: boolean } | null;
};

export type Me = { email: string; createdAt?: string; settings: RunSettings; streak: StreakView };

export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export async function fetchToday(): Promise<TodayRun> {
  const res = await api.get<TodayRun>("/api/v1/run/today", { params: { tz: browserTimeZone() } });
  return res.data;
}

export async function startRun(runId: string): Promise<void> {
  await api.post(`/api/v1/run/${runId}/start`);
}

export async function actOnItem(
  runId: string,
  contentId: string,
  action: RunAction,
  planFor?: Date
): Promise<{ content: Content; item: { contentId: string; result: RunItem["result"]; at: string | null } }> {
  const res = await api.post(`/api/v1/run/${runId}/items/${contentId}`, {
    action,
    ...(planFor ? { planFor: planFor.toISOString() } : {}),
  });
  return res.data;
}

export async function finishRun(runId: string): Promise<FinishResult> {
  const res = await api.post<FinishResult>(`/api/v1/run/${runId}/finish`);
  return res.data;
}

export async function startBonus(): Promise<Run> {
  const res = await api.post<{ run: Run }>("/api/v1/run/bonus");
  return res.data.run;
}

export async function fetchMe(): Promise<Me> {
  const res = await api.get<Me>("/api/v1/me");
  return res.data;
}

export async function saveSettings(fields: Partial<RunSettings>): Promise<RunSettings> {
  const res = await api.patch<{ settings: RunSettings }>("/api/v1/me/settings", fields);
  return res.data.settings;
}

/** "~4 min" for a run's remaining time. */
export function minutesLabel(seconds: number): string {
  if (seconds < 60) return "under a minute";
  return `~${Math.round(seconds / 60)} min`;
}

/** A thumbnail for a save when one can be had without a network round trip. */
export function thumbnailFor(c: Content): string | null {
  if (c.thumbnail) return c.thumbnail;
  const yt = c.link.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=)([^#&?]*).*/);
  if (yt?.[2]?.length === 11) return `https://i.ytimg.com/vi/${yt[2]}/hqdefault.jpg`;
  return c.ogData?.image ?? null;
}
