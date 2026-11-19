import { useMemo } from "react";
import { normalizeSourceType } from "../lib/urlDetector";
import { BRAIN_CHANNELS, type BrainChannelId } from "../lib/channels";
import { useAppData } from "./AppData";

export type AppEntry = { id: BrainChannelId; label: string; count: number };

const isOpen = (status: string | undefined) => (status ?? "active") === "active";

/**
 * The apps this person has saved from, in a fixed order, with how many saves
 * each still has to do; plus the totals for "All saves" and "Done".
 */
export function useApps(): { apps: AppEntry[]; total: number; done: number } {
  const { contents, meta, hasMore } = useAppData();
  return useMemo(() => {
    const open: Record<string, number> = {};
    const any = new Set<string>();
    let doneLocal = 0;
    for (const c of contents) {
      const s = normalizeSourceType(c);
      any.add(s);
      if (isOpen(c.status)) open[s] = (open[s] ?? 0) + 1;
      else doneLocal += 1;
    }
    const apps = BRAIN_CHANNELS.filter((c) => any.has(c.id)).map((c) => ({
      id: c.id as BrainChannelId,
      label: c.label,
      count: open[c.id] ?? 0,
    }));
    const openLocal = contents.length - doneLocal;
    // Only the first page is loaded; past it, the server's totals are the better number.
    const st = meta.statuses;
    return {
      apps,
      total: hasMore ? Math.max(openLocal, st.active ?? 0) : openLocal,
      done: hasMore ? Math.max(doneLocal, (st.done ?? 0) + (st.archived ?? 0)) : doneLocal,
    };
  }, [contents, meta.statuses, hasMore]);
}

/** Today's catch-up at a glance: how many saves are left, or that it's done. */
export function useCatchUpStatus(): { state: "none" | "ready" | "done"; left: number } {
  const { today } = useAppData();
  const run = today?.run;
  if (!run) return { state: "none", left: 0 };
  if (run.finishedAt) return { state: "done", left: 0 };
  return { state: "ready", left: run.items.filter((i) => !i.result).length };
}
