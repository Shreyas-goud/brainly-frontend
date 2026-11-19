import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Bookmark, Check, CheckSquare, ChevronLeft, ChevronRight, CircleCheck, Smartphone, Trash2, X } from "lucide-react";
import { useAppData } from "./AppData";
import { AppChips } from "./nav";
import { useApps } from "./navData";
import { useDoneActions } from "./useDoneActions";
import { PlaylistTile, SaveTile, Thumb } from "../components/SaveTile";
import { PlaylistView } from "../components/PlaylistView";
import { SourceIcon } from "../components/ui/SourceIcon";
import { Button } from "../components/ui/Button";
import { useConfirm } from "../components/ConfirmDialog";
import { useToast } from "../components/ui/Toast";
import type { Collection, Content } from "../hooks/useContent";
import { normalizeSourceType } from "../lib/urlDetector";
import { BRAIN_CHANNELS, appFromSlug, appPath, getChannelConfig, type BrainChannelId } from "../lib/channels";
import { api, normalizeError } from "../lib/api";
import { count } from "../lib/format";
import { minutesLabel, startBonus } from "../lib/runApi";
import { cn } from "../lib/cn";

const EASE = [0.16, 1, 0.3, 1] as const;
const SHELF_SIZE = 12;

const isOpen = (c: Content) => (c.status ?? "active") === "active";

/** All saves as one shelf per app, or one app's saves as a grid. Done lives on its own page. */
export function SavesPage() {
  const { app: slug } = useParams<{ app?: string }>();
  const app = appFromSlug(slug);
  if (slug && !app) return <Navigate to="/app" replace />;
  return app ? <AppSaves key={app} app={app} /> : <AllSaves />;
}

function AllSaves() {
  const { contents, collections, loading, error, refresh, refreshAll, hasMore, loadMore, loadingMore, modals } = useAppData();
  const { apps, total, done } = useApps();
  const { markDone } = useDoneActions();
  const navigate = useNavigate();
  const [openCollection, setOpenCollection] = useState<Collection | null>(null);

  const byApp = useMemo(() => {
    const m = new Map<BrainChannelId, Content[]>();
    for (const c of contents) {
      if (!isOpen(c)) continue;
      const s = normalizeSourceType(c) as BrainChannelId;
      if (!m.has(s)) m.set(s, []);
      m.get(s)!.push(c);
    }
    return m;
  }, [contents]);

  const shelves = BRAIN_CHANNELS.map((c) => c.id as BrainChannelId).filter(
    (id) => (byApp.get(id)?.length ?? 0) > 0 || (id === "youtube" && collections.length > 0)
  );
  const nothingSaved = !loading && contents.length === 0 && collections.length === 0;
  const appsWithTodo = apps.filter((a) => a.count > 0).length;

  return (
    <div>
      <AppChips />
      <header className="mb-6">
        <h1 className="text-[26px] font-semibold leading-tight tracking-title sm:text-[30px]">All saves</h1>
        {!loading && !nothingSaved && (
          <p className="mt-1 text-[14.5px] text-ink-3">
            {total > 0 ? `${count(total, "save")} to do, from ${count(appsWithTodo, "app")}` : "Nothing left to do"}
            {done > 0 && (
              <>
                {" · "}
                <Link to="/app/done" className="underline-offset-4 hover:text-ink hover:underline">
                  {done} done
                </Link>
              </>
            )}
          </p>
        )}
      </header>

      {error && <ErrorBar message={error.message} onRetry={refresh} />}

      {loading ? (
        <ShelvesSkeleton />
      ) : nothingSaved ? (
        <Welcome onSave={() => modals.openSave()} onPhone={modals.openCapture} />
      ) : (
        <>
          <CatchUpCard />
          {shelves.length > 0 ? (
            <div className="space-y-10">
              {shelves.map((id) => {
                const items = byApp.get(id) ?? [];
                const lists = id === "youtube" ? collections : [];
                const n = items.length + lists.length;
                return (
                  <Shelf key={id} app={id} count={n} more={n > SHELF_SIZE}>
                    {lists.map((p) => (
                      <PlaylistTile key={p._id} collection={p} onOpen={() => setOpenCollection(p)} className={SHELF_TILE} />
                    ))}
                    {items.slice(0, Math.max(0, SHELF_SIZE - lists.length)).map((c) => (
                      <SaveTile key={c._id} item={c} onOpen={() => navigate(`/app/view/${c._id}`)} onDone={() => markDone(c)} className={SHELF_TILE} />
                    ))}
                  </Shelf>
                );
              })}
            </div>
          ) : (
            <AllDone done={done} />
          )}
          {hasMore && (
            <div className="mt-10 flex justify-center">
              <Button variant="secondary" onClick={loadMore} loading={loadingMore} loadingText="Loading…">
                Load more
              </Button>
            </div>
          )}
        </>
      )}

      {openCollection && <PlaylistView collection={openCollection} open onClose={() => setOpenCollection(null)} onDeleted={refreshAll} />}
    </div>
  );
}

const SHELF_TILE = "w-[200px] shrink-0 snap-start sm:w-[232px]";

/** One app's row: its name and count, then its saves side by side; swipe or page through. */
function Shelf({ app, count: n, more, children }: { app: BrainChannelId; count: number; more: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: true });
  const config = getChannelConfig(app);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setEdge({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  const page = (dir: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };
  const arrow = "flex size-8 items-center justify-center rounded-full text-ink-2 ring-1 ring-inset ring-line transition-[background-color,opacity] hover:bg-surface-2 hover:text-ink disabled:opacity-30";

  return (
    <section aria-label={config.label}>
      <header className="mb-3 flex items-center gap-3">
        <Link to={appPath(app)} className="flex min-w-0 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent">
          <SourceIcon channel={app} size="sm" />
          <h2 className="truncate text-[17px] font-semibold tracking-title text-ink">{config.label}</h2>
          <span className="text-[14px] text-ink-3 tnum">{n}</span>
        </Link>
        <div className="ml-auto flex items-center gap-1.5">
          {!(edge.start && edge.end) && (
            <span className="hidden gap-1.5 sm:flex">
              <button type="button" aria-label={`Earlier ${config.label} saves`} onClick={() => page(-1)} disabled={edge.start} className={arrow}>
                <ChevronLeft className="size-4" />
              </button>
              <button type="button" aria-label={`More ${config.label} saves`} onClick={() => page(1)} disabled={edge.end} className={arrow}>
                <ChevronRight className="size-4" />
              </button>
            </span>
          )}
          <Link
            to={appPath(app)}
            className="inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-[13.5px] text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
          >
            {more ? "See all" : "Open"}
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </header>
      <div
        ref={ref}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 pt-2 scrollbar-none sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:-mx-10 lg:scroll-px-10 lg:px-10"
      >
        {children}
      </div>
    </section>
  );
}

function AppSaves({ app }: { app: BrainChannelId }) {
  const { contents, collections, loading, error, refresh, refreshAll, hasMore, loadMore, loadingMore, modals } = useAppData();
  const { done } = useApps();
  const { markDone } = useDoneActions();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [openCollection, setOpenCollection] = useState<Collection | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const config = getChannelConfig(app);

  const todo = useMemo(() => contents.filter((c) => isOpen(c) && normalizeSourceType(c) === app), [contents, app]);
  const doneHere = useMemo(() => contents.filter((c) => !isOpen(c) && normalizeSourceType(c) === app).length, [contents, app]);
  const lists = app === "youtube" ? collections : [];

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function deleteSelected() {
    if (selected.size === 0 || deleting) return;
    const ok = await confirm({
      title: `Delete ${count(selected.size, "save")}?`,
      message: "They'll be removed for good.",
      confirmText: `Delete ${selected.size}`,
      destructive: true,
    });
    if (!ok) return;
    setDeleting(true);
    setActionError(null);
    try {
      await api.delete("/api/v1/content", { data: { contentIds: Array.from(selected) } });
      setSelecting(false);
      setSelected(new Set());
      refreshAll();
    } catch (err) {
      setActionError(normalizeError(err).message);
    } finally {
      setDeleting(false);
    }
  }

  const ids = todo.map((c) => c._id).filter((id): id is string => Boolean(id));
  const allSelected = ids.length > 0 && ids.every((id) => selected.has(id));

  return (
    <div>
      <AppChips />
      <header className="mb-7 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex min-w-0 items-center gap-3.5">
          <SourceIcon channel={app} size="lg" />
          <div className="min-w-0">
            <h1 className="truncate text-[26px] font-semibold leading-tight tracking-title sm:text-[30px]">{config.label}</h1>
            {!loading && (
              <p className="text-[14px] text-ink-3">
                {todo.length + lists.length > 0 ? `${count(todo.length + lists.length, "save")} to do` : "Nothing left to do"}
                {doneHere > 0 && (
                  <>
                    {" · "}
                    <Link to="/app/done" className="underline-offset-4 hover:text-ink hover:underline">
                      {doneHere} done
                    </Link>
                  </>
                )}
              </p>
            )}
          </div>
        </div>
        {todo.length > 0 && (
          <Button
            size="sm"
            variant={selecting ? "primary" : "ghost"}
            onClick={() => {
              setSelecting((s) => !s);
              setSelected(new Set());
            }}
            startIcon={<CheckSquare className="size-3.5" />}
          >
            {selecting ? "Done selecting" : "Select"}
          </Button>
        )}
      </header>

      {error && <ErrorBar message={error.message} onRetry={refresh} />}
      {actionError && <p className="mb-5 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{actionError}</p>}

      {loading ? (
        <TileGridSkeleton />
      ) : todo.length + lists.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-7 pt-1.5 sm:grid-cols-3 xl:grid-cols-4">
          {!selecting && lists.map((p) => <PlaylistTile key={p._id} collection={p} onOpen={() => setOpenCollection(p)} />)}
          {todo.map((c) => (
            <SaveTile
              key={c._id}
              item={c}
              onOpen={() => navigate(`/app/view/${c._id}`)}
              onDone={() => markDone(c)}
              selectable={selecting}
              selected={c._id ? selected.has(c._id) : false}
              onToggle={() => c._id && toggle(c._id)}
            />
          ))}
        </div>
      ) : (
        <AllDone done={done} appLabel={config.label} onSave={() => modals.openSave()} />
      )}

      {!loading && hasMore && (
        <div className="mt-10 flex justify-center">
          <Button variant="secondary" onClick={loadMore} loading={loadingMore} loadingText="Loading…">
            Load more
          </Button>
        </div>
      )}

      <AnimatePresence>
        {selecting && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="fixed inset-x-0 bottom-[calc(92px+env(safe-area-inset-bottom))] z-40 flex justify-center px-4 lg:bottom-6 lg:pl-[248px]"
          >
            <div role="toolbar" aria-label="Selection" className="flex items-center gap-1 rounded-2xl bg-inverse p-1.5 pl-4 text-inverse-ink shadow-float">
              <span className="mr-2 text-[13.5px] font-medium tnum">{selected.size} selected</span>
              <button
                type="button"
                onClick={() => setSelected(allSelected ? new Set() : new Set(ids))}
                className="h-9 rounded-xl px-3 text-[13.5px] text-inverse-ink/75 hover:bg-inverse-ink/10 hover:text-inverse-ink"
              >
                {allSelected ? "Clear" : "Select all"}
              </button>
              <button
                type="button"
                onClick={deleteSelected}
                disabled={selected.size === 0 || deleting}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-danger px-3.5 text-[13.5px] font-medium text-white disabled:opacity-40"
              >
                <Trash2 className="size-3.5" />
                {deleting ? "Deleting…" : "Delete"}
              </button>
              <button
                type="button"
                aria-label="Stop selecting"
                onClick={() => {
                  setSelecting(false);
                  setSelected(new Set());
                }}
                className="flex size-9 items-center justify-center rounded-xl text-inverse-ink/70 hover:bg-inverse-ink/10 hover:text-inverse-ink"
              >
                <X className="size-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {openCollection && <PlaylistView collection={openCollection} open onClose={() => setOpenCollection(null)} onDeleted={refreshAll} />}
    </div>
  );
}

/** Today's catch-up, in one line: what's waiting and a way in, or that it's done. */
function CatchUpCard() {
  const { today, todayLoading, refreshToday } = useAppData();
  const navigate = useNavigate();
  const toast = useToast();
  const [starting, setStarting] = useState(false);

  if (todayLoading) return <div className="skeleton mb-10 h-[84px] rounded-2xl" aria-label="Getting today's catch-up ready" />;
  const run = today?.run;
  if (!run) return null;

  const left = run.items.filter((i) => !i.result);
  const finished = Boolean(run.finishedAt);
  const handled = today?.backlog.clearedThisWeek ?? 0;
  const bonus = today?.bonus;
  const bonusOpen = Boolean(bonus && !bonus.finishedAt);

  async function more() {
    if (bonusOpen) return navigate("/app/catch-up?kind=bonus");
    setStarting(true);
    try {
      await startBonus();
      await refreshToday();
      navigate("/app/catch-up?kind=bonus");
    } catch (err) {
      toast(normalizeError(err).message, { tone: "info" });
    } finally {
      setStarting(false);
    }
  }

  if (finished) {
    return (
      <section className="mb-10 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl bg-surface p-4 ring-1 ring-line sm:px-5" aria-label="Today's catch-up">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success/12 text-success">
          <Check className="size-5" strokeWidth={2.6} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-ink">You're caught up for today</p>
          <p className="text-[13.5px] text-ink-3">
            {handled > 0 ? `You went through ${count(handled, "save")} in the last 7 days. ` : ""}A new one is ready tomorrow.
          </p>
        </div>
        {(today?.bonusAvailable || bonusOpen) && (
          <Button variant="secondary" size="sm" onClick={more} loading={starting} loadingText="Picking…">
            {bonusOpen ? "Continue" : "3 more"}
          </Button>
        )}
      </section>
    );
  }

  const started = left.length < run.items.length;
  return (
    <button
      type="button"
      onClick={() => navigate("/app/catch-up")}
      className="group mb-10 flex w-full items-center gap-4 rounded-2xl bg-surface p-4 text-left shadow-card ring-1 ring-line transition-[box-shadow,transform] duration-200 ease-out hover:shadow-lift active:scale-[0.995] sm:px-5"
    >
      <span className="flex shrink-0 items-center" aria-hidden="true">
        {run.items.slice(0, 3).map((i, k) => (
          <Thumb
            key={i.contentId}
            item={i.content}
            className={cn("size-11 rounded-xl ring-2 ring-surface", k > 0 ? "-ml-3 hidden sm:block" : "")}
          />
        ))}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold text-ink">{started ? "Finish today's catch-up" : "Today's catch-up"}</span>
        <span className="block truncate text-[13.5px] text-ink-3">
          {count(left.length, "save")}
          <span className="hidden sm:inline"> {started ? "left" : "to go through"}</span> · {minutesLabel(run.estSecondsLeft)}
        </span>
      </span>
      <span className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-inverse px-4 text-[14px] font-medium text-inverse-ink transition-transform group-active:scale-[0.97]">
        {started ? "Continue" : "Start"}
        <ArrowRight className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
      </span>
    </button>
  );
}

function ErrorBar({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="mb-5 flex items-center gap-3 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
      <span className="flex-1">{message}</span>
      <Button size="sm" variant="secondary" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

function ShelvesSkeleton() {
  return (
    <div className="space-y-10" aria-label="Loading your saves">
      {[0, 1].map((r) => (
        <div key={r}>
          <div className="skeleton mb-4 h-6 w-36 rounded-lg" />
          <div className="flex gap-4 overflow-hidden">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="w-[200px] shrink-0 sm:w-[232px]">
                <div className="skeleton aspect-[16/10] rounded-2xl" />
                <div className="skeleton mt-3 h-4 w-4/5 rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TileGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 xl:grid-cols-4" aria-label="Loading your saves">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i}>
          <div className="skeleton aspect-[16/10] rounded-2xl" />
          <div className="skeleton mt-3 h-4 w-4/5 rounded" />
        </div>
      ))}
    </div>
  );
}

function AllDone({ done, appLabel, onSave }: { done: number; appLabel?: string; onSave?: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-line-strong px-6 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-success/12 text-success">
        <CircleCheck className="size-6" />
      </span>
      <h2 className="mt-4 text-lg font-semibold tracking-title">{appLabel ? `Nothing left from ${appLabel}` : "You're all done"}</h2>
      <p className="mt-1.5 max-w-sm text-[14px] text-ink-2">
        {done > 0 ? "Everything you finished is in Done, and any of it can come back." : "Save something new and it shows up here."}
      </p>
      <div className="mt-6 flex gap-2">
        {done > 0 && (
          <Link to="/app/done" className="inline-flex h-10 items-center rounded-xl bg-surface px-4 text-[14px] font-medium text-ink ring-1 ring-inset ring-line hover:bg-surface-2">
            Open Done
          </Link>
        )}
        {onSave && (
          <Button variant="primary" onClick={onSave}>
            Save a link
          </Button>
        )}
      </div>
    </div>
  );
}

function Welcome({ onSave, onPhone }: { onSave: () => void; onPhone: () => void }) {
  return (
    <section className="mx-auto flex max-w-lg flex-col items-center rounded-3xl bg-surface px-6 py-14 text-center ring-1 ring-line">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-surface-2 text-ink-2">
        <Bookmark className="size-6" />
      </span>
      <h2 className="mt-5 text-[22px] font-semibold tracking-title">Everything you save, in one place</h2>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
        Paste a link from YouTube, Instagram, X, Reddit or anywhere else. It lands here, sorted by the app it came from.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-2">
        <Button variant="primary" onClick={onSave}>
          Save your first link
        </Button>
        <Button variant="secondary" onClick={onPhone} startIcon={<Smartphone className="size-4" />}>
          Save from your phone
        </Button>
      </div>
    </section>
  );
}
