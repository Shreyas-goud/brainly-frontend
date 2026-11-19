import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, CalendarClock, Check, ChevronLeft, Quote, Undo2, X } from "lucide-react";
import { useAppData } from "./AppData";
import { RunComplete } from "./RunComplete";
import { Viewer } from "../components/viewer/Viewer";
import { viewerWidth } from "../components/viewer/viewerWidth";
import { PlanPicker } from "../components/PlanPicker";
import { SourceIcon } from "../components/ui/SourceIcon";
import { useToast } from "../components/ui/Toast";
import { Spinner } from "../components/ui/Spinner";
import { normalizeSourceType } from "../lib/urlDetector";
import { getChannelConfig } from "../lib/channels";
import { dayLabel } from "../lib/recall";
import { normalizeError } from "../lib/api";
import { formatDate, hostnameOf } from "../lib/format";
import { actOnItem, finishRun, minutesLabel, startRun, type FinishResult, type Run, type RunItem } from "../lib/runApi";
import { cn } from "../lib/cn";

const EASE = [0.16, 1, 0.3, 1] as const;
type Dir = "forward" | "back";

/** Today's catch-up: each save opened properly, one at a time, then it ends. */
export function CatchUp() {
  const [params] = useSearchParams();
  const kind = params.get("kind") === "bonus" ? "bonus" : "daily";
  const { today, todayLoading } = useAppData();
  const navigate = useNavigate();
  const run = kind === "bonus" ? today?.bonus : today?.run;

  useEffect(() => {
    if (!todayLoading && !run) navigate("/app", { replace: true });
  }, [todayLoading, run, navigate]);

  return (
    <div className="fixed inset-0 z-[130] flex flex-col bg-bg text-ink" role="dialog" aria-modal="true" aria-label="Today's catch-up">
      {run ? (
        <Player key={run._id} run={run} />
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <Spinner className="size-6 text-ink-3" />
        </div>
      )}
    </div>
  );
}

function Player({ run }: { run: Run }) {
  const { today, contents, refreshToday, upsertItem, refreshCounts } = useAppData();
  const navigate = useNavigate();
  const toast = useToast();
  const reduced = useReducedMotion();
  const items = run.items;
  const scrollRef = useRef<HTMLDivElement>(null);

  const [results, setResults] = useState<Record<string, RunItem["result"]>>(() =>
    Object.fromEntries(items.map((i) => [i.contentId, i.result]))
  );
  const firstOpen = items.findIndex((i) => !i.result);
  const [index, setIndex] = useState(firstOpen === -1 ? 0 : firstOpen);
  const [dir, setDir] = useState<Dir>("forward");
  const [stamp, setStamp] = useState<{ label: string; good: boolean } | null>(null);
  const [planOpen, setPlanOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [finished, setFinished] = useState<FinishResult | null>(null);
  const [finishing, setFinishing] = useState(false);
  const started = useRef(false);

  const current = items[index];
  const answered = items.filter((i) => results[i.contentId]).length;
  const openCount = items.length - answered;

  const finish = useCallback(async () => {
    setFinishing(true);
    try {
      const res = await finishRun(run._id);
      setFinished(res);
      refreshToday();
      refreshCounts();
    } catch (err) {
      toast(normalizeError(err).message, { tone: "info" });
    } finally {
      setFinishing(false);
    }
  }, [run._id, refreshToday, refreshCounts, toast]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (run.finishedAt) finish();
    else if (!run.startedAt) startRun(run._id).catch(() => {});
  }, [run, finish]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    setPlanOpen(false);
  }, [index]);

  function nextOpenAfter(i: number, res: Record<string, RunItem["result"]>): number {
    for (let k = i + 1; k < items.length; k++) if (!res[items[k].contentId]) return k;
    for (let k = 0; k < items.length; k++) if (!res[items[k].contentId]) return k;
    return -1;
  }

  async function decide(action: "done" | "plan" | "later", planFor?: Date) {
    if (!current || busy) return;
    const item = current;
    setBusy(true);
    setPlanOpen(false);
    setDir("forward");
    navigator.vibrate?.(8);
    if (action === "done") setStamp({ label: "Done", good: true });
    if (action === "plan" && planFor) setStamp({ label: `Planned · ${dayLabel(planFor)}`, good: false });
    try {
      const res = await actOnItem(run._id, item.contentId, action, planFor);
      upsertItem(res.content);
      const next = { ...results, [item.contentId]: res.item.result };
      setResults(next);
      if (!reduced && action !== "later") await new Promise((r) => setTimeout(r, 480));
      setStamp(null);
      const k = nextOpenAfter(index, next);
      if (k === -1) await finish();
      else setIndex(k);
    } catch (err) {
      setStamp(null);
      toast(normalizeError(err).message, { tone: "info" });
    } finally {
      setBusy(false);
    }
  }

  async function undo() {
    if (!current || busy) return;
    setBusy(true);
    try {
      const res = await actOnItem(run._id, current.contentId, "undo");
      upsertItem(res.content);
      setResults((r) => ({ ...r, [current.contentId]: null }));
    } catch (err) {
      toast(normalizeError(err).message, { tone: "info" });
    } finally {
      setBusy(false);
    }
  }

  function back() {
    if (index === 0 || busy) return;
    setDir("back");
    setIndex(index - 1);
  }

  function forward() {
    if (!current || busy) return;
    if (results[current.contentId]) {
      const k = nextOpenAfter(index, results);
      if (k === -1) finish();
      else {
        setDir("forward");
        setIndex(k);
      }
      return;
    }
    decide("later");
  }

  const close = useCallback(() => navigate("/app"), [navigate]);

  // Keyboard: → later, ← back, D done, P plan, Esc close.
  const keys = useRef({ decide, back, forward, close, planOpen, setPlanOpen, finished });
  keys.current = { decide, back, forward, close, planOpen, setPlanOpen, finished };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const h = keys.current;
      if (e.metaKey || e.ctrlKey || e.altKey || document.body.dataset.scrollLocked) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (e.key === "Escape") {
        if (h.planOpen) h.setPlanOpen(false);
        else h.close();
        return;
      }
      if (h.finished || h.planOpen) return;
      const k = e.key.toLowerCase();
      if (k === "arrowright") h.forward();
      else if (k === "arrowleft") h.back();
      else if (k === "d") h.decide("done");
      else if (k === "p") h.setPlanOpen(true);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (finished) {
    return (
      <div className="flex flex-1 flex-col bg-bg text-ink">
        <RunComplete result={finished} kind={run.kind} bonusAvailable={Boolean(today?.bonusAvailable)} onClose={close} />
      </div>
    );
  }
  if (finishing || !current) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-ink-3">
        <Spinner className="size-6" />
        <p className="text-sm">Wrapping up…</p>
      </div>
    );
  }

  const c = current.content;
  const source = normalizeSourceType(c);
  const result = results[current.contentId];
  const width = viewerWidth(c);
  const widthClass = width === "post" ? "max-w-[640px]" : "max-w-[720px]";
  const remaining = Math.round((run.estSecondsLeft / Math.max(1, items.filter((i) => !i.result).length)) * openCount);
  const plannedToday = current.reason === "planned" && c.plannedFor && new Date(c.plannedFor).getTime() <= Date.now() + 86_400_000;

  return (
    <>
      <header className="shrink-0 border-b border-line bg-bg/90 px-3 pb-2.5 pt-[max(10px,env(safe-area-inset-top))] backdrop-blur-md sm:px-5">
        <div className="mx-auto flex max-w-[980px] items-center gap-3">
          <button
            type="button"
            onClick={close}
            aria-label="Close catch-up"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <X className="size-5" />
          </button>
          <p className="hidden shrink-0 text-[14px] font-semibold text-ink sm:block">Catch up</p>
          <div className="flex flex-1 gap-1" aria-label={`${answered} of ${items.length} done`}>
            {items.map((it, i) => (
              <button
                key={it.contentId}
                type="button"
                aria-label={`Save ${i + 1}`}
                onClick={() => {
                  setDir(i < index ? "back" : "forward");
                  setIndex(i);
                }}
                className="group h-5 flex-1 py-2"
              >
                <span className="block h-1 overflow-hidden rounded-full bg-surface-3">
                  <motion.span
                    className={cn("block h-full rounded-full", results[it.contentId] ? "bg-ink" : "bg-accent")}
                    initial={false}
                    animate={{ width: results[it.contentId] ? "100%" : i === index ? "40%" : "0%" }}
                    transition={{ duration: 0.45, ease: EASE }}
                  />
                </span>
              </button>
            ))}
          </div>
          <p className="shrink-0 text-[13px] text-ink-3 tnum">
            {index + 1} of {items.length}
            <span className="hidden sm:inline">{openCount > 0 ? ` · ${minutesLabel(remaining)} left` : ""}</span>
          </p>
        </div>
      </header>

      <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.div
            key={current.contentId}
            custom={dir}
            variants={{
              enter: (d: Dir) => ({ opacity: 0, x: d === "back" ? -40 : 40 }),
              center: { opacity: 1, x: 0 },
              exit: (d: Dir) => ({ opacity: 0, x: d === "back" ? 40 : -40 }),
            }}
            initial={reduced ? false : "enter"}
            animate="center"
            exit={reduced ? { opacity: 0 } : "exit"}
            transition={{ duration: 0.3, ease: EASE }}
            className={cn("mx-auto px-5 pb-12 pt-6 sm:px-8 sm:pt-10", widthClass)}
          >
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[13.5px] text-ink-3">
              <SourceIcon channel={source} size="sm" />
              <span className="font-medium text-ink-2">{source === "other" ? hostnameOf(c.link) : getChannelConfig(source).label}</span>
              {c.createdAt && <span>· saved {formatDate(c.createdAt)}</span>}
              {plannedToday && (
                <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-accent-soft px-2.5 text-xs font-medium text-accent-ink sm:ml-auto">
                  <CalendarClock className="size-3.5" />
                  You planned this for today
                </span>
              )}
            </div>
            <h1 className="mt-3 text-[26px] font-semibold leading-tight tracking-title text-balance sm:text-[32px]">{c.title}</h1>

            {c.note && (
              <p className="mt-4 flex gap-2.5 rounded-2xl bg-surface-2/70 px-4 py-3 text-[15px] leading-relaxed text-ink-2">
                <Quote className="mt-1 size-3.5 shrink-0 text-ink-3" />
                {c.note}
              </p>
            )}

            <div className="mt-6">
              <Viewer item={c} />
            </div>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {stamp && (
            <motion.div
              initial={{ opacity: 0, scale: 1.25, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: -5 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", bounce: 0.45, duration: 0.42 }}
              className="pointer-events-none fixed inset-0 z-20 flex items-center justify-center"
            >
              <span
                className={cn(
                  "rounded-2xl px-6 py-3.5 text-[24px] font-bold tracking-title shadow-float ring-4",
                  stamp.good ? "bg-success text-white ring-success/25" : "bg-inverse text-inverse-ink ring-inverse/20"
                )}
              >
                {stamp.good && <Check className="-mt-1 mr-2 inline size-6" strokeWidth={3} />}
                {stamp.label}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
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
                    intent={c.intent}
                    contents={contents}
                    currentId={c._id}
                    busy={busy}
                    onCancel={() => setPlanOpen(false)}
                    onPick={(date) => decide("plan", date)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!planOpen &&
            (result ? (
              <div className="flex items-center gap-2">
                <p className="flex flex-1 items-center gap-2 text-[14px] text-ink-2">
                  <Check className="size-4 text-success" />
                  {result === "done" || result === "got"
                    ? "Done"
                    : result === "plan"
                      ? `Planned${c.plannedFor ? ` · ${dayLabel(c.plannedFor)}` : ""}`
                      : "Later"}
                </p>
                <button
                  type="button"
                  onClick={undo}
                  disabled={busy}
                  className="inline-flex h-11 items-center gap-1.5 rounded-xl px-3 text-[14px] text-ink-2 hover:bg-surface-2 hover:text-ink"
                >
                  <Undo2 className="size-4" />
                  Change
                </button>
                <button
                  type="button"
                  onClick={forward}
                  className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-inverse px-4 text-[14px] font-medium text-inverse-ink"
                >
                  Next
                  <ArrowRight className="size-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={back}
                    aria-label="Previous save"
                    className="hidden size-12 shrink-0 items-center justify-center rounded-2xl text-ink-2 ring-1 ring-inset ring-line transition-colors hover:bg-surface-2 sm:flex"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={forward}
                  disabled={busy}
                  title="Not now. It comes back another day."
                  className="inline-flex h-12 shrink-0 items-center gap-1.5 rounded-2xl px-4 text-[15px] font-medium text-ink-2 ring-1 ring-inset ring-line transition-[background-color,color,transform] hover:bg-surface-2 hover:text-ink active:scale-[0.97] disabled:opacity-50"
                >
                  Later
                </button>
                <button
                  type="button"
                  onClick={() => setPlanOpen(true)}
                  disabled={busy}
                  title="Pick a day for it"
                  className="inline-flex h-12 shrink-0 items-center gap-2 rounded-2xl px-4 text-[15px] font-medium text-ink ring-1 ring-inset ring-line transition-[background-color,transform] hover:bg-surface-2 active:scale-[0.97] disabled:opacity-50"
                >
                  <CalendarClock className="size-[18px]" />
                  Plan
                </button>
                <button
                  type="button"
                  onClick={() => decide("done")}
                  disabled={busy}
                  title="Finished with it. It moves to Done."
                  className="flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl bg-inverse px-4 text-[15.5px] font-semibold text-inverse-ink shadow-lift transition-transform active:scale-[0.98] disabled:opacity-60"
                >
                  <Check className="size-5 shrink-0" strokeWidth={2.6} />
                  Done
                </button>
              </div>
            ))}
          {!planOpen && (
            <p className="mt-2.5 text-center text-[12.5px] text-ink-3">
              <span className="lg:hidden">Later brings it back another day. Done moves it to Done.</span>
              <span className="hidden lg:inline">→ Later · P Plan · D Done · ← Back · Esc Close</span>
            </p>
          )}
        </div>
      </footer>
    </>
  );
}
