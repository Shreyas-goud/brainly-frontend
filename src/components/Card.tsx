import { useState } from "react";
import { ArrowUpRight, CalendarClock, Check, Copy, Quote, Trash2 } from "lucide-react";
import { api, normalizeError } from "../lib/api";
import { useConfirm } from "./ConfirmDialog";
import { TweetCard } from "./TweetCard";
import { InstagramCard } from "./InstagramCard";
import { LinkPreviewCard } from "./LinkPreviewCard";
import { Video } from "./VideoPlayer";
import { GitHubCard } from "./GitHubCard";
import { RedditCard } from "./RedditCard";
import { getChannelConfig } from "../lib/channels";
import { normalizeSourceType, type SourceType } from "../lib/urlDetector";
import { hostnameOf } from "../lib/format";
import { cn } from "../lib/cn";
import { SourceIcon } from "./ui/SourceIcon";
import { IconButton } from "./ui/Button";
import { type Tag, type OgData, type Content } from "../hooks/useContent";
import { dayLabel } from "../lib/recall";

interface CardProps {
  _id?: string;
  title: string;
  link: string;
  /** Legacy — present on old records. */
  type?: string | null;
  /** New — preferred over `type`. */
  sourceType?: string | null;
  ogData?: OgData | null;
  onDelete?: () => void;
  tags?: Tag[];
  readOnly?: boolean;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  /** The full item, for recall details (intent, note, plan, status). */
  item?: Content;
  /** Opens the item's detail sheet. */
  onOpen?: () => void;
}

function youTubeId(url: string): string | null {
  const match = url.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=)([^#&?]*).*/);
  return match?.[2]?.length === 11 ? match[2] : null;
}

/** A poster until pressed, so a board of videos doesn't load a board of iframes. */
function YouTubeEmbed({ url, title }: { url: string; title: string }) {
  const id = youTubeId(url);
  if (!id) return <LinkPreviewCard url={url} />;
  return <Video key={id} source={{ kind: "youtube", id }} title={title} channel="youtube" originalUrl={url} />;
}

function sourceLabel(sourceType: SourceType, link: string): string {
  if (sourceType === "other" || sourceType === "email" || sourceType === "chat") return hostnameOf(link);
  return getChannelConfig(sourceType).label;
}

export function CardBody({
  sourceType,
  link,
  title,
  ogData,
}: {
  sourceType: SourceType;
  link: string;
  title: string;
  ogData?: OgData | null;
}) {
  switch (sourceType) {
    case "youtube":
      return <YouTubeEmbed url={link} title={title} />;
    case "x":
      return <TweetCard url={link} />;
    case "github":
      return <GitHubCard url={link} ogData={ogData} />;
    case "instagram":
      return <InstagramCard url={link} ogData={ogData} />;
    case "reddit":
      return <RedditCard url={link} ogData={ogData} />;
    default:
      return <LinkPreviewCard url={link} ogData={ogData} />;
  }
}

export function Card({
  _id,
  title,
  link,
  type,
  sourceType: sourceTypeProp,
  ogData,
  onDelete,
  tags,
  readOnly,
  selectionMode,
  selected,
  onToggleSelect,
  item,
  onOpen,
}: CardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const confirm = useConfirm();

  const sourceType = normalizeSourceType({ type, sourceType: sourceTypeProp as SourceType | null });
  const isSelectable = Boolean(selectionMode && _id);

  async function handleDelete() {
    if (!_id || isDeleting) return;
    const ok = await confirm({
      title: "Remove from your brain?",
      message: `“${title}” will be permanently removed.`,
      confirmText: "Remove",
      destructive: true,
    });
    if (!ok) return;
    setIsDeleting(true);
    setActionError(null);
    try {
      await api.delete("/api/v1/content", { data: { contentId: _id } });
      onDelete?.();
    } catch (err) {
      setActionError(normalizeError(err).message);
      setIsDeleting(false);
    }
  }

  const finished = Boolean(item?.status && item.status !== "active");
  const planned = item?.status === "active" && Boolean(item.plannedFor) && new Date(item.plannedFor!).getTime() > Date.now();

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked: the link is still one click away */
    }
  }

  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-2xl bg-surface p-4 ring-1 transition-[box-shadow,transform,opacity] duration-300 ease-out",
        selected ? "ring-2 ring-accent shadow-lift" : "shadow-card ring-line hover:shadow-lift hover:ring-line-strong",
        isDeleting && "pointer-events-none scale-[0.98] opacity-40"
      )}
    >
      {isSelectable && (
        <button
          type="button"
          onClick={() => onToggleSelect?.(_id!)}
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
        <SourceIcon channel={sourceType} size="xs" />
        <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-ink-3">{sourceLabel(sourceType, link)}</span>
        {!readOnly && !selectionMode && (
          <div className="-my-1 -mr-1.5 flex items-center opacity-100 transition-opacity duration-200 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100">
            <IconButton label={copied ? "Copied" : "Copy link"} size="sm" onClick={copyLink}>
              {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
            </IconButton>
            <IconButton label="Delete" size="sm" tone="danger" onClick={handleDelete}>
              <Trash2 className="size-3.5" />
            </IconButton>
          </div>
        )}
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open ${title}`}
          className={cn(
            "-my-1 flex size-7 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink",
            !readOnly && !selectionMode ? "-mr-1.5" : "-mr-1",
            selectionMode && "invisible"
          )}
        >
          <ArrowUpRight className="size-4" />
        </a>
      </header>

      {onOpen ? (
        <button type="button" onClick={onOpen} className="mb-3 mt-2.5 block text-left">
          <h3 className="line-clamp-3 text-[15px] font-semibold leading-snug tracking-[-0.01em] text-ink text-pretty decoration-line-strong underline-offset-4 hover:underline">
            {title}
          </h3>
        </button>
      ) : (
        <h3 className="mb-3 mt-2.5 line-clamp-3 text-[15px] font-semibold leading-snug tracking-[-0.01em] text-ink text-pretty">
          {title}
        </h3>
      )}

      {item?.note && (
        <p className="mb-3 flex gap-1.5 text-[13px] leading-relaxed text-ink-2">
          <Quote className="mt-0.5 size-3 shrink-0 text-ink-3" />
          <span className="line-clamp-2">{item.note}</span>
        </p>
      )}

      {actionError && (
        <div className="mb-3 flex items-center justify-between gap-2 rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">
          <span className="min-w-0 truncate">{actionError}</span>
          <button onClick={() => setActionError(null)} className="shrink-0 font-semibold">
            Dismiss
          </button>
        </div>
      )}

      <div className="min-w-0">
        <CardBody sourceType={sourceType} link={link} title={title} ogData={ogData} />
      </div>

      {(finished || planned || (tags && tags.length > 0)) && (
        <footer className="mt-3.5 flex flex-wrap items-center gap-1.5">
          {finished && (
            <span
              className={cn(
                "inline-flex h-5 items-center gap-1 rounded-md px-1.5 text-[11px] font-medium",
                item?.status === "done" ? "bg-success/10 text-success" : "bg-surface-2 text-ink-3"
              )}
            >
              {item?.status === "done" ? (
                <>
                  <Check className="size-3" />
                  Done
                </>
              ) : (
                "Archived"
              )}
            </span>
          )}
          {planned && item?.plannedFor && (
            <span className="inline-flex h-5 items-center gap-1 rounded-md bg-surface-2 px-1.5 text-[11px] text-ink-2">
              <CalendarClock className="size-3" />
              {dayLabel(item.plannedFor)}
            </span>
          )}
          {tags?.map((tag) => (
            <span key={tag._id} className="rounded-md bg-surface-2 px-1.5 py-0.5 text-xs text-ink-2">
              #{tag.name}
            </span>
          ))}
        </footer>
      )}
    </article>
  );
}
