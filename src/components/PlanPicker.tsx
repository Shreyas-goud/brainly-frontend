import { useMemo, useState } from "react";
import { CalendarDays, Moon, Sun, Sunrise, Sunset } from "lucide-react";
import type { Content } from "../hooks/useContent";
import { getIntent, type IntentId } from "../lib/intents";
import { cn } from "../lib/cn";

type Slot = { id: "morning" | "afternoon" | "evening" | "night"; label: string; hour: number; minute: number; Icon: typeof Sun };

const SLOTS: Slot[] = [
  { id: "morning", label: "Morning", hour: 9, minute: 0, Icon: Sunrise },
  { id: "afternoon", label: "Afternoon", hour: 14, minute: 0, Icon: Sun },
  { id: "evening", label: "Evening", hour: 19, minute: 0, Icon: Sunset },
  { id: "night", label: "Night", hour: 21, minute: 30, Icon: Moon },
];

/** When each kind of save is usually done. */
const DEFAULT_SLOT: Record<IntentId, Slot["id"]> = {
  recipes: "evening",
  workouts: "morning",
  places: "morning",
  learn: "morning",
  shopping: "afternoon",
  watch: "night",
  ideas: "morning",
  laughs: "evening",
  unsorted: "evening",
};

const HINT: Partial<Record<IntentId, string>> = {
  recipes: "Recipes get cooked when they're planned for an evening.",
  workouts: "A set morning makes a workout far more likely to happen.",
  places: "Weekends are when places get visited.",
  watch: "Give it a night when you'll actually sit down.",
  learn: "Ten focused minutes beats someday.",
};

const DAY_COUNT = 10;

function localKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function startOfDay(offset: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d;
}

function at(day: Date, slot: Slot): Date {
  const d = new Date(day);
  d.setHours(slot.hour, slot.minute, 0, 0);
  return d;
}

/**
 * "When will you do it?" A day, then a time of day: a concrete plan, which is
 * what makes a save actually happen. Shows how full each day already is.
 */
export function PlanPicker({
  intent,
  contents,
  currentId,
  onPick,
  onCancel,
  busy,
  tone = "light",
}: {
  intent: IntentId | undefined;
  contents: Content[];
  /** The save being planned, so it doesn't count against its own day. */
  currentId?: string;
  onPick: (date: Date) => void;
  onCancel?: () => void;
  busy?: boolean;
  tone?: "light" | "dark";
}) {
  const config = getIntent(intent);
  const now = new Date();

  const plannedByDay = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of contents) {
      if (c._id === currentId || (c.status ?? "active") !== "active" || !c.plannedFor) continue;
      const d = new Date(c.plannedFor);
      if (d.getTime() < Date.now()) continue;
      const k = localKey(d);
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  }, [contents, currentId]);

  const days = useMemo(() => Array.from({ length: DAY_COUNT }, (_, i) => startOfDay(i)), []);
  const slotAvailable = (day: Date, slot: Slot) => at(day, slot).getTime() > now.getTime() + 15 * 60_000;
  const dayAvailable = (day: Date) => SLOTS.some((s) => slotAvailable(day, s));

  const defaultSlot = SLOTS.find((s) => s.id === DEFAULT_SLOT[config.id]) ?? SLOTS[2];
  const defaultDay = (() => {
    if (config.id === "places" || config.id === "shopping") {
      const weekend = days.find((d, i) => i > 0 && (d.getDay() === 6 || d.getDay() === 0));
      if (weekend) return weekend;
    }
    return days[1];
  })();

  const [day, setDay] = useState<Date>(defaultDay);
  const [slotId, setSlotId] = useState<Slot["id"]>(defaultSlot.id);
  const [custom, setCustom] = useState("");

  const slot = SLOTS.find((s) => s.id === slotId)!;
  const chosen = custom ? new Date(`${custom}T${String(slot.hour).padStart(2, "0")}:${String(slot.minute).padStart(2, "0")}:00`) : at(day, slot);
  const valid = chosen.getTime() > now.getTime();
  const dark = tone === "dark";

  const dayName = (d: Date, i: number) =>
    i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-US", { weekday: "short" });

  const summary = `${chosen.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })} · ${slot.label.toLowerCase()}`;

  return (
    <div className={cn(dark ? "text-white" : "text-ink")}>
      <p className={cn("text-[15px] font-semibold", dark ? "text-white" : "text-ink")}>When will you do it?</p>
      {HINT[config.id] && <p className={cn("mt-0.5 text-[13px]", dark ? "text-white/55" : "text-ink-3")}>{HINT[config.id]}</p>}

      <div className="-mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-none" role="radiogroup" aria-label="Day">
        {days.map((d, i) => {
          const on = !custom && localKey(d) === localKey(day);
          const load = plannedByDay.get(localKey(d)) ?? 0;
          const disabled = !dayAvailable(d);
          return (
            <button
              key={localKey(d)}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={disabled}
              onClick={() => {
                setCustom("");
                setDay(d);
                if (!slotAvailable(d, slot)) {
                  const next = SLOTS.find((s) => slotAvailable(d, s));
                  if (next) setSlotId(next.id);
                }
              }}
              className={cn(
                "flex w-[62px] shrink-0 flex-col items-center rounded-2xl py-2 transition-colors disabled:opacity-35",
                on
                  ? dark
                    ? "bg-white text-[#111110]"
                    : "bg-inverse text-inverse-ink"
                  : dark
                    ? "bg-white/6 text-white hover:bg-white/12"
                    : "bg-surface-2 text-ink hover:bg-surface-3"
              )}
              aria-label={`${d.toDateString()}${load ? `, ${load} already planned` : ""}`}
            >
              <span className={cn("text-[11px]", on ? "opacity-70" : "opacity-60")}>{dayName(d, i)}</span>
              <span className="text-[18px] font-semibold leading-tight tnum">{d.getDate()}</span>
              <span className="mt-0.5 flex h-1.5 gap-0.5" aria-hidden="true">
                {Array.from({ length: Math.min(load, 3) }, (_, k) => (
                  <span key={k} className={cn("size-1.5 rounded-full", on ? "bg-current opacity-60" : "bg-[#ff7a2e]")} />
                ))}
              </span>
            </button>
          );
        })}
        <label
          className={cn(
            "relative flex w-[62px] shrink-0 cursor-pointer flex-col items-center justify-center rounded-2xl py-2 text-[11px]",
            custom
              ? dark
                ? "bg-white text-[#111110]"
                : "bg-inverse text-inverse-ink"
              : dark
                ? "bg-white/6 text-white/70 hover:bg-white/12"
                : "bg-surface-2 text-ink-2 hover:bg-surface-3"
          )}
        >
          <CalendarDays className="mb-0.5 size-4" />
          {custom ? new Date(`${custom}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Later"}
          <input
            type="date"
            aria-label="Pick another day"
            min={localKey(startOfDay(1))}
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-1.5" role="radiogroup" aria-label="Time of day">
        {SLOTS.map((s) => {
          const on = slotId === s.id;
          const disabled = !custom && !slotAvailable(day, s);
          return (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={disabled}
              onClick={() => setSlotId(s.id)}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl py-2 text-[12px] transition-colors disabled:opacity-35",
                on
                  ? dark
                    ? "bg-white/18 text-white ring-1 ring-inset ring-white/40"
                    : "bg-accent-soft text-accent-ink ring-1 ring-inset ring-accent/40"
                  : dark
                    ? "text-white/70 hover:bg-white/8"
                    : "text-ink-2 hover:bg-surface-2"
              )}
            >
              <s.Icon className="size-4" />
              {s.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={cn("h-11 rounded-xl px-4 text-[14px]", dark ? "text-white/70 hover:bg-white/10" : "text-ink-2 hover:bg-surface-2")}
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          disabled={!valid || busy}
          onClick={() => onPick(chosen)}
          className={cn(
            "flex h-11 flex-1 items-center justify-center rounded-xl px-4 text-[14.5px] font-semibold transition-transform active:scale-[0.98] disabled:opacity-40",
            dark ? "bg-white text-[#111110]" : "bg-inverse text-inverse-ink"
          )}
        >
          <span className="truncate">Plan for {summary}</span>
        </button>
      </div>
    </div>
  );
}
