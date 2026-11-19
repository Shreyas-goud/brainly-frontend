import { useAppData } from "./AppData";
import { useToast } from "../components/ui/Toast";
import type { Content } from "../hooks/useContent";
import { reviewItem } from "../lib/recall";
import { normalizeError } from "../lib/api";

/** Move a save to Done or back to To do, always with an Undo, so neither is ever a dead end. */
export function useDoneActions() {
  const { upsertItem, refreshToday } = useAppData();
  const toast = useToast();

  async function apply(item: Content, action: "done" | "restore", withUndo: boolean) {
    if (!item._id) return;
    try {
      const next = await reviewItem(item._id, action);
      upsertItem(next);
      refreshToday();
      if (withUndo) {
        toast(action === "done" ? "Moved to Done." : "Back in To do.", {
          action: { label: "Undo", run: () => apply(next, action === "done" ? "restore" : "done", false) },
        });
      }
    } catch (err) {
      toast(normalizeError(err).message, { tone: "info" });
    }
  }

  return {
    markDone: (item: Content) => apply(item, "done", true),
    bringBack: (item: Content) => apply(item, "restore", true),
  };
}
