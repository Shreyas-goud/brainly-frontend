import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowUpRight, CalendarClock, Check, PencilLine, Quote, RotateCcw } from "lucide-react";
import { useAppData } from "./AppData";
import { Viewer } from "../components/viewer/Viewer";
import { viewerWidth } from "../components/viewer/viewerWidth";
import { PlanPicker } from "../components/PlanPicker";
import { SourceIcon } from "../components/ui/SourceIcon";
import { Spinner } from "../components/ui/Spinner";
import { useToast } from "../components/ui/Toast";
import { normalizeSourceType } from "../lib/urlDetector";
import { getChannelConfig } from "../lib/channels";
import { dayLabel, reviewItem, updateItem } from "../lib/recall";
import { normalizeError } from "../lib/api";
import { formatDate, hostnameOf } from "../lib/format";
import { cn } from "../lib/cn";

const EASE = [0.16, 1, 0.3, 1] as const;

/** One save, opened cleanly inside Brainly, with the two things worth doing next: plan it or finish it. */
export function ViewPage() {
  const { id } = useParams<{ id: string }>();
  const { contents, loading, upsertItem, refreshToday, modals } = useAppData();
  const navigate = useNavigate();
  const toast = useToast();
  const [planOpen, setPlanOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const item = contents.find((c) => c._id === id);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.body.dataset.scrollLocked) {
        if (planOpen) setPlanOpen(false);
        else close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  });

  function close() {
    if (window.history.length > 1) navigate(-1);
    else navigate("/app");
  }

  async function act(fn: () => Promise<import("../hooks/useContent").Content>, message: string) {
    setBusy(true);
    try {
      const next = await fn();
      upsertItem(next);
      refreshToday();
      toast(message);
      setPlanOpen(false);
    } catch (err) {
      toast(normalizeError(err).message, { tone: "info" });
    } finally {
      setBusy(false);
    }
  }

  if (!item) {
    return (
      <div className="fixed inset-0 z-[125] flex flex-col items-center justify-center gap-3 bg-bg text-ink">
        {loading ? (
          <Spinner className="size-6 text-ink-3" />
        ) : (
          <>
            <p className="text-[15px] font-medium">This save isn't here any more.</p>
            <button type="button" onClick={() => navigate("/app")} className="text-[14px] text-ink-2 underline underline-offset-4">
              Back to your saves
            </button>
          </>
        )}
      </div>
    );
  }

  const source = normalizeSourceType(item);
  const status = item.status ?? "active";
  const width = viewerWidth(item);
  const widthClass = width === "post" ? "max-w-[640px]" : "max-w-[720px]";
  const planned = status === "active" && item.plannedFor && new Date(item.plannedFor).getTime() > Date.now();

  return (
    <div className="fixed inset-0 z-[125] flex flex-col bg-bg text-ink" role="dialog" aria-modal="true" aria-label={item.title}>
      <header className="shrink-0 border-b border-line bg-bg/90 px-3 pb-2.5 pt-[max(10px,env(safe-area-inset-top))] backdrop-blur-md sm:px-5">
        <div className="mx-auto flex max-w-[980px] items-center gap-2">
          <button
            type="button"
            onClick={close}
            aria-label="Back"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <ArrowLeft className="size-5" />
          </button>
          <span className="flex min-w-0 flex-1 items-center gap-2 text-[13.5px] text-ink-3">
            <SourceIcon channel={source} size="xs" />
            <span className="truncate">{source === "other" ? hostnameOf(item.link) : getChannelConfig(source).label}</span>
            {item.createdAt && <span className="hidden sm:inline">· saved {formatDate(item.createdAt)}</span>}
          </span>
          <button
            type="button"
            onClick={() => modals.openItem(item)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-[13.5px] text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <PencilLine className="size-4" />
            <span className="hidden sm:inline">Details</span>
          </button>
          <a
            href={item.link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-[13.5px] text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <span className="hidden sm:inline">Original</span>
            <ArrowUpRight className="size-4" />
          </a>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
          className={cn("mx-auto px-5 pb-12 pt-6 sm:px-8 sm:pt-10", widthClass)}
        >
          {(planned || status === "done") && (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {planned && (
                <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-accent-soft px-2.5 text-xs font-medium text-accent-ink">
                  <CalendarClock className="size-3.5" />
                  Planned · {dayLabel(item.plannedFor!)}
                </span>
              )}
              {status === "done" && (
                <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-success/10 px-2.5 text-xs font-medium text-success">
                  <Check className="size-3.5" />
                  Done
                  {item.doneAt ? ` · ${formatDate(item.doneAt)}` : ""}
                </span>
              )}
            </div>
          )}
          <h1 className="text-[26px] font-semibold leading-tight tracking-title text-balance sm:text-[32px]">{item.title}</h1>
          {item.note && (
            <p className="mt-4 flex gap-2.5 rounded-2xl bg-surface-2/70 px-4 py-3 text-[15px] leading-relaxed text-ink-2">
              <Quote className="mt-1 size-3.5 shrink-0 text-ink-3" />
              {item.note}
            </p>
          )}
          <div className="mt-7">
            <Viewer item={item} />
          </div>
        </motion.div>
      </div>

      <footer className="shrink-0 border-t border-line bg-bg/92 px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md sm:px-5">
        <div className="mx-auto max-w-[720px]">
          <AnimatePresence initial={false}>
            {planOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.28, ease: EASE }}
                className="overflow-hidden"
              >
                <div className="pb-3">
                  <PlanPicker
                    intent={item.intent}
                    contents={contents}
                    currentId={item._id}
                    busy={busy}
                    onCancel={() => setPlanOpen(false)}
                    onPick={(date) =>
                      act(() => updateItem(item._id!, { plannedFor: date.toISOString() }), `Planned for ${dayLabel(date).toLowerCase()}. It'll be in that day's catch-up.`)
                    }
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {!planOpen &&
            (status === "active" ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPlanOpen(true)}
                  disabled={busy}
                  className="inline-flex h-12 shrink-0 items-center gap-2 rounded-2xl px-4 text-[15px] font-medium text-ink ring-1 ring-inset ring-line transition-colors hover:bg-surface-2 disabled:opacity-50"
                >
                  <CalendarClock className="size-[18px]" />
                  {planned ? "Move plan" : "Plan"}
                </button>
                <button
                  type="button"
                  onClick={() => act(() => reviewItem(item._id!, "done"), "Marked done.")}
                  disabled={busy}
                  className="flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl bg-inverse px-4 text-[15.5px] font-semibold text-inverse-ink shadow-lift transition-transform active:scale-[0.98] disabled:opacity-60"
                >
                  <Check className="size-5 shrink-0" strokeWidth={2.6} />
                  Done
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => act(() => reviewItem(item._id!, "restore"), "Back in To do.")}
                disabled={busy}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-medium text-ink ring-1 ring-inset ring-line hover:bg-surface-2"
              >
                <RotateCcw className="size-4" />
                Move back to To do
              </button>
            ))}
        </div>
      </footer>
    </div>
  );
}
