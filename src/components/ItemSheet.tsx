import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Archive, ArrowUpRight, CalendarClock, Check, Copy, RotateCcw, Trash2, X } from "lucide-react";
import type { Content } from "../hooks/useContent";
import { normalizeSourceType } from "../lib/urlDetector";
import { getChannelConfig } from "../lib/channels";
import { dayLabel, reviewItem, updateItem } from "../lib/recall";
import { PlanPicker } from "./PlanPicker";
import { api, normalizeError } from "../lib/api";
import { formatDate, hostnameOf } from "../lib/format";
import { CardBody } from "./Card";
import { SourceIcon } from "./ui/SourceIcon";
import { Button, IconButton } from "./ui/Button";
import { useConfirm } from "./ConfirmDialog";
import { useToast } from "./ui/Toast";
import { cn } from "../lib/cn";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Everything about one save: what it is, why it was kept, a note, a day to
 * come back to it, and what happened with it.
 */
export function ItemSheet({
  item,
  contents = [],
  onClose,
  onChange,
  onDeleted,
}: {
  item: Content | null;
  /** Everything saved, so the plan picker can show how full each day is. */
  contents?: Content[];
  onClose: () => void;
  onChange: (next: Content) => void;
  onDeleted: (id: string) => void;
}) {
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.dataset.scrollLocked = "true";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      delete document.body.dataset.scrollLocked;
    };
  }, [item, onClose]);

  return createPortal(
    <AnimatePresence>
      {item && (
        <div className="fixed inset-0 z-[140]">
          <motion.div
            className="absolute inset-0 bg-[rgb(10_10_9/0.32)] dark:bg-[rgb(0_0_0/0.5)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={item.title}
            className="absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col overflow-hidden rounded-t-3xl bg-surface shadow-float ring-1 ring-line sm:inset-y-3 sm:left-auto sm:right-3 sm:max-h-none sm:w-[460px] sm:rounded-3xl"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.38, ease: EASE }}
          >
            <SheetBody key={item._id} item={item} contents={contents} onClose={onClose} onChange={onChange} onDeleted={onDeleted} />
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function SheetBody({
  item,
  contents,
  onClose,
  onChange,
  onDeleted,
}: {
  item: Content;
  contents: Content[];
  onClose: () => void;
  onChange: (next: Content) => void;
  onDeleted: (id: string) => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [note, setNote] = useState(item.note ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [planning, setPlanning] = useState(false);
  const confirm = useConfirm();
  const toast = useToast();

  const id = item._id!;
  const source = normalizeSourceType(item);
  const status = item.status ?? "active";

  async function run<T>(fn: () => Promise<T>): Promise<T | undefined> {
    setBusy(true);
    setError(null);
    try {
      return await fn();
    } catch (err) {
      setError(normalizeError(err).message);
    } finally {
      setBusy(false);
    }
  }

  async function patch(fields: Parameters<typeof updateItem>[1]) {
    const next = await run(() => updateItem(id, fields));
    if (next) onChange(next);
    return next;
  }

  async function review(action: "done" | "restore") {
    const next = await run(() => reviewItem(id, action));
    if (!next) return;
    onChange(next);
    toast(action === "done" ? "Marked done." : "Back in To do.");
  }

  async function remove() {
    const ok = await confirm({
      title: "Delete this save?",
      message: "It will be permanently removed from your brain.",
      confirmText: "Delete",
      destructive: true,
    });
    if (!ok) return;
    const done = await run(() => api.delete("/api/v1/content", { data: { contentId: id } }));
    if (done) {
      onDeleted(id);
      onClose();
    }
  }

  return (
    <>
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-4">
        <SourceIcon channel={source} size="sm" />
        <span className="min-w-0 flex-1 truncate text-[13px] text-ink-3">
          {source === "other" ? hostnameOf(item.link) : getChannelConfig(source).label}
          {item.createdAt && ` · saved ${formatDate(item.createdAt)}`}
        </span>
        <IconButton label="Close" size="sm" onClick={onClose}>
          <X className="size-4" />
        </IconButton>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-6 pt-4">
        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => {
            const t = title.trim();
            if (t && t !== item.title) patch({ title: t });
            else setTitle(item.title);
          }}
          rows={2}
          maxLength={300}
          aria-label="Title"
          className="w-full resize-none rounded-lg bg-transparent text-[20px] font-semibold leading-snug tracking-title text-ink outline-none focus:bg-surface-2/60"
        />

        {status !== "active" && (
          <div
            className={cn(
              "mt-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[13px]",
              status === "done" ? "bg-success/10 text-success" : "bg-surface-2 text-ink-2"
            )}
          >
            {status === "done" ? <Check className="size-3.5" /> : <Archive className="size-3.5" />}
            {status === "done" ? `Done${item.doneAt ? ` · ${formatDate(item.doneAt)}` : ""}` : "Archived"}
          </div>
        )}

        <div className="mt-4">
          <CardBody sourceType={source} link={item.link} title={item.title} ogData={item.ogData} />
        </div>

        <section className="mt-7">
          <label htmlFor="item-note" className="text-[13px] font-medium text-ink-2">
            Why you saved it
          </label>
          <textarea
            id="item-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => note.trim() !== (item.note ?? "") && patch({ note: note.trim() })}
            placeholder="Try the sauce with rice instead · for the Goa trip · send to Priya…"
            rows={3}
            maxLength={1000}
            className="mt-2 w-full resize-none rounded-xl bg-surface-2/60 px-3.5 py-3 text-[14.5px] leading-relaxed text-ink outline-none ring-1 ring-inset ring-line placeholder:text-ink-3 focus:bg-surface focus:ring-2 focus:ring-accent"
          />
        </section>

        <section className="mt-6">
          <h3 className="flex items-center gap-1.5 text-[13px] font-medium text-ink-2">
            <CalendarClock className="size-3.5" />
            Come back to it
          </h3>
          {item.plannedFor && new Date(item.plannedFor) > new Date() ? (
            <div className="mt-2.5 flex items-center justify-between rounded-xl bg-accent-soft/60 px-3.5 py-2.5">
              <span className="text-[14px] text-ink">
                Planned for <span className="font-medium">{dayLabel(item.plannedFor)}</span>
              </span>
              <button
                type="button"
                onClick={() => patch({ plannedFor: null })}
                className="text-[13px] text-ink-2 underline-offset-2 hover:text-ink hover:underline"
              >
                Clear
              </button>
            </div>
          ) : planning ? (
            <div className="mt-3 rounded-2xl bg-surface-2/50 p-3.5 ring-1 ring-inset ring-line">
              <PlanPicker
                intent={item.intent}
                contents={contents}
                currentId={item._id}
                busy={busy}
                onCancel={() => setPlanning(false)}
                onPick={async (date) => {
                  const next = await patch({ plannedFor: date.toISOString() });
                  if (next) {
                    setPlanning(false);
                    toast(`Planned for ${dayLabel(date).toLowerCase()}. It'll be in that day's catch-up.`);
                  }
                }}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setPlanning(true)}
              className="mt-2.5 inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13.5px] text-ink ring-1 ring-inset ring-line transition-colors hover:bg-surface-2"
            >
              <CalendarClock className="size-4" />
              Pick a day and time
            </button>
          )}
          {status === "active" && item.dueAt && !item.plannedFor && (
            <p className="mt-2 text-xs text-ink-3">Otherwise it comes back on its own {dayLabel(item.dueAt).toLowerCase()}.</p>
          )}
        </section>

        {error && <p className="mt-5 rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">{error}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-2 border-t border-line px-4 py-3">
        {status === "active" ? (
          <Button variant="primary" onClick={() => review("done")} disabled={busy} startIcon={<Check className="size-4" />}>
            Mark done
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => review("restore")} disabled={busy} startIcon={<RotateCcw className="size-4" />}>
            Move back to To do
          </Button>
        )}
        <div className="ml-auto flex items-center">
          <IconButton
            label={copied ? "Copied" : "Copy link"}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(item.link);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1500);
              } catch {
                /* clipboard blocked */
              }
            }}
          >
            {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
          </IconButton>
          <IconButton label="Delete" tone="danger" onClick={remove}>
            <Trash2 className="size-4" />
          </IconButton>
          <a
            href={item.link}
            target="_blank"
            rel="noreferrer"
            className="ml-1 inline-flex h-9 items-center gap-1 rounded-lg px-3 text-[13.5px] font-medium text-ink ring-1 ring-inset ring-line hover:bg-surface-2"
          >
            Open
            <ArrowUpRight className="size-3.5" />
          </a>
        </div>
      </div>
    </>
  );
}
