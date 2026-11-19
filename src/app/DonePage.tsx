import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CircleCheck, RotateCcw } from "lucide-react";
import { useAppData } from "./AppData";
import { AppChips } from "./nav";
import { useDoneActions } from "./useDoneActions";
import { Thumb } from "../components/SaveTile";
import { SourceIcon } from "../components/ui/SourceIcon";
import { Button } from "../components/ui/Button";
import type { Content } from "../hooks/useContent";
import { normalizeSourceType } from "../lib/urlDetector";
import { getChannelConfig } from "../lib/channels";
import { count, formatDate, hostnameOf } from "../lib/format";

const EASE = [0.16, 1, 0.3, 1] as const;

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Group finished saves by when they were finished, newest first. */
function groupByWhen(items: Content[]): { label: string; items: Content[] }[] {
  const today = startOfToday();
  const weekAgo = today - 6 * 86_400_000;
  const groups = [
    { label: "Today", items: [] as Content[] },
    { label: "This week", items: [] as Content[] },
    { label: "Earlier", items: [] as Content[] },
  ];
  for (const c of items) {
    const t = c.doneAt ? new Date(c.doneAt).getTime() : 0;
    groups[t >= today ? 0 : t >= weekAgo ? 1 : 2].items.push(c);
  }
  return groups.filter((g) => g.items.length > 0);
}

/** Everything finished, kept apart from what's still to do; any of it comes back with one tap. */
export function DonePage() {
  const { contents, loading, hasMore, loadMore, loadingMore } = useAppData();
  const { bringBack } = useDoneActions();
  const navigate = useNavigate();
  const reduced = useReducedMotion();

  const done = useMemo(
    () =>
      contents
        .filter((c) => (c.status ?? "active") !== "active")
        .sort((a, b) => new Date(b.doneAt ?? 0).getTime() - new Date(a.doneAt ?? 0).getTime()),
    [contents]
  );
  const groups = useMemo(() => groupByWhen(done), [done]);

  return (
    <div className="mx-auto max-w-[760px]">
      <AppChips />
      <header className="mb-7">
        <h1 className="text-[26px] font-semibold leading-tight tracking-title sm:text-[30px]">Done</h1>
        <p className="mt-1 text-[14.5px] text-ink-3">
          {done.length > 0 ? `${count(done.length, "save")} you've finished. Tap ↺ on any of them to move it back to To do.` : "Saves you finish land here."}
        </p>
      </header>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="skeleton h-[72px] rounded-2xl" />
          ))}
        </div>
      ) : done.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border border-dashed border-line-strong px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-success/12 text-success">
            <CircleCheck className="size-6" />
          </span>
          <h2 className="mt-4 text-lg font-semibold tracking-title">Nothing done yet</h2>
          <p className="mt-1.5 max-w-sm text-[14px] text-ink-2">Mark a save done in a catch-up, or with ✓ on its picture, and it moves here.</p>
          <Link to="/app" className="mt-6 inline-flex h-10 items-center rounded-xl bg-surface px-4 text-[14px] font-medium text-ink ring-1 ring-inset ring-line hover:bg-surface-2">
            Back to All saves
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((g) => (
            <section key={g.label} aria-label={g.label}>
              <h2 className="mb-2 px-1 text-[13px] font-medium text-ink-3">{g.label}</h2>
              <ul className="overflow-hidden rounded-2xl bg-surface ring-1 ring-line">
                <AnimatePresence initial={false}>
                  {g.items.map((c) => {
                    const source = normalizeSourceType(c);
                    return (
                      <motion.li
                        key={c._id}
                        layout={!reduced}
                        initial={false}
                        exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0, transition: { duration: 0.22, ease: EASE } }}
                        className="flex items-center gap-3 border-b border-line px-3 py-2.5 last:border-b-0 sm:gap-4 sm:px-4"
                      >
                        <button
                          type="button"
                          onClick={() => navigate(`/app/view/${c._id}`)}
                          className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-accent sm:gap-4"
                        >
                          <Thumb item={c} className="aspect-[16/10] w-[76px] shrink-0 rounded-xl ring-1 ring-line sm:w-[88px]" />
                          <span className="min-w-0">
                            <span className="line-clamp-2 text-[14.5px] font-medium leading-snug text-ink">{c.title}</span>
                            <span className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-ink-3">
                              <SourceIcon channel={source} size="xs" bare />
                              <span className="truncate">
                                {source === "other" ? hostnameOf(c.link) : getChannelConfig(source).label}
                                {" · "}
                                {c.status === "archived" ? "archived" : c.doneAt ? `done ${formatDate(c.doneAt)}` : "done"}
                              </span>
                            </span>
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => bringBack(c)}
                          aria-label={`Bring "${c.title}" back to To do`}
                          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-[13.5px] font-medium text-ink-2 ring-1 ring-inset ring-line transition-[background-color,color,transform] hover:bg-surface-2 hover:text-ink active:scale-[0.96] sm:px-3"
                        >
                          <RotateCcw className="size-4" />
                          <span className="hidden sm:inline">Bring back</span>
                        </button>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            </section>
          ))}
        </div>
      )}

      {!loading && hasMore && (
        <div className="mt-8 flex justify-center">
          <Button variant="secondary" onClick={loadMore} loading={loadingMore} loadingText="Loading…">
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
