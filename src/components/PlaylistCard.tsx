import { useState } from "react";
import { Check, Copy, ListVideo, Play, Trash2 } from "lucide-react";
import { api, normalizeError } from "../lib/api";
import { useConfirm } from "./ConfirmDialog";
import { type Collection } from "../hooks/useContent";
import { SourceIcon } from "./ui/SourceIcon";
import { IconButton } from "./ui/Button";
import { cn } from "../lib/cn";
import { count } from "../lib/format";

interface PlaylistCardProps {
  collection: Collection;
  onOpen: () => void;
  onDeleted?: () => void;
  readOnly?: boolean;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export function PlaylistCard({
  collection,
  onOpen,
  onDeleted,
  readOnly,
  selectionMode,
  selected,
  onToggleSelect,
}: PlaylistCardProps) {
  const { title, thumbnail, itemCount, channelTitle, tags } = collection;
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirm = useConfirm();

  async function handleDelete() {
    if (deleting) return;
    const ok = await confirm({
      title: "Remove this playlist?",
      message: `“${title}” and its ${count(itemCount, "video")} will be permanently removed.`,
      confirmText: "Remove playlist",
      destructive: true,
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await api.delete(`/api/v1/collections/${collection._id}`);
      onDeleted?.();
    } catch (err) {
      setError(normalizeError(err).message);
      setDeleting(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(collection.url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-2xl bg-surface p-4 ring-1 transition-[box-shadow,transform,opacity] duration-300 ease-out",
        selected ? "ring-2 ring-accent shadow-lift" : "shadow-card ring-line hover:shadow-lift hover:ring-line-strong",
        deleting && "pointer-events-none scale-[0.98] opacity-40"
      )}
    >
      {selectionMode && (
        <button
          type="button"
          onClick={() => onToggleSelect?.(collection._id)}
          aria-pressed={selected}
          aria-label={selected ? `Deselect ${title}` : `Select ${title}`}
          className={cn(
            "absolute inset-0 z-20 rounded-2xl transition-colors",
            selected ? "bg-accent/[0.06]" : "hover:bg-ink/[0.03]"
          )}
        >
          <span
            className={cn(
              "absolute right-3.5 top-3.5 flex size-6 items-center justify-center rounded-full ring-1 ring-inset transition-all duration-200",
              selected ? "scale-100 bg-accent text-white ring-accent" : "scale-95 bg-surface text-transparent ring-line-strong"
            )}
          >
            <Check className="size-3.5" strokeWidth={3} />
          </span>
        </button>
      )}

      <header className="flex items-center gap-2">
        <SourceIcon channel="youtube" size="xs" />
        <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-ink-3">
          Playlist{channelTitle ? ` · ${channelTitle}` : ""}
        </span>
        {!readOnly && !selectionMode && (
          <div className="-my-1 -mr-1.5 flex items-center opacity-100 transition-opacity duration-200 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100">
            <IconButton label={copied ? "Copied" : "Copy link"} size="sm" onClick={copyLink}>
              {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
            </IconButton>
            <IconButton label="Delete playlist" size="sm" tone="danger" onClick={handleDelete}>
              <Trash2 className="size-3.5" />
            </IconButton>
          </div>
        )}
      </header>

      <h3 className="mb-3 mt-2.5 line-clamp-2 text-[15px] font-semibold leading-snug tracking-[-0.01em] text-ink">{title}</h3>

      <button
        type="button"
        onClick={onOpen}
        disabled={selectionMode}
        className="group/cover relative block w-full pt-2.5 text-left"
        aria-label={`Open playlist ${title}`}
      >
        {/* The stack behind says "many videos" before the count does. */}
        <span className="absolute inset-x-4 top-0 h-6 rounded-t-xl bg-surface-3" aria-hidden="true" />
        <span className="absolute inset-x-2 top-1 h-6 rounded-t-xl bg-line-strong" aria-hidden="true" />
        <span className="relative block aspect-video overflow-hidden rounded-xl bg-surface-3">
          {thumbnail && (
            <img
              src={thumbnail}
              alt=""
              loading="lazy"
              className="size-full object-cover transition-transform duration-500 ease-out group-hover/cover:scale-[1.04]"
            />
          )}
          <span className="absolute inset-y-0 right-0 flex w-[38%] flex-col items-center justify-center gap-0.5 bg-black/70 text-white backdrop-blur-[2px]">
            <ListVideo className="mb-1 size-5" />
            <span className="text-lg font-semibold leading-none tnum">{itemCount}</span>
            <span className="text-[11px] text-white/75">{itemCount === 1 ? "video" : "videos"}</span>
          </span>
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover/cover:bg-black/20">
            <span className="flex translate-y-1 items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1.5 text-[13px] font-semibold text-black opacity-0 shadow-lift transition-all duration-200 group-hover/cover:translate-y-0 group-hover/cover:opacity-100">
              <Play className="size-3.5 fill-current" />
              Play all
            </span>
          </span>
        </span>
      </button>

      {error && <p className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">{error}</p>}

      {tags && tags.length > 0 && (
        <footer className="mt-3.5 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span key={tag._id} className="rounded-md bg-surface-2 px-1.5 py-0.5 text-xs text-ink-2">
              #{tag.name}
            </span>
          ))}
        </footer>
      )}
    </article>
  );
}
