import { api } from "./api";
import type { Content } from "../hooks/useContent";
import type { IntentId } from "./intents";

export type ReviewAction = "done" | "keep" | "snooze" | "archive" | "restore";

export async function reviewItem(id: string, action: ReviewAction, snoozeUntil?: Date): Promise<Content> {
  const res = await api.post<{ content: Content }>(`/api/v1/content/${id}/review`, {
    action,
    ...(snoozeUntil ? { snoozeUntil: snoozeUntil.toISOString() } : {}),
  });
  return res.data.content;
}

export async function updateItem(
  id: string,
  fields: { title?: string; intent?: IntentId; note?: string; plannedFor?: string | null }
): Promise<Content> {
  const res = await api.patch<{ content: Content }>(`/api/v1/content/${id}`, fields);
  return res.data.content;
}

export async function saveLink(input: {
  link: string;
  sourceType: string;
  title?: string;
  intent?: IntentId;
  note?: string;
}): Promise<{ content: Content; duplicate: boolean }> {
  const res = await api.post<{ content: Content; duplicate: boolean }>("/api/v1/content", input);
  return res.data;
}

/** 9:00 local time on the given day offset. */
function at9(daysFromNow: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(9, 0, 0, 0);
  return d;
}

function nextWeekday(target: number): Date {
  const d = new Date();
  const diff = (target - d.getDay() + 7) % 7 || 7;
  return at9(diff);
}

/** The snooze and plan choices, computed in the visitor's own time zone. */
export function quickDates(): { id: string; label: string; date: Date }[] {
  return [
    { id: "tomorrow", label: "Tomorrow", date: at9(1) },
    { id: "weekend", label: "This weekend", date: nextWeekday(6) },
    { id: "week", label: "Next week", date: nextWeekday(1) },
    { id: "month", label: "In a month", date: at9(30) },
  ];
}

export function dayLabel(iso: string | Date): string {
  const d = new Date(iso);
  const today = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(d) - startOf(today)) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff > 1 && diff < 7) return d.toLocaleDateString("en-US", { weekday: "long" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
